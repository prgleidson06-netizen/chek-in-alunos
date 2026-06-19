'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Student, CheckIn } from '@/lib/database'
import { Check, User } from 'lucide-react'

interface RecentArrivalsProps {
  students: Student[]
  checkIns: CheckIn[]
  onCheckIn: (student: Student) => void
  onViewAll: () => void
}

export function RecentArrivals({ students, checkIns, onCheckIn, onViewAll }: RecentArrivalsProps) {
  const today = new Date().toISOString().split('T')[0]

  // Mantém o limite de exibição para até 50 alunos na tela inicial
  const displayedStudents = students.slice(0, 50)

  return (
    <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4 relative z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight text-white uppercase">Selecione seu nome para o Check-in</h2>
        {students.length > 50 && (
          <Button variant="link" onClick={onViewAll} className="text-red-500 hover:text-red-400 p-0 h-auto font-semibold text-xs">
            Ver todos ({students.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {displayedStudents.map((student) => {
          const isCheckedIn = checkIns.some(
            (c) => c.studentId === student.id && c.checkInTime && c.checkInTime.startsWith(today)
          )

          // Define a foto: Usa a foto do aluno OU o brasão da FJU por padrão
          const studentPhoto = student.photo || '/images/fju-badge.jpg'

          return (
            <Card 
              key={student.id} 
              className={`bg-zinc-900 border-zinc-800 text-white overflow-hidden transition duration-200 ${
                isCheckedIn ? 'ring-2 ring-emerald-500 border-transparent shadow-lg shadow-emerald-950/20' : 'hover:border-zinc-700'
              }`}
            >
              <CardContent className="p-4 flex items-center gap-4">
                {/* 📸 FOTO DO ALUNO OU BADGE FJU (RESTAURADA) */}
                <div className="relative flex-shrink-0">
                  <img 
                    src={studentPhoto} 
                    alt={`${student.firstName} ${student.lastName}`} 
                    className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                    onError={(e) => {
                      // Se a foto der erro, carrega o badge da FJU
                      (e.target as HTMLImageElement).src = '/images/fju-badge.jpg'
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-zinc-100 truncate">{student.firstName} {student.lastName}</p>
                  <p className="text-xs text-zinc-400 capitalize flex items-center gap-1 mt-0.5">
                    🥋 {student.beltRank || 'Branca'}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={isCheckedIn ? 'default' : 'destructive'}
                  onClick={() => onCheckIn(student)}
                  className={`flex-shrink-0 rounded-xl font-bold text-xs h-9 px-3 transition duration-150 ${
                    isCheckedIn 
                      ? 'bg-emerald-600 hover:bg-emerald-600 text-white cursor-default' 
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                  }`}
                >
                  {isCheckedIn ? (
                    <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 stroke-[3]" /> Checked</span>
                  ) : (
                    'Check-in'
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}

        {displayedStudents.length === 0 && (
          <div className="col-span-full text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/30 relative z-10">
            <User className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-500 text-sm">Nenhum aluno cadastrado ou encontrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
