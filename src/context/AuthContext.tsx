import React, { createContext, useContext, useState, useEffect } from 'react'
import { getToken, setToken, clearToken, getMe } from '../api'

interface AuthContextValue {
  token: string | null
  email: string | null
  loading: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getToken()
      .then(async (t) => {
        if (!t) return
        setTokenState(t)
        const me = await getMe()
        setEmail(me.email)
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false))
  }, [])

  async function signIn(newToken: string) {
    await setToken(newToken)
    setTokenState(newToken)
    const me = await getMe()
    setEmail(me.email)
  }

  function signOut() {
    clearToken()
    setTokenState(null)
    setEmail(null)
  }

  return (
    <AuthContext.Provider value={{ token, email, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('must be inside AuthProvider')
  return ctx
}
