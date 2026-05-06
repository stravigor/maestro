-- Create table: project
CREATE TABLE IF NOT EXISTS "project" (
  "id" BIGINT NOT NULL,
  "workspace_id" BIGINT NOT NULL DEFAULT current_setting('app.tenant_id', true)::bigint,
  "name" VARCHAR(120) NOT NULL DEFAULT '',
  "description" TEXT,
  "workflow_id" BIGINT,
  "archived_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "pk_project" PRIMARY KEY ("workspace_id", "id")
);

-- Enable row-level security for tenant isolation
ALTER TABLE "project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "project" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "project" USING ("workspace_id" = current_setting('app.tenant_id', true)::bigint) WITH CHECK ("workspace_id" = current_setting('app.tenant_id', true)::bigint);

-- Per-tenant id assignment trigger
DROP TRIGGER IF EXISTS "project_assign_tenanted_id" ON "project";
CREATE TRIGGER "project_assign_tenanted_id" BEFORE INSERT ON "project" FOR EACH ROW EXECUTE FUNCTION strav_assign_tenanted_id('workspace_id');
