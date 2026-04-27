export interface TripFormData {
  name: string
  destination: string
  country: string
  startDate: string
  endDate: string
  emoji: string
}

export interface EventFormData {
  title: string
  time: string
  notes: string
  website: string
  phone: string
  duration: string
  address: string
}

export interface TripFormErrors {
  name?: string
  destination?: string
  country?: string
  startDate?: string
  endDate?: string
}

export interface EventFormErrors {
  title?: string
  time?: string
  website?: string
  phone?: string
}

const LIMITS = {
  tripName: 80,
  destination: 60,
  country: 60,
  eventTitle: 100,
  notes: 500,
  website: 300,
  phone: 30,
  duration: 40,
  address: 200,
}

function isSafeUrl(url: string): boolean {
  if (!url) return true
  return /^https?:\/\//i.test(url)
}

function isSafePhone(phone: string): boolean {
  return /^[\d\s+\-().]{0,30}$/.test(phone)
}

export function sanitizeTripInput(form: TripFormData): TripFormData {
  return {
    name: form.name.trim().slice(0, LIMITS.tripName),
    destination: form.destination.trim().slice(0, LIMITS.destination),
    country: form.country.trim().slice(0, LIMITS.country),
    startDate: form.startDate.trim(),
    endDate: form.endDate.trim(),
    emoji: form.emoji,
  }
}

export function validateTrip(form: TripFormData): TripFormErrors {
  const errors: TripFormErrors = {}
  if (!form.name) errors.name = '請輸入旅行名稱'
  if (!form.destination) errors.destination = '請輸入城市'
  if (!form.country) errors.country = '請輸入國家'
  if (!form.startDate) errors.startDate = '請選擇出發日期'
  if (!form.endDate) errors.endDate = '請選擇回程日期'
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = '回程日期不能早於出發日期'
  }
  return errors
}

export function sanitizeEventInput(form: EventFormData): EventFormData {
  return {
    title: form.title.trim().slice(0, LIMITS.eventTitle),
    time: form.time.trim(),
    notes: form.notes.trim().slice(0, LIMITS.notes),
    website: form.website.trim().slice(0, LIMITS.website),
    phone: form.phone.trim().slice(0, LIMITS.phone),
    duration: form.duration.trim().slice(0, LIMITS.duration),
    address: form.address.trim().slice(0, LIMITS.address),
  }
}

export function validateEvent(form: EventFormData): EventFormErrors {
  const errors: EventFormErrors = {}
  if (!form.title) errors.title = '請輸入行程名稱'
  if (!form.time) errors.time = '請輸入時間'
  if (form.website && !isSafeUrl(form.website)) {
    errors.website = '網址需以 http:// 或 https:// 開頭'
  }
  if (form.phone && !isSafePhone(form.phone)) {
    errors.phone = '電話格式不正確'
  }
  return errors
}
