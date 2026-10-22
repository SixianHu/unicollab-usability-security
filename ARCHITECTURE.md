# UniCollab architecture

```mermaid
flowchart TB
 Browser[HTML CSS JavaScript] --> State[Browser local project task update and chat state]
 Browser --> Crypto[ECDH P-256 and AES-256-GCM helpers]
 Crypto --> Keys[Exportable browser-stored private keys]
 Browser -->|HTTPS register login lookup logout| Server[Loopback Express]
 Server --> Session[Server-managed development session map]
 Server --> Bcrypt[Existing bcrypt hash and compare]
 Server -->|Parameterized values over dedicated socket| DB[(Local MySQL users)]
 Setup[Repository setup script] --> DB
 Setup --> TLS[Fresh local leaf and key generated after checkout]
 TLS --> Server
```

The setup script replaces dependence on private workstation infrastructure; it does not alter application business logic. Users persist in MySQL, while projects/tasks/updates/chat remain local to a browser. Two identities can share that state for a local walkthrough; independent-client synchronization is not implemented. `sql/users.sql` is the complete relevant user DDL; fictional users are created by the UI/tests. New sessions are portfolio-only and not per-project production authorization.
