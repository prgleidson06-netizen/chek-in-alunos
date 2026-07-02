'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import { Student } from '@/lib/database'
import { AttendanceCardMini } from '@/components/attendance-card'
import { Search, ArrowLeft, CheckCircle, IdCard, Printer, Pencil, Camera } from 'lucide-react'
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
}

export function StudentsList({ onBack, onCheckIn }: StudentsListProps) {
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

  const addManualClass = async (student: Student) => {
    const updatedStudent: Student = {
      ...student,
      totalClasses: (student.totalClasses || 0) + 1,
      bjj: student.bjj ? {
        ...student.bjj,
        classes: (student.bjj.classes || 0) + 1,
      } : {
        beltRank: student.beltRank || 'white',
        stripes: student.stripes || 0,
        classes: (student.totalClasses || 0) + 1,
      },
      updatedAt: new Date().toISOString(),
    }

    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedStudent),
    })

    loadStudents()
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
    const fullName = `${student.firstName} ${student.lastName}`

    const html = `
      <html>
        <head>
          <title>Ficha do Aluno - ${fullName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
            .header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #d90429; padding-bottom: 16px; margin-bottom: 24px; }
            .logo { font-size: 28px; font-weight: bold; color: #d90429; }
            h1 { margin: 0; font-size: 26px; }
            h2 { margin-top: 28px; color: #d90429; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
            .photo { width: 110px; height: 110px; object-fit: cover; border-radius: 8px; border: 1px solid #ccc; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; }
            .item { margin-bottom: 8px; font-size: 14px; }
            .label { font-weight: bold; }
            .signature { margin-top: 40px; border-top: 1px solid #111; width: 320px; padding-top: 8px; text-align: center; }
            .waiver { line-height: 1.5; font-size: 13px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">FJU ARTES MARCIAIS</div>
              <div>United States & Canada</div>
            </div>
            <img class="photo" src="${student.photo || '/images/fju-badge.jpg'}" />
          </div>

          <h1>Ficha Completa do Aluno</h1>

          <h2>Dados Pessoais</h2>
          <div class="grid">
            <div class="item"><span class="label">Nome:</span> ${fullName}</div>
            <div class="item"><span class="label">Data de nascimento:</span> ${student.dateOfBirth || ''}</div>
            <div class="item"><span class="label">Email:</span> ${student.email || ''}</div>
            <div class="item"><span class="label">Telefone:</span> ${student.phone || ''}</div>
            <div class="item"><span class="label">Endereço:</span> ${student.address || ''}</div>
            <div class="item"><span class="label">Cidade/Estado:</span> ${student.city || ''} - ${student.state || ''}</div>
            <div class="item"><span class="label">CEP:</span> ${student.zipCode || ''}</div>
            <div class="item"><span class="label">País:</span> ${student.country || ''}</div>
          </div>

          <h2>Programas</h2>
          <div class="grid">
            <div class="item"><span class="label">Jiu-Jitsu:</span> ${student.programs?.bjj ? 'Sim' : 'Não'}</div>
            <div class="item"><span class="label">Karate:</span> ${student.programs?.karate ? 'Sim' : 'Não'}</div>
            <div class="item"><span class="label">Faixa BJJ:</span> ${student.bjj?.beltRank || student.beltRank || ''}</div>
            <div class="item"><span class="label">Graus BJJ:</span> ${student.bjj?.stripes ?? student.stripes ?? 0}</div>
            <div class="item"><span class="label">Faixa Karate:</span> ${student.karate?.beltRank || ''}</div>
            <div class="item"><span class="label">Kyu Karate:</span> ${student.karate?.kyu || ''}</div>
          </div>

          <h2>Contato de Emergência</h2>
          <div class="grid">
            <div class="item"><span class="label">Nome:</span> ${student.emergencyName || ''}</div>
            <div class="item"><span class="label">Telefone:</span> ${student.emergencyPhone || ''}</div>
            <div class="item"><span class="label">Relação:</span> ${student.emergencyRelationship || ''}</div>
          </div>

          <h2>Informações Médicas</h2>
          <div class="grid">
            <div class="item"><span class="label">Alergias:</span> ${student.allergies || 'Nenhuma'}</div>
            <div class="item"><span class="label">Condições médicas:</span> ${student.medicalConditions || 'Nenhuma'}</div>
            <div class="item"><span class="label">Medicamentos:</span> ${student.medications || 'Nenhum'}</div>
          </div>

          <h2>Termo de Responsabilidade</h2>
          <p class="waiver">
            Declaro que as informações fornecidas nesta ficha são verdadeiras. Reconheço que a prática de artes marciais,
            incluindo Jiu-Jitsu e Karate, envolve riscos físicos.
          </p>

          <div class="signature">
            ${student.waiverSignature || fullName}<br />
            Assinatura do aluno/responsável
          </div>

          <script>window.onload = () => window.print()</script>
        </body>
      </html>
    `

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(html)
    win.document.close()
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

              <div className="flex gap-2 mt-4 flex-wrap">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setSelectedStudent(student)}>
                  <IdCard className="w-4 h-4 mr-1" />
                  {t.attendanceCard}
                </Button>

                <Button variant="outline" size="sm" className="flex-1" onClick={() => printStudentPdf(student)}>
                  <Printer className="w-4 h-4 mr-1" />
                  PDF
                </Button>

                <Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingStudent(student)}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Editar
                </Button>

                <Button variant="outline" size="sm" className="flex-1" onClick={() => addManualClass(student)}>
                  + Aula
                </Button>

                <Button size="sm" className="flex-1 bg-primary" onClick={() => handleCheckIn(student)}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  CHECK-IN
                </Button>
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
