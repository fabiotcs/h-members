# Prisma — H-Members Database

## Commands

### Generate Prisma Client (after schema changes)

```bash
npx prisma generate
```

### Run Migrations (development)

```bash
npx prisma migrate dev
```

To create a named migration:

```bash
npx prisma migrate dev --name <migration_name>
```

### Run Migrations (production)

```bash
npx prisma migrate deploy
```

### Seed Database

```bash
npx prisma db seed
```

The seed script creates:
- Admin user (from `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars)
- Default platform settings (`platform_name`, `primary_color`, `logo_url`)
- Default category "Geral"

The seed is idempotent and safe to run multiple times.

### Open Prisma Studio (visual database editor)

```bash
npx prisma studio
```

## package.json Configuration

The API `package.json` must include:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  },
  "scripts": {
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "prisma db seed"
  }
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL connection string | (required) |
| `ADMIN_EMAIL` | Admin user email for seed | `admin@hmembers.com` |
| `ADMIN_PASSWORD` | Admin user password for seed | `Admin@123` |
| `PLATFORM_NAME` | Platform display name | `H-Members` |
| `PRIMARY_COLOR` | Brand primary color | `#6366f1` |
| `LOGO_URL` | Logo file path | `/uploads/logos/logo.png` |

## Schema

The full schema is in `schema.prisma` with 15 models, 7 enums, and all required indexes and constraints. See `docs/stories/1.3.story.md` for the complete acceptance criteria.
