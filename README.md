# be_vac

> Backend REST API service for VAC Stechoq therapy tracking and medical device management.

Built with high performance and type safety in mind using **Bun**, **ElysiaJS**, and **Prisma ORM** with **PostgreSQL**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Project Architecture](#project-architecture)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [License](#license)

---

## Overview

`be_vac` serves as the core backend engine powering the VAC Stechoq medical application ecosystem. It handles user authentication, device provisioning and binding via QR codes, live GPS location monitoring of active devices, and secure storage of therapy session logs transmitted by hardware devices via Bluetooth Low Energy (BLE) / Mobile client integration.

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

- 🔐 **Authentication & Authorization**: Secure JWT-based registration, login, and token management.
- 📱 **QR Code Device Binding**: Automatic device lookup, validation, and user-device binding (`TrDeviceUser`).
- 📍 **Live Device Location Tracking**: Query active device GPS coordinates and online status.
- 🩺 **Therapy Session Management**: Upload, store, and query historical therapy logs filtered by year.
- 📖 **Interactive Swagger UI**: Auto-generated interactive API docs served at `/docs`.

---

## Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or higher)
- [PostgreSQL](https://www.postgresql.org) database (local instance or cloud database instance)

---

## Environment Variables

Create a `.env` file in the project root directory with the following environment variables:

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

Create a `.env` file with your database URL and JWT secret key:

```bash
cp .env.example .env # if applicable, or populate .env manually
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

*For complete payload and response specifications, refer to [API_CONTRACT.md](file:///home/broo/Documents/apps/be_vac/API_CONTRACT.md) or visit `/docs`.*

---

## Project Architecture

The repository follows a clean 3-layer architecture:

```text
be_vac/
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
│   └── services/             # Service unit tests
├── API_CONTRACT.md           # API specification contract document
└── README.md                 # Project documentation
```

---

## Database Schema

Key models defined in `prisma/schema.prisma`:

- **User**: User accounts (name, hospitalName, username, passwordHash).
- **Device**: Physical VAC devices tracked by `qrKey`, produced status (`isProduced`), and telemetry (`latitude`, `longitude`, `isOnline`, `lastSeenAt`).
- **TrDeviceUser**: Relational mapping between Users and Devices with active state tracking (`isActive`).
- **History**: Recorded therapy sessions tied to a user and device (date, title, mode, duration).

Useful Prisma commands:

```bash
bunx prisma studio       # Open interactive database GUI in browser
bunx prisma migrate dev  # Create and execute database migrations
bunx prisma generate     # Regenerate Prisma Client TypeScript types
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
