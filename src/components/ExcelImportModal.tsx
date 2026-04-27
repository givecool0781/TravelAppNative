import React, { useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native'
import * as DocumentPicker from 'expo-document-picker'
import type { Trip, TripEvent } from '../types'
import { parseExcelUri, distributeRowsToTrip, type ImportError } from '../utils/excelUtils'

const CATEGORY_LABEL: Record<string, string> = {
  food: '餐廳', attraction: '景點', transport: '交通', hotel: '住宿', other: '其他',
}
const CATEGORY_COLOR: Record<string, string> = {
  food: '#C2410C', attraction: '#15803D', transport: '#1D4ED8', hotel: '#7E22CE', other: '#475569',
}

interface DistributedEvent {
  dayId: string
  dayDate: string
  event: TripEvent
}

interface Props {
  visible: boolean
  trip: Trip
  onImport: (events: { dayId: string; event: TripEvent }[]) => void
  onClose: () => void
}

export default function ExcelImportModal({ visible, trip, onImport, onClose }: Props) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'preview' | 'done'>('idle')
  const [parseErrors, setParseErrors] = useState<ImportError[]>([])
  const [preview, setPreview] = useState<DistributedEvent[]>([])
  const [skipped, setSkipped] = useState<{ date: string }[]>([])
  const [fileName, setFileName] = useState('')

  async function handlePick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
             'application/vnd.ms-excel'],
      copyToCacheDirectory: true,
    })
    if (result.canceled || !result.assets?.[0]) return

    const asset = result.assets[0]
    setFileName(asset.name)
    setStatus('parsing')

    try {
      const { rows, errors } = await parseExcelUri(asset.uri, asset.size ?? 0)
      setParseErrors(errors)

      const distributed = distributeRowsToTrip(trip, rows)
      const dayDateMap = new Map(trip.days.map((d) => [d.id, d.date]))
      const enriched: DistributedEvent[] = distributed.map(({ dayId, event }) => ({
        dayId,
        dayDate: dayDateMap.get(dayId) ?? '',
        event,
      }))

      const distributedIds = new Set(distributed.map((r) => r.event.id))
      const skippedRows = rows.filter((r) => !distributedIds.has(r.event.id))

      setPreview(enriched)
      setSkipped(skippedRows)
      setStatus('preview')
    } catch {
      setParseErrors([{ row: 0, message: '解析失敗，請確認檔案格式正確' }])
      setStatus('idle')
    }
  }

  function handleConfirm() {
    onImport(preview.map(({ dayId, event }) => ({ dayId, event })))
    setStatus('done')
    setTimeout(() => {
      onClose()
      setStatus('idle')
      setPreview([])
      setSkipped([])
      setParseErrors([])
      setFileName('')
    }, 1000)
  }

  function reset() {
    setStatus('idle')
    setPreview([])
    setSkipped([])
    setParseErrors([])
    setFileName('')
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => { onClose(); reset() }}>
            <Text style={s.closeLink}>關閉</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>匯入 Excel 行程</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={s.body}>
          {/* Step 1 */}
          <View style={s.stepCard}>
            <View style={s.stepBadge}><Text style={s.stepNum}>1</Text></View>
            <View style={s.stepContent}>
              <Text style={s.stepTitle}>填好 Excel 檔案後上傳</Text>
              <Text style={s.stepDesc}>欄位：日期、時間、名稱、類別、地點、備註、時長、官網、電話</Text>
              <Text style={s.stepDesc}>類別可填：餐廳 / 景點 / 交通 / 住宿 / 其他</Text>
            </View>
          </View>

          {/* Step 2: Pick file */}
          <TouchableOpacity style={s.pickBtn} onPress={handlePick} disabled={status === 'parsing'}>
            {status === 'parsing' ? (
              <ActivityIndicator color="#2563EB" />
            ) : (
              <>
                <Text style={s.pickIcon}>📂</Text>
                <Text style={s.pickText}>{fileName || '選擇 .xlsx 檔案'}</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <View style={s.errorBox}>
              <Text style={s.errorBoxTitle}>⚠️ 以下列有問題（{parseErrors.length} 筆）</Text>
              {parseErrors.map((e, i) => (
                <Text key={i} style={s.errorItem}>第 {e.row} 列：{e.message}</Text>
              ))}
            </View>
          )}

          {/* Skipped */}
          {skipped.length > 0 && (
            <View style={s.skipBox}>
              <Text style={s.skipTitle}>{skipped.length} 筆日期不在旅行範圍內，已略過</Text>
              {(() => {
                const dates = [...new Set(skipped.map((r) => r.date))].sort()
                return (
                  <Text style={s.skipDesc}>
                    Excel：{dates[0]} ～ {dates[dates.length - 1]}{'\n'}
                    旅行：{trip.startDate} ～ {trip.endDate}
                  </Text>
                )
              })()}
            </View>
          )}

          {/* Preview */}
          {status === 'preview' && preview.length > 0 && (
            <View style={s.previewSection}>
              <Text style={s.previewTitle}>預覽：共 {preview.length} 筆可匯入</Text>
              {preview.map(({ dayDate, event }) => (
                <View key={event.id} style={s.previewRow}>
                  <Text style={s.previewTime}>{event.time}</Text>
                  <View style={[s.catDot, { backgroundColor: CATEGORY_COLOR[event.category] + '20' }]}>
                    <Text style={[s.catLabel, { color: CATEGORY_COLOR[event.category] }]}>
                      {CATEGORY_LABEL[event.category]}
                    </Text>
                  </View>
                  <Text style={s.previewName} numberOfLines={1}>{event.title}</Text>
                  <Text style={s.previewDate}>{dayDate}</Text>
                </View>
              ))}
            </View>
          )}

          {status === 'preview' && preview.length === 0 && !parseErrors.length && (
            <View style={s.emptyBox}>
              <Text style={s.emptyText}>沒有可匯入的行程</Text>
            </View>
          )}

          {status === 'done' && (
            <View style={s.doneBox}>
              <Text style={s.doneText}>✅ 匯入成功！</Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {status === 'preview' && preview.length > 0 && (
          <View style={s.footer}>
            <TouchableOpacity style={s.resetBtn} onPress={reset}>
              <Text style={s.resetText}>重新選擇</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.confirmBtn} onPress={handleConfirm}>
              <Text style={s.confirmText}>確認匯入 {preview.length} 筆</Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A' },
  closeLink: { fontSize: 16, color: '#64748B' },
  body: { flex: 1, padding: 20 },
  stepCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNum: { color: '#fff', fontSize: 14, fontWeight: '700' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A', marginBottom: 4 },
  stepDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 16,
    paddingVertical: 24,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  pickIcon: { fontSize: 24 },
  pickText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  errorBox: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 14, marginBottom: 12 },
  errorBoxTitle: { fontSize: 13, fontWeight: '600', color: '#9A3412', marginBottom: 6 },
  errorItem: { fontSize: 12, color: '#C2410C', marginBottom: 2 },
  skipBox: { backgroundColor: '#FEF9C3', borderRadius: 12, padding: 14, marginBottom: 12 },
  skipTitle: { fontSize: 13, fontWeight: '600', color: '#713F12', marginBottom: 4 },
  skipDesc: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  previewSection: { marginBottom: 16 },
  previewTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 10 },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewTime: { fontSize: 12, fontFamily: 'monospace', color: '#64748B', width: 40 },
  catDot: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  catLabel: { fontSize: 11, fontWeight: '600' },
  previewName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#0F172A' },
  previewDate: { fontSize: 11, color: '#94A3B8' },
  emptyBox: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
  doneBox: { alignItems: 'center', paddingVertical: 24 },
  doneText: { fontSize: 16, fontWeight: '600', color: '#16A34A' },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  resetText: { fontSize: 15, color: '#334155', fontWeight: '500' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#16A34A',
    alignItems: 'center',
  },
  confirmText: { fontSize: 15, color: '#fff', fontWeight: '700' },
})
