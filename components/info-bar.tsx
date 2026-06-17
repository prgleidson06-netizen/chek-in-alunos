'use client'

import { Dumbbell, Users, MessageSquare } from 'lucide-react'
import { useApp } from '@/components/app-provider'
import { GymClass, getSettings, getTodayCheckIns, getCurrentClass, getNextClass } from '@/lib/database'
import { useEffect, useState } from 'react'

export function InfoBar() {
  const { t, language } = useApp()
  const [currentClass, setCurrentClass] = useState<GymClass | null>(null)
  const [checkInCount, setCheckInCount] = useState(0)
  const [settings, setSettings] = useState({ gymCapacity: 50, announcements: [] as string[] })

  useEffect(() => {
    const current = getCurrentClass()
    const next = getNextClass()
    setCurrentClass(current || next)
    setCheckInCount(getTodayCheckIns().length)
    setSettings(getSettings())
  }, [])

  const capacityPercent = Math.min((checkInCount / settings.gymCapacity) * 100, 100)

  const dayNames: Record<string, string[]> = {
    pt: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  }

  return (
    <section className="py-6 px-4 mt-auto">
      <div className="max-w-6xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6 relative overflow-hidden">
          {/* FJU Watermark */}
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none">
            <img src="/images/fju-badge.jpg" alt="" className="w-48" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative z-10">
            {/* Current Training */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Dumbbell className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">{t.currentClass}</span>
              </div>
              {currentClass ? (
                <>
                  <p className="font-bold text-foreground">
                    {currentClass.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dayNames[language][currentClass.dayOfWeek]} • {currentClass.startTime} - {currentClass.endTime}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {currentClass.instructor}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">{t.noClassScheduled}</p>
              )}
            </div>
            
            {/* Gym Capacity */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">{t.gymCapacity}</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-500" 
                    style={{ width: `${capacityPercent}%` }} 
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {checkInCount} / {settings.gymCapacity} ({Math.round(capacityPercent)}%)
                </p>
              </div>
            </div>
            
            {/* Announcements */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <MessageSquare className="h-4 w-4" />
                <span className="text-xs font-semibold tracking-wider uppercase">{t.announcements}</span>
              </div>
              {settings.announcements.length > 0 ? (
                <>
                  <p className="text-foreground">
                    {settings.announcements[0]}
                  </p>
                  {settings.announcements.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      +{settings.announcements.length - 1} more
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">{t.noAnnouncements}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
