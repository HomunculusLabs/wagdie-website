-- Set passwords for Supabase roles
ALTER USER supabase_admin WITH PASSWORD 'your-super-secret-and-long-postgres-password';
ALTER USER supabase_auth_admin WITH PASSWORD 'your-super-secret-and-long-postgres-password';
ALTER USER supabase_storage_admin WITH PASSWORD 'your-super-secret-and-long-postgres-password';
ALTER USER authenticator WITH PASSWORD 'your-super-secret-and-long-postgres-password';
