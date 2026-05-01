import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import type { Trip, TripDay } from '../types'
import { sanitizeTripInput, validateTrip, type TripFormErrors } from '../utils/validation'

const EMOJIS = ['✈️', '🗼', '🏯', '🗽', '🏰', '🌏', '🏖️', '🏔️', '🎌', '🇯🇵', '🇫🇷', '🇺🇸', '🇬🇧', '🇮🇹', '🇹🇭']

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function dateRange(startDate: string, endDate: string): string[] {
  const [sy, sm, sd] = startDate.split('-').map(Number)
  const [ey, em, ed] = endDate.split('-').map(Number)
  const start = Date.UTC(sy, sm - 1, sd)
  const end = Date.UTC(ey, em - 1, ed)
  const dates: string[] = []
  for (let ts = start; ts <= end; ts += 86400000) {
    const d = new Date(ts)
    dates.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    )
  }
  return dates
}

function buildDays(start: string, end: string): TripDay[] {
  return dateRange(start, end).map((date) => ({ id: `day-${generateId()}`, date, events: [] }))
}

function rebuildDays(existingDays: TripDay[], start: string, end: string): TripDay[] {
  const existing = new Map(existingDays.map((d) => [d.date, d]))
  return dateRange(start, end).map((date) => existing.get(date) ?? { id: `day-${generateId()}`, date, events: [] })
}

function isoToDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface Props {
  visible: boolean
  existingTrip?: Trip
  onSave: (trip: Trip) => void
  onClose: () => void
}

export default function TripForm({ visible, existingTrip, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: existingTrip?.name ?? '',
    destination: existingTrip?.destination ?? '',
    country: existingTrip?.country ?? '',
    startDate: existingTrip?.startDate ?? '',
    endDate: existingTrip?.endDate ?? '',
    emoji: existingTrip?.emoji ?? '✈️',
  })
  const [errors, setErrors] = useState<TripFormErrors>({})

  React.useEffect(() => {
    if (visible) {
      setForm({
        name: existingTrip?.name ?? '',
        destination: existingTrip?.destination ?? '',
        country: existingTrip?.country ?? '',
        startDate: existingTrip?.startDate ?? '',
        endDate: existingTrip?.endDate ?? '',
        emoji: existingTrip?.emoji ?? '✈️',
      })
      setErrors({})
    }
  }, [visible, existingTrip?.id])

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  function handleSubmit() {
    const sanitized = sanitizeTripInput(form)
    const errs = validateTrip(sanitized)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    const trip: Trip = existingTrip
      ? { ...existingTrip, ...sanitized, days: rebuildDays(existingTrip.days, sanitized.startDate, sanitized.endDate) }
      : { id: `trip-${generateId()}`, ...sanitized, days: buildDays(sanitized.startDate, sanitized.endDate) }

    onSave(trip)
    onClose()
  }

  return (
    <>
      {/* Main form modal */}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
        <View style={s.container}>
          <View style={s.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.cancelLink}>取消</Text>
            </TouchableOpacity>
            <Text style={s.headerTitle}>{existingTrip ? '編輯旅行' : '新增旅行'}</Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={s.saveLink}>儲存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            {/* Emoji */}
            <Text style={s.label}>圖示</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.emojiRow}>
              {EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[s.emojiBtn, form.emoji === e && s.emojiBtnActive]}
                  onPress={() => set('emoji', e)}
                >
                  <Text style={s.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name */}
            <Text style={s.label}>旅行名稱 *</Text>
            <TextInput
              style={[s.input, errors.name && s.inputError]}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholderTextColor="#94A3B8"
              placeholder="例：北海道之旅"
              maxLength={80}
            />
            {errors.name && <Text style={s.errorText}>{errors.name}</Text>}

            {/* City + Country */}
            <View style={s.row}>
              <View style={s.half}>
                <Text style={s.label}>城市 *</Text>
                <TextInput
                  style={[s.input, errors.destination && s.inputError]}
                  value={form.destination}
                  onChangeText={(v) => set('destination', v)}
                  placeholderTextColor="#94A3B8"
              placeholder="札幌"
                  maxLength={60}
                />
                {errors.destination && <Text style={s.errorText}>{errors.destination}</Text>}
              </View>
              <View style={s.half}>
                <Text style={s.label}>國家 *</Text>
                <TextInput
                  style={[s.input, errors.country && s.inputError]}
                  value={form.country}
                  onChangeText={(v) => set('country', v)}
                  placeholderTextColor="#94A3B8"
              placeholder="日本"
                  maxLength={60}
                />
                {errors.country && <Text style={s.errorText}>{errors.country}</Text>}
              </View>
            </View>

            {/* Dates — use compact display (native iOS date button + calendar popup) */}
            <View style={s.row}>
              <View style={s.half}>
                <Text style={s.label}>出發日期 *</Text>
                <View style={[s.dateBox, errors.startDate && s.inputError]}>
                  <DateTimePicker
                    value={form.startDate ? isoToDate(form.startDate) : new Date()}
                    mode="date"
                    display="compact"
                    onChange={(_, date) => { if (date) set('startDate', dateToISO(date)) }}
                  />
                </View>
                {errors.startDate && <Text style={s.errorText}>{errors.startDate}</Text>}
              </View>
              <View style={s.half}>
                <Text style={s.label}>回程日期 *</Text>
                <View style={[s.dateBox, errors.endDate && s.inputError]}>
                  <DateTimePicker
                    value={form.endDate ? isoToDate(form.endDate) : new Date()}
                    mode="date"
                    display="compact"
                    onChange={(_, date) => { if (date) set('endDate', dateToISO(date)) }}
                    minimumDate={form.startDate ? isoToDate(form.startDate) : undefined}
                  />
                </View>
                {errors.endDate && <Text style={s.errorText}>{errors.endDate}</Text>}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>

    </>
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
  errorText: { fontSize: 12, color: '#DC2626', marginTop: 4 },
  dateBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  pickerBox: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  pickerConfirmBtn: {
    backgroundColor: '#2563EB',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerConfirmText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  emojiRow: { flexDirection: 'row', marginBottom: 4 },
  emojiBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  emojiBtnActive: { backgroundColor: '#DBEAFE', borderWidth: 2, borderColor: '#2563EB' },
  emojiText: { fontSize: 22 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  picker: { backgroundColor: '#fff' },
})
