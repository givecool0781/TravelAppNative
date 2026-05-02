import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? ''

export default function ForgotPasswordScreen() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendCode() {
    if (!email.trim()) { setError('請輸入 Email'); return }
    setError('')
    setLoading(true)
    try {
      await fetch(`${BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setStep('reset')
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  async function handleReset() {
    if (!code.trim() || !newPassword.trim()) { setError('請填寫所有欄位'); return }
    if (newPassword.length < 8) { setError('密碼至少 8 個字元'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail ?? '重設失敗'); return }
      setStep('done')
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        <View style={s.logoArea}>
          <Text style={s.logoEmoji}>🔑</Text>
          <Text style={s.title}>重設密碼</Text>
        </View>

        <View style={s.card}>
          {step === 'email' && (
            <>
              <Text style={s.desc}>輸入帳號 Email，我們將寄送 6 位數驗證碼。</Text>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSendCode} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>寄送驗證碼</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 'reset' && (
            <>
              <Text style={s.desc}>驗證碼已寄到 <Text style={s.bold}>{email}</Text>，請查收。</Text>
              <Text style={s.label}>6 位數驗證碼</Text>
              <TextInput
                style={[s.input, s.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Text style={s.label}>新密碼</Text>
              <TextInput
                style={s.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="至少 8 個字元"
                placeholderTextColor="#94A3B8"
                secureTextEntry
              />
              {error ? <Text style={s.error}>{error}</Text> : null}
              <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>確認重設</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 'done' && (
            <View style={s.doneArea}>
              <Text style={s.doneIcon}>✅</Text>
              <Text style={s.doneText}>密碼重設成功！</Text>
              <TouchableOpacity style={s.btn} onPress={() => router.replace('/login')}>
                <Text style={s.btnText}>返回登入</Text>
              </TouchableOpacity>
            </View>
          )}

          {step !== 'done' && (
            <TouchableOpacity style={s.backLink} onPress={() => router.back()}>
              <Text style={s.backLinkText}>返回登入</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 28 },
  logoEmoji: { fontSize: 48, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  card: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  desc: { fontSize: 14, color: '#64748B', marginBottom: 16, lineHeight: 22 },
  bold: { fontWeight: '700', color: '#334155' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, color: '#0F172A',
  },
  codeInput: { textAlign: 'center', fontSize: 24, letterSpacing: 12, fontWeight: '700' },
  error: { marginTop: 10, fontSize: 13, color: '#DC2626', backgroundColor: '#FEF2F2', padding: 10, borderRadius: 10 },
  btn: { marginTop: 20, backgroundColor: '#2563EB', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { fontSize: 14, color: '#94A3B8' },
  doneArea: { alignItems: 'center', gap: 12 },
  doneIcon: { fontSize: 48 },
  doneText: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
})
