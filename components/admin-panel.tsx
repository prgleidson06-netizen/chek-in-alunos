'use client'

import { useEffect, useMemo, useState } from 'react'
import { Calendar, Edit2, Plus, Save, Trash2, Users, X } from 'lucide-react'
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

type StudentDraft = Partial<Student> & Record<string, any>
type ClassDraft = Partial<GymClass>

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

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [studentDraft, setStudentDraft] = useState<StudentDraft | null>(null)
  const [classDraft, setClassDraft] = useState<ClassDraft | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [studentsResponse, databaseClasses] = await Promise.all([
        fetch('/api/students', { cache: 'no-store' }),
        getClasses(),
      ])
      const studentsData = studentsResponse.ok ? await studentsResponse.json() : []
      const storedClasses = getStoredClasses()
      const classesData = databaseClasses.length > 0
        ? databaseClasses
        : storedClasses.length > 0
          ? storedClasses
          : defaultClasses

      setStudents(Array.isArray(studentsData) ? studentsData : [])
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
    if (!confirm(`Remover ${getStudentName(student)}?`)) return

    try {
      const nextStudents = students.filter((item) => item.id !== student.id)
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextStudents),
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
                      src={student.photo || '/images/fju-badge.jpg'}
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
      ) : (
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
                  <Input placeholder="Plano" value={studentDraft.membershipType || ''} onChange={(event) => updateStudentField('membershipType', event.target.value as Student['membershipType'])} />
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
