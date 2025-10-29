# Local Supabase Docker Setup

This project runs a local Supabase instance in Docker on custom ports to avoid conflicts with other Supabase instances.

## Port Mappings

The following ports are used (different from default to avoid conflicts):

- **Supabase Studio**: http://localhost:3012 (UI for database management)
- **API Gateway (Kong)**: http://localhost:8010 (API endpoint)
- **PostgreSQL**: localhost:5442
- **Inbucket (Email testing)**: http://localhost:9010

## Quick Start

1. **Start Supabase**:
   ```bash
   docker-compose --env-file .env.docker up -d
   ```

2. **Check status**:
   ```bash
   docker-compose ps
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop Supabase**:
   ```bash
   docker-compose down
   ```

5. **Stop and remove all data**:
   ```bash
   docker-compose down -v
   ```

## Access Points

- **Supabase Studio**: http://localhost:3012
  - Database management UI
  - Run SQL queries
  - View tables and data

- **API Endpoint**: http://localhost:8010
  - Used by your Next.js app
  - Already configured in `.env.local`

- **Direct PostgreSQL**: localhost:5442
  - Connection string: `postgresql://postgres:your-super-secret-and-long-postgres-password@localhost:5442/postgres`

- **Email Testing**: http://localhost:9010
  - View emails sent by the app (signup confirmations, etc.)

## Running Migrations

To run your database migrations:

```bash
# Apply the page wireframes schema
docker exec -i $(docker-compose ps -q db) psql -U postgres < supabase/migrations/20251028000000_page_wireframes_schema.sql
```

## Environment Variables

The Docker setup uses `.env.docker` for configuration. The default credentials are:

- **Anon Key**: Already in `.env.local`
- **Service Role Key**: Already in `.env.local`
- **Database Password**: `your-super-secret-and-long-postgres-password`

**Note**: These are development credentials. Use strong, unique credentials in production!

## Troubleshooting

If containers fail to start:

1. Check if ports are already in use:
   ```bash
   lsof -i :3012,8010,5442,9010
   ```

2. View container logs:
   ```bash
   docker-compose logs [service-name]
   # e.g., docker-compose logs db
   ```

3. Restart services:
   ```bash
   docker-compose restart
   ```

4. Complete reset (removes all data):
   ```bash
   docker-compose down -v
   rm -rf volumes/db/data
   docker-compose up -d
   ```
