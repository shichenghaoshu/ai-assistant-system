import { useSyncExternalStore } from 'react'
import { createClient } from '@supabase/supabase-js'

const env = import.meta.env
const REMEMBERED_EMAIL_KEY = 'xxjh_remembered_email'

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

export { supabase }

let authState = {
  loading: true,
  session: null,
}

const listeners = new Set()

function emit(nextState) {
  authState = nextState
  listeners.forEach((listener) => listener())
}

async function hydrateSession() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    emit({ loading: false, session })
  } catch {
    emit({ loading: false, session: null })
  }
}

hydrateSession()

supabase.auth.onAuthStateChange((_event, session) => {
  emit({ loading: false, session })
})

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return authState
}

function getServerSnapshot() {
  return { loading: true, session: null }
}

export function useAuthSession() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function subscribeAuth(callback) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })

  return () => subscription.unsubscribe()
}

export function getRememberedEmail() {
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? ''
}

export function setRememberedEmail(email, shouldRemember) {
  if (shouldRemember) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email)
    return
  }

  window.localStorage.removeItem(REMEMBERED_EMAIL_KEY)
}

export async function getSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  return { session, error }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signUp(email, password, name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })

  return { data, error }
}

export async function signOut() {
  return supabase.auth.signOut()
}

export async function checkEmailExists(email) {
  const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`)
  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(payload?.message || '邮箱检查失败')
  }

  return payload
}

export async function resetPasswordForEmail(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
}

export async function verifyOtpAndResetPassword(email, code, password) {
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email,
    token: code,
    type: 'recovery',
  })

  if (verifyError) {
    return { error: verifyError }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return { error: updateError }
  }

  await supabase.auth.signOut()

  return { error: null }
}

export async function redeemMembershipCode(code) {
  if (!code.trim()) {
    return { success: false, error: new Error('missing code') }
  }

  const { data, error } = await supabase.rpc('redeem_code', {
    p_code: code.trim(),
    p_user_ip: null,
    p_user_agent: navigator.userAgent,
  })

  if (error) {
    return { success: false, error }
  }

  if (!data?.success) {
    return {
      success: false,
      error: new Error(data?.message || '兑换失败，请稍后重试'),
    }
  }

  return { success: true, data }
}

export function formatAuthError(error) {
  if (!error) {
    return '未知错误'
  }

  if (typeof error === 'string') {
    return error
  }

  if (error?.message === 'Invalid login credentials') {
    return '账号与密码不正确'
  }

  if (error?.message) {
    return error.message
  }

  return '操作失败，请重试'
}
