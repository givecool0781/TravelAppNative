import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import type { Trip, TripEvent } from '../types'
import * as api from '../api'
import { useAuth } from './AuthContext'

interface State { trips: Trip[] }

type Action =
  | { type: 'SET_TRIPS'; trips: Trip[] }
  | { type: 'ADD_TRIP'; trip: Trip }
  | { type: 'UPDATE_TRIP'; trip: Trip }
  | { type: 'DELETE_TRIP'; tripId: string }
  | { type: 'ADD_EVENT'; tripId: string; dayId: string; event: TripEvent }
  | { type: 'UPDATE_EVENT'; tripId: string; dayId: string; event: TripEvent }
  | { type: 'DELETE_EVENT'; tripId: string; dayId: string; eventId: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_TRIPS': return { trips: action.trips }
    case 'ADD_TRIP': return { trips: [...state.trips, action.trip] }
    case 'UPDATE_TRIP': return { trips: state.trips.map((t) => t.id === action.trip.id ? action.trip : t) }
    case 'DELETE_TRIP': return { trips: state.trips.filter((t) => t.id !== action.tripId) }
    case 'ADD_EVENT': return {
      trips: state.trips.map((t) => t.id !== action.tripId ? t : {
        ...t, days: t.days.map((d) => d.id !== action.dayId ? d : { ...d, events: [...d.events, action.event] })
      })
    }
    case 'UPDATE_EVENT': return {
      trips: state.trips.map((t) => t.id !== action.tripId ? t : {
        ...t, days: t.days.map((d) => d.id !== action.dayId ? d : {
          ...d, events: d.events.map((e) => e.id === action.event.id ? action.event : e)
        })
      })
    }
    case 'DELETE_EVENT': return {
      trips: state.trips.map((t) => t.id !== action.tripId ? t : {
        ...t, days: t.days.map((d) => d.id !== action.dayId ? d : {
          ...d, events: d.events.filter((e) => e.id !== action.eventId)
        })
      })
    }
    default: return state
  }
}

interface TripContextValue {
  trips: Trip[]
  loaded: boolean
  addTrip: (trip: Trip) => Promise<void>
  updateTrip: (trip: Trip) => Promise<void>
  deleteTrip: (tripId: string) => Promise<void>
  addEvent: (tripId: string, dayId: string, event: TripEvent) => Promise<void>
  updateEvent: (tripId: string, dayId: string, event: TripEvent) => Promise<void>
  deleteEvent: (tripId: string, dayId: string, eventId: string) => Promise<void>
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const [state, dispatch] = useReducer(reducer, { trips: [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!token) { dispatch({ type: 'SET_TRIPS', trips: [] }); setLoaded(true); return }
    setLoaded(false)
    api.fetchTrips()
      .then((trips) => dispatch({ type: 'SET_TRIPS', trips }))
      .catch(() => dispatch({ type: 'SET_TRIPS', trips: [] }))
      .finally(() => setLoaded(true))
  }, [token])

  async function addTrip(trip: Trip) {
    const saved = await api.createTrip(trip)
    dispatch({ type: 'ADD_TRIP', trip: saved })
  }

  async function updateTrip(trip: Trip) {
    const saved = await api.updateTrip(trip)
    dispatch({ type: 'UPDATE_TRIP', trip: saved })
  }

  async function deleteTrip(tripId: string) {
    await api.deleteTrip(tripId)
    dispatch({ type: 'DELETE_TRIP', tripId })
  }

  async function addEvent(tripId: string, dayId: string, event: TripEvent) {
    const action: Action = { type: 'ADD_EVENT', tripId, dayId, event }
    const updated = reducer(state, action).trips.find((t) => t.id === tripId)!
    dispatch(action)
    await api.updateTrip(updated)
  }

  async function updateEvent(tripId: string, dayId: string, event: TripEvent) {
    const action: Action = { type: 'UPDATE_EVENT', tripId, dayId, event }
    const updated = reducer(state, action).trips.find((t) => t.id === tripId)!
    dispatch(action)
    await api.updateTrip(updated)
  }

  async function deleteEvent(tripId: string, dayId: string, eventId: string) {
    const action: Action = { type: 'DELETE_EVENT', tripId, dayId, eventId }
    const updated = reducer(state, action).trips.find((t) => t.id === tripId)!
    dispatch(action)
    await api.updateTrip(updated)
  }

  return (
    <TripContext.Provider value={{ trips: state.trips, loaded, addTrip, updateTrip, deleteTrip, addEvent, updateEvent, deleteEvent }}>
      {children}
    </TripContext.Provider>
  )
}

export function useTripContext() {
  const ctx = useContext(TripContext)
  if (!ctx) throw new Error('must be inside TripProvider')
  return ctx
}
