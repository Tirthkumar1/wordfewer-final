import React, { createContext, useContext } from 'react'

interface AuthContextValue {
  onSignOut: () => void
  onSignIn: () => void
}

const AuthContext = createContext<AuthContextValue>({ onSignOut: () => {}, onSignIn: () => {} })

export function AuthProvider({ onSignOut, onSignIn, children }: { onSignOut: () => void; onSignIn: () => void; children: React.ReactNode }) {
  return <AuthContext.Provider value={{ onSignOut, onSignIn }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
