"""F5 — chat history and message deletion over REST."""

import uuid

from core.database import async_session_factory
from models.message import Message
from tests.conftest import Account, TestClient


async def _channel(client: TestClient, owner: Account, slug: str = "ch-one") -> str:
    resp = await client.post("/communities", owner.access, json={"name": "Ch", "slug": slug})
    return resp.json()["id"]


async def _post(cid: str, author: Account, text: str, reply_to: str | None = None) -> str:
    async with async_session_factory() as db:
        row = Message(
            community_id=uuid.UUID(cid),
            user_id=uuid.UUID(author.id),
            content=text,
            reply_to_id=uuid.UUID(reply_to) if reply_to else None,
        )
        db.add(row)
        await db.commit()
        return str(row.id)


async def test_history_is_public_and_newest_first(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    for i in range(3):
        await _post(cid, owner, f"message {i}")

    resp = await client.get(f"/communities/{cid}/messages")  # no token: guests can read
    assert resp.status_code == 200
    assert [m["content"] for m in resp.json()] == ["message 2", "message 1", "message 0"]
    assert resp.json()[0]["username"] == "owner"


async def test_history_pages_with_a_cursor_without_gaps_or_repeats(
    client: TestClient, make_user
) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    for i in range(7):
        await _post(cid, owner, f"m{i}")

    seen: list[str] = []
    before: str | None = None
    for _ in range(5):
        url = f"/communities/{cid}/messages?limit=3" + (f"&before={before}" if before else "")
        page = (await client.get(url)).json()
        if not page:
            break
        seen += [m["content"] for m in page]
        before = page[-1]["id"]
    assert seen == [f"m{i}" for i in range(6, -1, -1)]


async def test_history_validates_limit_and_unknown_channel(client: TestClient, make_user) -> None:
    owner = await make_user("owner")
    cid = await _channel(client, owner)
    assert (await client.get(f"/communities/{cid}/messages?limit=0")).status_code == 422
    assert (await client.get(f"/communities/{cid}/messages?limit=101")).status_code == 422
    assert (await client.get(f"/communities/{uuid.uuid4()}/messages")).status_code == 404


async def test_histories_are_per_channel(client: TestClient, make_user) -> None:
    a, b = await make_user("alpha"), await make_user("bravo")
    ca = await _channel(client, a, "chan-a")
    cb = await _channel(client, b, "chan-b")
    await _post(ca, a, "in a")
    await _post(cb, b, "in b")
    assert [m["content"] for m in (await client.get(f"/communities/{ca}/messages")).json()] == [
        "in a"
    ]


async def test_authors_can_delete_their_own_messages_only(client: TestClient, make_user) -> None:
    owner, fan, other = await make_user("owner"), await make_user("fan"), await make_user("other")
    cid = await _channel(client, owner)
    mid = await _post(cid, fan, "oops")

    assert (
        await client.delete(f"/communities/{cid}/messages/{mid}", other.access)
    ).status_code == 403
    assert (await client.delete(f"/communities/{cid}/messages/{mid}")).status_code == 401
    assert (
        await client.delete(f"/communities/{cid}/messages/{mid}", fan.access)
    ).status_code == 204
    assert (await client.get(f"/communities/{cid}/messages")).json() == []
    # Deleting twice is a 404, not a second audit entry.
    assert (
        await client.delete(f"/communities/{cid}/messages/{mid}", fan.access)
    ).status_code == 404


async def test_owner_moderator_and_admin_can_delete_anyones_message(
    client: TestClient, make_user, make_admin
) -> None:
    owner, mod, fan = await make_user("owner"), await make_user("mod"), await make_user("fan")
    admin = await make_admin()
    cid = await _channel(client, owner)
    await client.post(f"/communities/{cid}/follow", mod.access)
    await client.post(f"/communities/{cid}/moderators", owner.access, json={"user_id": mod.id})

    for who in (owner, mod, admin):
        mid = await _post(cid, fan, f"by fan for {who.username}")
        resp = await client.delete(f"/communities/{cid}/messages/{mid}", who.access)
        assert resp.status_code == 204, who.username
    assert (await client.get(f"/communities/{cid}/messages")).json() == []


async def test_deleted_messages_are_kept_for_audit(client: TestClient, make_user) -> None:
    from sqlalchemy import select

    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    mid = await _post(cid, fan, "rude")
    await client.delete(f"/communities/{cid}/messages/{mid}", owner.access)

    async with async_session_factory() as db:
        row = (await db.execute(select(Message).where(Message.id == uuid.UUID(mid)))).scalar_one()
    assert row.deleted_at is not None
    assert str(row.deleted_by_id) == owner.id


async def test_a_message_cannot_be_deleted_through_another_channel(
    client: TestClient, make_user
) -> None:
    a, b = await make_user("alpha"), await make_user("bravo")
    ca = await _channel(client, a, "chan-a")
    cb = await _channel(client, b, "chan-b")
    mid = await _post(ca, a, "mine")
    assert (await client.delete(f"/communities/{cb}/messages/{mid}", b.access)).status_code == 404


async def test_replies_survive_when_the_parent_is_removed(client: TestClient, make_user) -> None:
    owner, fan = await make_user("owner"), await make_user("fan")
    cid = await _channel(client, owner)
    parent = await _post(cid, owner, "question?")
    await _post(cid, fan, "answer", reply_to=parent)
    await client.delete(f"/communities/{cid}/messages/{parent}", owner.access)
    contents = [m["content"] for m in (await client.get(f"/communities/{cid}/messages")).json()]
    assert contents == ["answer"]


async def test_deleting_a_channel_removes_its_messages(client: TestClient, make_user) -> None:
    from sqlalchemy import func, select

    owner = await make_user("owner")
    cid = await _channel(client, owner)
    await _post(cid, owner, "bye")
    await client.delete(f"/communities/{cid}", owner.access)
    async with async_session_factory() as db:
        count = (await db.execute(select(func.count()).select_from(Message))).scalar()
    assert count == 0
