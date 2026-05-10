import React, { createContext, useContext } from 'react'

interface AuthContextValue {
  onSignOut: () => void
}

const AuthContext = createContext<AuthContextValue>({ onSignOut: () => {} })

export function AuthProvider({ onSignOut, children }: { onSignOut: () => void; children: React.ReactNode }) {
  return <AuthContext.Provider value={{ onSignOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
