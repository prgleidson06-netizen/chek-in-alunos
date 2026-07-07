'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Language } from '@/lib/i18n'
import { getTranslation } from '@/lib/i18n'
import { initializeDemoData } from '@/lib/database'

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: any
  isAdmin: boolean
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const savedLang = localStorage.getItem('fju_language') as Language | null
    if (savedLang && ['pt', 'en', 'es', 'fr'].includes(savedLang)) {
      setLanguageState(savedLang)
    }

    initializeDemoData()

    fetch('/api/admin-session', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setIsAdmin(Boolean(data?.isAdmin)))
      .catch(() => setIsAdmin(false))
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('fju_language', lang)
  }

  const login = async (password: string): Promise<boolean> => {
    const response = await fetch('/api/admin-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const success = response.ok
    if (success) setIsAdmin(true)
    return success
  }

  const logout = async () => {
    await fetch('/api/admin-session', { method: 'DELETE' }).catch(() => null)
    setIsAdmin(false)
  }

  const t: any = getTranslation(language)

  const value: AppContextType = {
    language,
    setLanguage,
    t,
    isAdmin,
    login,
    logout,
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
