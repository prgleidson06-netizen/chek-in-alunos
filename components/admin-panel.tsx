'use client'

import { useEffect, useMemo, useState } from 'react'
import { Award, BarChart3, Calendar, ClipboardCopy, Edit2, Mail, MapPin, Phone, Plus, Save, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { GymClass, Student } from '@/lib/database'
import {
  deleteClass,
  generateId,
  getClasses,
  saveClass,
} from '@/lib/database'

function studentPhotoSrc(student: Student) {
  const version = encodeURIComponent(student.updatedAt || student.createdAt || student.id || 'photo')
  return student.id ? `/api/student-photo/${encodeURIComponent(student.id)}?v=${version}` : '/images/fju-badge.jpg'
}

type StudentDraft = Partial<Student> & Record<string, any>
type ClassDraft = Partial<GymClass>
type VolunteerTeacherProfile = {
  id: string
  fullName: string
  name?: string
  email?: string
  phone?: string
  birthDate?: string
  address?: string
  city?: string
  state?: string
  country?: string
  beltRank?: string
  yearsExperience?: number
  certifications?: string[]
  specialties?: string[]
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelationship?: string
  medicalConditions?: string
  medications?: string
  allergies?: string
  churchLocation?: string
  activityDescription?: string
  volunteerRole?: string
  termsAccepted?: boolean
  photoUrl?: string
  status?: string
  createdAt?: string
}
type AdminTab = 'students' | 'classes' | 'professors' | 'reports'
type WeeklyReportLocation = {
  rank: number
  country: string
  state: string
  city: string
  label: string
  bjj: number
  karate: number
  total: number
  uniqueStudents: number
}
type WeeklyReport = {
  startDate: string
  endDate: string
  periodLabel: string
  totals: {
    bjj: number
    karate: number
    general: number
    uniqueStudents: number
    checkIns: number
  }
  locations: WeeklyReportLocation[]
}

const emptyClassDraft = (): ClassDraft => ({
  id: generateId(),
  name: '',
  instructor: '',
  dayOfWeek: new Date().getDay(),
  startTime: '19:00',
  endTime: '20:00',
  maxCapacity: 50,
})

const getStudentName = (student: StudentDraft) => {
  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim()
  return fullName || student.name || 'Aluno sem nome'
}

const getStudentBelt = (student: StudentDraft) => {
  return student.beltRank || student.belt || 'white'
}

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const dayOptions = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda' },
  { value: 2, label: 'Terça' },
  { value: 3, label: 'Quarta' },
  { value: 4, label: 'Quinta' },
  { value: 5, label: 'Sexta' },
  { value: 6, label: 'Sábado' },
]

const defaultClasses: GymClass[] = [
  { id: 'mon-kids-bjj', name: 'Kids BJJ', instructor: 'Instrutor FJU', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', maxCapacity: 50 },
  { id: 'mon-adult-bjj', name: 'Adult BJJ', instructor: 'Instrutor FJU', dayOfWeek: 1, startTime: '19:00', endTime: '20:30', maxCapacity: 50 },
  { id: 'wed-kids-bjj', name: 'Kids BJJ', instructor: 'Instrutor FJU', dayOfWeek: 3, startTime: '18:00', endTime: '19:00', maxCapacity: 50 },
  { id: 'wed-adult-bjj', name: 'Adult BJJ', instructor: 'Instrutor FJU', dayOfWeek: 3, startTime: '19:00', endTime: '20:30', maxCapacity: 50 },
  { id: 'fri-open-mat', name: 'Open Mat', instructor: 'Instrutor FJU', dayOfWeek: 5, startTime: '19:00', endTime: '20:30', maxCapacity: 50 },
  { id: 'sat-karate', name: 'Karate', instructor: 'Instrutor FJU', dayOfWeek: 6, startTime: '10:00', endTime: '11:00', maxCapacity: 50 },
]

const getStoredClasses = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem('fju_admin_classes')
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed as GymClass[] : []
  } catch {
    return []
  }
}

const storeClasses = (classes: GymClass[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('fju_admin_classes', JSON.stringify(classes))
  }
}

const defaultReportDates = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 6)

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  }
}

