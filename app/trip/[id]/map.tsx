import React, { useState, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MapView, { Marker, Callout } from 'react-native-maps'
import { useTripContext } from '../../../src/context/TripContext'
import type { TripEvent } from '../../../src/types'

const CATEGORY_COLOR = {
  food: '#EA580C', attraction: '#16A34A', transport: '#2563EB',
  hotel: '#7C3AED', other: '#64748B',
}
const CATEGORY_ICON = {
  food: '🍽️', attraction: '📸', transport: '🚌', hotel: '🏨', other: '📌',
}


interface EventWithDay {
  event: TripEvent
  dayIndex: number
  dayDate: string
  index: number
}

export default function MapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { trips } = useTripContext()
  const mapRef = useRef<MapView>(null)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const trip = trips.find((t) => t.id === id)
  if (!trip) {
    return (
      <SafeAreaView style={s.center}>
        <Text>找不到此行程</Text>
      </SafeAreaView>
    )
  }

  const allEvents: EventWithDay[] = []
  let idx = 0
  trip.days.forEach((day, dayIndex) => {
    day.events
      .filter((e) => e.location && e.location.lat !== 0)
      .forEach((event) => {
        allEvents.push({ event, dayIndex, dayDate: day.date, index: idx++ })
      })
  })

  const hasLocations = allEvents.length > 0

  const initialRegion = hasLocations
    ? {
        latitude:
          allEvents.reduce((s, e) => s + e.event.location!.lat, 0) / allEvents.length,
        longitude:
          allEvents.reduce((s, e) => s + e.event.location!.lng, 0) / allEvents.length,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : { latitude: 35.6812, longitude: 139.7671, latitudeDelta: 0.1, longitudeDelta: 0.1 }

  async function openNavigation(event: TripEvent) {
    if (!event.location) return
    const { lat, lng } = event.location
    const googleUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    const canGoogle = await Linking.canOpenURL(googleUrl)
    Linking.openURL(canGoogle ? googleUrl : webUrl).catch(() => Linking.openURL(webUrl))
  }

  function focusMarker(item: EventWithDay) {
    setSelectedIdx(item.index)
    mapRef.current?.animateToRegion({
      latitude: item.event.location!.lat,
      longitude: item.event.location!.lng,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 400)
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.backText}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{trip.emoji} {trip.name}</Text>
        <Text style={s.markerCount}>{allEvents.length} 個地點</Text>
      </View>

      {/* Map */}
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={initialRegion}
          showsUserLocation
          showsCompass
        >
          {allEvents.map((item) => (
            <Marker
              key={item.event.id}
              coordinate={{
                latitude: item.event.location!.lat,
                longitude: item.event.location!.lng,
              }}
              onPress={() => focusMarker(item)}
            >
              <View style={[
                s.markerBubble,
                { borderColor: CATEGORY_COLOR[item.event.category] },
                selectedIdx === item.index && s.markerBubbleSelected,
              ]}>
                <Text style={s.markerNum}>{item.index + 1}</Text>
              </View>
              <Callout tooltip onPress={() => openNavigation(item.event)}>
                <View style={s.callout}>
                  <Text style={s.calloutTitle}>{item.event.title}</Text>
                  {item.event.location?.address ? (
                    <Text style={s.calloutAddr} numberOfLines={2}>{item.event.location.address}</Text>
                  ) : null}
                  <Text style={s.calloutNav}>點擊導航前往 →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>

        {!hasLocations && (
          <View style={s.noLocOverlay}>
            <Text style={s.noLocText}>尚無設定地點的行程</Text>
            <Text style={s.noLocSub}>在行程中新增地點後即可在地圖顯示</Text>
          </View>
        )}
      </View>

      {/* Bottom strip */}
      {hasLocations && (
        <View style={s.strip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.stripContent}>
            {allEvents.map((item) => (
              <TouchableOpacity
                key={item.event.id}
                style={[s.stripCard, selectedIdx === item.index && s.stripCardActive]}
                onPress={() => focusMarker(item)}
              >
                <View style={s.stripNum}>
                  <Text style={s.stripNumText}>{item.index + 1}</Text>
                </View>
                <View>
                  <Text style={s.stripIcon}>{CATEGORY_ICON[item.event.category]}</Text>
                  <Text style={s.stripTitle} numberOfLines={1}>{item.event.title}</Text>
                  <Text style={s.stripTime}>{item.event.time}</Text>
                </View>
                <TouchableOpacity style={s.navSmallBtn} onPress={() => openNavigation(item.event)}>
                  <Text style={s.navSmallText}>🧭</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backText: { fontSize: 17, color: '#2563EB' },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  markerCount: { fontSize: 13, color: '#64748B' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  markerBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerBubbleSelected: { width: 40, height: 40, borderRadius: 20, borderWidth: 3 },
  markerNum: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  calloutTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  calloutAddr: { fontSize: 12, color: '#64748B', marginBottom: 6 },
  calloutNav: { fontSize: 12, color: '#2563EB', fontWeight: '600' },
  noLocOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248,250,252,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noLocText: { fontSize: 16, fontWeight: '700', color: '#334155', marginBottom: 8 },
  noLocSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 40 },
  strip: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
  },
  stripContent: { paddingHorizontal: 12, gap: 10 },
  stripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 160,
  },
  stripCardActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  stripNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripNumText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  stripIcon: { fontSize: 16, marginBottom: 2 },
  stripTitle: { fontSize: 12, fontWeight: '600', color: '#0F172A', width: 80 },
  stripTime: { fontSize: 11, color: '#94A3B8' },
  navSmallBtn: { padding: 4 },
  navSmallText: { fontSize: 20 },
})
