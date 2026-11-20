## Express Boilerplate – Swagger API Docs

This project is an Express + TypeScript API with built‑in Swagger (OpenAPI) documentation.

### Prerequisites

- **Node.js** and **npm** installed
- **MongoDB** running locally or a connection string in `.env` (for the API itself to work)

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

The server uses `src/server.ts` with `ts-node-dev`. By default it listens on port **4000** (or `PORT` from `.env`).

### Build and run in production mode

```bash
npm run build
npm start
```

This compiles TypeScript to `dist/` and runs `dist/server.js`.

### Open Swagger UI

Once the server is running (dev or prod), open your browser to:

- **Swagger UI:** `http://localhost:4000/api-docs`

Adjust the port if you changed the `PORT` environment variable.

### Auth for protected endpoints

Some routes require a **JWT bearer token**:

1. Use `POST /api/auth/signup` or `POST /api/auth/login` to get `accessToken`.
2. In Swagger UI, click the **“Authorize”** button (top right).
3. Enter:
   - `Bearer <accessToken>`
4. Now protected endpoints (e.g. `/api/users/me`, `/api/workspaces`, `/api/uploads/images`) will send the token.

### Main documented route groups

- **Auth** – `/api/auth/*`
- **User** – `/api/users/me`
- **Workspaces & Bots** – `/api/workspaces/*`, `/api/bots/*`
- **Conversations & Messages** – `/api/conversations/*`
- **Uploads** – `/api/uploads/images`

Swagger configuration lives in `src/config/swagger.ts` and is mounted in `src/app.ts` at `/api-docs`.


## Frontend connection

The local dashboard runs at `http://localhost:3000` and calls
`http://localhost:4000/api`. For deployments, set `CORS_ORIGINS` to the
comma-separated list of allowed dashboard origins. Set `TRUST_PROXY_HOPS`
only when requests reach the API through that fixed number of trusted proxies.

The dashboard uses these authenticated routes under
`/api/workspaces/:workspaceId/bots/:botId`:

- `GET` and `PATCH` for bot details.
- `GET` and `PUT` on `/flow` and `/appearance` for editing drafts.
- `POST /publish` to publish the last saved flow and appearance.
- `GET /leads` and `GET`, `PATCH`, `DELETE /leads/:leadId` for lead management.

Publication requires a saved flow with a connected start node. The public
appearance route serves the published settings, so subsequent draft edits
stay private until the next publication.

The dashboard's Installation page generates an iframe for a published bot.
Serve the built frontend with SPA fallback for `/widget`, and allow that
page to be framed by the websites where the chatbot is installed. The public
`GET /api/public/bots/:botId/widget` endpoint serves the published graph used
by the iframe. Messages and replies in the iframe currently stay in the
visitor's browser.

## Workspace settings and widget activity

The dashboard reads `GET /api/workspaces/:workspaceId/settings` for workspace
details and the stored member roster. The owner can rename the workspace using
`PATCH` on the same route.

The widget uses `POST /api/public/bots/:botId/widget/activity` to register a
visitor session on a published bot. The same session can submit a name and
email with explicit consent to request a follow-up. A session counts once and
creates at most one lead. Conversation transcripts stay in the browser.

## Script widget and response collection

The public widget configuration and activity endpoints support credential-free
cross-origin requests so the script can run on a separate website. Dashboard
routes continue to use configured dashboard origins and authentication.

Visitor answers are persisted by session and exposed at
`GET /api/workspaces/:workspaceId/bots/:botId/responses` for workspace members.
The workspace owner can set a Zapier Catch Hook or Make custom webhook in
Integrations. Webhook jobs are stored in MongoDB and retried in the background.
A bot sends at most one delivery job per conversation, on completion or when the
conversation first reaches a Webhook node.
