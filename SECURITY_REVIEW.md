# UniCollab security review — local demonstration

Private scoped review; functional local demonstration is not production security approval.

## Password history and verified implementation

The latest original snapshot contains a commented bcrypt call and an active direct password assignment, while login uses bcrypt comparison. That describes the submitted snapshot only. **The original contributor confirms implementing hashing and salting previously, temporarily disabling the call for a demonstration, and forgetting to restore it.** Phase 3 restored the existing mechanism. It must not be described as a new Codex hashing feature or evidence the team never implemented it.

Current registration calls `await bcrypt.hash(password, 10)`; bcrypt supplies and embeds a random salt. Login calls `bcrypt.compare`. Phase 4A registered synthetic users into real local MySQL, confirmed the stored value differed from the input and verified comparison with real bcrypt. Browser registration/login and rejection of wrong/injection-like credentials passed. No original user table was accessed or migrated. Historical authorship is user-confirmed; the current mechanism and tests are source/test verified.

## Local server protection added in Phase 4A

New `local-session.js` creates random 256-bit session tokens, keeps sessions server side for two hours, protects application pages/member lookup, checks mutation origins, and invalidates sessions at logout. Cookies are HttpOnly, Secure and SameSite=Strict. Login rotates the current session. These are portfolio-only additions, not historical contributor achievements or per-project production authorization. Tests cover unauthenticated lookup and server invalidation after the workspace logout control.

The listener binds 127.0.0.1. DB access requires a dedicated absolute Unix socket; credentials have no original fallback. Fresh TLS files are generated after checkout in ignored `.local/tls`; none are bundled. Node tests explicitly trust the new leaf; Chrome acceptance is scoped to its SPKI. No original CA/key, OS trust-store change or global certificate bypass was used.

## SQL scope

The four inspected user statements—duplicate lookup, registration insert, login lookup and member lookup—use fixed SQL with `?` placeholders and separate values. No user-controlled dynamic SQL was found there; an injection-like login was rejected. This is not comprehensive SQL-injection prevention or a penetration test. Database/schema identifiers in the private setup are internally generated and restricted, not browser input.

## Distinct security mechanisms

- **Password storage:** bcrypt salted one-way representations, not reversible database encryption.
- **Transport:** configured local HTTPS/TLS.
- **Messages:** original ECDH P-256/AES-256-GCM helpers, with random IVs and authentication tags. Earlier five helper checks remain historical; a current browser group-message round trip also passes.
- **MySQL fields:** no application encryption of identifier/name/email established; storage-layer encryption is unknown.

The chat implementation exports private JWKs into local storage and relies on local public-key state. XSS/browser access can expose it. Authenticated key distribution, revocation, forward secrecy, secure multi-device synchronization and delivery to all recipients were not verified. Removing an incompatible plaintext welcome fixture does not add plaintext fallback to encrypted-message rendering. Do not claim production end-to-end encryption.

## Remaining work and release restrictions

Input bounds, rate limiting, registration abuse, account enumeration, error/log privacy, CORS and exhaustive XSS review remain open. Browser identity/project state is editable and server sessions do not validate each browser-local project operation. Dependencies were reused offline, not security-audited; a clean install is untested. In-memory sessions are unsuitable for multiple workers or persistent deployments.

Runtime secrets, certificates and synthetic DB rows are generated only after checkout in ignored `.local`/`.env`; none are bundled. Research records, original reports/keys/configuration and Git history remain excluded. Source publication, the selected synthetic screenshots/team UI and public methods/counts/anonymized findings are user-confirmed authorized in Phase 5A; approval documents were not independently inspected. Raw research records and separately protected artifacts remain excluded. Actual publication requires separate Phase 5B authorization.

Phase 4B adds repository-contained setup and test source; no global dependency cache or private workstation path is imported by application code. Clean dependency installation and a current vulnerability audit remain unverified.
