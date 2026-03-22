# Express Boilerplate - API Documentation

> **Base URL:** `http://localhost:4000/api`
> **Swagger UI:** `http://localhost:4000/api-docs`
> **Content-Type:** `application/json` (unless specified otherwise)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [User](#2-user)
3. [Workspaces](#3-workspaces)
4. [Bots](#4-bots)
5. [Bot Flows](#5-bot-flows)
6. [Conversations](#6-conversations)
7. [Messages](#7-messages)
8. [Leads](#8-leads)
9. [Bot Appearance](#9-bot-appearance)
10. [File Uploads](#10-file-uploads)
11. [Authentication Guide](#11-authentication-guide)
12. [Error Handling](#12-error-handling)
13. [Environment Variables](#13-environment-variables)
14. [Data Models](#14-data-models)

---

## 1. Authentication

### 1.1 Sign Up

Creates a new user account and returns access/refresh tokens.

| | |
|---|---|
| **URL** | `POST /api/auth/signup` |
| **Auth** | Not required |
| **Success Code** | `201 Created` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Valid email address |
| `password` | `string` | Yes | Minimum 8 characters |
| `name` | `string` | Yes | User's full name |
| `timezone` | `string` | No | IANA timezone (e.g., `"Asia/Kolkata"`) |

```json
{
  "email": "john@example.com",
  "password": "securePass123",
  "name": "John Doe",
  "timezone": "Asia/Kolkata"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (409 Conflict):**

```json
{
  "success": false,
  "message": "Email already in use"
}
```

---

### 1.2 Login

Authenticates user and returns tokens. Records login IP and User-Agent.

| | |
|---|---|
| **URL** | `POST /api/auth/login` |
| **Auth** | Not required |
| **Success Code** | `200 OK` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Registered email address |
| `password` | `string` | Yes | Account password |

```json
{
  "email": "john@example.com",
  "password": "securePass123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 1.3 Refresh Token

Exchanges a valid refresh token for a new access/refresh token pair (token rotation).

| | |
|---|---|
| **URL** | `POST /api/auth/refresh` |
| **Auth** | Not required |
| **Success Code** | `200 OK` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refreshToken` | `string` | Yes | Valid refresh token |

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "message": "Invalid refresh token"
}
```

---

### 1.4 Forgot Password

Sends a password reset token (valid for 30 minutes). Always returns success for security.

| | |
|---|---|
| **URL** | `POST /api/auth/forgot-password` |
| **Auth** | Not required |
| **Success Code** | `200 OK` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | Registered email address |

```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true
}
```

> **Note:** Returns `success: true` even if email doesn't exist (prevents email enumeration).

---

### 1.5 Reset Password

Resets the user's password using the token received from forgot-password.

| | |
|---|---|
| **URL** | `POST /api/auth/reset-password` |
| **Auth** | Not required |
| **Success Code** | `200 OK` |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `token` | `string` | Yes | UUID token from reset email |
| `password` | `string` | Yes | New password (min 8 characters) |

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "password": "newSecurePass456"
}
```

**Success Response (200):**

```json
{
  "success": true
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

## 2. User

### 2.1 Get My Profile

Returns the authenticated user's profile.

| | |
|---|---|
| **URL** | `GET /api/users/me` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

---

### 2.2 Update My Profile

Updates the authenticated user's profile.

| | |
|---|---|
| **URL** | `PUT /api/users/me` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | No | Updated name |

```json
{
  "name": "John Updated"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "email": "john@example.com",
    "name": "John Updated",
    "role": "admin"
  }
}
```

---

## 3. Workspaces

### 3.1 Create Workspace

Creates a new workspace. The creator is automatically added as owner and member.

| | |
|---|---|
| **URL** | `POST /api/workspaces` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `201 Created` |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | `string` | Yes | 3–100 characters |

```json
{
  "name": "My Workspace"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Workspace",
    "owner": "507f1f77bcf86cd799439012",
    "members": ["507f1f77bcf86cd799439012"],
    "createdAt": "2024-03-22T10:30:00.000Z",
    "updatedAt": "2024-03-22T10:30:00.000Z"
  }
}
```

---

### 3.2 List Workspaces

Lists all workspaces where the user is an owner or member.

| | |
|---|---|
| **URL** | `GET /api/workspaces` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Workspace 1",
      "owner": "507f1f77bcf86cd799439012",
      "members": ["507f1f77bcf86cd799439012"],
      "createdAt": "2024-03-22T10:30:00.000Z",
      "updatedAt": "2024-03-22T10:30:00.000Z"
    }
  ]
}
```

---

### 3.3 Get Workspace

Returns a single workspace (user must be owner or member).

| | |
|---|---|
| **URL** | `GET /api/workspaces/{workspaceId}` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workspaceId` | `string` | MongoDB ObjectId |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "My Workspace",
    "owner": "507f1f77bcf86cd799439012",
    "members": ["507f1f77bcf86cd799439012"],
    "createdAt": "2024-03-22T10:30:00.000Z",
    "updatedAt": "2024-03-22T10:30:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Workspace not found"
}
```

---

## 4. Bots

### 4.1 Create Bot

Creates a new bot in a workspace. Automatically creates an empty BotFlow.

| | |
|---|---|
| **URL** | `POST /api/workspaces/{workspaceId}/bots` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `201 Created` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workspaceId` | `string` | MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | `string` | Yes | 3–100 characters |
| `theme` | `object` | No | Free-form theme config |

```json
{
  "name": "Customer Support Bot",
  "theme": {}
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "workspaceId": "507f1f77bcf86cd799439011",
    "name": "Customer Support Bot",
    "status": "draft",
    "theme": {},
    "createdAt": "2024-03-22T10:35:00.000Z",
    "updatedAt": "2024-03-22T10:35:00.000Z"
  }
}
```

**Error Response (403 Forbidden):**

```json
{
  "success": false,
  "message": "Forbidden"
}
```

---

### 4.2 List Bots

Lists all bots in a workspace with optional name search.

| | |
|---|---|
| **URL** | `GET /api/workspaces/{workspaceId}/bots` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `workspaceId` | `string` | MongoDB ObjectId |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `search` | `string` | No | Case-insensitive name search |

**Example:** `GET /api/workspaces/507f.../bots?search=support`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "workspaceId": "507f1f77bcf86cd799439011",
      "name": "Customer Support Bot",
      "status": "draft",
      "theme": {},
      "createdAt": "2024-03-22T10:35:00.000Z",
      "updatedAt": "2024-03-22T10:35:00.000Z"
    }
  ]
}
```

---

### 4.3 Update Bot

Updates a bot's name, status, or theme.

| | |
|---|---|
| **URL** | `PATCH /api/bots/{botId}` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `name` | `string` | No | 3–100 characters |
| `status` | `string` | No | `"draft"` or `"published"` |
| `theme` | `object` | No | Free-form theme config |

```json
{
  "name": "Updated Bot Name",
  "status": "published"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "workspaceId": "507f1f77bcf86cd799439011",
    "name": "Updated Bot Name",
    "status": "published",
    "theme": {},
    "createdAt": "2024-03-22T10:35:00.000Z",
    "updatedAt": "2024-03-22T10:40:00.000Z"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "message": "Invalid status"
}
```

---

## 5. Bot Flows

### 5.1 Get Bot Flow

Returns the latest version of a bot's flow (nodes and edges).

| | |
|---|---|
| **URL** | `GET /api/bots/{botId}/flow` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439014",
    "botId": "507f1f77bcf86cd799439013",
    "nodes": [
      {
        "id": "node-1",
        "type": "text",
        "data": { "message": "Hello!" }
      }
    ],
    "edges": [
      {
        "id": "edge-1",
        "source": "node-1",
        "target": "node-2"
      }
    ],
    "version": 2,
    "createdAt": "2024-03-22T10:45:00.000Z",
    "updatedAt": "2024-03-22T10:45:00.000Z"
  }
}
```

---

### 5.2 Save Bot Flow

Saves a new version of the bot flow. Each save creates a new version (auto-incremented).

| | |
|---|---|
| **URL** | `PUT /api/bots/{botId}/flow` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `nodes` | `array` | Yes | Array of node objects |
| `edges` | `array` | Yes | Array of edge objects |

```json
{
  "nodes": [
    {
      "id": "node-1",
      "type": "text",
      "data": { "message": "Welcome!" }
    },
    {
      "id": "node-2",
      "type": "input",
      "data": { "prompt": "What's your name?" }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439015",
    "botId": "507f1f77bcf86cd799439013",
    "nodes": [...],
    "edges": [...],
    "version": 3,
    "createdAt": "2024-03-22T10:50:00.000Z",
    "updatedAt": "2024-03-22T10:50:00.000Z"
  }
}
```

---

## 6. Conversations

### 6.1 Start Conversation

Starts a new conversation with a bot. **No authentication required** (public-facing).

| | |
|---|---|
| **URL** | `POST /api/bots/{botId}/conversations` |
| **Auth** | **Not required** |
| **Success Code** | `201 Created` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sessionId` | `string` | No | Auto-generated if not provided |

```json
{
  "sessionId": "custom-session-id-123"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "botId": "507f1f77bcf86cd799439013",
    "sessionId": "custom-session-id-123",
    "visitor": {
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    "isCompleted": false,
    "createdAt": "2024-03-22T11:00:00.000Z",
    "updatedAt": "2024-03-22T11:00:00.000Z"
  }
}
```

> **Note:** Visitor IP is captured from `X-Forwarded-For` header or `req.ip`. User-Agent is auto-captured.

---

### 6.2 Get Conversation

Returns conversation details. **No authentication required.**

| | |
|---|---|
| **URL** | `GET /api/conversations/{conversationId}` |
| **Auth** | **Not required** |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `conversationId` | `string` | MongoDB ObjectId |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439016",
    "botId": "507f1f77bcf86cd799439013",
    "sessionId": "custom-session-id-123",
    "visitor": {
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0..."
    },
    "isCompleted": false,
    "createdAt": "2024-03-22T11:00:00.000Z",
    "updatedAt": "2024-03-22T11:00:00.000Z"
  }
}
```

---

## 7. Messages

### 7.1 Send Message

Adds a message to a conversation. **No authentication required** (public-facing).

| | |
|---|---|
| **URL** | `POST /api/conversations/{conversationId}/messages` |
| **Auth** | **Not required** |
| **Success Code** | `201 Created` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `conversationId` | `string` | MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Validation |
|-------|------|----------|------------|
| `sender` | `string` | Yes | `"bot"` or `"user"` |
| `content` | `string` | Yes | Minimum 1 character |
| `nodeId` | `string` | No | Flow node ID for tracking |

```json
{
  "sender": "user",
  "content": "Hello, I need help!",
  "nodeId": "node-1"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439017",
    "conversationId": "507f1f77bcf86cd799439016",
    "sender": "user",
    "content": "Hello, I need help!",
    "nodeId": "node-1",
    "createdAt": "2024-03-22T11:05:00.000Z",
    "updatedAt": "2024-03-22T11:05:00.000Z"
  }
}
```

---

### 7.2 Get Messages

Returns all messages in a conversation (sorted by creation time). **Requires authentication** — validates the user has access to the bot via workspace membership.

| | |
|---|---|
| **URL** | `GET /api/conversations/{conversationId}/messages` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `conversationId` | `string` | MongoDB ObjectId |

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439017",
      "conversationId": "507f1f77bcf86cd799439016",
      "sender": "user",
      "content": "Hello, I need help!",
      "nodeId": "node-1",
      "createdAt": "2024-03-22T11:05:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439018",
      "conversationId": "507f1f77bcf86cd799439016",
      "sender": "bot",
      "content": "Hi! How can I assist you?",
      "nodeId": "node-2",
      "createdAt": "2024-03-22T11:06:00.000Z"
    }
  ]
}
```

---

## 8. Leads

### 8.1 Create/Update Lead

Creates or updates (upserts) lead data for a conversation. **No authentication required.**

| | |
|---|---|
| **URL** | `POST /api/conversations/{conversationId}/leads` |
| **Auth** | **Not required** |
| **Success Code** | `201 Created` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `conversationId` | `string` | MongoDB ObjectId |

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `botId` | `string` | Yes | MongoDB ObjectId of the bot |
| `data` | `object` | No | Free-form lead data (default: `{}`) |

```json
{
  "botId": "507f1f77bcf86cd799439013",
  "data": {
    "email": "visitor@example.com",
    "name": "Jane Visitor",
    "phone": "+1234567890",
    "company": "Acme Corp"
  }
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439019",
    "botId": "507f1f77bcf86cd799439013",
    "conversationId": "507f1f77bcf86cd799439016",
    "data": {
      "email": "visitor@example.com",
      "name": "Jane Visitor",
      "phone": "+1234567890",
      "company": "Acme Corp"
    },
    "createdAt": "2024-03-22T11:10:00.000Z",
    "updatedAt": "2024-03-22T11:10:00.000Z"
  }
}
```

> **Note:** If a lead already exists for the same `(botId, conversationId)` pair, the `data` fields are shallow-merged with existing data.

---

### 8.2 List Leads

Lists all leads for a bot with optional date range filtering. **Requires authentication.**

| | |
|---|---|
| **URL** | `GET /api/bots/{botId}/leads` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `from` | `string` | No | ISO 8601 date — filter `createdAt >= from` |
| `to` | `string` | No | ISO 8601 date — filter `createdAt <= to` |

**Example:** `GET /api/bots/507f.../leads?from=2024-03-01&to=2024-03-31`

**Success Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439019",
      "botId": "507f1f77bcf86cd799439013",
      "conversationId": "507f1f77bcf86cd799439016",
      "data": {
        "email": "visitor@example.com",
        "name": "Jane Visitor"
      },
      "createdAt": "2024-03-22T11:10:00.000Z",
      "updatedAt": "2024-03-22T11:10:00.000Z"
    }
  ]
}
```

---

## 9. Bot Appearance

### 9.1 Get Appearance (Authenticated)

Returns the bot's appearance configuration (draft or published).

| | |
|---|---|
| **URL** | `GET /api/bots/{botId}/appearance` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd79943901a",
    "botId": "507f1f77bcf86cd799439013",
    "avatar": {
      "type": "default",
      "url": null
    },
    "theme": {
      "type": "solid",
      "solid": {
        "color": "#16A34A"
      },
      "gradient": {
        "angle": 135,
        "colors": []
      }
    },
    "position": "bottom-right",
    "branding": {
      "showBranding": true,
      "brandLogoUrl": null
    },
    "isDraft": true,
    "createdAt": "2024-03-22T11:15:00.000Z",
    "updatedAt": "2024-03-22T11:15:00.000Z"
  }
}
```

---

### 9.2 Update Appearance

Updates the bot's appearance configuration (deep-merged with existing).

| | |
|---|---|
| **URL** | `PUT /api/bots/{botId}/appearance` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Request Body (all fields optional):**

| Field | Type | Validation |
|-------|------|------------|
| `avatar.type` | `string` | `"default"` or `"custom"` |
| `avatar.url` | `string` | Valid URI |
| `theme.type` | `string` | `"solid"` or `"gradient"` |
| `theme.solid.color` | `string` | Hex color (`#RGB` or `#RRGGBB`) |
| `theme.gradient.angle` | `number` | 0–360 |
| `theme.gradient.colors` | `string[]` | Array of hex colors (min 2) |
| `position` | `string` | `"bottom-left"` or `"bottom-right"` |
| `branding.showBranding` | `boolean` | Show/hide branding |
| `branding.brandLogoUrl` | `string` | Valid URI |
| `isDraft` | `boolean` | Draft or published state |

```json
{
  "avatar": {
    "type": "custom",
    "url": "https://example.com/avatar.png"
  },
  "theme": {
    "type": "gradient",
    "gradient": {
      "angle": 135,
      "colors": ["#FF6B6B", "#4ECDC4"]
    }
  },
  "position": "bottom-left",
  "branding": {
    "showBranding": false
  },
  "isDraft": false
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd79943901a",
    "botId": "507f1f77bcf86cd799439013",
    "avatar": {
      "type": "custom",
      "url": "https://example.com/avatar.png"
    },
    "theme": {
      "type": "gradient",
      "solid": { "color": "#16A34A" },
      "gradient": {
        "angle": 135,
        "colors": ["#FF6B6B", "#4ECDC4"]
      }
    },
    "position": "bottom-left",
    "branding": {
      "showBranding": false,
      "brandLogoUrl": null
    },
    "isDraft": false,
    "createdAt": "2024-03-22T11:15:00.000Z",
    "updatedAt": "2024-03-22T11:20:00.000Z"
  }
}
```

---

### 9.3 Preview Appearance

Returns a preview of appearance with temporary overrides **without saving**.

| | |
|---|---|
| **URL** | `POST /api/bots/{botId}/appearance/preview` |
| **Auth** | Required (Bearer token) |
| **Success Code** | `200 OK` |

**Request Body:** Same schema as [Update Appearance](#92-update-appearance)

**Response:** Same structure as GET appearance (merged preview)

---

### 9.4 Get Public Appearance

Returns the **published** bot appearance. **No authentication required.**

| | |
|---|---|
| **URL** | `GET /api/public/bots/{botId}/appearance` |
| **Auth** | **Not required** |
| **Success Code** | `200 OK` |

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `botId` | `string` | MongoDB ObjectId |

**Success Response (200):** Same structure as GET appearance

> **Note:** Returns `404` if the appearance has `isDraft: true` (not yet published).

---

## 10. File Uploads

### 10.1 Upload Image

Uploads an image file for use in bot appearance or content.

| | |
|---|---|
| **URL** | `POST /api/uploads/images` |
| **Auth** | Required (Bearer token) |
| **Content-Type** | `multipart/form-data` |
| **Success Code** | `201 Created` |

**Request Body (Form Data):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | `binary` | Yes | Image file |

**Allowed MIME Types:**
- `image/png`
- `image/jpeg`
- `image/webp`
- `image/svg+xml`

**Maximum File Size:** 2MB (configurable via `UPLOAD_MAX_SIZE_BYTES`)

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "url": "https://uploads.example.com/avatar-1234567890-123456789.png",
    "mimeType": "image/png",
    "size": 45678,
    "originalName": "avatar.png",
    "filename": "avatar-1234567890-123456789.png"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Invalid file type"
}
```

---

## 11. Authentication Guide

### How Authentication Works

This API uses **JWT (JSON Web Tokens)** with a dual-token strategy:

| Token | TTL | Purpose |
|-------|-----|---------|
| **Access Token** | 15 minutes | Used for API requests |
| **Refresh Token** | 7 days | Used to get new access tokens |

### Using Authentication

1. **Sign up or log in** to receive `accessToken` and `refreshToken`
2. **Include the access token** in all protected requests:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
   ```
3. **When the access token expires** (401 response), call the refresh endpoint with your refresh token
4. **Store the new token pair** and retry the failed request

### Token Refresh Flow

```
Client                          Server
  |                               |
  |-- Request with expired AT -->|
  |<-- 401 Unauthorized ---------|
  |                               |
  |-- POST /auth/refresh ------->|
  |   { refreshToken: "..." }    |
  |<-- New AT + RT --------------|
  |                               |
  |-- Retry with new AT -------->|
  |<-- 200 OK -------------------|
```

### Public vs Protected Endpoints

| Endpoint Type | Auth Required | Examples |
|--------------|---------------|---------|
| **Public** | No | Signup, Login, Refresh, Forgot/Reset Password |
| **Public (Bot-facing)** | No | Start Conversation, Send Message, Get Conversation, Submit Lead, Get Public Appearance |
| **Protected** | Yes | User Profile, Workspaces, Bots, Bot Flows, Get Messages, Get Leads, Appearance Management, Uploads |

---

## 12. Error Handling

### Standard Error Response

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Validation Error Response (422)

```json
{
  "success": false,
  "errors": [
    {
      "message": "\"name\" length must be at least 3 characters long",
      "path": ["name"]
    }
  ]
}
```

### Auth Validation Error Response

```json
{
  "success": false,
  "errors": {
    "email": ["Email is required", "Must be a valid email"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| `200` | OK | Successful GET, PUT, PATCH |
| `201` | Created | Successful POST (resource created) |
| `400` | Bad Request | Invalid request body/params |
| `401` | Unauthorized | Missing or invalid authentication |
| `403` | Forbidden | Authenticated but lacks permission |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate resource (e.g., email) |
| `422` | Unprocessable Entity | Validation error |
| `500` | Internal Server Error | Server error |

### Correlation ID

Every request is assigned a **correlation ID** (UUID) for tracing:
- Auto-generated if not provided
- Can be passed via `X-Correlation-Id` header
- Included in error responses and server logs

---

## 13. Environment Variables

```env
# Core
NODE_ENV=development              # development | production
PORT=4000                         # Server port
LOG_LEVEL=info                    # Winston log level

# Database
MONGODB_URI=mongodb://localhost:27017     # MongoDB connection string
MONGODB_DB=express_boilerplate            # Database name

# JWT
JWT_ACCESS_SECRET=your_access_secret      # Access token signing key
JWT_REFRESH_SECRET=your_refresh_secret    # Refresh token signing key
JWT_ACCESS_TTL=15m                        # Access token expiration
JWT_REFRESH_TTL=7d                        # Refresh token expiration

# Uploads
UPLOADS_BASE_URL=https://cdn.example.com  # Public URL prefix for uploads
UPLOAD_MAX_SIZE_BYTES=2097152             # Max upload size (2MB default)
```

---

## 14. Data Models

### User

```typescript
{
  _id: ObjectId
  email: string           // unique, lowercase, indexed
  password: string        // bcrypt hashed (salt rounds: 12)
  name: string
  role: 'user' | 'admin'  // default: 'admin'
  isEmailVerified: boolean // default: false
  resetPasswordToken?: string
  resetPasswordExpires?: Date
  signupTimezone?: string
  signupIp?: string
  lastLoginIp?: string
  lastLoginUserAgent?: string
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}
```

### Workspace

```typescript
{
  _id: ObjectId
  name: string
  owner: ObjectId          // ref: User
  members: ObjectId[]      // ref: User, default: [owner]
  createdAt: Date
  updatedAt: Date
}
```

### Bot

```typescript
{
  _id: ObjectId
  workspaceId: ObjectId    // ref: Workspace, indexed
  name: string
  status: 'draft' | 'published'  // default: 'draft'
  theme?: object
  createdAt: Date
  updatedAt: Date
}
```

### BotFlow

```typescript
{
  _id: ObjectId
  botId: ObjectId          // ref: Bot, indexed
  nodes: any[]             // flow node objects
  edges: any[]             // flow edge objects
  version: number          // auto-incremented, default: 1
  createdAt: Date
  updatedAt: Date
}
```

### Conversation

```typescript
{
  _id: ObjectId
  botId: ObjectId          // ref: Bot, indexed
  sessionId: string        // indexed
  visitor: {
    ip?: string
    userAgent?: string
  }
  isCompleted: boolean     // default: false
  createdAt: Date
  updatedAt: Date
}
```

### Message

```typescript
{
  _id: ObjectId
  conversationId: ObjectId // ref: Conversation, indexed
  sender: 'bot' | 'user'
  content: string
  nodeId?: string          // flow node tracking
  createdAt: Date
  updatedAt: Date
}
```

### Lead

```typescript
{
  _id: ObjectId
  botId: ObjectId          // ref: Bot, indexed
  conversationId: ObjectId // ref: Conversation
  data: Record<string, any>  // free-form lead fields
  createdAt: Date
  updatedAt: Date
}
```

### BotAppearance

```typescript
{
  _id: ObjectId
  botId: ObjectId          // ref: Bot, unique, indexed
  avatar: {
    type: 'default' | 'custom'  // default: 'default'
    url?: string
  }
  theme: {
    type: 'solid' | 'gradient'  // default: 'solid'
    solid?: { color: string }   // default: '#16A34A'
    gradient?: {
      angle: number             // default: 135
      colors: string[]          // min 2 colors
    }
  }
  position: 'bottom-left' | 'bottom-right'  // default: 'bottom-right'
  branding: {
    showBranding: boolean       // default: true
    brandLogoUrl?: string
  }
  isDraft: boolean              // default: true
  createdAt: Date
  updatedAt: Date
}
```

---

## Quick Reference — All Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | No | Register new user |
| `POST` | `/api/auth/login` | No | Login |
| `POST` | `/api/auth/refresh` | No | Refresh tokens |
| `POST` | `/api/auth/forgot-password` | No | Request password reset |
| `POST` | `/api/auth/reset-password` | No | Reset password with token |
| `GET` | `/api/users/me` | Yes | Get my profile |
| `PUT` | `/api/users/me` | Yes | Update my profile |
| `POST` | `/api/workspaces` | Yes | Create workspace |
| `GET` | `/api/workspaces` | Yes | List my workspaces |
| `GET` | `/api/workspaces/{id}` | Yes | Get workspace |
| `POST` | `/api/workspaces/{id}/bots` | Yes | Create bot |
| `GET` | `/api/workspaces/{id}/bots` | Yes | List bots |
| `PATCH` | `/api/bots/{id}` | Yes | Update bot |
| `GET` | `/api/bots/{id}/flow` | Yes | Get bot flow |
| `PUT` | `/api/bots/{id}/flow` | Yes | Save bot flow |
| `POST` | `/api/bots/{id}/conversations` | No | Start conversation |
| `GET` | `/api/conversations/{id}` | No | Get conversation |
| `POST` | `/api/conversations/{id}/messages` | No | Send message |
| `GET` | `/api/conversations/{id}/messages` | Yes | Get messages |
| `POST` | `/api/conversations/{id}/leads` | No | Submit lead |
| `GET` | `/api/bots/{id}/leads` | Yes | List leads |
| `GET` | `/api/bots/{id}/appearance` | Yes | Get appearance |
| `PUT` | `/api/bots/{id}/appearance` | Yes | Update appearance |
| `POST` | `/api/bots/{id}/appearance/preview` | Yes | Preview appearance |
| `GET` | `/api/public/bots/{id}/appearance` | No | Get public appearance |
| `POST` | `/api/uploads/images` | Yes | Upload image |
