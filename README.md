# be_vac

> Backend REST API service for VAC Stechoq therapy tracking and medical device management.

Built with **Bun**, **ElysiaJS**, and **Prisma ORM** on **PostgreSQL**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [System Architecture & Data Flow](#system-architecture--data-flow)
  - [System Component Diagram](#system-component-diagram)
  - [End-to-End Therapy Sync Flow](#end-to-end-e2e-therapy-sync-flow)
  - [Device QR Binding & Auth Sequence](#device-qr-binding--auth-sequence)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Database Tooling](#database-tooling)
- [API Reference](#api-reference)
  - [Endpoints Summary](#endpoints-summary)
  - [Authentication](#authentication)
  - [Device Management](#device-management)
  - [Therapy Sessions](#therapy-sessions)
  - [Error Response Catalogue](#error-response-catalogue)
- [Project Architecture](#project-architecture)
- [Database Schema](#database-schema)
  - [Entity Relationship Diagram](#entity-relationship-er-diagram)
  - [Device Binding State Lifecycle](#device-binding-state-lifecycle)
- [Development Workflow](#development-workflow)
- [License](#license)

---

## Overview

`be_vac` is the core REST API service powering the VAC Stechoq medical application ecosystem. It handles user authentication, device provisioning via QR code, live GPS telemetry of active devices, and secure storage of therapy session logs.

> [!NOTE]
> `be_vac` is a pure HTTP REST API service. Therapy session data recorded by VAC Stechoq hardware via Bluetooth Low Energy (BLE) is synchronized locally by the mobile client and then uploaded to this backend via REST.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Runtime | [Bun](https://bun.sh) — ultra-fast JavaScript/TypeScript runtime & package manager |
| Framework | [ElysiaJS](https://elysiajs.com) — ergonomic, type-safe web framework for Bun |
| Database | PostgreSQL via [Prisma ORM](https://www.prisma.io) (`@prisma/adapter-pg`) |
| Authentication | JWT (`@elysiajs/jwt`) & bcrypt password hashing (`Bun.password`) |
| Validation | TypeBox (`t`) schema validation |
| Logging | Pino with `pino-pretty` middleware |
| API Docs | OpenAPI / Swagger UI via `@elysiajs/swagger` |
| Testing | Native Bun test runner (`bun test`) |

---

## Features

- 🔐 **Authentication & Authorization** — JWT-based registration, login, and logout with bcrypt password hashing.
- 📱 **QR Code Device Binding** — QR key resolution, device validation, and transactional user-device mapping.
- 📍 **Live Device Location Tracking** — Query real-time GPS telemetry and online status for all bound devices.
- 🩺 **Therapy Session Management** — Upload and retrieve historical therapy logs, filterable by year.
- 📖 **Interactive API Docs** — Swagger UI served automatically at `/docs`.

---

## System Architecture & Data Flow

### System Component Diagram

```mermaid
flowchart TB
    accTitle: System Architecture and Data Flow
    accDescr: High-level diagram showing interaction between hardware, mobile app, ElysiaJS backend, and PostgreSQL.

    subgraph hardware_layer["Hardware & Edge Layer"]
        vac_device["📟 VAC Stechoq Device"]
    end

    subgraph client_layer["Client Layer"]
        mobile_app["📱 Mobile Application"]
    end

    subgraph backend_layer["Backend Layer (be_vac / Bun + ElysiaJS)"]
        api_router["⚡ ElysiaJS Router & CORS"]
        jwt_auth["🔐 JWT & Auth Middleware"]
        pino_logger["📜 Pino Logger Middleware"]

        subgraph services["Services Layer"]
            auth_service["👤 Auth Service"]
            device_service["📡 Device Service"]
            therapy_service["🩺 Therapy Service"]
        end

        prisma_orm["💎 Prisma ORM Client"]
    end

    subgraph database_layer["Database Layer"]
        postgres_db[("🐘 PostgreSQL Database")]
    end

    vac_device -- "1. Sync Therapy Data (BLE)" --> mobile_app
    mobile_app -- "2. HTTP REST Request + Bearer JWT" --> api_router
    api_router --> jwt_auth
    jwt_auth --> pino_logger
    pino_logger --> auth_service
    pino_logger --> device_service
    pino_logger --> therapy_service
    auth_service --> prisma_orm
    device_service --> prisma_orm
    therapy_service --> prisma_orm
    prisma_orm --> postgres_db

    classDef hw fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#991b1b
    classDef client fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#3730a3
    classDef server fill:#dbeafe,stroke:#3b82f6,stroke-width:2px,color:#1e40af
    classDef db fill:#dcfce7,stroke:#22c55e,stroke-width:2px,color:#166534

    class vac_device hw
    class mobile_app client
    class api_router,jwt_auth,pino_logger,auth_service,device_service,therapy_service,prisma_orm server
    class postgres_db db
```

---

### End-to-End (E2E) Therapy Sync Flow

```mermaid
sequenceDiagram
    accTitle: End-to-End Therapy Session Upload Sequence
    accDescr: How a therapy session is recorded on a VAC device, synced via BLE to the mobile app, and posted to the backend API.

    actor User as 👤 Patient / Nurse
    participant Device as 📟 VAC Device
    participant Mobile as 📱 Mobile App
    participant Middleware as 🛡️ Auth Middleware
    participant Service as ⚙️ Therapy Service
    participant DB as 🐘 PostgreSQL DB

    User->>Device: Execute therapy session
    Device-->>Device: Record duration, mode & session date
    User->>Mobile: Connect to device via BLE
    Device->>Mobile: Transfer therapy session log payload (BLE)
    Mobile->>Mobile: Attach current device GPS coordinates (lat, long)
    Mobile->>Middleware: POST /api/therapy-sessions (Bearer JWT + Payload)

    alt Invalid or Missing JWT Token
        Middleware-->>Mobile: 401 Unauthorized
    else Valid JWT Token
        Middleware->>Middleware: Extract userId & active deviceId from JWT
        alt deviceId is Null (No Active Device Bound)
            Middleware-->>Mobile: 403 Device Required
        else deviceId is Present
            Middleware->>Service: createTherapySession({userId, deviceId, ...body})
            Service->>DB: INSERT into History table
            DB-->>Service: Created Session Record
            Service-->>Mobile: 201 Created { status: "ok", data: session }
            Mobile-->>User: Display session sync confirmation
        end
    end
```

---

### Device QR Binding & Auth Sequence

```mermaid
sequenceDiagram
    accTitle: Device QR Binding and Token Issue Sequence
    accDescr: User registration or device binding via QR code scanning and JWT reissue.

    actor User as 👤 User / Medical Staff
    participant Mobile as 📱 Mobile App
    participant QRResolver as 🔍 QR Resolver
    participant DeviceService as 📡 Device Service
    participant DB as 🐘 PostgreSQL DB

    User->>Mobile: Scan QR Code label on VAC Device
    Mobile->>QRResolver: Parse QR Payload
    QRResolver-->>Mobile: Extracted qrKey (e.g. B002U)
    Mobile->>DeviceService: POST /api/device/bind { qrKey } (Bearer JWT)
    DeviceService->>DB: Query Device by qrKey

    alt Device Not Found or Not Produced
        DB-->>DeviceService: Null / isProduced = false
        DeviceService-->>Mobile: 400 Bad Request ("Device not found or invalid")
    else Device Valid
        DB-->>DeviceService: Valid Device Record (id: newDeviceId)
        DeviceService->>DB: Update existing user bindings (isActive = false)
        DeviceService->>DB: Insert new TrDeviceUser record (isActive = true)
        DeviceService-->>Mobile: Reissue JWT Token with updated deviceId
        Mobile-->>User: Device successfully bound & active!
    end
```

---

## Prerequisites

- [Bun](https://bun.sh) v1.0.0 or higher
- [PostgreSQL](https://www.postgresql.org) database (local instance or managed cloud database)

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:password@localhost:5432/be_vac?sslmode=disable` |
| `JWT_SECRET` | Secret key used to sign JWT tokens | `change-this-to-a-secure-secret-key` |

> [!CAUTION]
> Never commit `.env` to version control. Use a strong, randomly generated value for `JWT_SECRET` in production.

---

## Quick Start

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and fill in DATABASE_URL and JWT_SECRET
```

### 3. Run Database Migrations & Generate Prisma Client

```bash
bunx prisma migrate dev
bunx prisma generate
```

### 4. Start Development Server

```bash
bun run dev
```

The server starts at `http://localhost:3000` with hot-reload enabled.
Interactive API docs are available at `http://localhost:3000/docs`.

---

## Docker Deployment

A `Dockerfile` is included for containerised deployments. It uses the official `oven/bun` base image.

### Build the Image

```bash
docker build -t be_vac .
```

### Run the Container

```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@host:5432/be_vac?sslmode=disable" \
  -e JWT_SECRET="your-production-secret" \
  --name be_vac \
  be_vac
```

> [!NOTE]
> The container exposes port `3000` and runs `bun src/index.ts` directly (no build step). The Prisma client is generated during the Docker image build.

> [!IMPORTANT]
> The database must be reachable from within the container. If running PostgreSQL locally, use `host.docker.internal` as the host instead of `localhost`.

---

## Database Tooling

### Run Migrations

Creates a new migration file and applies all pending migrations:

```bash
bunx prisma migrate dev
```

### Apply Migrations in Production

Applies pending migrations without creating new migration files:

```bash
bunx prisma migrate deploy
```

### Regenerate Prisma Client

Required after any change to `prisma/schema.prisma`:

```bash
bunx prisma generate
```

The generated client is output to `src/generated/prisma`.

### Prisma Studio

Opens a visual browser-based GUI for inspecting and editing database records:

```bash
bunx prisma studio
```

---

## API Reference

### Endpoints Summary

All endpoints are prefixed with `/api`. Endpoints marked **Auth Required** expect:

```
Authorization: Bearer <jwt_token>
```

| Method | Endpoint | Description | Auth Required |
| :---: | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user and bind a device via QR key | No |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT token | No |
| `POST` | `/api/auth/logout` | Deactivate current device binding and end session | Yes |
| `POST` | `/api/device/bind` | Bind or switch the active device via QR key | Yes |
| `GET` | `/api/device/live-locations` | Get live GPS telemetry for all devices | Yes |
| `GET` | `/api/devices/live-locations` | Alias for the above endpoint | Yes |
| `POST` | `/api/therapy-sessions` | Upload and record a new therapy session | Yes |
| `GET` | `/api/therapy-sessions` | Get therapy session history (supports `?year=YYYY`) | Yes |

---

### Authentication

#### POST `/api/auth/register`

Registers a new user and immediately binds a VAC device using the provided QR key. Returns a signed JWT token.

**Request Body**

```json
{
  "name": "John Doe",
  "hospitalName": "RSUD Sehat",
  "username": "johndoe",
  "password": "securepassword123",
  "qrKey": "B002U"
}
```

**Success Response — `201 Created`**

```json
{
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deviceId": 2,
  "user": {
    "id": 1,
    "username": "johndoe"
  }
}
```

**Error Response — `400 Bad Request`**

```json
{ "error": "Registration failed." }
```

---

#### POST `/api/auth/login`

Authenticates a user and returns a JWT token. The token payload includes `userId`, `username`, and `deviceId` (the currently active device, or `null` if no device is bound).

**Request Body**

```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Success Response — `200 OK`**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response — `401 Unauthorized`**

```json
{ "error": "Invalid username or password." }
```

---

#### POST `/api/auth/logout`

Deactivates all active device bindings for the authenticated user (`TrDeviceUser.isActive = false`). The client is responsible for discarding the JWT token.

**Request Body** — None

**Success Response — `200 OK`**

```json
{ "message": "Logged out successfully" }
```

---

### Device Management

#### POST `/api/device/bind`

Binds the authenticated user to a new VAC device by QR key. Any previously active binding is deactivated atomically. Returns a new JWT token with the updated `deviceId` in its payload.

> [!IMPORTANT]
> The mobile client **must** replace the stored JWT with the returned `token`. The old token's `deviceId` is now stale.

**Request Body**

```json
{ "qrKey": "aBcDe" }
```

**Success Response — `200 OK`**

```json
{
  "status": "ok",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response — `400 Bad Request`**

```json
{ "error": "Device not found." }
```

---

#### GET `/api/device/live-locations`

Returns real-time GPS telemetry for all devices in the system. A device is considered **online** if its `lastSeenAt` timestamp is within the last 5 minutes. Includes the currently active user binding and the most recent therapy session for each device.

**Request Body** — None

**Success Response — `200 OK`**

```json
{
  "status": "ok",
  "data": [
    {
      "id": 1,
      "qrKey": "B002U",
      "latitude": -6.2088,
      "longitude": 106.8456,
      "lastSeenAt": "2026-07-31T04:10:00.000Z",
      "isOnline": true,
      "currentUser": {
        "id": 1,
        "name": "John Doe",
        "hospitalName": "RSUD Sehat",
        "username": "johndoe"
      },
      "lastSession": {
        "id": 5,
        "sessionDate": "2026-07-31",
        "title": "Sesi Terapi Pagi",
        "mode": "Kontinyu",
        "duration": "45 Menit",
        "createdAt": "2026-07-31T03:45:00.000Z"
      }
    }
  ]
}
```

> [!NOTE]
> `isOnline` is computed at query time. A device with no `lastSeenAt` value is always reported as offline.

---

### Therapy Sessions

#### POST `/api/therapy-sessions`

Uploads and records a therapy session log. The `userId` and `deviceId` are extracted from the JWT token — they must not be sent in the request body.

> [!IMPORTANT]
> This endpoint requires an active device binding. If `deviceId` in the JWT is `null`, the request will be rejected with `403`.

**Request Body**

```json
{
  "sessionDate": "2026-07-31",
  "title": "Sesi Terapi Pagi",
  "date": "31 Jul 2026",
  "mode": "Kontinyu",
  "duration": "45 Menit"
}
```

**Success Response — `201 Created`**

```json
{ "message": "Therapy session saved successfully" }
```

---

#### GET `/api/therapy-sessions`

Returns all therapy session history for the authenticated user. Supports optional year filtering.

**Query Parameters**

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `year` | `string` | No | Filter sessions by year, e.g. `?year=2026` |

**Success Response — `200 OK`**

```json
{
  "data": [
    {
      "id": 1,
      "userId": 1,
      "deviceId": 1,
      "sessionDate": "2026-07-31",
      "title": "Sesi Terapi Pagi",
      "date": "31 Jul 2026",
      "mode": "Kontinyu",
      "duration": "45 Menit",
      "createdAt": "2026-07-31T03:45:00.000Z"
    }
  ]
}
```

---

### Error Response Catalogue

All error responses follow a consistent structure:

```json
{ "error": "<human-readable message>" }
```

| HTTP Status | Scenario |
| :---: | :--- |
| `400 Bad Request` | Invalid request body, QR key not found, or device not produced |
| `401 Unauthorized` | Missing, expired, or invalid JWT token |
| `403 Forbidden` | Valid token but no active device bound (`deviceId` is `null`) |
| `500 Internal Server Error` | Unhandled server-side error |

---

## Project Architecture

Three-layer clean architecture:

```text
be_vac/
├── docs/                       # Domain docs and agent issue tracker notes
├── prisma/
│   └── schema.prisma           # Database models and relations
├── src/
│   ├── index.ts                # Entry point — Elysia init, middleware & route registration
│   ├── db.ts                   # Prisma client instance & database connection
│   ├── logger.ts               # Pino logger setup
│   ├── generated/              # Generated Prisma client types (src/generated/prisma)
│   ├── middleware/
│   │   ├── auth.ts             # JWT authentication middleware
│   │   └── loggerMiddleware.ts # HTTP request/response logging middleware
│   ├── routes/                 # HTTP handlers, Elysia decorators, TypeBox schemas
│   │   ├── auth.ts             # /api/auth (/register, /login, /logout)
│   │   ├── device.ts           # /api/device (/bind, /live-locations)
│   │   └── therapy.ts          # /api/therapy-sessions (POST, GET)
│   ├── services/               # Business logic & Prisma DB operations
│   │   ├── auth.ts
│   │   ├── device.ts
│   │   └── therapy.ts
│   └── utils/
│       └── qrResolver.ts       # QR payload resolver utility
├── tests/                      # Unit and integration test suite
│   ├── routes/                 # Route integration tests
│   ├── services/               # Service unit tests
│   ├── setup.ts                # Global test configuration
│   └── utils.ts                # Test helpers & mock Prisma client
├── .env.example                # Environment variable template
├── API_CONTRACT.md             # Full API specification contract
└── README.md                   # This file
```

**Layer responsibilities:**

- **Routes** (`src/routes/`) — HTTP handlers, request validation with TypeBox, response shaping.
- **Services** (`src/services/`) — Business logic, Prisma DB calls, error handling.
- **Database** (`prisma/schema.prisma`) — Schema definitions; Prisma client is the only DB interface.

---

## Database Schema

### Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ TrDeviceUser : "has bindings"
    User ||--o{ History : "owns therapy logs"
    Device ||--o{ TrDeviceUser : "bound to users"
    Device ||--o{ History : "records therapy logs"

    User {
        Int id PK
        String name
        String hospitalName
        String username UK
        String passwordHash
        DateTime createdAt
        DateTime updatedAt
    }

    Device {
        Int id PK
        String qrKey UK
        Boolean isProduced
        Float latitude
        Float longitude
        DateTime lastSeenAt
        Boolean isOnline
        DateTime createdAt
        DateTime updatedAt
    }

    TrDeviceUser {
        Int id PK
        Int userId FK
        Int deviceId FK
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    History {
        Int id PK
        Int userId FK
        Int deviceId FK
        String sessionDate
        String title
        String date
        String mode
        String duration
        DateTime createdAt
    }
```

---

### Device Binding State Lifecycle

```mermaid
stateDiagram-v2
    accTitle: Device Binding State Lifecycle
    accDescr: Active and inactive lifecycle of user-device relationships managed via TrDeviceUser.

    [*] --> Unbound: User Registered (No Active Device)

    Unbound --> BoundActive: Scan QR & POST /api/device/bind

    state BoundActive {
        [*] --> ActiveState: TrDeviceUser.isActive = true
        ActiveState --> RecordingTherapy: POST /api/therapy-sessions
        RecordingTherapy --> ActiveState: Log Saved to History
        ActiveState --> LocationTracking: GET /api/device/live-locations
        LocationTracking --> ActiveState: Telemetry Returned
    }

    BoundActive --> BoundInactive: User Binds New Device QR\nor POST /api/auth/logout

    state BoundInactive {
        [*] --> InactiveState: TrDeviceUser.isActive = false
    }

    BoundInactive --> BoundActive: Re-bind Previous Device QR
```

---

## Development Workflow

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage report
bun test --coverage

# Run a specific test file
bun test tests/services/auth.test.ts
```

### Code Conventions

- **Architecture**: Follow the three-layer pattern — keep HTTP concerns in routes, business logic in services, no direct Prisma calls from routes.
- **Naming**: Use `camelCase` for variables and functions; `PascalCase` for types and interfaces.
- **Error handling**: Throw errors from services; catch and map to HTTP status codes in routes.
- **Clean code**: Apply KISS, SRP, and DRY principles. Keep functions small and focused.
- **No speculative code**: Do not add features or abstractions that are not immediately needed.

---

## License

Private & Proprietary. All rights reserved.
