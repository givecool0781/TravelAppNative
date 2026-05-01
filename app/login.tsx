import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { register, login } from '../src/api'
import { useAuth } from '../src/context/AuthContext'

export default function LoginScreen() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) { setError('請填寫 Email 和密碼'); return }
    if (mode === 'register' && password.length < 8) { setError('密碼至少 8 個字元'); return }
    setError('')
    setLoading(true)
    try {
      const token = mode === 'login'
        ? await login(email, password)
        : await register(email, password)
      await signIn(token)
      router.replace('/')
    } catch (err: any) {
      setError(err.message ?? '發生錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={s.logoArea}>
          <Text style={s.logoEmoji}>✈️</Text>
          <Text style={s.logoTitle}>旅行規劃</Text>
          <Text style={s.logoSub}>規劃你的每一段旅程</Text>
        </View>

        {/* Card */}
        <View style={s.card}>
          {/* Tab */}
          <View style={s.tabRow}>
            {(['login', 'register'] as const).map((m) => (
              <TouchableOpacity
                key={m}
                style={[s.tab, mode === m && s.tabActive]}
                onPress={() => { setMode(m); setError('') }}
              >
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                  {m === 'login' ? '登入' : '註冊'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {/* Password */}
          <Text style={s.label}>密碼{mode === 'register' ? '（至少 8 個字元）' : ''}</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {/* Error */}
          {error ? <Text style={s.error}>{error}</Text> : null}

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.submitText}>{mode === 'login' ? '登入' : '建立帳號'}</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoArea: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 56, marginBottom: 12 },
  logoTitle: { fontSize: 26, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  logoSub: { fontSize: 14, color: '#64748B' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#0F172A' },
  label: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#0F172A',
  },
  error: {
    marginTop: 12,
    fontSize: 13,
    color: '#DC2626',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  submitBtn: {
    marginTop: 24,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
