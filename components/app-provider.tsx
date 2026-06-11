'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, getTranslation, translations } from '@/lib/i18n'
import { isAdminLoggedIn, adminLogin, adminLogout, initializeDemoData } from '@/lib/database'

interface AppContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.pt
  isAdmin: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt')
  const [isAdmin, setIsAdmin] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Load saved language preference
    const savedLang = localStorage.getItem('fju_language') as Language
    if (savedLang && ['pt', 'en', 'es', 'fr'].includes(savedLang)) {
      setLanguageState(savedLang)
    }
    
    // Check admin status
    setIsAdmin(isAdminLoggedIn())
    
    // Initialize demo data
    initializeDemoData()
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('fju_language', lang)
  }

  const login = (password: string): boolean => {
    const success = adminLogin(password)
    if (success) {
      setIsAdmin(true)
    }
    return success
  }

  const logout = () => {
    adminLogout()
    setIsAdmin(false)
  }

  const t = getTranslation(language)

  if (!mounted) {
    return null
  }

  return (
    <AppContext.Provider value={{ language, setLanguage, t, isAdmin, login, logout }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
