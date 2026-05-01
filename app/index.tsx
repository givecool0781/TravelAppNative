import React, { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTripContext } from '../src/context/TripContext'
import { useAuth } from '../src/context/AuthContext'
import TripForm from '../src/components/TripForm'
import ConfirmDialog from '../src/components/ConfirmDialog'
import type { Trip } from '../src/types'

export default function HomeScreen() {
  const router = useRouter()
  const { trips, addTrip, updateTrip, deleteTrip, loaded } = useTripContext()
  const { email, signOut } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editingTrip, setEditingTrip] = useState<Trip | undefined>()
  const [deletingTripId, setDeletingTripId] = useState<string | undefined>()

  if (!loaded) {
    return (
      <SafeAreaView style={s.center}>
        <Text style={s.loadingText}>載入中...</Text>
      </SafeAreaView>
    )
  }

  function handleSave(trip: Trip) {
    if (editingTrip) {
      updateTrip(trip)
    } else {
      addTrip(trip)
    }
    setEditingTrip(undefined)
  }

  function formatDateRange(start: string, end: string) {
    const fmt = (d: string) => { const [, m, day] = d.split('-'); return `${m}/${day}` }
    return `${start.slice(0, 4)}  ${fmt(start)} ～ ${fmt(end)}`
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>我的旅行</Text>
          <Text style={s.headerEmail} numberOfLines={1}>{email}</Text>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => { setEditingTrip(undefined); setShowForm(true) }}
          >
            <Text style={s.addBtnText}>+ 新增</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={signOut}>
            <Text style={s.logoutText}>登出</Text>
          </TouchableOpacity>
        </View>
      </View>

      {trips.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>✈️</Text>
          <Text style={s.emptyTitle}>還沒有旅行</Text>
          <Text style={s.emptyDesc}>點擊「+ 新增」開始規劃你的旅程</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          contentContainerStyle={s.list}
          renderItem={({ item: trip }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/trip/${trip.id}`)}>
              <View style={s.cardLeft}>
                <Text style={s.cardEmoji}>{trip.emoji}</Text>
                <View style={s.cardInfo}>
                  <Text style={s.cardName} numberOfLines={1}>{trip.name}</Text>
                  <Text style={s.cardSub}>{trip.destination}・{trip.country}</Text>
                  <Text style={s.cardDate}>{formatDateRange(trip.startDate, trip.endDate)}</Text>
                  <Text style={s.cardMeta}>
                    {trip.days.length} 天・{trip.days.reduce((s, d) => s + d.events.length, 0)} 個行程
                  </Text>
                </View>
              </View>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.iconBtn} onPress={() => { setEditingTrip(trip); setShowForm(true) }}>
                  <Text style={s.iconBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => setDeletingTripId(trip.id)}>
                  <Text style={s.iconBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TripForm
        visible={showForm}
        existingTrip={editingTrip}
        onSave={handleSave}
        onClose={() => { setShowForm(false); setEditingTrip(undefined) }}
      />

      <ConfirmDialog
        visible={!!deletingTripId}
        title="刪除旅行"
        message="確定要刪除這個旅行嗎？所有行程資料將一併刪除。"
        onConfirm={() => { if (deletingTripId) deleteTrip(deletingTripId); setDeletingTripId(undefined) }}
        onCancel={() => setDeletingTripId(undefined)}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#94A3B8' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  headerEmail: { fontSize: 12, color: '#94A3B8', marginTop: 2, maxWidth: 160 },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0' },
  logoutText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardLeft: { flex: 1, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  cardSub: { fontSize: 13, color: '#64748B', marginBottom: 2 },
  cardDate: { fontSize: 13, color: '#2563EB', fontWeight: '500', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#94A3B8' },
  cardActions: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },
  iconBtnText: { fontSize: 18 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#334155', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
})
