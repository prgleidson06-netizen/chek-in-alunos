'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import { Student } from '@/lib/database'
import { AttendanceCardMini } from '@/components/attendance-card'
import { Search, ArrowLeft, IdCard, Printer, Pencil, Camera, Plus, Minus, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AttendanceCard } from '@/components/attendance-card'

interface StudentsListProps {
  onBack: () => void
  onCheckIn: (student: Student) => void
  onUpdateClasses?: (studentId: string, newCount: number) => Promise<void>
}

export function StudentsList({ onBack, onCheckIn, onUpdateClasses }: StudentsListProps) {
  const { t } = useApp()
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)

  const loadStudents = () => {
    fetch('/api/students')
      .then(res => res.json())
      .then(data => setStudents(Array.isArray(data) ? data : []))
  }

  useEffect(() => {
    loadStudents()
    const interval = setInterval(loadStudents, 15000)
    return () => clearInterval(interval)
  }, [])

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase().trim()
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    )
  })

  const handleCheckIn = async (student: Student) => {
    await onCheckIn(student)
    loadStudents()
  }

  const updateEditingField = (field: string, value: any) => {
    setEditingStudent(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const saveEditedStudent = async () => {
    if (!editingStudent) return

    const updatedStudent: Student = {
      ...editingStudent,
      updatedAt: new Date().toISOString(),
      programs: editingStudent.programs || {
        bjj: true,
        karate: false,
      },
      bjj: editingStudent.bjj || {
        beltRank: editingStudent.beltRank || 'white',
        stripes: editingStudent.stripes || 0,
        classes: editingStudent.totalClasses || 0,
      },
      karate: editingStudent.karate || {
        beltRank: 'white',
        kyu: 10,
        classes: 0,
      },
    }

    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStudent),
    })

    setEditingStudent(null)
    loadStudents()
  }

  const handlePhotoChange = (file: File | null) => {
    if (!file || !editingStudent) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = String(reader.result || '')
      setEditingStudent(prev => prev ? { ...prev, photo: result } : prev)
    }
    reader.readAsDataURL(file)
  }

  const printStudentPdf = (student: Student) => {
    window.open(`/student-print/${encodeURIComponent(student.id)}`, '_blank')
  }

  const beltColors: Record<string, string> = {
    white: 'bg-white text-gray-900',
    yellow: 'bg-yellow-400 text-gray-900',
    orange: 'bg-orange-500 text-white',
    green: 'bg-green-600 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    brown: 'bg-amber-700 text-white',
    black: 'bg-gray-900 text-white',
  }

  const programLabel = (student: Student) => {
    const bjj = student.programs?.bjj ?? true
    const karate = student.programs?.karate ?? false
    if (bjj && karate) return 'Jiu-Jitsu + Karate'
    if (karate) return 'Karate'
    return 'Jiu-Jitsu'
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.checkIn}
        </Button>
        <h1 className="text-2xl font-bold">{t.studentList}</h1>
      </div>

      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="overflow-hidden hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {student.photo ? (
                    <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{student.firstName} {student.lastName}</h3>

                  <p className="text-xs text-primary font-semibold mt-1">
                    {programLabel(student)}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    {(student.programs?.bjj ?? true) && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${beltColors[student.bjj?.beltRank || student.beltRank] || beltColors.white}`}>
                        BJJ: {student.bjj?.beltRank || student.beltRank} • {student.bjj?.stripes ?? student.stripes ?? 0} graus
                      </span>
                    )}

                    {student.programs?.karate && (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${beltColors[student.karate?.beltRank || 'white'] || beltColors.white}`}>
                        Karate: {student.karate?.beltRank || 'white'} • {student.karate?.kyu || 10}º Kyu
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground mt-1">{t[student.membershipType]}</p>
                </div>
              </div>

              <div className="mt-4">
                <AttendanceCardMini student={student} />
              </div>

              <div className="flex flex-col gap-2 mt-4 w-full">
                {/* LINHA 1: BOTOES DE CONTROLE DO ALUNO */}
                <div className="flex gap-2 w-full">
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setSelectedStudent(student)}>
                    <IdCard className="w-4 h-4 mr-1" />
                    Cartão de Frequência
                  </Button>

                  <Button variant="outline" size="sm" className="p-2" title="Imprimir ficha completa" onClick={() => printStudentPdf(student)}>
                    <Printer className="w-4 h-4" />
                  </Button>

                  <Button variant="outline" size="sm" className="p-2" onClick={() => setEditingStudent(student)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>

                {/* LINHA 2: GERENCIADOR DE SALDO DE AULAS NATIVO (CORREÇÃO DE EXECUÇÃO EM DISPOSITIVOS MOVEIS) */}
                <div className="flex gap-2 w-full">
                  <div className="flex-1 flex items-center justify-between bg-zinc-800 p-1 rounded-md border border-zinc-700 h-10 select-none">
                    <button
                      type="button"
                      onClick={() => {
                        const current = student.totalClasses || 0;
                        if (current > 0 && onUpdateClasses) {
                          onUpdateClasses(student.id, current - 1);
                        }
                      }}
                      disabled={(student.totalClasses || 0) <= 0}
                      className="w-8 h-8 rounded bg-zinc-700 hover:bg-zinc-600 disabled:opacity-20 flex items-center justify-center text-white font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <div className="flex flex-col items-center justify-center text-center px-1">
                      <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tight leading-none mb-0.5">Aulas</span>
                      <span className="text-xs font-mono font-bold text-white leading-none">{student.totalClasses || 0}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const current = student.totalClasses || 0;
                        if (onUpdateClasses) {
                          onUpdateClasses(student.id, current + 1);
                        }
                      }}
                      className="w-8 h-8 rounded bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center text-white font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCheckIn(student)}
                    className="flex-1 bg-red-600 text-white font-bold uppercase tracking-wider text-xs h-10 rounded-md shadow-md active:bg-red-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    CHECK-IN
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t.noStudentsFound}
        </div>
      )}

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.attendanceCard}</DialogTitle>
          </DialogHeader>
          {selectedStudent && <AttendanceCard student={selectedStudent} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Aluno</DialogTitle>
          </DialogHeader>

          {editingStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={editingStudent.photo || '/images/fju-badge.jpg'}
                  alt=""
                  className="w-24 h-24 rounded-lg object-cover bg-secondary"
                />

                <div>
                  <Label className="cursor-pointer">
                    <div className="inline-flex items-center px-3 py-2 border rounded-md text-sm">
                      <Camera className="w-4 h-4 mr-2" />
                      Trocar Foto
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handlePhotoChange(e.target.files?.[0] || null)}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use uma foto pequena para manter o sistema rápido.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nome</Label>
                  <Input value={editingStudent.firstName || ''} onChange={(e) => updateEditingField('firstName', e.target.value)} />
                </div>
                <div>
                  <Label>Sobrenome</Label>
                  <Input value={editingStudent.lastName || ''} onChange={(e) => updateEditingField('lastName', e.target.value)} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={editingStudent.email || ''} onChange={(e) => updateEditingField('email', e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={editingStudent.phone || ''} onChange={(e) => updateEditingField('phone', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data de nascimento</Label>
                  <Input type="date" value={editingStudent.dateOfBirth || ''} onChange={(e) => updateEditingField('dateOfBirth', e.target.value)} />
                </div>
                <div>
                  <Label>Data de matrícula</Label>
                  <Input type="date" value={editingStudent.startDate || ''} onChange={(e) => updateEditingField('startDate', e.target.value)} />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input value={editingStudent.address || ''} onChange={(e) => updateEditingField('address', e.target.value)} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={editingStudent.city || ''} onChange={(e) => updateEditingField('city', e.target.value)} />
                </div>
                <div>
                  <Label>Estado/Província</Label>
                  <Input value={editingStudent.state || ''} onChange={(e) => updateEditingField('state', e.target.value)} />
                </div>
                <div>
                  <Label>Postal Code</Label>
                  <Input value={editingStudent.zipCode || ''} onChange={(e) => updateEditingField('zipCode', e.target.value)} />
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h3 className="font-bold">Emergência</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome emergência</Label>
                    <Input value={editingStudent.emergencyName || ''} onChange={(e) => updateEditingField('emergencyName', e.target.value)} />
                  </div>
                  <div>
                    <Label>Telefone emergência</Label>
                    <Input value={editingStudent.emergencyPhone || ''} onChange={(e) => updateEditingField('emergencyPhone', e.target.value)} />
                  </div>
                  <div>
                    <Label>Relação</Label>
                    <Input value={editingStudent.emergencyRelationship || ''} onChange={(e) => updateEditingField('emergencyRelationship', e.target.value)} />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Input value={(editingStudent as any).status || 'active'} onChange={(e) => updateEditingField('status', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h3 className="font-bold">Informações Médicas</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Alergias</Label>
                    <Input value={editingStudent.allergies || ''} onChange={(e) => updateEditingField('allergies', e.target.value)} />
                  </div>
                  <div>
                    <Label>Condições médicas</Label>
                    <Input value={editingStudent.medicalConditions || ''} onChange={(e) => updateEditingField('medicalConditions', e.target.value)} />
                  </div>
                  <div>
                    <Label>Medicamentos</Label>
                    <Input value={editingStudent.medications || ''} onChange={(e) => updateEditingField('medications', e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-3 space-y-3">
                <h3 className="font-bold">Programas</h3>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingStudent.programs?.bjj ?? true}
                    onChange={(e) =>
                      setEditingStudent(prev => prev ? {
                        ...prev,
                        programs: {
                          bjj: e.target.checked,
                          karate: prev.programs?.karate ?? false,
                        }
                      } : prev)
                    }
                  />
                  Jiu-Jitsu
                </label>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editingStudent.programs?.karate ?? false}
                    onChange={(e) =>
                      setEditingStudent(prev => prev ? {
                        ...prev,
                        programs: {
                          bjj: prev.programs?.bjj ?? true,
                          karate: e.target.checked,
                        }
                      } : prev)
                    }
                  />
                  Karate
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Faixa Jiu-Jitsu</Label>
                  <Input
                    value={editingStudent.bjj?.beltRank || editingStudent.beltRank || 'white'}
                    onChange={(e) =>
                      setEditingStudent(prev => prev ? {
                        ...prev,
                        beltRank: e.target.value as any,
                        bjj: {
                          beltRank: e.target.value,
                          stripes: prev.bjj?.stripes ?? prev.stripes ?? 0,
                          classes: prev.bjj?.classes ?? prev.totalClasses ?? 0,
                        }
                      } : prev)
                    }
                  />
                </div>

                <div>
                  <Label>Graus Jiu-Jitsu</Label>
                  <Input
                    type="number"
                    value={editingStudent.bjj?.stripes ?? editingStudent.stripes ?? 0}
                    onChange={(e) =>
                      setEditingStudent(prev => prev ? {
                        ...prev,
                        stripes: Number(e.target.value) || 0,
                        bjj: {
                          beltRank: prev.bjj?.beltRank || prev.beltRank || 'white',
                          stripes: Number(e.target.value) || 0,
                          classes: prev.bjj?.classes ?? prev.totalClasses ?? 0,
                        }
                      } : prev)
                    }
                  />
                </div>

                <div>
                  <Label>Faixa Karate</Label>
                  <Input
                    value={editingStudent.karate?.beltRank || 'white'}
                    onChange={(e) =>
                      setEditingStudent(prev => prev ? {
                        ...prev,
                        karate: {
                          beltRank: e.target.value,
                          kyu: prev.karate?.kyu ?? 10,
                          classes: prev.karate?.classes ?? 0,
                        }
                      } : prev)
                    }
                  />
                </div>

                <div>
                  <Label>Kyu Karate</Label>
                  <Input
                    type="number"
                    value={editingStudent.karate?.kyu ?? 10}
                    onChange={(e) =>
                      setEditingStudent(prev => prev ? {
                        ...prev,
                        karate: {
                          beltRank: prev.karate?.beltRank || 'white',
                          kyu: Number(e.target.value) || 10,
                          classes: prev.karate?.classes ?? 0,
                        }
                      } : prev)
                    }
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setEditingStudent(null)}>
                  Cancelar
                </Button>
                <Button onClick={saveEditedStudent}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
