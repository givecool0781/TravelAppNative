import React, { useRef, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'

const DURATIONS = [
  '15 分鐘', '30 分鐘', '45 分鐘',
  '1 小時', '1.5 小時', '2 小時', '2.5 小時', '3 小時',
  '4 小時', '5 小時', '6 小時', '半天', '一天',
]

const ITEM_HEIGHT = 48

interface Props {
  value: string
  onChange: (v: string) => void
}

export default function DurationPicker({ value, onChange }: Props) {
  const scrollRef = useRef<ScrollView>(null)

  useEffect(() => {
    const idx = DURATIONS.indexOf(value)
    if (idx >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false })
      }, 50)
    }
  }, [])

  return (
    <View style={s.container}>
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
        {DURATIONS.map((d, i) => {
          const selected = value === d
          return (
            <TouchableOpacity
              key={d}
              style={[s.item, selected && s.itemSelected]}
              onPress={() => {
                onChange(d)
                scrollRef.current?.scrollTo({ y: i * ITEM_HEIGHT, animated: true })
              }}
            >
              <Text style={[s.itemText, selected && s.itemTextActive]}>{d}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
      {/* Center frame indicator */}
      <View pointerEvents="none" style={s.frame}>
        <View style={s.frameLine} />
        <View style={{ height: ITEM_HEIGHT }} />
        <View style={s.frameLine} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * 3,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  scroll: { flex: 1 },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: '#EFF6FF',
  },
  itemText: { fontSize: 16, color: '#94A3B8' },
  itemTextActive: { fontSize: 17, color: '#2563EB', fontWeight: '700' },
  frame: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    justifyContent: 'space-between',
  },
  frameLine: { height: 1, backgroundColor: '#BFDBFE', marginHorizontal: 16 },
})
