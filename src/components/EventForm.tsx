import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import type { TripEvent, EventCategory } from '../types'
import { sanitizeEventInput, validateEvent, type EventFormErrors } from '../utils/validation'
import DurationPicker from './DurationPicker'

const MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY ?? ''

function timeStringToDate(time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date()
  d.setHours(isNaN(h) ? 9 : h, isNaN(m) ? 0 : m, 0, 0)
  return d
}

function dateToTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface GeoResult {
  lat: number
  lng: number
  displayName: string
}

async function geocodeAddress(address: string): Promise<GeoResult | null> {
  if (!address.trim()) return null
  try {
    // Photon (komoot) — better POI coverage than Nominatim, still free & no key needed
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}&limit=1&lang=zh`
    const res = await fetch(url, { headers: { 'User-Agent': 'TravelApp/1.0' } })
    const data = await res.json()
    const feature = data?.features?.[0]
    if (feature) {
      const [lng, lat] = feature.geometry.coordinates
      const p = feature.properties
      const name = [p.name, p.city, p.state, p.country].filter(Boolean).join(', ')
      return { lat, lng, displayName: name || address }
    }
  } catch {}
  return null
}

const CATEGORIES: { value: EventCategory; label: string; color: string }[] = [
  { value: 'food', label: '餐廳', color: '#EA580C' },
  { value: 'attraction', label: '景點', color: '#16A34A' },
  { value: 'transport', label: '交通', color: '#2563EB' },
  { value: 'hotel', label: '住宿', color: '#7C3AED' },
  { value: 'other', label: '其他', color: '#64748B' },
]

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

interface Props {
  visible: boolean
  existingEvent?: TripEvent
  onSave: (event: TripEvent) => void
  onClose: () => void
}

export default function EventForm({ visible, existingEvent, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    title: existingEvent?.title ?? '',
    time: existingEvent?.time ?? '09:00',
    category: (existingEvent?.category ?? 'attraction') as EventCategory,
    address: existingEvent?.location?.address ?? '',
    duration: existingEvent?.duration ?? '',
    notes: existingEvent?.notes ?? '',
    website: existingEvent?.website ?? '',
    phone: existingEvent?.phone ?? '',
  })
  const [errors, setErrors] = useState<EventFormErrors>({})
  const [saving, setSaving] = useState(false)
  const [geoState, setGeoState] = useState<'idle' | 'searching' | 'found' | 'notfound'>('idle')
  const [geoResult, setGeoResult] = useState<GeoResult | null>(
    existingEvent?.location?.lat
      ? { lat: existingEvent.location.lat, lng: existingEvent.location.lng, displayName: existingEvent.location.address }
      : null
  )

  React.useEffect(() => {
    if (visible) {
      setGeoState('idle')
      setGeoResult(
        existingEvent?.location?.lat
          ? { lat: existingEvent.location.lat, lng: existingEvent.location.lng, displayName: existingEvent.location.address }
          : null
      )
      setForm({
        title: existingEvent?.title ?? '',
        time: existingEvent?.time ?? '09:00',
        category: (existingEvent?.category ?? 'attraction') as EventCategory,
        address: existingEvent?.location?.address ?? '',
        duration: existingEvent?.duration ?? '',
        notes: existingEvent?.notes ?? '',
        website: existingEvent?.website ?? '',
        phone: existingEvent?.phone ?? '',
      })
      setErrors({})
    }
  }, [visible, existingEvent?.id])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
    if (field === 'address') { setGeoState('idle'); setGeoResult(null) }
  }

  async function searchLocation() {
    if (!form.address.trim()) return
    setGeoState('searching')
    const result = await geocodeAddress(form.address)
    if (result) {
      setGeoResult(result)
      setGeoState('found')
    } else {
      setGeoResult(null)
      setGeoState('notfound')
    }
  }

  async function handleSubmit() {
    const sanitized = sanitizeEventInput(form)
    const errs = validateEvent(sanitized)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setSaving(true)

    // Use cached result from preview search, or geocode now if not yet searched
    let coords = geoResult
    if (sanitized.address && !coords) {
      coords = await geocodeAddress(sanitized.address)
    }

    const event: TripEvent = {
      id: existingEvent?.id ?? `ev-${generateId()}`,
      title: sanitized.title,
      time: sanitized.time,
      category: form.category,
      duration: sanitized.duration || undefined,
      notes: sanitized.notes || undefined,
      website: sanitized.website || undefined,
      phone: sanitized.phone || undefined,
      location: sanitized.address
        ? { lat: coords?.lat ?? 0, lng: coords?.lng ?? 0, address: sanitized.address }
        : undefined,
    }

    setSaving(false)
    onSave(event)
    onClose()
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.cancelLink}>取消</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>{existingEvent ? '編輯行程' : '新增行程'}</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={saving}>
              {saving
                ? <ActivityIndicator size="small" color="#2563EB" />
                : <Text style={s.saveLink}>儲存</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={s.label}>行程名稱 *</Text>
            <TextInput
              style={[s.input, errors.title && s.inputError]}
              value={form.title}
              onChangeText={(v) => set('title', v)}
              placeholderTextColor="#94A3B8"
              placeholder="例：新千歲機場"
              maxLength={100}
            />
            {errors.title && <Text style={s.errorText}>{errors.title}</Text>}

            {/* Time */}
            <Text style={s.label}>時間</Text>
            <View style={s.timeBox}>
              <DateTimePicker
                value={timeStringToDate(form.time)}
                mode="time"
                display="compact"
                onChange={(_, date) => { if (date) set('time', dateToTimeString(date)) }}
              />
            </View>
            {errors.time && <Text style={s.errorText}>{errors.time}</Text>}

            {/* Category */}
            <Text style={s.label}>類別</Text>
            <View style={s.catRow}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.value}
                  style={[s.catBtn, form.category === c.value && { backgroundColor: c.color + '20', borderColor: c.color }]}
                  onPress={() => setForm((f) => ({ ...f, category: c.value }))}
                >
                  <Text style={[s.catText, form.category === c.value && { color: c.color }]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Address */}
            <Text style={s.label}>地點</Text>
            <View style={s.addressRow}>
              <TextInput
                style={[s.input, s.addressInput]}
                value={form.address}
                onChangeText={(v) => set('address', v)}
                placeholderTextColor="#94A3B8"
                placeholder="例：Vessel Hotel Campana Susukino..."
                maxLength={200}
                onSubmitEditing={searchLocation}
                returnKeyType="search"
              />
              {form.address.length > 0 && (
                <TouchableOpacity
                  style={s.clearBtn}
                  onPress={() => { set('address', ''); setGeoState('idle'); setGeoResult(null) }}
                >
                  <Text style={s.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[s.searchBtn, geoState === 'searching' && s.searchBtnDisabled]}
              onPress={searchLocation}
              disabled={geoState === 'searching'}
            >
              {geoState === 'searching'
                ? <ActivityIndicator size="small" color="#2563EB" />
                : <Text style={s.searchBtnText}>🔍 確認地點</Text>
              }
            </TouchableOpacity>
            {geoState === 'found' && geoResult && (
              <View style={s.geoResult}>
                <Text style={s.geoFound}>✅ 找到：</Text>
                <Text style={s.geoFoundName} numberOfLines={2}>{geoResult.displayName}</Text>
              </View>
            )}
            {geoState === 'notfound' && (
              <View style={s.geoResult}>
                <Text style={s.geoNotFound}>❌ 找不到此地點，請嘗試更完整的名稱</Text>
              </View>
            )}

            {/* Duration */}
            <Text style={s.label}>預計時長</Text>
            <DurationPicker
              value={form.duration}
              onChange={(v) => set('duration', v)}
            />

            {/* Notes */}
            <Text style={s.label}>備註</Text>
            <TextInput
              style={[s.input, s.multiline]}
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
              placeholderTextColor="#94A3B8"
              placeholder="補充說明..."
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            {/* Website */}
            <Text style={s.label}>官網</Text>
            <TextInput
              style={[s.input, errors.website && s.inputError]}
              value={form.website}
              onChangeText={(v) => set('website', v)}
              placeholderTextColor="#94A3B8"
              placeholder="https://..."
              keyboardType="url"
              autoCapitalize="none"
              maxLength={300}
            />
            {errors.website && <Text style={s.errorText}>{errors.website}</Text>}

            {/* Phone */}
            <Text style={s.label}>電話</Text>
            <TextInput
              style={[s.input, errors.phone && s.inputError]}
              value={form.phone}
              onChangeText={(v) => set('phone', v)}
              placeholderTextColor="#94A3B8"
              placeholder="+81-3-1234-5678"
              keyboardType="phone-pad"
              maxLength={30}
            />
            {errors.phone && <Text style={s.errorText}>{errors.phone}</Text>}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  cancelLink: { fontSize: 16, color: '#64748B' },
  saveLink: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
  body: { flex: 1, padding: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 16 },
  timeBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0F172A',
  },
  inputError: { borderColor: '#F87171', backgroundColor: '#FEF2F2' },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  catText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addressInput: { flex: 1 },
  clearBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  searchBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    minHeight: 40,
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { fontSize: 14, color: '#2563EB', fontWeight: '600' },
  geoResult: { marginTop: 6, paddingHorizontal: 4 },
  geoFound: { fontSize: 12, color: '#15803D', fontWeight: '600' },
  geoFoundName: { fontSize: 12, color: '#334155', marginTop: 2, lineHeight: 18 },
  geoNotFound: { fontSize: 13, color: '#DC2626' },
})
