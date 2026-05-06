import { router, session, csrf, auth } from '@strav/http'
import AuthController from '#controllers/api/auth_controller'
import UserController from '#controllers/api/user_controller'
import WorkspaceController from '#controllers/api/workspace_controller'
import WorkflowController from '#controllers/api/workflow_controller'
import ProjectController from '#controllers/api/project_controller'
import SprintController from '#controllers/api/sprint_controller'
import StoryController from '#controllers/api/story_controller'
import CommentController from '#controllers/api/comment_controller'
import { workspace } from '#middleware/workspace'

router.group({ prefix: '/api', middleware: [session(), csrf()] }, (r) => {
  // Auth — public
  r.post('/auth/login', [AuthController, 'login'])

  // Authenticated API — workspace is resolved from session by workspace()
  r.group({ middleware: [auth(), workspace()] }, (r) => {
    r.resource('/users', UserController)
    r.resource('/workspaces', WorkspaceController)
    r.resource('/workflows', WorkflowController)
    r.resource('/projects', ProjectController)

    // Workspace-level read of all sprints / stories across projects.
    // Mutations stay nested under /projects/:projectId/{sprints,stories} below.
    r.get('/sprints', [SprintController, 'index'])
    r.get('/stories', [StoryController, 'index'])

    r.group({ prefix: '/projects/:projectId' }, (r) => {
      r.resource('/sprints', SprintController)
      r.resource('/stories', StoryController)
    })

    r.group({ prefix: '/stories/:storyId' }, (r) => {
      r.resource('/comments', CommentController)
    })
  })
})
