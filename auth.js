import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://wpodultnumzmkdfkshnq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwb2R1bHRudW16bWtkZmtzaG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDA0ODcsImV4cCI6MjA5MDE3NjQ4N30.JN6snxAaQJs576JzuhgSf66nfSF3VsYlmt3xRk-J0gc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Sign in with Google
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
    redirectTo: 'https://my-eloquence.github.io/my-eloquence/'
    }
  })
  if (error) console.error('Login error:', error)
}

// Sign out
export async function signOut() {
  await supabase.auth.signOut()
  window.location.reload()
}

// Get current user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Update nav with user info
export async function updateNav() {
  const user = await getUser()
  const navLinks = document.querySelector('.nav-links')
  const existing = document.getElementById('userNav')
  if (existing) existing.remove()

  const userNav = document.createElement('div')
  userNav.id = 'userNav'
  userNav.style.cssText = 'display:flex;align-items:center;gap:8px;'

  if (user) {
    userNav.innerHTML = `
      <img src="${user.user_metadata.avatar_url}" 
        style="width:32px;height:32px;border-radius:50%;border:2px solid var(--primary);" 
        alt="avatar">
      <span style="font-size:13px;font-weight:700;color:var(--text);">
        ${user.user_metadata.full_name.split(' ')[0]}
      </span>
      <button onclick="import('./auth.js').then(m=>m.signOut())" 
        style="background:rgba(255,75,110,0.1);border:1.5px solid rgba(255,75,110,0.2);
        border-radius:10px;padding:5px 12px;font-size:13px;font-weight:700;
        color:var(--primary);cursor:pointer;">
        Logout
      </button>
    `
  } else {
    userNav.innerHTML = `
      <button onclick="import('./auth.js').then(m=>m.signInWithGoogle())"
        style="background:linear-gradient(135deg,var(--primary),var(--primary-dark));
        color:white;border:none;border-radius:12px;padding:7px 16px;
        font-size:13px;font-weight:700;cursor:pointer;
        box-shadow:0 4px 12px rgba(255,75,110,0.3);">
        🔐 Login with Google
      </button>
    `
  }
  navLinks.appendChild(userNav)
}

// Save practice session
export async function saveSession(transcript, feedback, duration, fillerCount) {
  const user = await getUser()
  if (!user) return

  await supabase.from('sessions').insert({
    user_id: user.id,
    transcript,
    feedback,
    duration,
    filler_count: fillerCount
  })
}

// Get practice sessions
export async function getSessions() {
  const user = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data || []
}

// Save streak
export async function saveStreak(streakData) {
  const user = await getUser()
  if (!user) {
    localStorage.setItem('streakData', JSON.stringify(streakData))
    return
  }

  const { data: existing } = await supabase
    .from('streaks')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) {
    await supabase.from('streaks').update({
      current_day: streakData.currentDay,
      completed_days: streakData.completedDays,
      last_completed_date: streakData.lastCompletedDate,
      frozen: streakData.frozen
    }).eq('user_id', user.id)
  } else {
    await supabase.from('streaks').insert({
      user_id: user.id,
      current_day: streakData.currentDay,
      completed_days: streakData.completedDays,
      last_completed_date: streakData.lastCompletedDate,
      frozen: streakData.frozen
    })
  }
}

// Get streak
export async function getStreak() {
  const user = await getUser()
  if (!user) {
    return JSON.parse(localStorage.getItem('streakData')) || {
      currentDay: 1,
      completedDays: [],
      lastCompletedDate: null,
      frozen: false
    }
  }

  const { data } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!data) return {
    currentDay: 1,
    completedDays: [],
    lastCompletedDate: null,
    frozen: false
  }

  return {
    currentDay: data.current_day,
    completedDays: data.completed_days || [],
    lastCompletedDate: data.last_completed_date,
    frozen: data.frozen
  }
}