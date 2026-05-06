-- Create table: sprint
CREATE TABLE IF NOT EXISTS "sprint" (
  "id" BIGINT NOT NULL,
  "workspace_id" BIGINT NOT NULL DEFAULT current_setting('app.tenant_id', true)::bigint,
  "project_id" BIGINT NOT NULL,
  "name" VARCHAR(120) NOT NULL DEFAULT '',
  "description" TEXT,
  "started_at" DATE,
  "ended_at" DATE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pk_sprint" PRIMARY KEY ("workspace_id", "id")
);

-- Enable row-level security for tenant isolation
ALTER TABLE "sprint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sprint" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "sprint" USING ("workspace_id" = current_setting('app.tenant_id', true)::bigint) WITH CHECK ("workspace_id" = current_setting('app.tenant_id', true)::bigint);

-- Per-tenant id assignment trigger
DROP TRIGGER IF EXISTS "sprint_assign_tenanted_id" ON "sprint";
CREATE TRIGGER "sprint_assign_tenanted_id" BEFORE INSERT ON "sprint" FOR EACH ROW EXECUTE FUNCTION strav_assign_tenanted_id('workspace_id');
