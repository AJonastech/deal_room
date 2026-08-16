# Dealroom.

Dealroom is my full-stack technical assessment for controlled fundraising document sharing and investor engagement tracking. I built the core founder workflow end to end: authenticate, upload a document, create an unguessable share link, send it to an investor, and review the resulting activity from the dashboard.

## Start Here: Reviewer Access

After starting the application, open [http://localhost:3000](http://localhost:3000) and sign in with:

```text
Username: Agujonas13@gmail.com
Password: batman_001
```

The login is intentionally seeded for this assessment. I did not build public registration because the brief assumes a single founder account and explicitly treats signup as out of scope.

**Project links:** [Source repository](https://github.com/AJonastech/deal_room) · [Local application](http://localhost:3000)

### Suggested Review Flow

1. Sign in with the credentials above.
2. Upload a PDF, DOC, DOCX, XLS, XLSX, or ZIP file and give it a clear document name.
3. Open the uploaded document from the dashboard.
4. Create a share link with an investor or recipient label.
5. Copy the generated `/view/:token` URL and open it in another browser or private window.
6. Return to the founder dashboard to inspect the view count and activity timeline.
7. Revoke the link and confirm that the investor URL can no longer load or download the document.

## What I Built

I focused first on making the complete assessment journey usable rather than creating isolated screens. The application currently includes:

- A seeded founder account with password-based authentication
- Database-backed sessions stored in an HTTP-only, same-site cookie that is marked secure in production
- A protected founder dashboard scoped to the authenticated account
- Document upload with a user-supplied name and server-side validation
- Support for PDF, DOC, DOCX, XLS, XLSX, and ZIP files up to 50 MB
- A document list with aggregate link and recorded-view information
- Cryptographically random, unauthenticated investor share links
- Recipient labels so a founder can identify where each link was sent
- An investor view with inline PDF preview and file download
- Server-created view events backed by an event table instead of a mutable counter
- Session-level deduplication enforced by a database unique constraint
- Share-link revocation checked before metadata or file bytes are returned
- Document deletion constrained to the authenticated owner
- Responsive loading, empty, success, failure, and destructive-action states

## My Approach

The main product decision I made was to keep views as events rather than maintaining a mutable counter. Every accepted view is represented by a `view_events` row, and the dashboard derives totals and recent activity from those records. This makes the engagement history inspectable and prevents a counter from drifting away from its source data.

I also kept the investor boundary narrow. An investor only receives an unguessable token and talks to token-based backend routes. The browser never receives database credentials or a storage location, and every file response checks that the link still exists and has not been revoked.

For the assessment build, I store file bytes in PostgreSQL alongside document metadata. This keeps local setup and deployment straightforward and ensures document access still goes through the application. For a production version, I would move the bytes to private object storage and retain only the storage key and metadata in PostgreSQL.

## Architecture

```mermaid
flowchart LR
    F[Founder browser] -->|Authenticated requests| N[Next.js application]
    I[Investor browser] -->|Unguessable share token| N
    N -->|Prisma queries| P[(PostgreSQL)]
    P --> U[Users and sessions]
    P --> D[Documents and file bytes]
    P --> L[Share links]
    P --> V[View event log]
```

I implemented the frontend and backend in one Next.js application. App Router pages provide the founder and investor experiences, route handlers own authentication and document operations, Prisma defines the relational model, and PostgreSQL persists accounts, sessions, documents, links, and view events.

### Main Technology Choices

| Area | Choice | Why I Used It |
| --- | --- | --- |
| Application | Next.js 16 App Router | One deployable application with server routes and React UI |
| Language | TypeScript | Explicit contracts across UI and API data |
| UI | React 19, Tailwind CSS 4, Base UI, Lucide | Accessible primitives and a focused custom interface |
| Database | PostgreSQL | Relational ownership constraints and durable event history |
| ORM | Prisma 6 | Typed data access, migrations, indexes, and constraints |
| Passwords | Node `scrypt` | Salted password derivation without storing plaintext passwords |
| Charts | Recharts | Dashboard engagement visualization |

## Data Model

The implementation has five primary models:

| Model | Responsibility |
| --- | --- |
| `User` | The founder account and password hash |
| `Session` | Expiring founder login sessions |
| `Document` | Owner, display name, MIME type, size, storage key, type, and file bytes |
| `ShareLink` | Document relationship, recipient label, random token, and revocation time |
| `ViewEvent` | One accepted investor session with server timestamp, IP, and user agent |

Important database protections include:

- Unique user emails
- Unique authentication session tokens
- Unique share-link tokens
- Cascading cleanup from owners to documents and from documents to links/events
- An owner-and-date index for dashboard document queries
- A link-and-date index for chronological activity queries
- `@@unique([shareLinkId, sessionKey])` to make duplicate session inserts race-safe

## Core Request Flows

### Founder Authentication

I seed one test founder and hash the supplied password with a random salt and `scrypt`. A successful login creates a random 32-byte session token, stores that token in the database, and returns it in an HTTP-only, same-site cookie. Protected routes resolve the founder from that server-side session and reject missing or expired sessions.

### Document Upload

The upload endpoint requires an authenticated founder, reads multipart form data, validates the document name, extension, and size, and writes the document against that founder's ID. The dashboard query always filters on the authenticated owner, so one founder cannot request another founder's documents through the normal API surface.

### Share-Link Creation

Before creating a link, I verify that the requested document belongs to the current founder. I generate the public token from 12 cryptographically random bytes and prefix it with `dr_`. The token is unique in the database and is the only identifier needed by the unauthenticated investor route.

### Investor View Registration

When the investor page resolves a valid token, the backend checks revocation first and then records a server-timestamped event. Known preview crawlers such as Slackbot, WhatsApp, and Facebook's link expander are served the response without creating engagement. A browser receives an opaque HTTP-only reader cookie; when cookies are unavailable, the server derives a one-way fallback fingerprint from the forwarded IP and user agent instead of persisting those values as identity.

The session identity is combined with a server-defined 30-minute UTC bucket. The event insert is protected by `@@unique([shareLinkId, sessionKey])`, and a uniqueness race is treated as an already-counted session. Repeated and concurrent requests in one window therefore produce one row, while the same reader can count again after the next boundary.

### Revocation and File Delivery

Both the investor metadata route and the download route reject missing or revoked tokens before returning document information or file bytes. The download response uses `Cache-Control: private, no-store`. Revocation is idempotent from the founder's perspective: revoking an already revoked link returns its existing revocation timestamp.

## API Surface

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | Public | Validate seeded credentials and create a founder session |
| `POST` | `/auth/signout` | Founder | End the current session |
| `GET` | `/api/documents` | Founder | List owned documents, links, and activity |
| `POST` | `/api/documents` | Founder | Validate and upload a named document |
| `DELETE` | `/api/documents/:id` | Founder | Delete an owned document |
| `GET` | `/api/documents/:id/download` | Founder | Download an owned document |
| `POST` | `/api/documents/:id/links` | Founder | Create a recipient-labelled share link |
| `DELETE` | `/api/documents/:id/links/:linkId` | Founder | Revoke an owned share link |
| `GET` | `/api/share-links/:token` | Investor | Validate a token, return metadata, and register a session |
| `GET` | `/api/share-links/:token/download` | Investor | Preview or download a document through a valid token |

## Local Setup

### Prerequisites

- Node.js 20 or newer
- npm
- A PostgreSQL database

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure the Database

Create the local environment file:

```bash
cp .env.example .env.local
```

Set both values to your PostgreSQL connection strings:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

`DATABASE_URL` can use a pooled connection in a hosted environment. `DIRECT_URL` should be a direct database connection for Prisma migrations.

### 3. Create the Schema and Seed Reviewer Access

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

The seed command creates or updates the assessment account shown at the top of this README.

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then use:

```text
Username: Agujonas13@gmail.com
Password: batman_001
```

## Available Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server after a build |
| `npm run lint` | Run ESLint |
| `npm test` | Run fast unit tests without a database |
| `npm run test:integration` | Run the PostgreSQL integration suite using `.env.local` |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Apply development migrations |
| `npm run db:seed` | Seed the assessment founder account |

## Assessment Scope Compared With the Plan

I completed the must-have product path from the supplied architecture and delivery document:

- The founder can upload and name a document.
- The document is persisted against the founder's account.
- The founder can generate an unguessable link.
- An investor can open and download the shared document without an account.
- The founder can see server-timestamped view activity.
- The founder can revoke a link and immediately block future access.

I also added owner-scoped deletion, recipient labels, aggregate dashboard metrics, responsive states, and atomic session deduplication.

## Known Limitations and Next Steps

I treated this as an assessment-sized implementation and kept the unfinished production concerns explicit.

### View Tracking

- **Registration point:** The view event is currently registered when the investor metadata route succeeds, immediately before the page requests the file. The target architecture logs at the file-serving boundary. I would consolidate token resolution and event registration into the serving path so a metadata request alone cannot count as a read.
- **Crawler coverage:** The classifier covers common user-agent signatures, but production traffic would require monitored allow/deny rules for security scanners and new preview clients.
- **Window semantics:** Buckets are fixed 30-minute boundaries rather than a rolling 30-minute expiry from the first open. This makes the key deterministic and race-safe, but a reader opening immediately on either side of a boundary can create two events.
- **Fingerprint tradeoff:** The cookie identifies a browser, not a person. Clearing cookies, switching browsers, or forwarding a link can create a distinct session, which is intentional for engagement analytics but not person-level identity.

### Storage and Delivery

- File bytes currently live in PostgreSQL. I would use a private S3-compatible bucket for production, keep only the object key in PostgreSQL, and stream through an authorized backend response or short-lived signed URL.
- The application does not yet implement share-link expiry, malware scanning, at-rest application encryption, range requests, upload resumability, or a background processing queue.
- Office and ZIP files can be downloaded but are not rendered inline; PDF files use the browser's native viewer.

### Testing

The repository includes two focused layers:

- `npm test` checks password hashing, bot classification, fixed-window boundaries, server timestamps, fallback fingerprints, uniqueness races, and error propagation without requiring PostgreSQL.
- `npm run test:integration` uses the configured PostgreSQL database and isolated temporary records to verify document persistence, random token shape, active versus expired sessions, owner isolation, concurrent deduplication, retry boundaries, crawler suppression, forwarded readers, and revocation ordering. The suite deletes its records after each run.

The remaining test gap is browser-level coverage of the complete login, multipart upload, public viewer, download, and revoke workflow. The route handlers and persistence boundaries are exercised by type checking, production builds, and the database suite, but the HTTP cookie and UI transitions are not yet automated end to end.

### Product Scope

- I intentionally omitted signup, password reset, teams, roles, and multi-founder collaboration.
- Analytics, settings, and global link-list routes are currently presentation placeholders.
- The assessment credentials are public by design and must be replaced before any real deployment.

## Production Hardening

Before treating this as a production deal room, I would prioritize the work in this order:

1. Move file bytes to private object storage.
2. Register views in the actual serving path.
3. Expand crawler detection with monitored production signatures and security-scanner policy.
4. Add browser-level end-to-end coverage for the complete founder and investor workflow.
5. Add rate limiting, audit logs, CSRF review, and stricter response security headers.
6. Add link expiration and optional download controls.
7. Add observability for failed uploads, rejected links, and event-registration errors.
8. Run migrations through a deployment pipeline and rotate the public assessment credentials.

## Repository Guide

```text
app/
  api/                         Backend route handlers
  auth/                        Login and signout handlers
  dashboard/                   Founder dashboard routes
  view/[token]/                Public investor experience
components/
  dashboard/                   Dashboard and document workflow components
  layout/                      Shared application navigation
  ui/                          Reusable UI primitives and Dealroom wordmark
lib/
  auth.ts                      Server-side session lookup
  dashboard-types.ts           Frontend/API dashboard contracts
  password.ts                  scrypt password hashing and verification
  prisma.ts                    Prisma client lifecycle
  view-tracking.ts             Bot filtering, fingerprints, and atomic view registration
prisma/
  migrations/                  Versioned PostgreSQL schema changes
  schema.prisma                Relational data model and constraints
  seed.mjs                     Assessment founder seed
public/document_icons/         Document-type assets
tests/                         Unit and PostgreSQL integration coverage
```

## Final Note

My goal with this submission was to demonstrate the whole product loop and make the important trust boundaries visible in the code. The app does not treat engagement as a number that can be incremented arbitrarily: it stores inspectable events, scopes founder operations by ownership, uses random revocable links for investors, and relies on a database constraint for duplicate-session safety. I have also called out where the assessment implementation stops short of the more rigorous tracking architecture in the supplied plan, along with the order in which I would close those gaps.
