export type EventCategory = 'food' | 'attraction' | 'transport' | 'hotel' | 'other'

export interface Location {
  lat: number
  lng: number
  address: string
  placeId?: string
}

export interface TripEvent {
  id: string
  time: string
  title: string
  category: EventCategory
  location?: Location
  notes?: string
  duration?: string
  website?: string
  phone?: string
}

export interface TripDay {
  id: string
  date: string
  label?: string
  events: TripEvent[]
}

export interface Trip {
  id: string
  name: string
  destination: string
  country: string
  startDate: string
  endDate: string
  emoji: string
  days: TripDay[]
}
