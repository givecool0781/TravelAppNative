import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Trip } from './types'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000'
const TOKEN_KEY = 'travelapp_token'

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY)
}
export async function setToken(t: string) {
  return AsyncStorage.setItem(TOKEN_KEY, t)
}
export async function clearToken() {
  return AsyncStorage.removeItem(TOKEN_KEY)
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })
  if (res.status === 204) return null as T
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? 'API 錯誤')
  return data as T
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function register(email: string, password: string): Promise<string> {
  const { access_token } = await request<{ access_token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return access_token
}

export async function login(email: string, password: string): Promise<string> {
  const { access_token } = await request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  return access_token
}

export async function getMe(): Promise<{ id: string; email: string }> {
  return request('/auth/me')
}

// ── Trips ─────────────────────────────────────────────────────────────────────

function toApiTrip(trip: Trip) {
  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    country: trip.country,
    start_date: trip.startDate,
    end_date: trip.endDate,
    emoji: trip.emoji,
    days: trip.days.map((d) => ({
      id: d.id,
      date: d.date,
      label: d.label ?? null,
      events: d.events.map((e) => ({
        id: e.id,
        time: e.time,
        title: e.title,
        category: e.category,
        location: e.location ?? null,
        notes: e.notes ?? null,
        duration: e.duration ?? null,
        website: e.website ?? null,
        phone: e.phone ?? null,
      })),
    })),
  }
}

function fromApiTrip(t: any): Trip {
  return {
    id: t.id,
    name: t.name,
    destination: t.destination,
    country: t.country,
    startDate: t.start_date,
    endDate: t.end_date,
    emoji: t.emoji,
    days: (t.days ?? []).map((d: any) => ({
      id: d.id,
      date: d.date,
      label: d.label ?? undefined,
      events: (d.events ?? []).map((e: any) => ({
        id: e.id,
        time: e.time,
        title: e.title,
        category: e.category,
        location: e.location ?? undefined,
        notes: e.notes ?? undefined,
        duration: e.duration ?? undefined,
        website: e.website ?? undefined,
        phone: e.phone ?? undefined,
      })),
    })),
  }
}

export async function fetchTrips(): Promise<Trip[]> {
  const data = await request<any[]>('/trips')
  return data.map(fromApiTrip)
}

export async function createTrip(trip: Trip): Promise<Trip> {
  const data = await request<any>('/trips', {
    method: 'POST',
    body: JSON.stringify(toApiTrip(trip)),
  })
  return fromApiTrip(data)
}

export async function updateTrip(trip: Trip): Promise<Trip> {
  const data = await request<any>(`/trips/${trip.id}`, {
    method: 'PUT',
    body: JSON.stringify(toApiTrip(trip)),
  })
  return fromApiTrip(data)
}

export async function deleteTrip(tripId: string): Promise<void> {
  await request(`/trips/${tripId}`, { method: 'DELETE' })
}
