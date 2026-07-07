'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Student, CheckIn } from '@/lib/database'
import { Check, User, Plus, Minus } from 'lucide-react'
import { useApp } from '@/components/app-provider'

interface RecentArrivalsProps {
  students: Student[]
  checkIns: CheckIn[]
  onCheckIn: (student: Student) => void
  onViewAll: () => void
  onUpdateClasses?: (studentId: string, newCount: number) => void
}

export function RecentArrivals({ students, checkIns, onCheckIn, onViewAll, onUpdateClasses }: RecentArrivalsProps) {
  const { t } = useApp()
  const [filter, setFilter] = useState<'all'|'bjj'|'karate'>('all')

  // OTIMIZAÇÃO 1: Cria um Set de IDs com check-in hoje. Otimiza o tempo de busca de O(N) para O(1).
  const checkedInStudentIdsToday = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const ids = new Set<string>()
    
    if (Array.isArray(checkIns)) {
      for (let i = 0; i < checkIns.length; i++) {
        const c = checkIns[i]
        if (c.studentId && c.checkInTime && c.checkInTime.startsWith(today)) {
          ids.add(c.studentId)
        }
      }
    }
    return ids
  }, [checkIns])

  // OTIMIZAÇÃO 2: Memoriza os alunos filtrados para evitar reprocessamento na rolagem do tablet
  const displayedStudents = useMemo(() => {
    const filtered = students.filter(student => {
      if (filter === 'bjj') return student.programs?.bjj ?? true
      if (filter === 'karate') return student.programs?.karate ?? false
      return true
    })
    return filtered.slice(0, 50) // Mantém o limite seguro de 50 alunos na Home
  }, [students, filter])

  // Cache estático da imagem padrão para evitar requisições duplicadas
  const DEFAULT_BADGE = '/images/fju-badge.jpg'

  // Evita o conflito de cliques e "ghost clicks" que travam navegadores móveis
  const handleTouchStart = (e: React.TouchEvent, callback: () => void) => {
    if (e.cancelable) {
      e.preventDefault()
    }
    e.stopPropagation()
    callback()
  }

  const handleMouseClick = (e: React.MouseEvent, callback: () => void) => {
    e.stopPropagation()
    callback()
  }

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4 relative z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-white uppercase">{t.studentList}</h2>
        {students.length > 50 && (
          <Button variant="link" onClick={onViewAll} className="text-red-500 hover:text-red-400 p-0 h-auto font-semibold text-xs">
            {t.viewAll} ({students.length})
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
          className="font-bold tracking-wider text-xs"
        >
          {t.all}
        </Button>

        <Button
          size="sm"
          variant={filter === 'bjj' ? 'default' : 'outline'}
          onClick={() => setFilter('bjj')}
          className="font-bold tracking-wider text-xs"
        >
          JIU-JITSU
        </Button>

        <Button
          size="sm"
          variant={filter === 'karate' ? 'default' : 'outline'}
          onClick={() => setFilter('karate')}
          className="font-bold tracking-wider text-xs"
        >
          KARATE
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedStudents.map((student) => {
          const isCheckedIn = checkedInStudentIdsToday.has(student.id)
          const studentPhoto = student.photo || DEFAULT_BADGE

          const hasBjj = student.programs?.bjj ?? true
          const hasKarate = student.programs?.karate ?? false
          const programText = hasBjj && hasKarate ? 'Jiu-Jitsu + Karate' : hasKarate ? 'Karate' : 'Jiu-Jitsu'
          
          const bjjBelt = student.bjj?.beltRank || student.beltRank || 'white'
          const bjjStripes = student.bjj?.stripes ?? student.stripes ?? 0
          const karateBelt = student.karate?.beltRank || 'white'
          const karateKyu = student.karate?.kyu || 10

          const totalAulas = student.totalClasses ?? 0 

          return (
            <Card 
              key={student.id} 
              className={`bg-zinc-900 border-zinc-800 text-white overflow-hidden transition-all duration-200 ${
                isCheckedIn ? 'ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-950/20' : 'hover:border-zinc-700'
              }`}
            >
              {/* RENDERIZAÇÃO PRINCIPAL DO CONTEÚDO DO CARD */}
              <CardContent className="p-4 flex flex-col justify-between h-full space-y-4">
                
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={studentPhoto} 
                      alt={`${student.firstName} ${student.lastName}`} 
                      className="w-12 h-12 rounded-full object-cover border border-zinc-700 pointer-events-none"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        if (target.src !== DEFAULT_BADGE) {
                          target.src = DEFAULT_BADGE
                        }
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-zinc-100 truncate">{student.firstName} {student.lastName}</p>
                    <p className="text-[11px] text-red-400 font-bold uppercase mt-0.5 tracking-wide">
                      {programText}
                    </p>

                    {hasBjj && (
                      <p className="text-xs text-zinc-400 capitalize flex items-center gap-1 mt-0.5 truncate">
                        🥋 BJJ: {bjjBelt} • {bjjStripes}G
                      </p>
                    )}

                    {hasKarate && (
                      <p className="text-xs text-zinc-400 capitalize flex items-center gap-1 mt-0.5 truncate">
                        🥋 Karate: {karateBelt} • {karateKyu}º Kyu
                      </p>
                    )}
                  </div>
                </div>

                {/* BARRA INFERIOR DE COMPORTAMENTO REESTRUTURADA */}
                <div className="flex items-center gap-2 w-full pt-2 border-t border-zinc-800/60">
                  
                  {/* GERENCIADOR DE AULAS COM BOTÕES MAIS E MENOS (Substituindo o antigo "+ Aula") */}
                  <div className="flex-1 flex items-center justify-between bg-zinc-950/50 p-1 rounded-xl border border-zinc-800 h-10 relative z-20">
                    <button
                      type="button"
                      onClick={(e) => handleMouseClick(e, () => onUpdateClasses?.(student.id, Math.max(0, totalAulas - 1)))}
                      onTouchStart={(e) => handleTouchStart(e, () => onUpdateClasses?.(student.id, Math.max(0, totalAulas - 1)))}
                      disabled={totalAulas <= 0}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 transition-colors text-zinc-300 touch-none select-none"
                      title="Diminuir aula"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex flex-col items-center justify-center min-w-[32px] select-none">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight block leading-none mb-0.5">{t.classes}</span>
                      <span className="text-xs font-mono font-bold text-zinc-200 leading-none">{totalAulas}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleMouseClick(e, () => onUpdateClasses?.(student.id, totalAulas + 1))}
                      onTouchStart={(e) => handleTouchStart(e, () => onUpdateClasses?.(student.id, totalAulas + 1))}
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-300 touch-none select-none"
                      title="Aumentar aula"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* BOTÃO DE CHECK-IN: FOCO TOTAL APENAS NO REGISTRO DE PRESENÇA */}
                  <Button
                    size="sm"
                    variant={isCheckedIn ? 'default' : 'destructive'}
                    disabled={isCheckedIn}
                    onClick={(e) => handleMouseClick(e, () => onCheckIn(student))}
                    onTouchStart={(e) => handleTouchStart(e, () => !isCheckedIn && onCheckIn(student))}
                    className={`flex-1 rounded-xl font-bold text-xs h-10 px-2 transition-all duration-150 relative z-20 uppercase tracking-wider select-none ${
                      isCheckedIn 
                        ? 'bg-emerald-600 disabled:opacity-100 text-white cursor-default' 
                        : 'bg-red-600 hover:bg-red-700 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {isCheckedIn ? (
                      <span className="flex items-center justify-center gap-1"><Check className="w-3.5 h-3.5 stroke-[3]" /> {t.checked}</span>
                    ) : (
                      t.checkIn
                    )}
                  </Button>
                </div>

              </CardContent>
            </Card>
          )
        })}

        {displayedStudents.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 relative z-10">
            <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">{t.noStudentsRegistered}</p>
          </div>
        )}
      </div>
    </div>
  )
}
