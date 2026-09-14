'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, CheckCircle2, FileText, IdCard, Loader2, Pencil, PlayCircle, Users } from 'lucide-react'

type Teacher = Record<string, any>
const badge = '/images/fju-badge.jpg'

function teacherName(teacher: Teacher) {
  return teacher.fullName || teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ') || 'Professor FJU'
}

function photoOf(teacher: Teacher, id: string) {
  const version = encodeURIComponent(teacher.updatedAt || teacher.createdAt || id || 'photo')
  return id ? `/api/student-photo/${encodeURIComponent(id)}?v=${version}` : badge
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-black/50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-lg font-bold text-white">{value || 'Nao informado'}</p>
    </div>
  )
}

export default function ProfessorPortalPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    params.then((value) => setId(decodeURIComponent(value.id)))
  }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch('/api/teachers', { cache: 'no-store' })
      .then((response) => response.json())
      .then((json) => {
        const teachers = Array.isArray(json) ? json : json.teachers || []
        setTeacher(teachers.find((item: Teacher) => item.id === id) || null)
      })
      .catch(() => setTeacher(null))
      .finally(() => setLoading(false))
  }, [id])

  const qrUrl = useMemo(() => {
    if (!id || typeof window === 'undefined') return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${window.location.origin}/professor/${id}`)}`
  }, [id])

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-black text-white"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Carregando professor...</main>
  }

  if (!teacher) {
    return <main className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-white">Professor nao encontrado.</main>
  }

  const name = teacherName(teacher)
  const location = [teacher.city, teacher.state, teacher.country].filter(Boolean).join(', ') || 'Local nao informado'
  const studentCount = Number(teacher.managedStudentCount || 0)

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white">
      <section className="mx-auto max-w-4xl rounded-lg border border-red-950 bg-[#18181d] p-5 shadow-2xl sm:p-8">
        <div className="relative overflow-hidden rounded-md">
          <img src="/images/fju-badge.jpg" alt="" className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.06]" />
          <div className="relative z-10">
            <div className="flex flex-col gap-5 border-b border-red-900/70 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <img src={photoOf(teacher, id)} onError={(event) => { event.currentTarget.src = badge }} alt={name} className="h-28 w-28 rounded-lg border border-red-800 object-cover" />
                <div>
                  <img src="/images/fju-logo.png" alt="FJU" className="mb-4 h-14 w-auto object-contain" />
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-red-300">Portal do Professor</p>
                  <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{name}</h1>
                  <p className="mt-2 break-all font-mono text-sm text-zinc-500">ID: {id}</p>
                </div>
              </div>
              {qrUrl ? <img src={qrUrl} alt="QR do professor" className="h-32 w-32 rounded-md bg-white p-2" /> : null}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <InfoBox label="Alunos sob cuidado" value={studentCount} />
              <InfoBox label="Local" value={location} />
              <InfoBox label="Graduacao" value={teacher.beltRank || teacher.graduation || 'Nao informada'} />
              <InfoBox label="Funcao" value={teacher.volunteerRole || teacher.role || 'Professor voluntario'} />
              <InfoBox label="Telefone" value={teacher.phone || 'Nao informado'} />
              <InfoBox label="Email" value={teacher.email || 'Nao informado'} />
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link className="action" href={`/professor-checkin?teacherId=${encodeURIComponent(id)}`}><CheckCircle2 /> Check-in dos meus alunos</Link>
              <Link className="action" href={`/professor-aulas?teacherId=${encodeURIComponent(id)}`}><BookOpen /> Aulas vinculadas</Link>
              <Link className="action" href={`/professor/aulas.html?teacherId=${encodeURIComponent(id)}`}><PlayCircle /> Plataforma de aulas</Link>
              <Link className="action" href={`/teacher-print/${encodeURIComponent(id)}`}><FileText /> Minha ficha PDF</Link>
              <Link className="action" href={`/teacher-card/${encodeURIComponent(id)}`}><IdCard /> Meu ID digital</Link>
              <Link className="action" href={`/professor-voluntario/novo?edit=${encodeURIComponent(id)}`}><Pencil /> Meus dados pessoais</Link>
            </div>

            <div className="mt-6 rounded-md border border-zinc-800 bg-black/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Observacoes / atividades</p>
              <p className="mt-2 whitespace-pre-wrap text-zinc-300">{teacher.activityDescription || teacher.notes || 'Nenhuma observacao registrada.'}</p>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`.action{display:flex;align-items:center;justify-content:center;gap:.65rem;min-height:3.35rem;border:1px solid #27272a;background:#050505;border-radius:.375rem;padding:1rem;font-weight:900;color:white;text-align:center}.action:hover{border-color:#ef4444;background:#19070a}.action :global(svg){width:1.15rem;height:1.15rem;color:#f87171}`}</style>
    </main>
  )
}
