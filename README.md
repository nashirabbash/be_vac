# be_vac

Backend API for therapy session tracking, built on Elysia + Bun.

## Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Elysia](https://elysiajs.com)
- **Database**: PostgreSQL via Prisma ORM
- **API docs**: OpenAPI/Swagger via `@elysiajs/swagger`

## Setup

```bash
bun install
```

Create a `.env` file with your database connection string:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/be_vac"
```

Apply the schema:

```bash
bunx prisma migrate dev
```

## Development

```bash
bun run dev
```

Server runs at `http://localhost:3000`. API routes are under `/api`.

Interactive API docs available at `http://localhost:3000/docs`.

## Testing

```bash
bun test
bun test --coverage
```

## Project structure

```text
src/
  routes/     HTTP handlers, request validation
  services/   Business logic, Prisma DB calls
  index.ts    App entry point
prisma/
  schema.prisma   Database schema
tests/
```
