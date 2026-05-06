<template>
  <div class="story-island">
    <div class="toolbar">
      <div class="toolbar-left">
        <label v-if="!props.projectId" class="picker">
          Project
          <select v-model="selectedProjectId" @change="onProjectChange">
            <option value="" disabled>Select…</option>
            <option v-for="p in projects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </label>
        <h2 v-else class="project-title">{{ projectName }}</h2>
        <label class="picker">
          Sprint
          <select v-model="selectedSprintId">
            <option value="">All sprints</option>
            <option value="__backlog__">Backlog (no sprint)</option>
            <option v-for="s in projectSprints" :key="s.id" :value="s.id">{{ s.name }}</option>
          </select>
        </label>
      </div>
      <button
        class="btn btn-primary"
        :disabled="!selectedProjectId || !columns.length || creating"
        @click="startCreate(columns[0]?.key ?? '')"
      >
        <i class="far fa-plus"></i> New story
      </button>
    </div>

    <div v-if="!selectedProjectId" class="empty">Pick a project to view its kanban.</div>

    <div v-else-if="!columns.length" class="empty">
      This project has no workflow columns. Edit the project to attach a workflow.
    </div>

    <div v-else class="kanban-board">
      <article
        v-for="col in columns"
        :key="col.key"
        class="kanban-column"
        :class="{ 'drag-over': dragOverColumn === col.key }"
        @dragover.prevent="onDragOver(col.key, $event)"
        @dragleave="onDragLeave(col.key)"
        @drop.prevent="onDrop(col.key)"
      >
        <header class="kanban-column-head">
          <h3>{{ col.label }}</h3>
          <span class="muted small">{{ (storiesByColumn[col.key] ?? []).length }}</span>
        </header>

        <div class="kanban-stories">
          <article
            v-for="story in storiesByColumn[col.key] ?? []"
            :key="story.id"
            class="story-card"
            :class="[
              'priority-' + (story.priority ?? 'none'),
              { dragging: draggingId === story.id },
            ]"
            :draggable="editingId !== story.id"
            @dragstart="onDragStart(story, $event)"
            @dragend="onDragEnd"
          >
            <template v-if="editingId !== story.id">
              <div class="story-card-head">
                <h4>{{ story.title }}</h4>
                <button class="btn btn-ghost btn-xs" @click="startEdit(story)">Edit</button>
              </div>
              <p v-if="story.description" class="muted small">{{ story.description }}</p>
              <div class="story-meta">
                <span v-if="story.priority" class="priority-tag">{{ story.priority }}</span>
                <span v-if="story.sprintId" class="sprint-tag">{{ sprintName(story.sprintId) }}</span>
                <span v-if="story.dueAt" class="due-tag">due {{ formatDate(story.dueAt) }}</span>
              </div>
              <div class="story-foot">
                <button class="btn btn-ghost btn-xs" @click="destroyStory(story)">Delete</button>
              </div>
            </template>

            <form v-else class="story-form" @submit.prevent="submitEdit(story)">
              <div class="form-group">
                <label>Title</label>
                <input v-model="editDraft.title" type="text" required maxlength="200" />
                <div v-if="editErrors.title" class="feedback-error">{{ editErrors.title.join(', ') }}</div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="editDraft.description" rows="3"></textarea>
              </div>
              <div class="form-grid two">
                <div class="form-group">
                  <label>Column</label>
                  <select v-model="editDraft.workflowColumn" required>
                    <option v-for="c in columns" :key="c.key" :value="c.key">{{ c.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Priority</label>
                  <select v-model="editDraft.priority">
                    <option value="">— None —</option>
                    <option value="low">Low</option>
                    <option value="med">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div class="form-grid two">
                <div class="form-group">
                  <label>Sprint</label>
                  <select v-model="editDraft.sprintId">
                    <option value="">— None —</option>
                    <option v-for="s in projectSprints" :key="s.id" :value="s.id">{{ s.name }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Due</label>
                  <input v-model="editDraft.dueAt" type="date" />
                </div>
              </div>
              <div class="form-actions">
                <button type="button" class="btn btn-ghost btn-xs" @click="cancelEdit">Cancel</button>
                <button type="submit" class="btn btn-primary btn-xs" :disabled="state.saving">
                  {{ state.saving ? 'Saving…' : 'Save' }}
                </button>
              </div>
            </form>
          </article>

          <p v-if="!(storiesByColumn[col.key]?.length)" class="muted small placeholder">
            Drop a story here.
          </p>
        </div>
      </article>
    </div>

    <div v-if="creating" class="modal-backdrop" @click.self="cancelCreate">
      <form class="card story-form modal" @submit.prevent="submitCreate">
        <h3>New story</h3>
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
        <div class="form-grid two">
          <div class="form-group">
            <label>Sprint</label>
            <select v-model="draft.sprintId">
              <option value="">— None —</option>
              <option v-for="s in projectSprints" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Due</label>
            <input v-model="draft.dueAt" type="date" />
          </div>
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
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { xfetch } from '@strav/view/client'

type ErrorBag = Record<string, string[]>
type Priority = 'low' | 'med' | 'high'

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

interface StoryDraft {
  title: string
  description: string
  workflowColumn: string
  priority: '' | Priority
  sprintId: string
  dueAt: string
}

const props = defineProps<{ projectId?: string }>()

const projects = ref<Project[]>([])
const workflows = ref<Record<string, Workflow>>({})
const sprints = ref<Sprint[]>([])
const stories = ref<Story[]>([])

const selectedProjectId = ref<string>(props.projectId ?? '')
const selectedSprintId = ref<string>('')
const state = reactive({ loading: false, saving: false })

const creating = ref(false)
const draft = reactive<StoryDraft>(emptyDraft())
const draftErrors = ref<ErrorBag>({})

const editingId = ref<string | null>(null)
const editDraft = reactive<StoryDraft>(emptyDraft())
const editErrors = ref<ErrorBag>({})

// Drag-and-drop state.
const draggingId = ref<string | null>(null)
const dragOverColumn = ref<string | null>(null)

const selectedProject = computed(() =>
  projects.value.find(p => p.id === selectedProjectId.value) ?? null
)

const projectName = computed(() => selectedProject.value?.name ?? '…')

const projectSprints = computed(() =>
  sprints.value.filter(s => s.projectId === selectedProjectId.value)
)

const columns = computed<{ key: string; label: string }[]>(() => {
  const wfId = selectedProject.value?.workflowId
  const cols = wfId ? workflows.value[wfId]?.columns : null
  if (!cols || !cols.length) return []
  return cols.map(c => ({ key: c, label: c.replace(/_/g, ' ') }))
})

const storiesByColumn = computed<Record<string, Story[]>>(() => {
  const m: Record<string, Story[]> = {}
  const filterSprint = selectedSprintId.value
  for (const s of stories.value) {
    if (s.projectId !== selectedProjectId.value) continue
    if (filterSprint === '__backlog__' && s.sprintId) continue
    if (filterSprint && filterSprint !== '__backlog__' && s.sprintId !== filterSprint) continue
    ;(m[s.workflowColumn] ||= []).push(s)
  }
  // Stable sort by position within each column.
  for (const k of Object.keys(m)) m[k]!.sort((a, b) => a.position - b.position)
  return m
})

function sprintName(id: string | null): string {
  if (!id) return ''
  return sprints.value.find(s => s.id === id)?.name ?? '(unknown sprint)'
}

function emptyDraft(): StoryDraft {
  return {
    title: '',
    description: '',
    workflowColumn: '',
    priority: '',
    sprintId: '',
    dueAt: '',
  }
}

async function loadAll() {
  state.loading = true
  try {
    const [pr, wf, sp] = await Promise.all([
      xfetch('/api/projects').then(r => r.json()),
      xfetch('/api/workflows').then(r => r.json()),
      xfetch('/api/sprints').then(r => r.json()),
    ])
    projects.value = (pr.data ?? pr) as Project[]
    const wflist = (wf.data ?? wf) as Workflow[]
    workflows.value = Object.fromEntries(wflist.map(w => [w.id, w]))
    sprints.value = (sp.data ?? sp) as Sprint[]

    // When the page locks us to a project we already have an id; otherwise
    // pick the first project so the kanban renders something on first paint.
    if (!selectedProjectId.value && projects.value.length) {
      selectedProjectId.value = projects.value[0]!.id
    }
    if (selectedProjectId.value) await loadStories()
  } finally {
    state.loading = false
  }
}

async function loadStories() {
  if (!selectedProjectId.value) {
    stories.value = []
    return
  }
  const res = await xfetch(`/api/stories?projectId=${selectedProjectId.value}`)
  const data = await res.json()
  if (res.ok) stories.value = (data.data ?? data) as Story[]
}

async function onProjectChange() {
  selectedSprintId.value = ''
  await loadStories()
}

function startCreate(initialColumn: string) {
  Object.assign(draft, emptyDraft(), { workflowColumn: initialColumn })
  draftErrors.value = {}
  creating.value = true
}

function cancelCreate() {
  creating.value = false
  draftErrors.value = {}
}

async function submitCreate() {
  if (!selectedProjectId.value) return
  state.saving = true
  draftErrors.value = {}
  try {
    const res = await xfetch(`/api/projects/${selectedProjectId.value}/stories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(draft)),
    })
    const data = await res.json()
    if (!res.ok) {
      draftErrors.value = data.errors ?? {}
      return
    }
    stories.value = [...stories.value, data as Story]
    cancelCreate()
  } finally {
    state.saving = false
  }
}

function startEdit(s: Story) {
  editingId.value = s.id
  editDraft.title = s.title
  editDraft.description = s.description ?? ''
  editDraft.workflowColumn = s.workflowColumn
  editDraft.priority = s.priority ?? ''
  editDraft.sprintId = s.sprintId ?? ''
  editDraft.dueAt = s.dueAt ? s.dueAt.slice(0, 10) : ''
  editErrors.value = {}
}

function cancelEdit() {
  editingId.value = null
  editErrors.value = {}
}

async function submitEdit(s: Story) {
  state.saving = true
  editErrors.value = {}
  try {
    const res = await xfetch(`/api/projects/${s.projectId}/stories/${s.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(editDraft)),
    })
    const data = await res.json()
    if (!res.ok) {
      editErrors.value = data.errors ?? {}
      return
    }
    stories.value = stories.value.map(x => (x.id === s.id ? (data as Story) : x))
    cancelEdit()
  } finally {
    state.saving = false
  }
}

async function moveStory(s: Story, newColumn: string) {
  if (newColumn === s.workflowColumn) return
  // Optimistic update so the card lands in the target column immediately.
  const previous = s.workflowColumn
  stories.value = stories.value.map(x =>
    x.id === s.id ? { ...x, workflowColumn: newColumn } : x
  )
  const res = await xfetch(`/api/projects/${s.projectId}/stories/${s.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ workflowColumn: newColumn }),
  })
  if (!res.ok) {
    // Roll back on failure.
    stories.value = stories.value.map(x =>
      x.id === s.id ? { ...x, workflowColumn: previous } : x
    )
    return
  }
  const updated = (await res.json()) as Story
  stories.value = stories.value.map(x => (x.id === s.id ? updated : x))
}

// ---- Drag-and-drop ----------------------------------------------------
function onDragStart(s: Story, ev: DragEvent) {
  draggingId.value = s.id
  if (ev.dataTransfer) {
    ev.dataTransfer.effectAllowed = 'move'
    // Required by Firefox to start the drag, even if we don't read it back.
    ev.dataTransfer.setData('text/plain', s.id)
  }
}

function onDragEnd() {
  draggingId.value = null
  dragOverColumn.value = null
}

function onDragOver(columnKey: string, ev: DragEvent) {
  if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move'
  dragOverColumn.value = columnKey
}

function onDragLeave(columnKey: string) {
  if (dragOverColumn.value === columnKey) dragOverColumn.value = null
}

async function onDrop(columnKey: string) {
  const id = draggingId.value
  draggingId.value = null
  dragOverColumn.value = null
  if (!id) return
  const story = stories.value.find(x => x.id === id)
  if (!story) return
  await moveStory(story, columnKey)
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
    sprintId: d.sprintId || null,
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

watch(selectedProjectId, async (id, prev) => {
  if (id !== prev) await loadStories()
})

onMounted(loadAll)
</script>
