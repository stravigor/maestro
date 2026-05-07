<template>
  <div class="sprint-island">
    <div class="toolbar">
      <h2 v-if="props.projectId" class="project-title">{{ currentProjectName }}</h2>
      <button class="btn btn-primary" :disabled="creating || !projects.length" @click="startCreate">
        <i class="far fa-plus"></i> New sprint
      </button>
      <span v-if="!projects.length && !state.loading" class="muted">
        Create a project first
      </span>
    </div>

    <form v-if="creating" class="card sprint-form" @submit.prevent="submitCreate">
      <h3>New sprint</h3>
      <div class="form-grid">
        <div v-if="!props.projectId" class="form-group">
          <label>Project</label>
          <select v-model="draft.projectId" required>
            <option value="" disabled>Select a project…</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>Name</label>
          <input v-model="draft.name" type="text" required maxlength="120" />
          <div v-if="draftErrors.name" class="feedback-error">{{ draftErrors.name.join(', ') }}</div>
        </div>
        <div class="form-group">
          <label>Started at</label>
          <input v-model="draft.startedAt" type="date" />
        </div>
        <div class="form-group">
          <label>Ended at</label>
          <input v-model="draft.endedAt" type="date" />
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea v-model="draft.description" rows="2"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn" @click="cancelCreate">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="state.saving">
          {{ state.saving ? 'Saving…' : 'Create' }}
        </button>
      </div>
    </form>

    <div v-if="state.loading && !sprints.length" class="empty">Loading…</div>

    <div v-else-if="sprints.length" class="kanban-board">
      <article v-for="s in sprints" :key="s.id" class="kanban-column">
        <header class="kanban-column-head">
          <template v-if="editingId !== s.id">
            <div>
              <h3>{{ s.name }}</h3>
              <p class="muted small">
                <span class="project-tag">{{ projectName(s.projectId) }}</span>
                <span v-if="s.startedAt || s.endedAt"> · {{ formatRange(s) }}</span>
              </p>
            </div>
            <button class="btn btn-ghost" @click="startEdit(s)"><i class="far fa-edit"></i></button>
          </template>

          <form v-else class="sprint-form inline" @submit.prevent="submitEdit(s)">
            <div class="form-group">
              <label>Name</label>
              <input v-model="editDraft.name" type="text" required maxlength="120" />
              <div v-if="editErrors.name" class="feedback-error">{{ editErrors.name.join(', ') }}</div>
            </div>
            <div class="form-grid two">
              <div class="form-group">
                <label>Started</label>
                <input v-model="editDraft.startedAt" type="date" />
              </div>
              <div class="form-group">
                <label>Ended</label>
                <input v-model="editDraft.endedAt" type="date" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea v-model="editDraft.description" rows="2"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-ghost" @click="cancelEdit">Cancel</button>
              <button type="submit" class="btn btn-primary" :disabled="state.saving">
                {{ state.saving ? 'Saving…' : 'Save' }}
              </button>
            </div>
          </form>
        </header>

        <p v-if="s.description && editingId !== s.id" class="muted sprint-desc">{{ s.description }}</p>

        <div class="kanban-stories">
          <article
            v-for="story in storiesBySprint[s.id] ?? []"
            :key="story.id"
            class="story-card"
            :class="['priority-' + (story.priority ?? 'none')]"
          >
            <h4>{{ story.title }}</h4>
            <p v-if="story.description" class="muted small">{{ story.description }}</p>
            <div class="story-meta">
              <span class="column-tag">{{ story.workflowColumn }}</span>
              <span v-if="story.priority" class="priority-tag">{{ story.priority }}</span>
              <span v-if="story.dueAt" class="due-tag">due {{ formatDate(story.dueAt) }}</span>
            </div>
          </article>
          <p v-if="!(storiesBySprint[s.id]?.length)" class="muted small placeholder">
            No stories yet.
          </p>
        </div>
      </article>
    </div>

    <div v-else-if="!state.loading && !creating" class="empty">
      No sprints yet. Click <em>New sprint</em> to start one.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { xfetch } from '@strav/view/client'

type ErrorBag = Record<string, string[]>
type Priority = 'low' | 'med' | 'high'