const reportToSheet = (report: WeeklyReport) => {
  const rows = [
    ['Resumo semanal FJU', report.periodLabel],
    ['Total Jiu-Jitsu', String(report.totals.bjj)],
    ['Total Karate', String(report.totals.karate)],
    ['Total geral', String(report.totals.general)],
    ['Alunos unicos', String(report.totals.uniqueStudents)],
    [],
    ['#', 'Pais', 'Estado', 'Cidade', 'Jiu-Jitsu', 'Karate', 'Total', 'Alunos unicos'],
    ...report.locations.map((location) => [
      String(location.rank),
      location.country,
      location.state,
      location.city,
      String(location.bjj),
      String(location.karate),
      String(location.total),
      String(location.uniqueStudents),
    ]),
  ]

  return rows.map((row) => row.join('\t')).join('\n')
}

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [teachers, setTeachers] = useState<VolunteerTeacherProfile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [studentDraft, setStudentDraft] = useState<StudentDraft | null>(null)
  const [classDraft, setClassDraft] = useState<ClassDraft | null>(null)
  const initialReportDates = useMemo(defaultReportDates, [])
  const [reportStart, setReportStart] = useState(initialReportDates.start)
  const [reportEnd, setReportEnd] = useState(initialReportDates.end)
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsResult, teachersResult, classesResult] = await Promise.allSettled([
        fetch('/api/students', { cache: 'no-store' }),
        fetch('/api/teachers', { cache: 'no-store' }),
        getClasses(),
      ])
      const studentsResponse = studentsResult.status === 'fulfilled' ? studentsResult.value : null
      const teachersResponse = teachersResult.status === 'fulfilled' ? teachersResult.value : null
      const databaseClasses = classesResult.status === 'fulfilled' ? classesResult.value : []
      const studentsData = studentsResponse?.ok ? await studentsResponse.json() : []
      const teachersData = teachersResponse?.ok ? await teachersResponse.json() : { teachers: [] }
      const storedClasses = getStoredClasses()
      const classesData = databaseClasses.length > 0
        ? databaseClasses
        : storedClasses.length > 0
          ? storedClasses
          : defaultClasses

      setStudents(Array.isArray(studentsData) ? studentsData : [])
      setTeachers(Array.isArray(teachersData?.teachers) ? teachersData.teachers : [])
      setClasses(classesData)

      if (databaseClasses.length === 0 && storedClasses.length === 0) {
        storeClasses(defaultClasses)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do painel:', error)
      toast.error('Nao foi possivel carregar o painel administrativo.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadReport = async () => {
    try {
      setReportLoading(true)
      const response = await fetch(`/api/weekly-report?start=${reportStart}&end=${reportEnd}`, { cache: 'no-store' })

      if (!response.ok) throw new Error('weekly report API returned an error')

      const data = await response.json()
      setReport(data)
    } catch (error) {
      console.error('Erro ao carregar relatorio:', error)
      toast.error('Nao foi possivel carregar o relatorio semanal.')
    } finally {
      setReportLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'reports') loadReport()
  }, [activeTab])

  const handleCopyReport = async () => {
    if (!report) return

    try {
      await navigator.clipboard.writeText(reportToSheet(report))
      toast.success('Relatorio copiado em formato de planilha.')
    } catch {
      toast.error('Nao foi possivel copiar o relatorio.')
    }
  }

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return students

    return students.filter((student) => {
      const searchable = [
        getStudentName(student),
        student.email,
        student.phone,
        student.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(query)
    })
  }, [students, search])

  const professorSummaries = useMemo(() => {
    const summary = new Map<string, { name: string; classes: GymClass[]; totalCapacity: number }>()

    for (const gymClass of classes) {
      const name = (gymClass.instructor || 'Instrutor FJU').trim() || 'Instrutor FJU'
      const current = summary.get(name) || { name, classes: [], totalCapacity: 0 }
      current.classes.push(gymClass)
      current.totalCapacity += Number(gymClass.maxCapacity || 0)
      summary.set(name, current)
    }

    return Array.from(summary.values()).sort(
      (a, b) => b.classes.length - a.classes.length || a.name.localeCompare(b.name),
    )
  }, [classes])

  const handleSaveStudent = async () => {
    if (!studentDraft?.id) return

    const nextStudent = {
      ...studentDraft,
      programs: studentDraft.programs || {
        bjj: true,
        karate: false,
      },
      bjj: studentDraft.bjj || {
        beltRank: studentDraft.beltRank || 'white',
        stripes: studentDraft.stripes || 0,
        classes: studentDraft.totalClasses || 0,
      },
      karate: studentDraft.karate || {
        beltRank: 'white',
        kyu: 10,
        classes: 0,
      },
      attendanceHistory: studentDraft.attendanceHistory || [],
      updatedAt: new Date().toISOString(),
    }

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextStudent),
      })

      if (!response.ok) throw new Error('students API returned an error')
      toast.success('Aluno atualizado.')
      setStudentDraft(null)
      await loadData()
    } catch (error) {
      console.error('Erro ao salvar aluno:', error)
      toast.error('Nao foi possivel salvar o aluno.')
    }
  }

  const handleDeleteStudent = async (student: Student) => {
    if (!confirm(`Remover ${getStudentName(student)}? Esta acao nao pode ser desfeita.`)) return

    try {
      const response = await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: student.id }),
      })

      if (!response.ok) throw new Error('students API returned an error')
      toast.success('Aluno removido.')
      await loadData()
    } catch (error) {
      console.error('Erro ao remover aluno:', error)
      toast.error('Nao foi possivel remover o aluno.')
    }
  }

  const handleSaveClass = async () => {
    if (!classDraft?.name?.trim()) {
      toast.error('Informe o nome da aula.')
      return
    }

    const nextClass: GymClass = {
      id: classDraft.id || generateId(),
      name: classDraft.name.trim(),
      instructor: classDraft.instructor?.trim() || 'Instrutor FJU',
      dayOfWeek: Number(classDraft.dayOfWeek ?? new Date().getDay()),
      startTime: classDraft.startTime || '19:00',
      endTime: classDraft.endTime || '20:00',
      maxCapacity: Number(classDraft.maxCapacity || 50),
      description: classDraft.description,
    }

    try {
      const nextClasses = classes.some((item) => item.id === nextClass.id)
        ? classes.map((item) => item.id === nextClass.id ? nextClass : item)
        : [...classes, nextClass]

      try {
        await saveClass(nextClass)
      } catch (error) {
        console.warn('Aula salva localmente; Supabase nao respondeu.', error)
      }

      storeClasses(nextClasses)
      setClasses(nextClasses)
      toast.success('Aula salva.')
      setClassDraft(null)
    } catch (error) {
      console.error('Erro ao salvar aula:', error)
      toast.error('Nao foi possivel salvar a aula.')
    }
  }

  const handleDeleteClass = async (gymClass: GymClass) => {
    if (!confirm(`Remover a aula ${gymClass.name}?`)) return

    try {
      const nextClasses = classes.filter((item) => item.id !== gymClass.id)

      try {
        await deleteClass(gymClass.id)
      } catch (error) {
        console.warn('Aula removida localmente; Supabase nao respondeu.', error)
      }

      storeClasses(nextClasses)
      setClasses(nextClasses)
      toast.success('Aula removida.')
    } catch (error) {
      console.error('Erro ao remover aula:', error)
      toast.error('Nao foi possivel remover a aula.')
    }
  }

  const updateStudentField = (field: string, value: unknown) => {
    setStudentDraft((current) => current ? { ...current, [field]: value } : current)
  }

  const updateStudentProgram = (field: 'bjj' | 'karate', value: boolean) => {
    setStudentDraft((current) => current ? {
      ...current,
      programs: {
        bjj: current.programs?.bjj ?? true,
        karate: current.programs?.karate ?? false,
        [field]: value,
      },
    } : current)
  }

  const updateBjjField = (field: string, value: unknown) => {
    setStudentDraft((current) => current ? {
      ...current,
      bjj: {
        beltRank: current.bjj?.beltRank || current.beltRank || 'white',
        stripes: current.bjj?.stripes ?? current.stripes ?? 0,
        classes: current.bjj?.classes ?? current.totalClasses ?? 0,
        [field]: value,
      },
    } : current)
  }

  const updateKarateField = (field: string, value: unknown) => {
    setStudentDraft((current) => current ? {
      ...current,
      karate: {
        beltRank: current.karate?.beltRank || 'white',
        kyu: current.karate?.kyu ?? 10,
        classes: current.karate?.classes ?? 0,
        [field]: value,
      },
    } : current)
  }

  return (
    <div className="max-w-7xl mx-auto w-full p-4 md:p-8 space-y-6 text-white relative z-10">
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <img
            src="/images/fju-badge.jpg"
            alt="FJU"
            className="h-14 w-14 rounded-full object-cover border border-red-600/50"
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-sm text-red-400 uppercase tracking-widest">FJU BJJ Martial Arts</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
          onClick={loadData}
        >
          Atualizar dados
        </Button>
      </div>

      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-lg border border-zinc-800 w-fit">
        <button
          onClick={() => setActiveTab('students')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'students' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 mr-2 inline" />
          Alunos
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'classes' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4 mr-2 inline" />
          Aulas
        </button>
        <button
          onClick={() => setActiveTab('professors')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'professors' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4 mr-2 inline" />
          Professores
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'reports' ? 'bg-red-600 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4 mr-2 inline" />
          Relatorios
        </button>
      </div>

      {loading ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-10 text-center text-zinc-400">
          Carregando dados do painel...
        </div>
      ) : activeTab === 'students' ? (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Alunos para alteracao</h2>
              <p className="text-sm text-zinc-500">{filteredStudents.length} de {students.length} alunos visiveis</p>
            </div>
            <Input
              placeholder="Pesquisar aluno..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="bg-zinc-950 border-zinc-800 text-white md:max-w-xs"
            />
          </div>

          <div className="divide-y divide-zinc-800">
            {filteredStudents.length === 0 ? (
              <p className="p-8 text-center text-zinc-500">Nenhum aluno encontrado.</p>
            ) : (
              filteredStudents.map((student) => (
                <div key={student.id} className="grid gap-4 p-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="flex min-w-0 items-center gap-4">
                    <img
                      src={studentPhotoSrc(student)}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover border border-zinc-800"
                      onError={(event) => {
                        ;(event.currentTarget as HTMLImageElement).src = '/images/fju-badge.jpg'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-100 truncate">{getStudentName(student)}</p>
                      <p className="text-xs text-zinc-500 truncate">{student.email || 'Sem e-mail'} • {student.phone || 'Sem telefone'}</p>
                      <p className="text-xs text-red-400">Faixa: {getStudentBelt(student)} • Aulas: {student.totalClasses || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => setStudentDraft({ ...student })}>
                      <Edit2 className="w-4 h-4 mr-1" />
                      Alterar
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-900 text-red-300 hover:bg-red-950" onClick={() => handleDeleteStudent(student)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : activeTab === 'classes' ? (
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Aulas para alteracao</h2>
              <p className="text-sm text-zinc-500">{classes.length} aulas cadastradas</p>
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setClassDraft(emptyClassDraft())}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar aula
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            {classes.length === 0 ? (
              <p className="text-zinc-500 md:col-span-2 xl:col-span-3">Nenhuma aula cadastrada.</p>
            ) : (
              classes.map((gymClass) => (
                <div key={gymClass.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-zinc-100">{gymClass.name}</h3>
                      <p className="text-sm text-red-400">{dayNames[gymClass.dayOfWeek] || 'Dia'} • {gymClass.startTime} - {gymClass.endTime}</p>
                      <p className="text-xs text-zinc-500">Professor: {gymClass.instructor || 'Instrutor FJU'}</p>
                      <p className="text-xs text-zinc-500">Capacidade: {gymClass.maxCapacity || 50}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => setClassDraft({ ...gymClass })}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="border-red-900 text-red-300 hover:bg-red-950" onClick={() => handleDeleteClass(gymClass)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : activeTab === 'professors' ? (
        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-col gap-3 border-b border-zinc-800 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Professores</h2>
              <p className="text-sm text-zinc-500">
                {teachers.length > 0
                  ? `${teachers.length} perfis completos restaurados do cadastro antigo.`
                  : 'Perfis antigos de professores voluntarios, com aulas vinculadas quando o nome bate com a grade.'}
              </p>
            </div>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setClassDraft(emptyClassDraft())}>
              <Plus className="w-4 h-4 mr-2" />
              Nova aula
            </Button>
          </div>

          {teachers.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
              {teachers.map((teacher) => {
                const name = teacher.fullName || teacher.name || 'Professor FJU'
                const linkedClasses = classes.filter((gymClass) => (gymClass.instructor || '').trim().toLowerCase() === name.trim().toLowerCase())
                return (
                  <div key={teacher.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <img
                        src={teacher.photoUrl || '/images/fju-badge.jpg'}
                        alt=""
                        className="h-20 w-20 rounded-lg border border-zinc-800 object-cover"
                        onError={(event) => {
                          ;(event.currentTarget as HTMLImageElement).src = '/images/fju-badge.jpg'
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">{teacher.volunteerRole || 'Professor voluntario'}</p>
                        <h3 className="mt-1 text-xl font-black text-white">{name}</h3>
                        <div className="mt-3 grid gap-2 text-sm text-zinc-400 sm:grid-cols-2">
                          <span className="flex items-center gap-2"><Award className="h-4 w-4 text-red-400" />{teacher.beltRank || 'Graduacao nao informada'}</span>
                          <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-red-400" />{teacher.phone || 'Telefone nao informado'}</span>
                          <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-red-400" />{teacher.email || 'E-mail nao informado'}</span>
                          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-400" />{[teacher.city, teacher.state, teacher.country].filter(Boolean).join(', ') || 'Local nao informado'}</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-xs text-zinc-500 sm:grid-cols-2">
                          <span>Experiencia: {teacher.yearsExperience || 0} anos</span>
                          <span>Igreja: {teacher.churchLocation || 'Nao informado'}</span>
                          <span>Emergencia: {teacher.emergencyContactName || 'Nao informado'}</span>
                          <span>Status: {teacher.status || 'active'}</span>
                        </div>
                        {teacher.activityDescription ? (
                          <p className="mt-3 rounded-md border border-zinc-800 bg-black/20 p-3 text-sm text-zinc-300">{teacher.activityDescription}</p>
                        ) : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <a
                            href={`/professor-voluntario?id=${encodeURIComponent(teacher.id)}`}
                            className="inline-flex items-center justify-center rounded-md border border-red-500 bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                          >
                            Abrir perfil
                          </a>
                          <a
                            href={`/teacher-print/${encodeURIComponent(teacher.id)}`}
                            className="inline-flex items-center justify-center rounded-md border border-zinc-700 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-red-500 hover:text-white"
                          >
                            Ficha
                          </a>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5 divide-y divide-zinc-800 rounded-lg border border-zinc-800">
                      <div className="flex items-center justify-between p-3 text-sm">
                        <span className="font-semibold text-zinc-200">Aulas vinculadas</span>
                        <span className="text-zinc-500">{linkedClasses.length}</span>
                      </div>
                      {linkedClasses.length === 0 ? (
                        <p className="p-3 text-sm text-zinc-500">Nenhuma aula com este nome de professor na grade.</p>
                      ) : linkedClasses.map((gymClass) => (
                        <div key={gymClass.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-zinc-100">{gymClass.name}</p>
                            <p className="text-xs text-red-400">
                              {dayNames[gymClass.dayOfWeek] || 'Dia'} • {gymClass.startTime} - {gymClass.endTime}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => setClassDraft({ ...gymClass })}>
                            <Edit2 className="w-4 h-4 mr-1" />
                            Alterar aula
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 lg:grid-cols-2">
              {professorSummaries.length === 0 ? (
                <p className="text-zinc-500 lg:col-span-2">Nenhum professor vinculado a uma aula.</p>
              ) : (
                professorSummaries.map((professor) => (
                  <div key={professor.name} className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-400">Professor</p>
                        <h3 className="mt-1 text-xl font-black text-white">{professor.name}</h3>
                        <p className="mt-1 text-sm text-zinc-500">
                          {professor.classes.length} aulas cadastradas • capacidade semanal {professor.totalCapacity}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="border-zinc-700 text-zinc-200" onClick={() => setActiveTab('classes')}>
                        Editar aulas
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      ) : (
        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/40">
          <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-zinc-100">Relatorio semanal de assistencias</h2>
              <p className="text-sm text-zinc-500">
                Resumo por pais, estado e cidade, com Jiu-Jitsu e Karate separados.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Inicio
                <Input
                  type="date"
                  value={reportStart}
                  onChange={(event) => setReportStart(event.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </label>
              <label className="space-y-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Fim
                <Input
                  type="date"
                  value={reportEnd}
                  onChange={(event) => setReportEnd(event.target.value)}
                  className="bg-zinc-950 border-zinc-800 text-white"
                />
              </label>
              <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={loadReport} disabled={reportLoading}>
                <BarChart3 className="w-4 h-4 mr-2" />
                {reportLoading ? 'Gerando...' : 'Gerar'}
              </Button>
              <Button variant="outline" className="border-zinc-700 text-zinc-200" onClick={handleCopyReport} disabled={!report}>
                <ClipboardCopy className="w-4 h-4 mr-2" />
                Copiar Excel
              </Button>
            </div>
          </div>

          {!report ? (
            <div className="p-10 text-center text-zinc-500">
              Escolha o periodo e clique em Gerar para ver o resumo semanal.
            </div>
          ) : (
            <div className="space-y-5 p-5">
              <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-red-400">
                  Resumo da semana
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {report.totals.general} assistencias registradas
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Periodo: {report.periodLabel} • {report.totals.uniqueStudents} alunos unicos
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                {[
                  ['Jiu-Jitsu', report.totals.bjj],
                  ['Karate', report.totals.karate],
                  ['Total geral', report.totals.general],
                  ['Alunos unicos', report.totals.uniqueStudents],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
                    <p className="mt-2 text-3xl font-black text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-zinc-950 text-left text-xs uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-3 py-3">#</th>
                      <th className="px-3 py-3">Pais</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="px-3 py-3">Cidade</th>
                      <th className="px-3 py-3 text-right">Jiu-Jitsu</th>
                      <th className="px-3 py-3 text-right">Karate</th>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3 text-right">Alunos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {report.locations.length === 0 ? (
                      <tr>
                        <td className="px-3 py-8 text-center text-zinc-500" colSpan={8}>
                          Nenhuma assistencia encontrada neste periodo.
                        </td>
                      </tr>
                    ) : (
                      report.locations.map((location) => (
                        <tr key={location.label} className="hover:bg-zinc-950/70">
                          <td className="px-3 py-3 font-mono text-zinc-500">{location.rank}</td>
                          <td className="px-3 py-3">
                            <span className="rounded bg-red-600/15 px-2 py-1 font-bold text-red-300">
                              {location.country}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="rounded bg-zinc-800 px-2 py-1 font-semibold text-zinc-100">
                              {location.state}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-semibold text-white">{location.city}</span>
                          </td>
                          <td className="px-3 py-3 text-right font-mono">{location.bjj}</td>
                          <td className="px-3 py-3 text-right font-mono">{location.karate}</td>
                          <td className="px-3 py-3 text-right font-mono font-black text-white">{location.total}</td>
                          <td className="px-3 py-3 text-right font-mono">{location.uniqueStudents}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm leading-7 text-zinc-300">
                <p className="font-semibold text-white">
                  Este e o resumo de assistencia do projeto de Jiu-Jitsu por localidade referente a semana de {report.periodLabel}:
                </p>
                <ol className="mt-3 space-y-1">
                  {report.locations.map((location) => (
                    <li key={location.label}>
                      {location.rank}. {location.city}, {location.state}, {location.country} - {location.bjj} alunos
                    </li>
                  ))}
                </ol>
                <p className="mt-3 font-bold text-white">Total de assistencias no Jiu-Jitsu: {report.totals.bjj}</p>
                <p>Karatê: {report.totals.karate} assistencias</p>
                <p className="font-bold text-white">Total geral do projeto nesta semana: {report.totals.general} assistencias</p>
              </div>
            </div>
          )}
        </section>
      )}

      <Dialog open={Boolean(studentDraft)} onOpenChange={(open) => !open && setStudentDraft(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>Alterar aluno</DialogTitle>
            <DialogDescription>Todas as informacoes do aluno ficam editaveis para administradores.</DialogDescription>
          </DialogHeader>
          {studentDraft && (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Dados pessoais</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input placeholder="ID" value={studentDraft.id || ''} onChange={(event) => updateStudentField('id', event.target.value)} />
                  <Input placeholder="Nome" value={studentDraft.firstName || ''} onChange={(event) => updateStudentField('firstName', event.target.value)} />
                  <Input placeholder="Sobrenome" value={studentDraft.lastName || ''} onChange={(event) => updateStudentField('lastName', event.target.value)} />
                  <Input placeholder="Data de nascimento" type="date" value={studentDraft.dateOfBirth || ''} onChange={(event) => updateStudentField('dateOfBirth', event.target.value)} />
                  <Input placeholder="E-mail" value={studentDraft.email || ''} onChange={(event) => updateStudentField('email', event.target.value)} />
                  <Input placeholder="Telefone" value={studentDraft.phone || ''} onChange={(event) => updateStudentField('phone', event.target.value)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Endereco</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input className="md:col-span-3" placeholder="Endereco" value={studentDraft.address || ''} onChange={(event) => updateStudentField('address', event.target.value)} />
                  <Input placeholder="Cidade" value={studentDraft.city || ''} onChange={(event) => updateStudentField('city', event.target.value)} />
                  <Input placeholder="Estado/Provincia" value={studentDraft.state || ''} onChange={(event) => updateStudentField('state', event.target.value)} />
                  <Input placeholder="CEP" value={studentDraft.zipCode || ''} onChange={(event) => updateStudentField('zipCode', event.target.value)} />
                  <Input placeholder="Pais" value={studentDraft.country || ''} onChange={(event) => updateStudentField('country', event.target.value)} />
                  <Input placeholder="Data de inicio" type="date" value={studentDraft.startDate || ''} onChange={(event) => updateStudentField('startDate', event.target.value)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Contato de emergencia e responsavel</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Input placeholder="Contato de emergencia" value={studentDraft.emergencyName || ''} onChange={(event) => updateStudentField('emergencyName', event.target.value)} />
                  <Input placeholder="Telefone de emergencia" value={studentDraft.emergencyPhone || ''} onChange={(event) => updateStudentField('emergencyPhone', event.target.value)} />
                  <Input placeholder="Parentesco" value={studentDraft.emergencyRelationship || ''} onChange={(event) => updateStudentField('emergencyRelationship', event.target.value)} />
                  <Input placeholder="Nome do responsavel" value={studentDraft.guardianName || ''} onChange={(event) => updateStudentField('guardianName', event.target.value)} />
                  <Input placeholder="Parentesco do responsavel" value={studentDraft.guardianRelationship || ''} onChange={(event) => updateStudentField('guardianRelationship', event.target.value)} />
                  <Input placeholder="Telefone do responsavel" value={studentDraft.guardianPhone || ''} onChange={(event) => updateStudentField('guardianPhone', event.target.value)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Informacoes medicas</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Textarea placeholder="Alergias" value={studentDraft.allergies || ''} onChange={(event) => updateStudentField('allergies', event.target.value)} />
                  <Textarea placeholder="Condicoes medicas" value={studentDraft.medicalConditions || ''} onChange={(event) => updateStudentField('medicalConditions', event.target.value)} />
                  <Textarea placeholder="Medicamentos" value={studentDraft.medications || ''} onChange={(event) => updateStudentField('medications', event.target.value)} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Programas e graduacao</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={studentDraft.programs?.bjj ?? true}
                      onChange={(event) => updateStudentProgram('bjj', event.target.checked)}
                    />
                    Jiu-Jitsu ativo
                  </label>
                  <label className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={studentDraft.programs?.karate ?? false}
                      onChange={(event) => updateStudentProgram('karate', event.target.checked)}
                    />
                    Karate ativo
                  </label>
                  <Input placeholder="Escolha do programa" value={studentDraft.programChoice || ''} onChange={(event) => updateStudentField('programChoice', event.target.value)} />
                  <Input placeholder="Faixa principal" value={getStudentBelt(studentDraft)} onChange={(event) => updateStudentField('beltRank', event.target.value as Student['beltRank'])} />
                  <Input placeholder="Graus principais" type="number" value={studentDraft.stripes ?? 0} onChange={(event) => updateStudentField('stripes', Number(event.target.value))} />
                  <Input placeholder="Total de aulas" type="number" value={studentDraft.totalClasses ?? 0} onChange={(event) => updateStudentField('totalClasses', Number(event.target.value))} />
                  <Input placeholder="Faixa BJJ" value={studentDraft.bjj?.beltRank || studentDraft.beltRank || ''} onChange={(event) => updateBjjField('beltRank', event.target.value)} />
                  <Input placeholder="Graus BJJ" type="number" value={studentDraft.bjj?.stripes ?? studentDraft.stripes ?? 0} onChange={(event) => updateBjjField('stripes', Number(event.target.value))} />
                  <Input placeholder="Aulas BJJ" type="number" value={studentDraft.bjj?.classes ?? studentDraft.totalClasses ?? 0} onChange={(event) => updateBjjField('classes', Number(event.target.value))} />
                  <Input placeholder="Faixa Karate" value={studentDraft.karate?.beltRank || ''} onChange={(event) => updateKarateField('beltRank', event.target.value)} />
                  <Input placeholder="Kyu Karate" type="number" value={studentDraft.karate?.kyu ?? 10} onChange={(event) => updateKarateField('kyu', Number(event.target.value))} />
                  <Input placeholder="Aulas Karate" type="number" value={studentDraft.karate?.classes ?? 0} onChange={(event) => updateKarateField('classes', Number(event.target.value))} />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400">Foto e termo</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Textarea className="min-h-24" placeholder="Foto URL ou base64" value={studentDraft.photo || ''} onChange={(event) => updateStudentField('photo', event.target.value)} />
                  <Textarea className="min-h-24" placeholder="Assinatura URL ou base64" value={studentDraft.waiverSignature || ''} onChange={(event) => updateStudentField('waiverSignature', event.target.value)} />
                  <Input placeholder="Data da assinatura" value={studentDraft.waiverSignedAt || ''} onChange={(event) => updateStudentField('waiverSignedAt', event.target.value)} />
                  <label className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(studentDraft.waiverAgreed)}
                      onChange={(event) => updateStudentField('waiverAgreed', event.target.checked)}
                    />
                    Termo aceito
                  </label>
                  <Input placeholder="Criado em" value={studentDraft.createdAt || ''} onChange={(event) => updateStudentField('createdAt', event.target.value)} />
                  <Input placeholder="Atualizado em" value={studentDraft.updatedAt || ''} onChange={(event) => updateStudentField('updatedAt', event.target.value)} />
                </div>
              </section>

              <div className="sticky bottom-0 flex justify-end gap-2 border-t border-zinc-800 bg-background/95 py-4">
                <Button variant="outline" onClick={() => setStudentDraft(null)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSaveStudent}>
                  <Save className="w-4 h-4 mr-1" />
                  Salvar aluno
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(classDraft)} onOpenChange={(open) => !open && setClassDraft(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Alterar aula</DialogTitle>
            <DialogDescription>Atualize a grade de aulas da FJU BJJ Martial Arts.</DialogDescription>
          </DialogHeader>
          {classDraft && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input className="md:col-span-2" placeholder="Nome da aula" value={classDraft.name || ''} onChange={(event) => setClassDraft({ ...classDraft, name: event.target.value })} />
              <Input placeholder="Professor" value={classDraft.instructor || ''} onChange={(event) => setClassDraft({ ...classDraft, instructor: event.target.value })} />
              <div className="space-y-2 md:col-span-2">
                <p className="text-sm font-medium text-zinc-300">Dia da semana</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
                  {dayOptions.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => setClassDraft({ ...classDraft, dayOfWeek: day.value })}
                      className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                        Number(classDraft.dayOfWeek ?? new Date().getDay()) === day.value
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:text-white'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input placeholder="Inicio" value={classDraft.startTime || ''} onChange={(event) => setClassDraft({ ...classDraft, startTime: event.target.value })} />
              <Input placeholder="Fim" value={classDraft.endTime || ''} onChange={(event) => setClassDraft({ ...classDraft, endTime: event.target.value })} />
              <Input placeholder="Capacidade" type="number" value={classDraft.maxCapacity ?? 50} onChange={(event) => setClassDraft({ ...classDraft, maxCapacity: Number(event.target.value) })} />
              <Textarea className="md:col-span-2" placeholder="Descricao/observacoes" value={classDraft.description || ''} onChange={(event) => setClassDraft({ ...classDraft, description: event.target.value })} />
              <div className="flex justify-end gap-2 md:col-span-2">
                <Button variant="outline" onClick={() => setClassDraft(null)}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleSaveClass}>
                  <Save className="w-4 h-4 mr-1" />
                  Salvar aula
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
