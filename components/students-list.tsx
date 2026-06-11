'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import { Student } from '@/lib/database'
import { AttendanceCardMini } from '@/components/attendance-card'
import { Search, ArrowLeft, CheckCircle, IdCard, Printer } from 'lucide-react'
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

  useEffect(() => {
    const loadStudents = () => {
      fetch('/api/students')
        .then(res => res.json())
        .then(data => setStudents(data))
    }

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

    fetch('/api/students')
      .then(res => res.json())
      .then(data => setStudents(data))
  }

  const printStudentPdf = (student: Student) => {
    const fullName = `${student.firstName} ${student.lastName}`

    const html = `
      <html>
        <head>
          <title>Ficha do Aluno - ${fullName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 32px;
              color: #111;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              border-bottom: 3px solid #d90429;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .logo {
              font-size: 28px;
              font-weight: bold;
              color: #d90429;
            }
            h1 {
              margin: 0;
              font-size: 26px;
            }
            h2 {
              margin-top: 28px;
              color: #d90429;
              border-bottom: 1px solid #ddd;
              padding-bottom: 6px;
            }
            .photo {
              width: 110px;
              height: 110px;
              object-fit: cover;
              border-radius: 8px;
              border: 1px solid #ccc;
            }
            .grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px 24px;
            }
            .item {
              margin-bottom: 8px;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
            }
            .signature {
              margin-top: 40px;
              border-top: 1px solid #111;
              width: 320px;
              padding-top: 8px;
              text-align: center;
            }
            .waiver {
              line-height: 1.5;
              font-size: 13px;
            }
            @media print {
              button { display: none; }
            }
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

          <h2>Plano e Graduação</h2>
          <div class="grid">
            <div class="item"><span class="label">Plano:</span> ${student.membershipType || ''}</div>
            <div class="item"><span class="label">Faixa:</span> ${student.beltRank || ''}</div>
            <div class="item"><span class="label">Graus:</span> ${student.stripes ?? 0}</div>
            <div class="item"><span class="label">Início:</span> ${student.startDate || ''}</div>
            <div class="item"><span class="label">Total de aulas:</span> ${student.totalClasses ?? 0}</div>
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

          <h2>Responsável</h2>
          <div class="grid">
            <div class="item"><span class="label">Nome:</span> ${student.guardianName || ''}</div>
            <div class="item"><span class="label">Relação:</span> ${student.guardianRelationship || ''}</div>
            <div class="item"><span class="label">Telefone:</span> ${student.guardianPhone || ''}</div>
          </div>

          <h2>Termo de Responsabilidade</h2>
          <p class="waiver">
            Declaro que as informações fornecidas nesta ficha são verdadeiras. Reconheço que a prática de artes marciais,
            incluindo Jiu-Jitsu, envolve riscos físicos. Autorizo a participação do aluno nas atividades da FJU Artes Marciais
            e assumo responsabilidade pelas informações médicas e de emergência aqui declaradas.
          </p>

          <div class="grid">
            <div class="item"><span class="label">Termo aceito:</span> ${student.waiverAgreed ? 'Sim' : 'Não'}</div>
            <div class="item"><span class="label">Data da assinatura:</span> ${student.waiverSignedAt || ''}</div>
          </div>

          <div class="signature">
            ${student.waiverSignature || fullName}<br />
            Assinatura do aluno/responsável
          </div>

          <script>
            window.onload = () => window.print()
          </script>
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
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    brown: 'bg-amber-700 text-white',
    black: 'bg-gray-900 text-white',
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
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${beltColors[student.beltRank]}`}>
                      {t[student.beltRank]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {student.stripes} {t.stripes}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t[student.membershipType]}</p>
                </div>
              </div>

              <div className="mt-4">
                <AttendanceCardMini student={student} />
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedStudent(student)}
                >
                  <IdCard className="w-4 h-4 mr-1" />
                  {t.attendanceCard}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => printStudentPdf(student)}
                >
                  <Printer className="w-4 h-4 mr-1" />
                  PDF
                </Button>

                <Button
                  size="sm"
                  className="flex-1 bg-primary"
                  onClick={() => handleCheckIn(student)}
                >
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
    </div>
  )
}