interface Sprint {
  id: string
  projectId: string
  name: string
  description: string | null
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Project {
  id: string
  name: string
}

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

interface SprintDraft {
  projectId: string
  name: string
  description: string
  startedAt: string
  endedAt: string
}

const props = defineProps<{ projectId?: string }>()

const allSprints = ref<Sprint[]>([])
const projects = ref<Project[]>([])
const stories = ref<Story[]>([])
const projectIndex = ref<Record<string, string>>({})
const state = reactive({ loading: false, saving: false })

const sprints = computed(() =>
  props.projectId
    ? allSprints.value.filter(s => s.projectId === props.projectId)
    : allSprints.value
)

const currentProjectName = computed(() =>
  props.projectId ? projectIndex.value[props.projectId] ?? '…' : ''
)

const storiesBySprint = computed<Record<string, Story[]>>(() => {
  const m: Record<string, Story[]> = {}
  for (const s of stories.value) {
    if (!s.sprintId) continue
    ;(m[s.sprintId] ||= []).push(s)
  }
  return m
})

const creating = ref(false)
const draft = reactive<SprintDraft>({
  projectId: '', name: '', description: '', startedAt: '', endedAt: '',
})
const draftErrors = ref<ErrorBag>({})

const editingId = ref<string | null>(null)
const editDraft = reactive<SprintDraft>({
  projectId: '', name: '', description: '', startedAt: '', endedAt: '',
})
const editErrors = ref<ErrorBag>({})

async function load() {
  state.loading = true
  try {
    const [sp, pr, st] = await Promise.all([
      xfetch('/api/sprints').then(r => r.json()),
      xfetch('/api/projects').then(r => r.json()),
      xfetch('/api/stories').then(r => r.json()),
    ])
    allSprints.value = (sp.data ?? sp) as Sprint[]
    projects.value = (pr.data ?? pr) as Project[]
    stories.value = (st.data ?? st) as Story[]
    projectIndex.value = Object.fromEntries(projects.value.map(p => [p.id, p.name]))
  } finally {
    state.loading = false
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ''
  const ymd = iso.slice(0, 10).split('-').map(Number)
  if (ymd.length !== 3 || ymd.some(isNaN)) return iso
  const d = new Date(Date.UTC(ymd[0]!, ymd[1]! - 1, ymd[2]!))
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}

function projectName(id: string): string {
  return projectIndex.value[id] ?? '(unknown project)'
}

function startCreate() {
  Object.assign(draft, {
    projectId: props.projectId ?? projects.value[0]?.id ?? '',
    name: '',
    description: '',
    startedAt: '',
    endedAt: '',
  })
  draftErrors.value = {}
  creating.value = true
}

function cancelCreate() {
  creating.value = false
  draftErrors.value = {}
}

async function submitCreate() {
  if (!draft.projectId) {
    draftErrors.value = { projectId: ['Required'] }
    return
  }
  state.saving = true
  draftErrors.value = {}
  try {
    const res = await xfetch(`/api/projects/${draft.projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(draft)),
    })
    const data = await res.json()
    if (!res.ok) {
      draftErrors.value = data.errors ?? {}
      return
    }
    sprints.value = [data as Sprint, ...sprints.value]
    cancelCreate()
  } finally {
    state.saving = false
  }
}

function startEdit(s: Sprint) {
  editingId.value = s.id
  editDraft.projectId = s.projectId
  editDraft.name = s.name
  editDraft.description = s.description ?? ''
  editDraft.startedAt = toDateInput(s.startedAt)
  editDraft.endedAt = toDateInput(s.endedAt)
  editErrors.value = {}
}

function cancelEdit() {
  editingId.value = null
  editErrors.value = {}
}

async function submitEdit(s: Sprint) {
  state.saving = true
  editErrors.value = {}
  try {
    const res = await xfetch(`/api/projects/${s.projectId}/sprints/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(editDraft)),
    })
    const data = await res.json()
    if (!res.ok) {
      editErrors.value = data.errors ?? {}
      return
    }
    sprints.value = sprints.value.map(x => (x.id === s.id ? (data as Sprint) : x))
    cancelEdit()
  } finally {
    state.saving = false
  }
}

function payloadFrom(d: SprintDraft) {
  return {
    name: d.name,
    description: d.description.trim() ? d.description : null,
    // The schema stores DATE (no time component), so send the raw
    // `YYYY-MM-DD` from the date input — Postgres parses it directly.
    startedAt: d.startedAt || null,
    endedAt: d.endedAt || null,
  }
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  // Server may send either a `YYYY-MM-DD` date or a full ISO timestamp.
  // Slice the first 10 chars in either case.
  return iso.slice(0, 10)
}

function formatRange(s: Sprint): string {
  const fmt = (iso: string | null) => {
    if (!iso) return '…'
    // Use UTC pieces so the displayed date matches the stored DATE
    // regardless of the viewer's timezone.
    const ymd = iso.slice(0, 10).split('-').map(Number)
    if (ymd.length !== 3 || ymd.some(isNaN)) return iso
    const d = new Date(Date.UTC(ymd[0]!, ymd[1]! - 1, ymd[2]!))
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  return `${fmt(s.startedAt)} → ${fmt(s.endedAt)}`
}

onMounted(load)
</script>
