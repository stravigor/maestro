<template>
  <form>
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" v-model="form.email" required>
      <div class="feedback-error" v-if="state.errors.email">{{ state.errors.email.join(', ') }}</div>
    </div>
    <div class="form-group">
      <label for="password">Password</label>
      <input type="password" id="password" v-model="form.password" required>
      <div class="feedback-error" v-if="state.errors.password">{{ state.errors.password.join(', ') }}</div>
    </div>
    <button class="btn btn-full" @click="submitLogin">Sign In</button>
    <div class="feedback-error" v-if="state.wrongCredentials">Wrong credentials</div>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { xfetch } from '@strav/view/client'
type ErrorBag = Record<string, string[]>

const form = reactive({ email: '', password: '' })
const state = reactive({ errors: {} as ErrorBag, wrongCredentials: false })

// Submit login form
const submitLogin = async (e: Event) => {
  e.preventDefault()

  const res = await xfetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  })
  const data = await res.json()
  if (!res.ok) {
    state.wrongCredentials = false
    state.errors = data.errors ?? {}
    console.log('data', data)
    if (res.status === 401) {
      state.wrongCredentials = true
    }
    return
  }
  window.location.href = '/dashboard'
}


</script>