import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://wpodultnumzmkdfkshnq.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwb2R1bHRudW16bWtkZmtzaG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2MDA0ODcsImV4cCI6MjA5MDE3NjQ4N30.JN6snxAaQJs576JzuhgSf66nfSF3VsYlmt3xRk-J0gc'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://my-eloquence.github.io/my-eloquence/'
    }
  })
  if (error) console.error('Login error:', error)
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.reload()
}

export async function getUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch(e) {
    return null
  }
}

export async function saveSession(transcript, feedback, duration, fillerCount) {
  const user = await getUser()
  if (!user) return
  try {
    await supabase.from('sessions').insert({
      user_id: user.id,
      transcript,
      feedback,
      duration,
      filler_count: fillerCount
    })
  } catch(e) {
    console.error('Save session error:', e)
  }
}

export async function getSessions() {
  const user = await getUser()
  if (!user) return []
  try {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    return data || []
  } catch(e) {
    return []
  }
}

export async function saveStreak(streakData) {
  const user = await getUser()
  if (!user) {
    localStorage.setItem('streakData', JSON.stringify(streakData))
    return
  }
  try {
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
  } catch(e) {
    console.error('Save streak error:', e)
  }
}

export async function getStreak() {
  const user = await getUser()
  if (!user) {
    return JSON.parse(localStorage.getItem('streakData')) || {
      currentDay: 1, completedDays: [], lastCompletedDate: null, frozen: false
    }
  }
  try {
    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!data) return { currentDay: 1, completedDays: [], lastCompletedDate: null, frozen: false }

    return {
      currentDay: data.current_day,
      completedDays: data.completed_days || [],
      lastCompletedDate: data.last_completed_date,
      frozen: data.frozen
    }
  } catch(e) {
    return { currentDay: 1, completedDays: [], lastCompletedDate: null, frozen: false }
  }
}