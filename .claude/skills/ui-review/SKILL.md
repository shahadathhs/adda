---
name: ui-review
description: Audit the current UI changes (or a named page/component) for generic generated-UI tells, DESIGN.md violations, missing states and accessibility problems. Use before committing UI work or when asked to review the design.
disable-model-invocation: false
---

# UI review

Review UI work the way a design lead would, with evidence, not vibes.

## Procedure

1. Scope: `git diff --name-only` for files under `web/` and `site/`, or the
   file/page the user named.
2. Run the automated gate and report its output verbatim:
   `pnpm check:design` (banned patterns from DESIGN.md) and
   `pnpm lint && pnpm typecheck`.
3. Read each changed component against:
   - `/DESIGN.md` §8 anti-slop checklist
   - the `ui-build` rules (tokens, type, shape, motion, content, one component per file)
   - the `ux-states-a11y` tables (states, keyboard/focus, semantics)
4. If the app can run, look at it at 375px and 1280px and say what you saw.
   If you could not run it, say so — do not claim visual verification.
5. Report findings grouped by severity, each as `file:line — problem — fix`:
   - **Blocking:** banned patterns, missing error/empty/loading state, keyboard
     trap, contrast failure, white text on accent, live red used for non-live.
   - **Should fix:** off-scale spacing/type, un-tabular numbers, vague copy,
     placeholder content, duplicated component anatomy.
   - **Nit:** polish.
6. Finish with the logo-covered test: would this screen be identifiable as adda?

Do not rewrite the design to taste; flag deviations from the documented system
and from the product intent in `docs/SCOPE.md`.

## Known tells to look for

Purple/indigo accents · gradient text or backgrounds · glass blur · rounded-xl+
on controls · opaque drop shadows · `transition-all` · three equal cards as the
default layout · centred hero with two buttons · decorative sparklines/blobs ·
emoji icons · "Welcome back!"-style filler copy · placeholder names · every
heading the same weight/size · identical padding everywhere.
