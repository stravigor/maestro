<template>
  <div class="project-island">
    <div class="toolbar">
      <label class="toggle">
        <input type="checkbox" v-model="state.showArchived" @change="reload" />
        Show archived
      </label>
      <button class="btn btn-primary" :disabled="creating" @click="startCreate">
        <i class="far fa-plus"></i> New project
      </button>
    </div>

    <div v-if="state.loading && !projects.length" class="empty">Loading…</div>

    <form v-if="creating" class="card project-form" @submit.prevent="submitCreate">
      <h3>New project</h3>
      <div class="form-group">
        <label>Name</label>
        <input v-model="draft.name" type="text" required maxlength="120" class="w-full" />
        <div v-if="draftErrors.name" class="feedback-error">{{ draftErrors.name.join(', ') }}</div>
      </div>
      <div class="form-group">
        <label>Workflow</label>
        <select v-model="draft.workflowId" class="w-full">
          <option value="">— None —</option>
          <option v-for="w in workflows" :key="w.id" :value="w.id">{{ w.name }}</option>
        </select>
        <div v-if="draftErrors.workflowId" class="feedback-error">
          {{ draftErrors.workflowId.join(', ') }}
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea v-model="draft.description" rows="3" class="w-full"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="btn" @click="cancelCreate">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="state.saving">
          {{ state.saving ? 'Saving…' : 'Create' }}
        </button>
      </div>
    </form>

    <ul v-if="projects.length" class="project-list">
      <li v-for="p in projects" :key="p.id" class="card project-row" :class="{ archived: !!p.archivedAt }">
        <template v-if="editingId !== p.id">
          <div class="project-summary">
            <h3>
              {{ p.name }}
              <span v-if="p.archivedAt" class="badge">archived</span>
            </h3>
            <p class="muted small">
              <span class="workflow-tag">{{ workflowName(p.workflowId) }}</span>
            </p>
            <p v-if="p.description" class="muted">{{ p.description }}</p>
          </div>
          <div class="project-actions">
            <button class="btn" @click="startEdit(p)">Edit</button>
            <button class="btn" @click="toggleArchive(p)">
              {{ p.archivedAt ? 'Unarchive' : 'Archive' }}
            </button>
          </div>
        </template>

        <form v-else class="project-form w-full" @submit.prevent="submitEdit(p.id)">
          <div class="form-group">
            <label>Name</label>
            <input v-model="editDraft.name" type="text" required maxlength="120"  class="w-full"/>
            <div v-if="editErrors.name" class="feedback-error">{{ editErrors.name.join(', ') }}</div>
          </div>
          <div class="form-group">
            <label>Workflow</label>
            <select v-model="editDraft.workflowId" class="w-full">
              <option value="">— None —</option>
              <option v-for="w in workflows" :key="w.id" :value="w.id">{{ w.name }}</option>
            </select>
            <div v-if="editErrors.workflowId" class="feedback-error">
              {{ editErrors.workflowId.join(', ') }}
            </div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editDraft.description" rows="3" class="w-full"></textarea>
          </div>
          <div class="form-actions">
            <button type="button" class="btn" @click="cancelEdit">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="state.saving">
              {{ state.saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </form>
      </li>
    </ul>

    <div v-else-if="!state.loading && !creating" class="empty">
      No projects yet. Click <em>New project</em> to create one.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { xfetch } from '@strav/view/client'

type ErrorBag = Record<string, string[]>

interface Project {
  id: string
  name: string
  description: string | null
  workflowId: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Workflow {
  id: string
  name: string
}

interface ProjectDraft {
  name: string
  description: string
  workflowId: string
}

const baseUrl = '/api/projects'

const state = reactive({ loading: false, saving: false, showArchived: false })
const projects = ref<Project[]>([])
const workflows = ref<Workflow[]>([])
const workflowIndex = ref<Record<string, string>>({})

const creating = ref(false)
const draft = reactive<ProjectDraft>({ name: '', description: '', workflowId: '' })
const draftErrors = ref<ErrorBag>({})

const editingId = ref<string | null>(null)
const editDraft = reactive<ProjectDraft>({ name: '', description: '', workflowId: '' })
const editErrors = ref<ErrorBag>({})

async function load() {
  state.loading = true
  try {
    const [pr, wf] = await Promise.all([
      xfetch(baseUrl).then(r => r.json()),
      xfetch('/api/workflows').then(r => r.json()),
    ])

    const list = (pr.data ?? pr) as Project[]
    projects.value = state.showArchived ? list : list.filter(p => !p.archivedAt)

    workflows.value = (wf.data ?? wf) as Workflow[]
    workflowIndex.value = Object.fromEntries(workflows.value.map(w => [w.id, w.name]))
  } finally {
    state.loading = false
  }
}

async function reload() {
  // Re-filter without re-fetching workflows.
  state.loading = true
  try {
    const res = await xfetch(baseUrl)
    const data = await res.json()
    if (!res.ok) return
    const list = (data.data ?? data) as Project[]
    projects.value = state.showArchived ? list : list.filter(p => !p.archivedAt)
  } finally {
    state.loading = false
  }
}

function workflowName(id: string | null): string {
  if (!id) return 'No workflow'
  return workflowIndex.value[id] ?? '(unknown workflow)'
}

function startCreate() {
  draft.name = ''
  draft.description = ''
  draft.workflowId = ''
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
    const res = await xfetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(draft)),
    })
    const data = await res.json()
    if (!res.ok) {
      draftErrors.value = data.errors ?? {}
      return
    }
    projects.value = [data as Project, ...projects.value]
    cancelCreate()
  } finally {
    state.saving = false
  }
}

function startEdit(p: Project) {
  editingId.value = p.id
  editDraft.name = p.name
  editDraft.description = p.description ?? ''
  editDraft.workflowId = p.workflowId ?? ''
  editErrors.value = {}
}

function cancelEdit() {
  editingId.value = null
  editErrors.value = {}
}

async function submitEdit(id: string) {
  state.saving = true
  editErrors.value = {}
  try {
    const res = await xfetch(`${baseUrl}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadFrom(editDraft)),
    })
    const data = await res.json()
    if (!res.ok) {
      editErrors.value = data.errors ?? {}
      return
    }
    projects.value = projects.value.map(p => (p.id === id ? (data as Project) : p))
    cancelEdit()
  } finally {
    state.saving = false
  }
}

async function toggleArchive(p: Project) {
  state.saving = true
  try {
    const res = await xfetch(`${baseUrl}/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ archivedAt: p.archivedAt ? null : new Date().toISOString() }),
    })
    if (!res.ok) return
    const updated = (await res.json()) as Project
    if (!state.showArchived && updated.archivedAt) {
      projects.value = projects.value.filter(x => x.id !== updated.id)
    } else {
      projects.value = projects.value.map(x => (x.id === updated.id ? updated : x))
    }
  } finally {
    state.saving = false
  }
}

function payloadFrom(d: ProjectDraft) {
  return {
    name: d.name,
    description: d.description.trim() ? d.description : null,
    workflowId: d.workflowId || null,
  }
}

onMounted(load)
</script>
