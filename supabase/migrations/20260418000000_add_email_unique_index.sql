-- Add a unique index on public.users.email.
-- auth.users already enforces uniqueness for auth, but this covers the
-- public.users mirror table so duplicate rows are impossible at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON public.users (email);
