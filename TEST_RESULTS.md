# Packaged-copy test results — 23 October 2026

Tests were run against a fresh copy of this repository, using existing offline dependencies where needed. No private Phase 4A application/configuration file was imported. Generated databases, config, TLS files and outputs stayed outside the release candidate.

| Check | Result |
|---|---|
| Startup over TLS with explicit development certificate trust | PASS |
| Register synthetic member and verify bcrypt in real MySQL | PASS |
| Unauthenticated member lookup is denied | PASS |
| Wrong password and injection-like login are rejected | PASS |
| Browser registration and login with existing restored bcrypt flow | PASS |
| Create project through UI and add a registered member | PASS |
| Assign complete tasks to both members using title, deadline and steps | PASS |
| Agreement and workspace navigation using both legitimate local accounts | PASS |
| Workspace task and progress views render assigned work | PASS |
| Required feedback entry, save and refresh persistence | PASS |
| Encrypted group chat UI round trip | PASS |
| Logout invalidates backend session | PASS |

Chrome 155.0.8059.85; Node v24.19.0. Uncaught page errors: 0; external application requests attempted: 0.

Syntax/manifest checks passed separately. The first agreement test encountered a navigation timing failure; its test now waits for the app’s real workspace transition before logout, and the final run passes. Application code was not changed to hide the issue. Clean dependency installation, production build, security audit, mobile/accessibility coverage and participant retests are NOT VERIFIED. Local browser/project/key state is not cross-device synchronization. [Testing instructions](TESTING.md) document exact portable commands and requirements.
