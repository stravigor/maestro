import { Seeder, TenantManager, withTenant, query } from '@strav/database'
import { DateTime } from 'luxon'
import User from '#models/user'
import Workspace from '#models/workspace'
import Workflow from '#models/workflow'

const DEMO_EMAIL = 'demo@strav.dev'
const DEMO_PASSWORD = 'demo1234'
const DEMO_WORKSPACE_SLUG = 'demo'
const DEMO_WORKSPACE_NAME = 'Demo Workspace'

export default class AccountSeeder extends Seeder {
  async run() {

    // Create the demo user if not existing
    let user = await query(User).where('email', DEMO_EMAIL).first()
    if (!user) {
      user = await User.create({
        email: DEMO_EMAIL,
        name: 'Demo User',
        passwordHash: await Bun.password.hash(DEMO_PASSWORD),
        emailVerifiedAt: DateTime.utc(),
      })
      console.log(`  + user ${DEMO_EMAIL} (password: ${DEMO_PASSWORD})`)
    } else {
      console.log(`  = user ${DEMO_EMAIL} (already exists)`)
    }

    // Create the demo workspace if not existing
    let workspace = await query(Workspace).where('slug', DEMO_WORKSPACE_SLUG).first()
    if (!workspace) {
      workspace = await Workspace.create({
        slug: DEMO_WORKSPACE_SLUG,
        name: DEMO_WORKSPACE_NAME,
        ownerId: user.id,
      })
      console.log(`  + workspace ${DEMO_WORKSPACE_SLUG}`)
    } else {
      console.log(`  = workspace ${DEMO_WORKSPACE_SLUG} (already exists)`)
    }

    // Add the user to the workspace if not existing
    await workspace.members.attach(user)

    
    // Create new workflow if not existing
    await withTenant(workspace.id, async () => {
      let workflow = await query(Workflow).first()
      if (!workflow) {
        workflow = await Workflow.create({
          name: 'Workflow',
          description: 'Workflow',
          columns: ['backlog', 'in_progress', 'done'],
        })
        console.log(`  + workflow ${workflow.id}`)
      } else {
        console.log(`  = workflow ${workflow.name} (already exists)`)
      }
    })
    
  }
}