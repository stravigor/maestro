-- Create table: workflow
CREATE TABLE IF NOT EXISTS "workflow" (
  "id" BIGINT NOT NULL,
  "workspace_id" BIGINT NOT NULL DEFAULT current_setting('app.tenant_id', true)::bigint,
  "name" VARCHAR(120) NOT NULL DEFAULT '',
  "description" TEXT,
  "columns" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deleted_at" TIMESTAMPTZ,
  CONSTRAINT "pk_workflow" PRIMARY KEY ("workspace_id", "id")
);

-- Enable row-level security for tenant isolation
ALTER TABLE "workflow" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "workflow" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "workflow" USING ("workspace_id" = current_setting('app.tenant_id', true)::bigint) WITH CHECK ("workspace_id" = current_setting('app.tenant_id', true)::bigint);

-- Per-tenant id assignment trigger
DROP TRIGGER IF EXISTS "workflow_assign_tenanted_id" ON "workflow";
CREATE TRIGGER "workflow_assign_tenanted_id" BEFORE INSERT ON "workflow" FOR EACH ROW EXECUTE FUNCTION strav_assign_tenanted_id('workspace_id');
