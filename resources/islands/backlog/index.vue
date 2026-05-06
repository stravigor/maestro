<template>
  <div class="backlog-island">
    <div class="backlog-toolbar">
      <h2 class="project-title">{{ projectName }}</h2>
      <button
        class="btn btn-primary"
        :disabled="!columns.length || creating"
        @click="startCreate"
      >
        <i class="far fa-plus"></i> New story
      </button>
    </div>

    <p v-if="!columns.length && !state.loading" class="muted small">
      Attach a workflow to this project to enable story creation.
    </p>

    <div v-if="state.loading && !stories.length" class="empty">Loading…</div>

    <table v-else-if="stories.length" class="backlog-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Column</th>
          <th>Priority</th>
          <th>Due</th>
          <th>Sprint</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="s in stories" :key="s.id">
          <td>
            <strong>{{ s.title }}</strong>
            <p v-if="s.description" class="muted small">{{ s.description }}</p>
          </td>
          <td>{{ s.workflowColumn }}</td>
          <td>
            <span v-if="s.priority" class="priority-tag" :class="'priority-' + s.priority">
              {{ s.priority }}
            </span>
            <span v-else class="muted small">—</span>
          </td>
          <td>{{ s.dueAt ? formatDate(s.dueAt) : '' }}</td>
          <td>
            <select :value="s.sprintId ?? ''" @change="moveToSprint(s, ($event.target as HTMLSelectElement).value)">
              <option value="">— Backlog —</option>
              <option v-for="sp in sprints" :key="sp.id" :value="sp.id">{{ sp.name }}</option>
            </select>
          </td>
          <td>
            <button class="btn btn-ghost btn-xs" @click="destroyStory(s)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!state.loading" class="empty">
      No backlog stories — every story is scheduled.
    </div>

    <div v-if="creating" class="modal-backdrop" @click.self="cancelCreate">
      <form class="card story-form modal" @submit.prevent="submitCreate">
        <h3>New backlog story</h3>
        <div class="form-group">
          <label>Title</label>
          <input v-model="draft.title" type="text" required maxlength="200" />
          <div v-if="draftErrors.title" class="feedback-error">{{ draftErrors.title.join(', ') }}</div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea v-model="draft.description" rows="3"></textarea>
        </div>
        <div class="form-grid two">
          <div class="form-group">
            <label>Column</label>
            <select v-model="draft.workflowColumn" required>
              <option v-for="c in columns" :key="c.key" :value="c.key">{{ c.label }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Priority</label>
            <select v-model="draft.priority">
              <option value="">— None —</option>
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Due</label>
          <input v-model="draft.dueAt" type="date" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn" @click="cancelCreate">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="state.saving">
            {{ state.saving ? 'Saving…' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { xfetch } from '@strav/view/client'

type ErrorBag = Record<string, string[]>
type Priority = 'low' | 'med' | 'high'

interface Story {
  id: string
  projectId: string
  sprintId: string | null
  title: string
  description: string | null
  workflowColumn: string
  position: number
  priority: Priority | null
  dueAt: string | null
}

interface Project {
  id: string
  name: string
  workflowId: string | null
}

interface Workflow {
  id: string
  name: string
  columns: string[] | null
}

interface Sprint {
  id: string
  projectId: string
  name: string
}

interface StoryDraft {
  title: string
  description: string
  workflowColumn: string
  priority: '' | Priority
  dueAt: string
}

const props = defineProps<{ projectId: string }>()

const stories = ref<Story[]>([])
const sprints = ref<Sprint[]>([])
const projectsList = ref<Project[]>([])
const workflows = ref<Record<string, Workflow>>({})
const state = reactive({ loading: false, saving: false })

const creating = ref(false)
const draft = reactive<StoryDraft>(emptyDraft())
const draftErrors = ref<ErrorBag>({})

const project = computed(
  () => projectsList.value.find(p => p.id === props.projectId) ?? null
)

const projectName = computed(() => project.value?.name ?? '…')

const columns = computed<{ key: string; label: string }[]>(() => {
  const wfId = project.value?.workflowId
  const cols = wfId ? workflows.value[wfId]?.columns : null
  if (!cols || !cols.length) return []
  return cols.map(c => ({ key: c, label: c.replace(/_/g, ' ') }))
})

function emptyDraft(): StoryDraft {
  return { title: '', description: '', workflowColumn: '', priority: '', dueAt: '' }
}

async function load() {
  state.loading = true
  try {
    const [st, sp, pr, wf] = await Promise.all([
      xfetch(`/api/stories?projectId=${props.projectId}`).then(r => r.json()),
      xfetch('/api/sprints').then(r => r.json()),
      xfetch('/api/projects').then(r => r.json()),
      xfetch('/api/workflows').then(r => r.json()),
    ])
    const all = (st.data ?? st) as Story[]
    stories.value = all.filter(s => !s.sprintId)
    sprints.value = ((sp.data ?? sp) as Sprint[]).filter(s => s.projectId === props.projectId)
    projectsList.value = (pr.data ?? pr) as Project[]
    const wflist = (wf.data ?? wf) as Workflow[]
    workflows.value = Object.fromEntries(wflist.map(w => [w.id, w]))
  } finally {
    state.loading = false
  }
}

function startCreate() {
  Object.assign(draft, emptyDraft(), { workflowColumn: columns.value[0]?.key ?? '' })
  draftErrors.value = {}
  creating.value = true
}

function cancelCreate() {
  creating.value = false
  draftErrors.value = {}
}

async function submitCreate() {
  state.saving = true
  draftErrors.value = {}
  try {
    const res = await xfetch(`/api/projects/${props.projectId}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(draft)),
    })
    const data = await res.json()
    if (!res.ok) {
      draftErrors.value = data.errors ?? {}
      return
    }
    stories.value = [data as Story, ...stories.value]
    cancelCreate()
  } finally {
    state.saving = false
  }
}

async function moveToSprint(s: Story, sprintId: string) {
  const res = await xfetch(`/api/projects/${s.projectId}/stories/${s.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sprintId: sprintId || null }),
  })
  if (!res.ok) return
  if (sprintId) {
    stories.value = stories.value.filter(x => x.id !== s.id)
  } else {
    const updated = (await res.json()) as Story
    stories.value = stories.value.map(x => (x.id === s.id ? updated : x))
  }
}

async function destroyStory(s: Story) {
  if (!confirm(`Delete "${s.title}"?`)) return
  const res = await xfetch(`/api/projects/${s.projectId}/stories/${s.id}`, {
    method: 'DELETE',
  })
  if (!res.ok) return
  stories.value = stories.value.filter(x => x.id !== s.id)
}

function payloadFrom(d: StoryDraft) {
  return {
    title: d.title,
    description: d.description.trim() ? d.description : null,
    workflowColumn: d.workflowColumn,
    priority: d.priority || null,
    sprintId: null,
    dueAt: d.dueAt || null,
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const ymd = iso.slice(0, 10).split('-').map(Number)
  if (ymd.length !== 3 || ymd.some(isNaN)) return iso
  const d = new Date(Date.UTC(ymd[0]!, ymd[1]! - 1, ymd[2]!))
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

onMounted(load)
</script>
