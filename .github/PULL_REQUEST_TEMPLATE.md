## Summary
<!-- What does this PR change and why? -->

## Related issue
<!-- Closes #123 -->

## Changes
-

## Checklist
- [ ] Backend type checking passes (`make typecheck`)
- [ ] Backend lint passes (`cd backend && uv run ruff check .`)
- [ ] Frontend lint + build pass (`make lint` / `make build-web`)
- [ ] WebSocket contract stays in sync (`backend/modules/realtime/protocol.py` <-> `frontend/src/features/realtime/ws.ts`)
- [ ] Migrations added/updated if the schema changed (`make migration m="..."`)
