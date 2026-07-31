# 01 — Backend Location Schema & API Endpoints (be_vac)

**What to build:**
Update the Prisma database schema for `Device` model to store location telemetry (`latitude`, `longitude`, `lastSeenAt`, `isOnline`). Update `POST /api/therapy-sessions` endpoint to accept location parameters and update the active device's location. Create a new endpoint `GET /api/devices/live-locations` returning active devices with user details, coordinates, and computed online status.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] `schema.prisma` updated with `latitude`, `longitude`, `lastSeenAt`, and `isOnline` fields on `Device` model.
- [ ] Database migration generated and executed cleanly via Prisma.
- [ ] `POST /api/therapy-sessions` accepts optional `latitude` and `longitude` in request body and updates `Device` telemetry (`lastSeenAt = now()`, `isOnline = true`).
- [ ] Endpoint `GET /api/devices/live-locations` implemented returning list of devices with location, user/hospital info, and dynamically computed `isOnline` status (`lastSeenAt < 5 mins`).
- [ ] Integration tests in `tests/routes/device.test.ts` passing.
