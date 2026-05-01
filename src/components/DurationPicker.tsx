import React, { useRef, useEffect } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native'

const DURATIONS = [
  '15 分鐘', '30 分鐘', '45 分鐘',
  '1 小時', '1.5 小時', '2 小時', '2.5 小時', '3 小時',
  '4 小時', '5 小時', '6 小時',
  '半天', '一天',
]

const ITEM_HEIGHT = 44

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function DurationPicker({ value, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null)
  const currentIdx = DURATIONS.indexOf(value)

  useEffect(() => {
    const idx = currentIdx >= 0 ? currentIdx : 0
    scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false })
  }, [])

  return (
    <View style={s.container}>
      {/* Highlight bar */}
      <View pointerEvents="none" style={s.highlight} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)
          const clamped = Math.max(0, Math.min(idx, DURATIONS.length - 1))
          onChange(DURATIONS[clamped])
        }}
        contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
        style={s.scroll}
      >
        {DURATIONS.map((d, i) => (
          <TouchableOpacity
            key={d}
            style={s.item}
            onPress={() => {
              onChange(d)
              scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true })
            }}
          >
            <Text style={[s.itemText, value === d && s.itemTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 3,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    backgroundColor: '#EFF6FF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#BFDBFE',
    zIndex: 1,
  },
  scroll: { flex: 1 },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: { fontSize: 16, color: '#64748B' },
  itemTextActive: { color: '#2563EB', fontWeight: '700', fontSize: 17 },
})
