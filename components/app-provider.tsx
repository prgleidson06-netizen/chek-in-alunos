'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Language } from '@/lib/i18n'
import { getTranslation } from '@/lib/i18n'
import { isAdminLoggedIn, adminLogin, adminLogout, initializeDemoData } from '@/lib/database'

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: any
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
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

    setIsAdmin(isAdminLoggedIn())
    initializeDemoData()
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('fju_language', lang)
  }

  const login = (password: string): boolean => {
    const success = adminLogin(password)
    if (success) setIsAdmin(true)
    return success
  }

  const logout = () => {
    adminLogout()
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
