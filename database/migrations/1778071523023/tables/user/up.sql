-- Create table: user
CREATE TABLE IF NOT EXISTS "user" (
  "id" BIGSERIAL,
  "email" VARCHAR(255) NOT NULL DEFAULT '',
  "name" VARCHAR(120) NOT NULL DEFAULT '',
  "password_hash" TEXT NOT NULL DEFAULT '',
  "email_verified_at" TIMESTAMPTZ,
  "remember_token" VARCHAR(100),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "pk_user" PRIMARY KEY ("id")
);
