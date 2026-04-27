import React, { createContext, useContext, useReducer, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Trip, TripDay, TripEvent } from '../types'
import { mockTrips } from '../data/mockData'

const STORAGE_KEY = 'travelapp_trips_v1'

interface State {
  trips: Trip[]
}

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
    case 'SET_TRIPS':
      return { trips: action.trips }

    case 'ADD_TRIP':
      return { trips: [...state.trips, action.trip] }

    case 'UPDATE_TRIP':
      return { trips: state.trips.map((t) => (t.id === action.trip.id ? action.trip : t)) }

    case 'DELETE_TRIP':
      return { trips: state.trips.filter((t) => t.id !== action.tripId) }

    case 'ADD_EVENT':
      return {
        trips: state.trips.map((t) =>
          t.id !== action.tripId
            ? t
            : {
                ...t,
                days: t.days.map((d) =>
                  d.id !== action.dayId ? d : { ...d, events: [...d.events, action.event] }
                ),
              }
        ),
      }

    case 'UPDATE_EVENT':
      return {
        trips: state.trips.map((t) =>
          t.id !== action.tripId
            ? t
            : {
                ...t,
                days: t.days.map((d) =>
                  d.id !== action.dayId
                    ? d
                    : { ...d, events: d.events.map((e) => (e.id === action.event.id ? action.event : e)) }
                ),
              }
        ),
      }

    case 'DELETE_EVENT':
      return {
        trips: state.trips.map((t) =>
          t.id !== action.tripId
            ? t
            : {
                ...t,
                days: t.days.map((d) =>
                  d.id !== action.dayId
                    ? d
                    : { ...d, events: d.events.filter((e) => e.id !== action.eventId) }
                ),
              }
        ),
      }

    default:
      return state
  }
}

interface TripContextValue {
  trips: Trip[]
  loaded: boolean
  addTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  deleteTrip: (tripId: string) => void
  addEvent: (tripId: string, dayId: string, event: TripEvent) => void
  updateEvent: (tripId: string, dayId: string, event: TripEvent) => void
  deleteEvent: (tripId: string, dayId: string, eventId: string) => void
}

const TripContext = createContext<TripContextValue | null>(null)

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { trips: [] })
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw)
          dispatch({ type: 'SET_TRIPS', trips: Array.isArray(parsed) ? parsed : mockTrips })
        } else {
          dispatch({ type: 'SET_TRIPS', trips: mockTrips })
        }
      })
      .catch(() => dispatch({ type: 'SET_TRIPS', trips: mockTrips }))
      .finally(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!loaded) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state.trips)).catch(() => {})
  }, [state.trips, loaded])

  const addTrip = (trip: Trip) => dispatch({ type: 'ADD_TRIP', trip })
  const updateTrip = (trip: Trip) => dispatch({ type: 'UPDATE_TRIP', trip })
  const deleteTrip = (tripId: string) => dispatch({ type: 'DELETE_TRIP', tripId })
  const addEvent = (tripId: string, dayId: string, event: TripEvent) =>
    dispatch({ type: 'ADD_EVENT', tripId, dayId, event })
  const updateEvent = (tripId: string, dayId: string, event: TripEvent) =>
    dispatch({ type: 'UPDATE_EVENT', tripId, dayId, event })
  const deleteEvent = (tripId: string, dayId: string, eventId: string) =>
    dispatch({ type: 'DELETE_EVENT', tripId, dayId, eventId })

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
