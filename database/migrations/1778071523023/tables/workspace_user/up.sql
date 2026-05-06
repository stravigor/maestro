-- Create table: workspace_user
CREATE TABLE IF NOT EXISTS "workspace_user" (
  "workspace_id" BIGINT NOT NULL,
  "user_id" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
