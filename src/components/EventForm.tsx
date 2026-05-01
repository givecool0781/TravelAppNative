import React, { useState } from 'react'
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native'
import type { TripEvent, EventCategory } from '../types'
import { sanitizeEventInput, validateEvent, type EventFormErrors } from '../utils/validation'

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

  React.useEffect(() => {
    if (visible) {
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
  }

  function handleSubmit() {
    const sanitized = sanitizeEventInput(form)
    const errs = validateEvent(sanitized)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

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
        ? { lat: existingEvent?.location?.lat ?? 0, lng: existingEvent?.location?.lng ?? 0, address: sanitized.address }
        : undefined,
    }
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
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={s.saveLink}>儲存</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.body} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <Text style={s.label}>行程名稱 *</Text>
            <TextInput
              style={[s.input, errors.title && s.inputError]}
              value={form.title}
              onChangeText={(v) => set('title', v)}
              placeholder="例：新千歲機場"
              maxLength={100}
            />
            {errors.title && <Text style={s.errorText}>{errors.title}</Text>}

            {/* Time */}
            <Text style={s.label}>時間 * (HH:MM)</Text>
            <TextInput
              style={[s.input, errors.time && s.inputError]}
              value={form.time}
              onChangeText={(v) => set('time', v)}
              placeholder="09:00"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
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
            <TextInput
              style={s.input}
              value={form.address}
              onChangeText={(v) => set('address', v)}
              placeholder="例：新千歲機場、東京駅..."
              maxLength={200}
            />

            {/* Duration */}
            <Text style={s.label}>預計時長</Text>
            <TextInput
              style={s.input}
              value={form.duration}
              onChangeText={(v) => set('duration', v)}
              placeholder="例：1.5 小時"
              maxLength={40}
            />

            {/* Notes */}
            <Text style={s.label}>備註</Text>
            <TextInput
              style={[s.input, s.multiline]}
              value={form.notes}
              onChangeText={(v) => set('notes', v)}
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
})
