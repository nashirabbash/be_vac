# be_vac

> Backend REST API service for VAC Stechoq therapy tracking and medical device management.

Built with high performance and type safety in mind using **Bun**, **ElysiaJS**, and **Prisma ORM** with **PostgreSQL**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [System Architecture & Data Flow](#system-architecture--data-flow)
  - [System Component Diagram](#system-component-diagram)
  - [End-to-End (E2E) Therapy Sync Flow](#end-to-end-e2e-therapy-sync-flow)
  - [Device QR Binding & Auth Sequence](#device-qr-binding--auth-sequence)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
  - [Primary Endpoints Summary](#primary-endpoints-summary)
- [Project Architecture](#project-architecture)
- [Database Schema](#database-schema)
  - [Entity Relationship (ER) Diagram](#entity-relationship-er-diagram)
  - [Device Binding State Lifecycle](#device-binding-state-lifecycle)
- [Testing](#testing)
- [License](#license)

---

## Overview

`be_vac` serves as the core backend REST API service powering the VAC Stechoq medical application ecosystem. It handles user authentication, device provisioning and binding via QR codes, live GPS location monitoring of active devices, and secure storage of therapy session logs. 

> [!NOTE]
> `be_vac` is a pure HTTP REST API service. Therapy session logs recorded by hardware devices via Bluetooth Low Energy (BLE) are synchronized locally by the mobile client application and subsequently uploaded to this backend via REST API endpoints.

---

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) (Ultra-fast JavaScript/TypeScript runtime & package manager)
- **Framework**: [ElysiaJS](https://elysiajs.com) (Ergonomic, type-safe web framework for Bun)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io) (`@prisma/adapter-pg`)
- **Authentication**: JWT (`@elysiajs/jwt`) & bcrypt password hashing (`Bun.password`)
- **Validation**: TypeBox (`t`) schema validation
- **Logging**: Pino logger with `pino-pretty` middleware
- **API Specs**: OpenAPI / Swagger UI via `@elysiajs/swagger`
- **Testing**: Native Bun test runner (`bun test`)

---

## Features

- 🔐 **Authentication & Authorization**: Secure JWT-based registration, login, token refresh, and logout.
- 📱 **QR Code Device Binding**: Automatic device validation, QR key resolution, and user-device mapping (`TrDeviceUser`).
- 📍 **Live Device Location Tracking**: Query active device GPS telemetry and online connectivity status.
- 🩺 **Therapy Session Management**: Upload, store, and query historical therapy logs filtered by year.
- 📖 **Interactive Swagger UI**: Auto-generated interactive API documentation served at `/docs`.

---

## System Architecture & Data Flow

### System Component Diagram

The following architecture diagram illustrates the end-to-end separation of concerns between hardware, mobile client, backend layers, and the database storage:

```mermaid
flowchart TB
    accTitle: System Architecture and Data Flow
    accDescr: High-level architectural diagram showing interaction between hardware, mobile app, ElysiaJS backend server, and PostgreSQL database.

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

Sequence diagram demonstrating how a patient therapy session is recorded on the physical VAC unit, retrieved by the mobile application via Bluetooth Low Energy (BLE), and securely saved to the database via REST API:

```mermaid
sequenceDiagram
    accTitle: End-to-End Therapy Session Upload Sequence
    accDescr: Sequence diagram illustrating how a therapy session is recorded on a VAC device, synced via BLE to the mobile app, and posted to the backend API.

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

Sequence diagram detailing user registration or active device binding via QR code scanning and JWT reissue:

```mermaid
sequenceDiagram
    accTitle: Device QR Binding and Token Issue Sequence
    accDescr: Sequence diagram demonstrating user registration or device binding via QR code scanning and JWT reissue.

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

- [Bun](https://bun.sh) (v1.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org) database (local instance or cloud database instance)

---

## Environment Variables

Copy `.env.example` to `.env` in the project root directory and configure the following variables:

```env
# Database connection string (PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/be_vac?sslmode=disable"

# Secret key used for signing JWT tokens
JWT_SECRET="your-super-secret-jwt-key"
```

---

## Quick Start

Get up and running in less than 5 minutes:

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and populate your database credentials and JWT secret key:

```bash
cp .env.example .env
```

### 3. Run Database Migrations & Generate Prisma Client

```bash
# Run migrations to set up database tables
bunx prisma migrate dev

# Generate Prisma Client types
bunx prisma generate
```

### 4. Start Development Server

```bash
bun run dev
```

The server will start at `http://localhost:3000`.

---

## API Documentation

Interactive Swagger documentation is available out of the box when running the server:

- **Swagger UI**: [http://localhost:3000/docs](http://localhost:3000/docs)

### Primary Endpoints Summary

All `/api` endpoints requiring authentication expect the HTTP Header:
`Authorization: Bearer <jwt_token>`

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register user & bind device via QR key | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `POST` | `/api/auth/logout` | Invalidate session / logout user | Yes |
| `POST` | `/api/device/bind` | Bind/switch active device with QR key | Yes |
| `GET` | `/api/device/live-locations` | Retrieve live GPS coordinates for bound devices | Yes |
| `POST` | `/api/therapy-sessions` | Upload & record new therapy session | Yes |
| `GET` | `/api/therapy-sessions` | Get user therapy session history (supports `?year=YYYY`) | Yes |

*For complete payload and response specifications, refer to [API_CONTRACT.md](API_CONTRACT.md) or visit `/docs`.*

---

## Project Architecture

The repository follows a clean 3-layer architecture:

```text
be_vac/
├── docs/                     # Domain documentation and issue tracker notes
├── prisma/
│   └── schema.prisma         # Database models and relations
├── src/
│   ├── index.ts              # Entry point (Elysia server initialization & plugin registration)
│   ├── db.ts                 # Database connection & Prisma client instance
│   ├── logger.ts             # Pino logger setup
│   ├── generated/            # Generated Prisma client types
│   ├── middleware/
│   │   ├── auth.ts           # JWT authentication middleware
│   │   └── loggerMiddleware.ts # HTTP request/response logging middleware
│   ├── routes/               # HTTP route handlers & TypeBox schemas
│   │   ├── auth.ts           # Authentication routes (/api/auth)
│   │   ├── device.ts         # Device management routes (/api/device)
│   │   └── therapy.ts        # Therapy history routes (/api/therapy-sessions)
│   ├── services/             # Core business logic & Prisma DB operations
│   │   ├── auth.ts
│   │   ├── device.ts
│   │   └── therapy.ts
│   └── utils/                # Utility helpers (e.g. QR key resolution)
├── tests/                    # Integration and unit test suite
│   ├── routes/               # API route endpoint tests
│   ├── services/             # Service unit tests
│   ├── setup.ts              # Global test configuration and setup
│   └── utils.ts              # Test helper utilities and Prisma mocks
├── .env.example              # Environment variable template
├── API_CONTRACT.md           # API specification contract document
└── README.md                 # Project documentation
```

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
    accDescr: State machine diagram detailing the active and inactive lifecycle of user-device relationships.

    [*] --> Unbound: User Registered (No Active Device)
    
    Unbound --> BoundActive: Scan QR & POST /api/device/bind
    
    state BoundActive {
        [*] --> ActiveState: TrDeviceUser.isActive = true
        ActiveState --> RecordingTherapy: POST /api/therapy-sessions
        RecordingTherapy --> ActiveState: Log Saved to History
        ActiveState --> LocationTracking: GET /api/device/live-locations
        LocationTracking --> ActiveState: Telemetry Returned
    }

    BoundActive --> BoundInactive: User Binds New Device QR
    
    state BoundInactive {
        [*] --> InactiveState: TrDeviceUser.isActive = false
    }

    BoundInactive --> BoundActive: Re-bind Previous Device QR
```

---

## Testing

Run unit and integration tests using Bun's native runner:

```bash
# Run all tests
bun test

# Run tests with code coverage report
bun test --coverage
```

---

## License

Private & Proprietary. All rights reserved.
