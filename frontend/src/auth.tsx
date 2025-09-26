import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, setAuthToken, logoutServer } from './api'
import type { User } from './types'

interface AuthState {
  user: User | null
  token: string | null
  setToken: (token: string | null) => void
  refreshMe: () => Promise<void>
  logout: () => void
}

const AuthCtx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem('auth_token'))
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    setAuthToken(token)
    if (token) localStorage.setItem('auth_token', token)
    else localStorage.removeItem('auth_token')
  }, [token])

  useEffect(() => {
    if (token) refreshMe()
    else setUser(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function refreshMe() {
    try {
      const me = await getMe()
      setUser(me)
    } catch {
      setUser(null)
      setTokenState(null)
    }
  }

  function setToken(t: string | null) {
    setTokenState(t)
  }

  async function logout() {
    try {
      if (token) {
        // Attempt server-side logout (stateless; optional)
        await logoutServer()
      }
    } catch (err) {
      // Non-fatal; proceed with local logout
      console.warn('Logout request failed (continuing):', err)
    } finally {
      setTokenState(null)
      setUser(null)
    }
  }

  const value = useMemo(() => ({ user, token, setToken, refreshMe, logout }), [user, token])
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
