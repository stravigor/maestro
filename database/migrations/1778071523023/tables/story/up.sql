-- Create table: story
CREATE TABLE IF NOT EXISTS "story" (
  "id" BIGINT NOT NULL,
  "workspace_id" BIGINT NOT NULL DEFAULT current_setting('app.tenant_id', true)::bigint,
  "project_id" BIGINT NOT NULL,
  "title" VARCHAR(200) NOT NULL DEFAULT '',
  "description" TEXT,
  "workflow_column" VARCHAR(200) NOT NULL DEFAULT '',
  "position" INTEGER NOT NULL DEFAULT 0,
  "assignee_id" BIGINT,
  "priority" "story_priority",
  "priority_rationale" TEXT,
  "sprint_id" BIGINT,
  "due_at" DATE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "pk_story" PRIMARY KEY ("workspace_id", "id")
);

-- Enable row-level security for tenant isolation
ALTER TABLE "story" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "story" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "story" USING ("workspace_id" = current_setting('app.tenant_id', true)::bigint) WITH CHECK ("workspace_id" = current_setting('app.tenant_id', true)::bigint);

-- Per-tenant id assignment trigger
DROP TRIGGER IF EXISTS "story_assign_tenanted_id" ON "story";
CREATE TRIGGER "story_assign_tenanted_id" BEFORE INSERT ON "story" FOR EACH ROW EXECUTE FUNCTION strav_assign_tenanted_id('workspace_id');
