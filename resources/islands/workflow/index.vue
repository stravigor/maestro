<template>
  <div class="workflow-island">
    <div class="toolbar">
      <button class="btn btn-primary" :disabled="creating" @click="startCreate">
        <i class="far fa-plus"></i> New workflow
      </button>
    </div>

    <div v-if="state.loading && !workflows.length" class="empty">Loading…</div>

    <form v-if="creating" class="card workflow-form" @submit.prevent="submitCreate">
      <h3>New workflow</h3>
      <div class="form-group">
        <label>Name</label>
        <input v-model="draft.name" type="text" required maxlength="120" />
        <div v-if="draftErrors.name" class="feedback-error">{{ draftErrors.name.join(', ') }}</div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea v-model="draft.description" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Columns</label>
        <ColumnsEditor v-model="draft.columns" />
      </div>
      <div class="form-actions">
        <button type="button" class="btn" @click="cancelCreate">Cancel</button>
        <button type="submit" class="btn btn-primary" :disabled="state.saving">
          {{ state.saving ? 'Saving…' : 'Create' }}
        </button>
      </div>
    </form>

    <ul v-if="workflows.length" class="workflow-list">
      <li v-for="wf in workflows" :key="wf.id" class="card workflow-row">
        <template v-if="editingId !== wf.id">
          <div class="workflow-summary">
            <h3>{{ wf.name }}</h3>
            <p v-if="wf.description" class="muted">{{ wf.description }}</p>
            <div class="columns">
              <span v-for="col in wf.columns ?? []" :key="col" class="tag">{{ col }}</span>
              <span v-if="!(wf.columns?.length)" class="muted">No columns</span>
            </div>
          </div>
          <div class="workflow-actions">
            <button class="btn" @click="startEdit(wf)">Edit</button>
          </div>
        </template>

        <form v-else class="workflow-form" @submit.prevent="submitEdit(wf.id)">
          <div class="form-group">
            <label>Name</label>
            <input v-model="editDraft.name" type="text" required maxlength="120" />
            <div v-if="editErrors.name" class="feedback-error">{{ editErrors.name.join(', ') }}</div>
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="editDraft.description" rows="2"></textarea>
          </div>
          <div class="form-group">
            <label>Columns</label>
            <ColumnsEditor v-model="editDraft.columns" />
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
      No workflows yet. Click <em>New workflow</em> to create one.
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, h, defineComponent, type PropType } from 'vue'
import { xfetch } from '@strav/view/client'

type ErrorBag = Record<string, string[]>

interface Workflow {
  id: string
  name: string
  description: string | null
  columns: string[] | null
  createdAt: string
  updatedAt: string
}

interface WorkflowDraft {
  name: string
  description: string
  columns: string[]
}

const baseUrl = '/api/workflows'

const state = reactive({ loading: false, saving: false })
const workflows = ref<Workflow[]>([])

// Create
const creating = ref(false)
const draft = reactive<WorkflowDraft>({ name: '', description: '', columns: [] })
const draftErrors = ref<ErrorBag>({})

// Edit
const editingId = ref<string | null>(null)
const editDraft = reactive<WorkflowDraft>({ name: '', description: '', columns: [] })
const editErrors = ref<ErrorBag>({})

const emptyDraft = (): WorkflowDraft => ({ name: '', description: '', columns: [] })

async function load() {
  state.loading = true
  try {
    const res = await xfetch(baseUrl, { method: 'GET' })
    const data = await res.json()
    if (res.ok) {
      workflows.value = (data.data ?? data) as Workflow[]
    }
  } finally {
    state.loading = false
  }
}

function startCreate() {
  Object.assign(draft, emptyDraft())
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
    workflows.value = [data as Workflow, ...workflows.value]
    cancelCreate()
  } finally {
    state.saving = false
  }
}

function startEdit(wf: Workflow) {
  editingId.value = wf.id
  editDraft.name = wf.name
  editDraft.description = wf.description ?? ''
  editDraft.columns = [...(wf.columns ?? [])]
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
    workflows.value = workflows.value.map(w => (w.id === id ? (data as Workflow) : w))
    cancelEdit()
  } finally {
    state.saving = false
  }
}

function payloadFrom(d: WorkflowDraft) {
  return {
    name: d.name,
    description: d.description.trim() ? d.description : null,
    columns: d.columns,
  }
}

// Inline columns editor — array of strings with add/remove.
const ColumnsEditor = defineComponent({
  props: { modelValue: { type: Array as PropType<string[]>, required: true } },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const newCol = ref('')
    const add = () => {
      const v = newCol.value.trim()
      if (!v) return
      emit('update:modelValue', [...props.modelValue, v])
      newCol.value = ''
    }
    const remove = (i: number) => {
      const next = [...props.modelValue]
      next.splice(i, 1)
      emit('update:modelValue', next)
    }
    return () =>
      h('div', { class: 'columns-editor' }, [
        h(
          'div',
          { class: 'columns' },
          props.modelValue.map((col, i) =>
            h('span', { class: 'tag', key: i }, [
              col,
              h(
                'button',
                {
                  type: 'button',
                  class: 'tag-remove',
                  onClick: () => remove(i),
                  'aria-label': `Remove ${col}`,
                },
                '×'
              ),
            ])
          )
        ),
        h('div', { class: 'columns-add' }, [
          h('input', {
            type: 'text',
            placeholder: 'Add column…',
            value: newCol.value,
            onInput: (e: Event) => (newCol.value = (e.target as HTMLInputElement).value),
            onKeydown: (e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                add()
              }
            },
          }),
          h('button', { type: 'button', class: 'btn', onClick: add }, 'Add'),
        ]),
      ])
  },
})

onMounted(load)
</script>
