"""The v1 data migration: text-room chat moves onto the channel, moderators carry over."""

import asyncio
import os
import uuid

from alembic.config import Config

from alembic import command

BEFORE = "c4d8e1a7b2f6"


def _config() -> Config:
    here = os.path.dirname(__file__)
    cfg = Config(os.path.join(here, "..", "alembic.ini"))
    cfg.set_main_option("script_location", os.path.join(here, "..", "alembic"))
    return cfg


def _sql(pg, db: str, statement: str) -> str:
    return pg.psql(f"\\c {db}\n{statement}")


async def test_old_data_survives_the_migration(pg_server, monkeypatch) -> None:
    from core.config import settings

    db = "migration_check"
    pg_server.psql(f"create database {db}")
    url = settings.database_url.replace("@/postgres?", f"@/{db}?")
    assert url != settings.database_url
    monkeypatch.setattr(settings, "database_url", url)

    # Alembic's env runs its own event loop, so it must run off this one.
    await asyncio.to_thread(command.upgrade, _config(), BEFORE)

    owner, mod, plain = (str(uuid.uuid4()) for _ in range(3))
    community, room = str(uuid.uuid4()), str(uuid.uuid4())
    long_text = "x" * 500
    _sql(
        pg_server,
        db,
        f"""
        insert into users (id, username, email, display_name, system_role, is_active)
          values ('{owner}','owner','o@x.io','O','user',true),
                 ('{mod}','mod','m@x.io','M','user',true),
                 ('{plain}','plain','p@x.io','P','user',true);
        insert into communities (id, name, slug, stream_key, owner_id, is_private, is_suspended)
          values ('{community}','C','c-one','sk_abc','{owner}',false,false);
        insert into memberships (id, user_id, community_id, role) values
          (gen_random_uuid(),'{owner}','{community}','owner'),
          (gen_random_uuid(),'{mod}','{community}','moderator'),
          (gen_random_uuid(),'{plain}','{community}','member');
        insert into channels (id, community_id, name, slug, type, position, is_restricted)
          values ('{room}','{community}','General','general','text',0,false);
        insert into messages (id, channel_id, user_id, content)
          values (gen_random_uuid(),'{room}','{plain}','hello'),
                 (gen_random_uuid(),'{room}','{plain}','{long_text}');
        """,
    )

    await asyncio.to_thread(command.upgrade, _config(), "head")

    moderators = _sql(pg_server, db, "select user_id from channel_moderators;")
    assert mod in moderators and plain not in moderators and owner not in moderators

    messages = _sql(
        pg_server,
        db,
        "select community_id, length(content) from messages order by length(content);",
    )
    assert messages.count(community) == 2
    assert "300" in messages  # the over-long message was truncated to the new limit

    tables = _sql(pg_server, db, "select tablename from pg_tables where schemaname = 'public';")
    for gone in ("channels", "channel_members", "memberships", "join_requests"):
        assert f" {gone}" not in tables, gone
    assert "channel_moderators" in tables
