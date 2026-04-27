import React from 'react'
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Linking,
} from 'react-native'
import type { TripEvent } from '../types'

const CATEGORY_CONFIG = {
  food:       { label: '餐廳', bg: '#FFF7ED', color: '#C2410C' },
  attraction: { label: '景點', bg: '#F0FDF4', color: '#15803D' },
  transport:  { label: '交通', bg: '#EFF6FF', color: '#1D4ED8' },
  hotel:      { label: '住宿', bg: '#FAF5FF', color: '#7E22CE' },
  other:      { label: '其他', bg: '#F8FAFC', color: '#475569' },
}

interface Props {
  event: TripEvent | null
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}

export default function EventDetailModal({ event, onClose, onEdit, onDelete }: Props) {
  if (!event) return null
  const cfg = CATEGORY_CONFIG[event.category]

  function openNavigation() {
    if (!event?.location) return
    const { lat, lng } = event.location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    Linking.openURL(url)
  }

  function openMaps() {
    if (!event?.location) return
    const query = encodeURIComponent(event.location.address)
    const url = `https://maps.apple.com/?q=${query}`
    Linking.openURL(url)
  }

  function openWebsite() {
    if (event?.website) Linking.openURL(event.website)
  }

  function callPhone() {
    if (event?.phone) Linking.openURL(`tel:${event.phone}`)
  }

  return (
    <Modal visible={!!event} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={s.closeLink}>關閉</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{event.title}</Text>
          <TouchableOpacity onPress={onEdit}>
            <Text style={s.editLink}>編輯</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body}>
          {/* Category + time */}
          <View style={s.topRow}>
            <View style={[s.catBadge, { backgroundColor: cfg.bg }]}>
              <Text style={[s.catText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <Text style={s.time}>{event.time}</Text>
            {event.duration && <Text style={s.duration}>{event.duration}</Text>}
          </View>

          {/* Notes */}
          {event.notes && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>備註</Text>
              <Text style={s.notes}>{event.notes}</Text>
            </View>
          )}

          {/* Location */}
          {event.location && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>地點</Text>
              <Text style={s.address}>{event.location.address}</Text>
              <View style={s.mapBtns}>
                <TouchableOpacity style={s.mapBtn} onPress={openMaps}>
                  <Text style={s.mapBtnText}>📍 查看地圖</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.mapBtn, s.navBtn]} onPress={openNavigation}>
                  <Text style={[s.mapBtnText, { color: '#fff' }]}>🧭 導航前往</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Website */}
          {event.website && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>官網</Text>
              <TouchableOpacity onPress={openWebsite}>
                <Text style={s.link} numberOfLines={1}>{event.website}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Phone */}
          {event.phone && (
            <View style={s.section}>
              <Text style={s.sectionLabel}>電話</Text>
              <TouchableOpacity onPress={callPhone}>
                <Text style={s.link}>{event.phone}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Delete */}
          <TouchableOpacity style={s.deleteBtn} onPress={onDelete}>
            <Text style={s.deleteText}>刪除此行程</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#0F172A', textAlign: 'center', marginHorizontal: 12 },
  closeLink: { fontSize: 16, color: '#64748B' },
  editLink: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
  body: { flex: 1, padding: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 },
  catBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  catText: { fontSize: 13, fontWeight: '600' },
  time: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  duration: { fontSize: 13, color: '#64748B' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  notes: { fontSize: 15, color: '#334155', lineHeight: 24 },
  address: { fontSize: 15, color: '#334155', marginBottom: 10 },
  mapBtns: { flexDirection: 'row', gap: 10 },
  mapBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  navBtn: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  mapBtnText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  link: { fontSize: 15, color: '#2563EB', textDecorationLine: 'underline' },
  deleteBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
  },
  deleteText: { fontSize: 15, fontWeight: '600', color: '#DC2626' },
})
