# JoinEazy — Placement Backend

Backend for the Placement module of the JoinEazy ERP. Express 4 · Sequelize 6 ·
PostgreSQL 16 · Node 20 — the same conventions as the other JoinEazy services.

> **Status: skeleton.** Every module has real models, routes, controllers and
> working CRUD, and the drive lifecycle (rounds → outcomes → advance) and the
> apply flow carry real logic. Reporting, notifications, file upload and bulk
> import are stubs to grow into.

It backs [`Placement-Frontend`](https://github.com/SiddharthaThonti/placement_frontend),
whose `src/api/services/placement.service.js` already calls these paths — so
switching it off mocks is a base-URL change, not a rewrite.

## Run

```bash
cp .env.example .env      # set DATABASE_* and JWT_SECRET
npm install
npm run db:setup          # create schema + seed reference data
npm run dev               # http://localhost:8003
```

`JWT_SECRET` **must match the main ERP's** — this service verifies tokens the
ERP issues and owns no user accounts of its own.

## Modules

| Module | Base path | Owns |
|---|---|---|
| Overview | `/placement/overview`, `/coord/overview`, `/hod/overview` | dashboards (derived, no tables) |
| Companies | `/placement/companies` | companies, recruiter contacts, hiring history |
| MOUs | `/placement/mous` | agreements, campus visits |
| Drives | `/placement/jobs`, `/placement/drives` | drives + selection rounds |
| Applications | `/placement/applications`, `/placement/apply/:jobId` | applications, round results |
| Interviews | `/placement/interviews` | scheduled slots |
| Offers | `/placement/offers` | offers, acceptance |
| Students | `/placement/students` | placement roster, student profiles |
| Training | `/placement/training` | courses, enrolments, sessions, attendance |
| Assessments | `/placement/assessments` | tests and scores |
| Tasks | `/placement/tasks` | coordinator to-dos, off-campus records |

Drives are mounted under **both** `/jobs` and `/drives` — the frontend uses
"jobs" for the student board and "drives" for the coordinator pipeline, and they
are the same record.

## Conventions

- **Services hold the logic; controllers hold none.** A controller unwraps the
  request, calls one service function, and shapes the response.
- Routine CRUD comes from `src/utils/crud.js` rather than being copy-pasted per
  module. Override any method the moment a module needs real behaviour — see
  `jobs-service.js` and `applications-service.js`, which do.
- Every response is `{ success, data }` or `{ success: false, message }`.
- Async route handlers **must** be wrapped in `asyncHandler`. A bare `async`
  handler that rejects escapes Express 4 and takes the process down.

## Authorisation

`PLACEMENT_STAFF = ["admin", "placement_coordinator", "hod", "dean"]` may write.
Reads are open to any authenticated user; each service still scopes results by
the caller where it matters. `professor` is deliberately excluded — professors
view drives and their mentees but do not run the placement cell.

## Drive lifecycle

```
Applications open → Assessment → Interviews → Offered → Drive complete
```

`POST /placement/drives/:jobId/advance` moves to the next stage (or to an
explicit `{ status }`). Round outcomes are recorded in bulk via
`POST /drives/:jobId/rounds/:roundId/outcomes` and can be undone with
`.../outcomes/revert`; clearing a round advances the application, rejecting it
ends it. Accepting an offer marks the roster row **Placed**.

## Notes

- A student must be on the **placement roster** before applying — applications
  are foreign-keyed to it, and eligibility (CGPA, branch) cannot be judged
  without it. Applying without a roster row returns a clear 400.
- `DATABASE_SSL` is explicit rather than inferred from `NODE_ENV`; a shell that
  exports `NODE_ENV=production` would otherwise force SSL against a local
  Postgres that does not offer it.
- **Docker:** a one-shot migration container runs the code baked into its image,
  not a bind mount. Rebuild it after changing a model, or `sync({ alter: true })`
  will run against stale models and **drop** columns the live code expects.
