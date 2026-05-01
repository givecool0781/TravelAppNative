import { useEffect } from 'react'
import { Stack, useRouter, useSegments } from 'expo-router'
import { AuthProvider, useAuth } from '../src/context/AuthContext'
import { TripProvider } from '../src/context/TripContext'

function AuthGate() {
  const { token, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === 'login'
    if (!token && !inAuth) router.replace('/login')
    if (token && inAuth) router.replace('/')
  }, [token, loading, segments])

  return null
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <TripProvider>
        <AuthGate />
        <Stack screenOptions={{ headerShown: false }} />
      </TripProvider>
    </AuthProvider>
  )
}
