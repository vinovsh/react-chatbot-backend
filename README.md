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

