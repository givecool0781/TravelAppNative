import * as XLSX from 'xlsx'
import * as FileSystem from 'expo-file-system/legacy'
import type { Trip, TripEvent, TripDay, EventCategory } from '../types'
import { sanitizeEventInput, validateEvent } from './validation'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const MAX_ROWS = 500

const CATEGORY_MAP: Record<string, EventCategory> = {
  餐廳: 'food', food: 'food',
  景點: 'attraction', attraction: 'attraction',
  交通: 'transport', transport: 'transport',
  住宿: 'hotel', hotel: 'hotel',
  其他: 'other', other: 'other',
}

const HEADER_ALIASES: Record<string, string> = {
  日期: 'date', date: 'date',
  時間: 'time', time: 'time',
  名稱: 'title', 行程名稱: 'title', title: 'title', name: 'title',
  類別: 'category', category: 'category',
  地點: 'address', 地址: 'address', address: 'address', location: 'address',
  備註: 'notes', notes: 'notes',
  時長: 'duration', 預計時長: 'duration', duration: 'duration',
  官網: 'website', 網站: 'website', website: 'website',
  電話: 'phone', phone: 'phone',
}

export interface ParsedRow {
  date: string
  event: TripEvent
}

export interface ImportError {
  row: number
  message: string
}

export interface ParseResult {
  rows: ParsedRow[]
  errors: ImportError[]
}

function normalizeHeader(raw: string): string {
  const trimmed = raw.toString().trim()
  return HEADER_ALIASES[trimmed] ?? trimmed.toLowerCase()
}

function cellToString(val: unknown): string {
  if (val === null || val === undefined) return ''
  return String(val).trim()
}

function excelTimeToHHMM(val: unknown): string {
  if (typeof val === 'string') {
    const match = val.match(/^(\d{1,2}):(\d{2})/)
    if (match) return `${match[1].padStart(2, '0')}:${match[2]}`
  }
  if (typeof val === 'number' && val >= 0 && val < 1) {
    const totalMinutes = Math.round(val * 24 * 60)
    const h = Math.floor(totalMinutes / 60)
    const m = totalMinutes % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  return cellToString(val)
}

function excelDateToISO(val: unknown): string {
  if (typeof val === 'string') {
    const normalized = val.replace(/\//g, '-').trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized
  }
  if (typeof val === 'number') {
    const date = XLSX.SSF.parse_date_code(val)
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
    }
  }
  return cellToString(val)
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export async function parseExcelUri(uri: string, fileSize: number): Promise<ParseResult> {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return { rows: [], errors: [{ row: 0, message: `檔案大小不能超過 5MB` }] }
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  })

  const workbook = XLSX.read(base64, { type: 'base64', cellDates: false })
  const sheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const raw = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  }) as unknown[][]

  if (raw.length < 2) {
    return { rows: [], errors: [{ row: 0, message: '檔案內容為空或缺少標題列' }] }
  }

  const headerRow = raw[0] as unknown[]
  const colMap: Record<string, number> = {}
  headerRow.forEach((cell, idx) => {
    const key = normalizeHeader(String(cell))
    if (key) colMap[key] = idx
  })

  if (!('date' in colMap) || !('time' in colMap) || !('title' in colMap)) {
    return {
      rows: [],
      errors: [{ row: 1, message: '找不到必要欄位「日期」、「時間」、「名稱」' }],
    }
  }

  const dataRows = raw.slice(1)
  if (dataRows.length > MAX_ROWS) {
    return {
      rows: [],
      errors: [{ row: 0, message: `一次最多匯入 ${MAX_ROWS} 筆` }],
    }
  }

  const rows: ParsedRow[] = []
  const errors: ImportError[] = []

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2
    const get = (key: string) => {
      const colIdx = colMap[key]
      return colIdx !== undefined ? row[colIdx] : ''
    }

    const dateRaw = excelDateToISO(get('date'))
    const timeRaw = excelTimeToHHMM(get('time'))

    const sanitized = sanitizeEventInput({
      title: cellToString(get('title')),
      time: timeRaw,
      notes: cellToString(get('notes')),
      website: cellToString(get('website')),
      phone: cellToString(get('phone')),
      duration: cellToString(get('duration')),
      address: cellToString(get('address')),
    })

    if (!sanitized.title) {
      if (!dateRaw && !timeRaw) return
      errors.push({ row: rowNum, message: '名稱為空，略過此列' })
      return
    }

    const validationErrors = validateEvent(sanitized)
    if (Object.keys(validationErrors).length > 0) {
      errors.push({ row: rowNum, message: Object.values(validationErrors).join('、') })
      return
    }

    const categoryRaw = cellToString(get('category'))
    const category: EventCategory =
      CATEGORY_MAP[categoryRaw] ?? CATEGORY_MAP[categoryRaw.toLowerCase()] ?? 'other'

    const event: TripEvent = {
      id: `ev-${generateId()}`,
      title: sanitized.title,
      time: sanitized.time,
      category,
      notes: sanitized.notes || undefined,
      website: sanitized.website || undefined,
      phone: sanitized.phone || undefined,
      duration: sanitized.duration || undefined,
      location: sanitized.address ? { lat: 0, lng: 0, address: sanitized.address } : undefined,
    }

    rows.push({ date: dateRaw, event })
  })

  return { rows, errors }
}

export function distributeRowsToTrip(
  trip: Trip,
  rows: ParsedRow[]
): { dayId: string; event: TripEvent }[] {
  const dayMap = new Map(trip.days.map((d: TripDay) => [d.date, d.id]))
  return rows
    .filter(({ date }) => dayMap.has(date))
    .map(({ date, event }) => ({ dayId: dayMap.get(date)!, event }))
}
