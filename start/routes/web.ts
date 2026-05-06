import DashboardController from '#controllers/pages/dashboard_controller'
import WorkflowController from '#controllers/pages/workflow_controller'
import ProjectController from '#controllers/pages/project_controller'
import SprintController from '#controllers/pages/sprint_controller'
import StoryController from '#controllers/pages/story_controller'
import AuthController from '#controllers/api/auth_controller'
import { router, session, auth } from '@strav/http'
import { workspace } from '#middleware/workspace'
import { projects } from '#middleware/projects'

router.use(session())

router.group({ middleware: [auth(), workspace(), projects()] }, (r) => {
  r.get('/', [StoryController, 'index'])
  r.get('/dashboard', [DashboardController, 'index'])
  r.get('/workflow', [WorkflowController, 'index'])
  r.get('/projects', [ProjectController, 'index'])
  r.get('/sprints', [SprintController, 'index'])
  r.get('/logout', [AuthController, 'logout'])

  // Per-project pages — same templates, locked to one project.
  r.group({ prefix: '/projects/:projectId' }, (r) => {
    r.get('/stories', [StoryController, 'forProject'])
    r.get('/sprints', [SprintController, 'forProject'])
    r.get('/backlog', [StoryController, 'backlog'])
  })
})
