-- Create table: comment
CREATE TABLE IF NOT EXISTS "comment" (
  "id" BIGINT NOT NULL,
  "workspace_id" BIGINT NOT NULL DEFAULT current_setting('app.tenant_id', true)::bigint,
  "story_id" BIGINT NOT NULL,
  "author_id" BIGINT NOT NULL,
  "body" TEXT NOT NULL DEFAULT '',
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pk_comment" PRIMARY KEY ("workspace_id", "id")
);

-- Enable row-level security for tenant isolation
ALTER TABLE "comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comment" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "comment" USING ("workspace_id" = current_setting('app.tenant_id', true)::bigint) WITH CHECK ("workspace_id" = current_setting('app.tenant_id', true)::bigint);

-- Per-tenant id assignment trigger
DROP TRIGGER IF EXISTS "comment_assign_tenanted_id" ON "comment";
CREATE TRIGGER "comment_assign_tenanted_id" BEFORE INSERT ON "comment" FOR EACH ROW EXECUTE FUNCTION strav_assign_tenanted_id('workspace_id');
