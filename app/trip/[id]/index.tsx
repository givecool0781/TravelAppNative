import React, { useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useTripContext } from '../../../src/context/TripContext'
import EventForm from '../../../src/components/EventForm'
import EventDetailModal from '../../../src/components/EventDetailModal'
import ExcelImportModal from '../../../src/components/ExcelImportModal'
import ConfirmDialog from '../../../src/components/ConfirmDialog'
import type { TripEvent } from '../../../src/types'

const CATEGORY_CONFIG = {
  food:       { label: '餐廳', bg: '#FFF7ED', color: '#C2410C', icon: '🍽️' },
  attraction: { label: '景點', bg: '#F0FDF4', color: '#15803D', icon: '📸' },
  transport:  { label: '交通', bg: '#EFF6FF', color: '#1D4ED8', icon: '🚌' },
  hotel:      { label: '住宿', bg: '#FAF5FF', color: '#7E22CE', icon: '🏨' },
  other:      { label: '其他', bg: '#F8FAFC', color: '#475569', icon: '📌' },
}

function formatDateHeader(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${m} 月 ${d} 日（${weekdays[date.getDay()]}）`
}

export default function TripScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { trips, addEvent, updateEvent, deleteEvent } = useTripContext()

  const [activeDay, setActiveDay] = useState(0)
  const [viewingEvent, setViewingEvent] = useState<TripEvent | null>(null)
  const [editingEvent, setEditingEvent] = useState<TripEvent | undefined>()
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [showExcel, setShowExcel] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<{ dayId: string; event: TripEvent } | null>(null)

  const trip = trips.find((t) => t.id === id)
  if (!trip) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.notFound}>找不到此行程</Text>
      </SafeAreaView>
    )
  }

  const tripId = trip.id
  const day = trip.days[activeDay]
  const sortedEvents = [...day.events].sort((a, b) => a.time.localeCompare(b.time))

  function handleSaveEvent(event: TripEvent) {
    if (editingEvent) {
      updateEvent(tripId, day.id, event)
    } else {
      addEvent(tripId, day.id, event)
    }
    setEditingEvent(undefined)
    setShowAddEvent(false)
  }

  function handleImport(events: { dayId: string; event: TripEvent }[]) {
    events.forEach(({ dayId, event }) => addEvent(tripId, dayId, event))
  }

  function handleDeleteConfirmed() {
    if (deletingEvent) {
      deleteEvent(tripId, deletingEvent.dayId, deletingEvent.event.id)
      if (viewingEvent?.id === deletingEvent.event.id) setViewingEvent(null)
      setDeletingEvent(null)
    }
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <View style={s.titleRow}>
          <Text style={s.emoji}>{trip.emoji}</Text>
          <View>
            <Text style={s.tripName} numberOfLines={1}>{trip.name}</Text>
            <Text style={s.tripSub}>{trip.destination}・{trip.country}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => router.push(`/trip/${id}/map`)} style={s.mapBtn}>
          <Text style={s.mapBtnText}>🗺️ 地圖</Text>
        </TouchableOpacity>
      </View>

      {/* Day tabs */}
      <View style={s.tabsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
          {trip.days.map((d, idx) => (
            <TouchableOpacity
              key={d.id}
              style={[s.tab, activeDay === idx && s.tabActive]}
              onPress={() => setActiveDay(idx)}
            >
              <Text style={[s.tabText, activeDay === idx && s.tabTextActive]}>
                Day {idx + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Date + action bar */}
      <View style={s.dayBar}>
        <Text style={s.dayDate}>{formatDateHeader(day.date)}・{sortedEvents.length} 個行程</Text>
        <View style={s.dayActions}>
          <TouchableOpacity onPress={() => setShowExcel(true)}>
            <Text style={s.excelBtn}>📊 匯入</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.addEventBtn}
            onPress={() => { setEditingEvent(undefined); setShowAddEvent(true) }}
          >
            <Text style={s.addEventText}>+ 新增</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Timeline */}
      {sortedEvents.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>這天還沒有行程</Text>
          <Text style={s.emptyDesc}>點擊「+ 新增」開始安排</Text>
        </View>
      ) : (
        <FlatList
          data={sortedEvents}
          keyExtractor={(e) => e.id}
          contentContainerStyle={s.timeline}
          renderItem={({ item: event }) => {
            const cfg = CATEGORY_CONFIG[event.category]
            return (
              <TouchableOpacity style={s.eventCard} onPress={() => setViewingEvent(event)}>
                <View style={s.timeCol}>
                  <Text style={s.timeText}>{event.time}</Text>
                  <View style={s.dot} />
                </View>
                <View style={s.eventContent}>
                  <View style={[s.catTag, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 12 }}>{cfg.icon}</Text>
                    <Text style={[s.catTagText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
                  {event.location?.address ? (
                    <Text style={s.eventAddr} numberOfLines={1}>{event.location.address}</Text>
                  ) : null}
                  {event.notes ? (
                    <Text style={s.eventNotes} numberOfLines={2}>{event.notes}</Text>
                  ) : null}
                  <View style={s.eventFooter}>
                    {event.duration ? <Text style={s.eventDuration}>{event.duration}</Text> : null}
                    <View style={s.eventBtns}>
                      <TouchableOpacity
                        style={s.eventIconBtn}
                        onPress={() => { setEditingEvent(event); setShowAddEvent(true) }}
                      >
                        <Text style={s.eventIconText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.eventIconBtn}
                        onPress={() => setDeletingEvent({ dayId: day.id, event })}
                      >
                        <Text style={s.eventIconText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}

      <EventDetailModal
        event={viewingEvent}
        onClose={() => setViewingEvent(null)}
        onEdit={() => { setEditingEvent(viewingEvent!); setViewingEvent(null); setShowAddEvent(true) }}
        onDelete={() => {
          if (viewingEvent) { setDeletingEvent({ dayId: day.id, event: viewingEvent }); setViewingEvent(null) }
        }}
      />

      <EventForm
        visible={showAddEvent || !!editingEvent}
        existingEvent={editingEvent}
        onSave={handleSaveEvent}
        onClose={() => { setShowAddEvent(false); setEditingEvent(undefined) }}
      />

      <ExcelImportModal
        visible={showExcel}
        trip={trip}
        onImport={handleImport}
        onClose={() => setShowExcel(false)}
      />

      <ConfirmDialog
        visible={!!deletingEvent}
        title="刪除行程"
        message={`確定要刪除「${deletingEvent?.event.title}」嗎？`}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingEvent(null)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { fontSize: 16, color: '#94A3B8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 8,
  },
  backBtn: { paddingRight: 4 },
  backText: { fontSize: 17, color: '#2563EB' },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  emoji: { fontSize: 28 },
  tripName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  tripSub: { fontSize: 12, color: '#64748B' },
  mapBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  mapBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  tabsWrapper: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabs: { paddingHorizontal: 12, paddingVertical: 8, gap: 6 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabActive: { backgroundColor: '#2563EB' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#fff' },
  dayBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dayDate: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  dayActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  excelBtn: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  addEventBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  addEventText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  timeline: { padding: 16, gap: 10 },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  timeCol: { alignItems: 'center', width: 44 },
  timeText: { fontSize: 12, color: '#94A3B8', fontFamily: 'monospace', marginBottom: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#CBD5E1', borderWidth: 2, borderColor: '#fff' },
  eventContent: { flex: 1 },
  catTag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 6 },
  catTagText: { fontSize: 12, fontWeight: '600' },
  eventTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  eventAddr: { fontSize: 12, color: '#94A3B8', marginBottom: 2 },
  eventNotes: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  eventFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  eventDuration: { fontSize: 12, color: '#94A3B8' },
  eventBtns: { flexDirection: 'row', gap: 4 },
  eventIconBtn: { padding: 4 },
  eventIconText: { fontSize: 16 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94A3B8' },
})
