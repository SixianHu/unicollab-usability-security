# Local setup

## Prerequisites

Node.js 22+, runtime dependencies declared in package.json, MySQL (`mysqld`) and OpenSSL supporting certificate SAN generation. Only existing offline dependencies were used for verification. Clean `npm ci` and cross-platform provisioning are NOT VERIFIED; package/browser downloads require a separate user decision. Unix-socket setup is tested on macOS, not Windows.

For a newly authorized environment, the conventional dependency command is `npm ci` from the repository root. That command was not executed during this packaging phase. Optional browser tests have a separate tests/package.json and lockfile; they are not needed to run the app.

## New isolated demonstration

```sh
node scripts/demo.cjs init
node --env-file=.env server.js
```

The first command initializes a new `.local/mysql-data`, launches `mysqld --no-defaults --skip-networking`, creates a local app account/new schema and applies `sql/users.sql`. No existing database is selected. No user records are pre-seeded: register fictional accounts through the UI; regression tests create synthetic users dynamically.

If binaries are not on PATH, set MYSQLD_BIN and OPENSSL_BIN explicitly; if MySQL needs a basedir, set MYSQL_BASEDIR to the installed local MySQL base directory. These identify already installed software, not a download or old database endpoint. Init refuses to overwrite existing `.local`/`.env`; on failed initialization inspect private logs and use a new disposable checkout rather than modifying another database.

Generated `.env`, runtime configuration, logs, data and TLS key live in ignored `.local`/`.env`, with private file permissions. Do not commit or package them. `.env.example` lists placeholders only; actual configuration is generated at runtime. No file outside this repository supplies app code or hidden credentials.

## TLS

Init generates a fresh seven-day self-signed localhost leaf with SANs for localhost and 127.0.0.1. No root CA, old coursework key or trust-store action is used. Normal browsers may warn. The regression client explicitly trusts the generated leaf, and Chrome accepts only its SPKI. Do not disable certificate verification globally. Renew development files locally after expiration; no key/certificate belongs in source control.

## Restart and stop

After stopping the app with Ctrl-C:

```sh
node scripts/demo.cjs stop
```

For a later session, preserve `.local` and `.env` and run `node scripts/demo.cjs start` (with the same MYSQLD_BIN/MYSQL_BASEDIR if needed), then the app command again. In-memory app sessions disappear on server restart. The stop command uses only the dedicated generated Unix socket.

## Configuration and boundaries

The generated environment explicitly supplies LOCAL_DEMO_DB_ENABLED, MYSQL_SOCKET_PATH, DB_USER/PASSWORD/NAME, PORT, LOCAL_DEMO_ORIGIN and LOCAL_TLS_KEY_PATH/CERT_PATH. The original startup gate remains disabled without reviewed configuration. All app requests use the current origin; the backend binds 127.0.0.1. There is no browser-visible administrator password or public authentication bypass.
