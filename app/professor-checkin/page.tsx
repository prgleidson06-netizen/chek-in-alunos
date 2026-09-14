'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, Search, Users } from 'lucide-react'

type Student = Record<string, any>
type Teacher = Record<string, any>

function studentPhotoSrc(student: Student) {
  const version = encodeURIComponent(student.updatedAt || student.createdAt || student.id || 'photo')
  return student.id ? `/api/student-photo/${encodeURIComponent(student.id)}?v=${version}` : '/images/fju-badge.jpg'
}

function studentName(student: Student) {
  return `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Aluno FJU'
}
function teacherName(teacher?: Teacher | null) {
  return teacher?.fullName || teacher?.name || 'Professor FJU'
}

function normLocation(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function sameLocation(teacher: Teacher | null, student: Student) {
  if (!teacher) return true
  const teacherCity = normLocation(teacher.city)
  const teacherState = normLocation(teacher.state)
  const teacherCountry = normLocation(teacher.country)
  const studentCity = normLocation(student.city)
  const studentState = normLocation(student.state)
  const studentCountry = normLocation(student.country)
  if (teacherCity && teacherState) return teacherCity === studentCity && teacherState === studentState && (!teacherCountry || !studentCountry || teacherCountry === studentCountry)
  if (teacherState) return teacherState === studentState && (!teacherCountry || !studentCountry || teacherCountry === studentCountry)
  return true
}


export default function ProfessorCheckinPage() {
  const [teacherId, setTeacherId] = useState('')
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [query, setQuery] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('teacherId') || ''
    setTeacherId(id)
    async function load() {
      setLoading(true)
      try {
        const [studentsRes, teachersRes] = await Promise.all([
          fetch('/api/students', { cache: 'no-store' }),
          fetch('/api/teachers', { cache: 'no-store' }),
        ])
        const studentsData = await studentsRes.json()
        const teachersData = await teachersRes.json()
        setStudents(Array.isArray(studentsData) ? studentsData : [])
        const teachers = Array.isArray(teachersData?.teachers) ? teachersData.teachers : []
        setTeacher(teachers.find((item: Teacher) => item.id === id) || null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase()
    const byTeacher = students.filter((student) => sameLocation(teacher, student))
    if (!text) return byTeacher.slice(0, 80)
    return byTeacher.filter((student) => [studentName(student), student.email, student.phone, student.id].filter(Boolean).join(' ').toLowerCase().includes(text)).slice(0, 80)
  }, [students, teacher, query])

  async function checkIn(student: Student) {
    setMessage('')
    const now = new Date().toISOString()
    const payload = {
      id: `${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: studentName(student),
      studentPhoto: studentPhotoSrc(student),
      beltRank: student.beltRank || 'white',
      stripes: student.stripes || 0,
      membershipType: student.membershipType || 'monthly',
      classId: teacherId || 'professor-checkin',
      className: teacher ? `Check-in com ${teacherName(teacher)}` : 'Check-in do professor',
      checkInTime: now,
      teacherId,
      teacherName: teacherName(teacher),
      program: student.programs?.karate && !student.programs?.bjj ? 'karate' : 'bjj',
    }
    const response = await fetch('/api/checkins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) {
      setMessage('Nao foi possivel registrar. Entre como admin e tente de novo.')
      return
    }
    setMessage(`${studentName(student)} registrado com sucesso.`)
  }

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 border-b border-zinc-800 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">FJU Professor</p>
            <h1 className="mt-2 text-3xl font-black">Check-in dos alunos</h1>
            <p className="mt-2 text-zinc-400">{teacher ? teacherName(teacher) : 'Professor FJU'} {teacherId ? `• ${teacherId}` : ''}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/professor-aulas${teacherId ? `?teacherId=${encodeURIComponent(teacherId)}` : ''}`} className="rounded-md border border-red-500 px-4 py-2 font-semibold text-red-100">Plataforma de aulas</a>
            <a href={`/professor-voluntario${teacherId ? `?id=${encodeURIComponent(teacherId)}` : ''}`} className="rounded-md border border-zinc-700 px-4 py-2 font-semibold">Perfil</a>
          </div>
        </div>

        {message ? <div className="mb-4 rounded-md border border-red-900 bg-red-950/30 p-3 text-sm">{message}</div> : null}

        <div className="mb-5 flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-3">
          <Search className="h-5 w-5 text-zinc-500" />
          <input className="w-full bg-transparent p-2 outline-none" placeholder="Buscar aluno por nome, telefone, email ou ID" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between border-b border-zinc-800 p-5">
            <h2 className="flex items-center gap-2 text-xl font-black"><Users className="h-5 w-5 text-red-400" />Alunos</h2>
            <span className="text-sm text-zinc-500">{loading ? 'Carregando...' : `${filtered.length} exibidos`}</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {filtered.length === 0 ? <p className="p-5 text-zinc-500">Nenhum aluno encontrado.</p> : filtered.map((student) => (
              <div key={student.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <img src={studentPhotoSrc(student)} alt="" className="h-14 w-14 rounded-md border border-zinc-800 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/fju-badge.jpg' }} />
                  <div><p className="font-semibold">{studentName(student)}</p><p className="text-sm text-zinc-500">{student.beltRank || 'white'} • {student.phone || student.email || student.id}</p></div>
                </div>
                <button onClick={() => checkIn(student)} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 font-semibold hover:bg-red-700"><CheckCircle className="h-4 w-4" />Fazer check-in</button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
