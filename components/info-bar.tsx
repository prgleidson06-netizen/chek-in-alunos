'use client'

import { Dumbbell, Users, MessageSquare, Pencil, Save, X } from 'lucide-react'
import { useApp } from '@/components/app-provider'
import { GymClass, getSettings, getTodayCheckIns, getCurrentClass, getNextClass } from '@/lib/database'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function InfoBar() {
  const { t, language } = useApp()
  const [currentClass, setCurrentClass] = useState<GymClass | null>(null)
  const [checkInCount, setCheckInCount] = useState(0)
  const [settings, setSettings] = useState({ gymCapacity: 50, announcements: [] as string[] })
  const [editing, setEditing] = useState(false)
  const [editClassName, setEditClassName] = useState('')
  const [editInstructor, setEditInstructor] = useState('')
  const [editDay, setEditDay] = useState('1')
  const [editStart, setEditStart] = useState('18:00')
  const [editEnd, setEditEnd] = useState('19:00')
  const [editCapacity, setEditCapacity] = useState('50')
  const [editAnnouncement, setEditAnnouncement] = useState('')

  useEffect(() => {
    const current = getCurrentClass()
    const next = getNextClass()
    const cls = current || next
    const st = getSettings()
    setCurrentClass(cls)
    setCheckInCount(getTodayCheckIns().length)
    setSettings(st)
    setEditClassName(cls?.name || '')
    setEditInstructor(cls?.instructor || '')
    setEditDay(String(cls?.dayOfWeek ?? 1))
    setEditStart(cls?.startTime || '18:00')
    setEditEnd(cls?.endTime || '19:00')
    setEditCapacity(String(st.gymCapacity || 50))
    setEditAnnouncement(st.announcements?.[0] || '')
  }, [])

  const saveEdits = () => {
    const newSettings = {
      gymCapacity: Number(editCapacity) || 50,
      announcements: editAnnouncement ? [editAnnouncement] : [],
    }

    const newClass = currentClass ? {
      ...currentClass,
      name: editClassName,
      instructor: editInstructor,
      dayOfWeek: Number(editDay),
      startTime: editStart,
      endTime: editEnd,
    } : null

    setSettings(newSettings)
    setCurrentClass(newClass)
    setEditing(false)
  }

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

          <div className="flex justify-end mb-4 relative z-10">
            {editing ? (
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdits}>
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-1" />
                Editar Informações
              </Button>
            )}
          </div>

          {editing && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
              <Input value={editClassName} onChange={(e) => setEditClassName(e.target.value)} placeholder="Nome da aula" />
              <Input value={editDay} onChange={(e) => setEditDay(e.target.value)} placeholder="Dia 0=Dom 1=Seg 2=Ter" />
              <Input value={editStart} onChange={(e) => setEditStart(e.target.value)} placeholder="Início 18:00" />
              <Input value={editEnd} onChange={(e) => setEditEnd(e.target.value)} placeholder="Fim 19:00" />
              <Input value={editInstructor} onChange={(e) => setEditInstructor(e.target.value)} placeholder="Instrutor" />
              <Input value={editCapacity} onChange={(e) => setEditCapacity(e.target.value)} placeholder="Capacidade" />
              <Input value={editAnnouncement} onChange={(e) => setEditAnnouncement(e.target.value)} placeholder="Aviso" />
            </div>
          )}

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
