'use client'

import { useState } from 'react'
import { Search, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useApp } from '@/components/app-provider'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const { language, setLanguage, t, isAdmin, login, logout } = useApp()
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState(false)

  const handleLogin = () => {
    if (login(password)) {
      setShowLoginDialog(false)
      setPassword('')
      setLoginError(false)
    } else {
      setLoginError(true)
    }
  }

  const handleLogout = () => {
    logout()
  }

  const languages = [
    { code: 'pt', label: 'PT', flag: '🇧🇷' },
    { code: 'en', label: 'EN', flag: '🇺🇸' },
    { code: 'es', label: 'ES', flag: '🇪🇸' },
    { code: 'fr', label: 'FR', flag: '🇫🇷' },
  ]

  const tabs = [
    { id: 'CHECK-IN', label: t.checkIn },
    { id: 'ALUNOS', label: t.students },
    { id: 'MATRÍCULA', label: t.enrollment },
  ]

  // Add admin tab if logged in
  if (isAdmin) {
    tabs.push({ id: 'ADMIN', label: t.adminPanel })
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onTabChange('CHECK-IN')}
          >
            <img 
              src="/images/fju-logo.png" 
              alt="FJU" 
              className="h-12 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground">
                FJU ARTES MARCIAIS
              </h1>
              <p className="text-xs text-primary tracking-widest">
                UNITED STATES & CANADA
              </p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-4">
            {/* Language selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span>{languages.find(l => l.code === language)?.flag}</span>
                  <span>{language.toUpperCase()}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => setLanguage(lang.code as 'pt' | 'en' | 'es' | 'fr')}
                    className={language === lang.code ? 'bg-accent' : ''}
                  >
                    <span className="mr-2">{lang.flag}</span>
                    {lang.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin login/logout button */}
            {isAdmin ? (
              <Button
                variant="outline"
                className="gap-2 border-primary text-primary"
                onClick={handleLogout}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">ADMIN</span>
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                className="bg-[#4285f4] hover:bg-[#3b78dc] text-white gap-2"
                onClick={() => setShowLoginDialog(true)}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="hidden sm:inline">ADMIN LOGIN</span>
              </Button>
            )}

            {/* Navigation tabs */}
            <nav className="flex items-center gap-1 ml-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label.toUpperCase()}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Admin Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t.adminLogin}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center">
              <img 
                src="/images/fju-badge.jpg" 
                alt="FJU" 
                className="w-24 h-24 rounded-full object-cover"
              />
            </div>
            <div>
              <Label>{t.password}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setLoginError(false)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className={loginError ? 'border-red-500' : ''}
              />
              {loginError && (
                <p className="text-red-500 text-sm mt-1">{t.invalidPassword}</p>
              )}
            </div>
            <Button onClick={handleLogin} className="w-full bg-primary">
              {t.login}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
