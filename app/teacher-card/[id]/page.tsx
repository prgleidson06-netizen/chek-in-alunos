'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, BookOpen, CheckCircle2, FileText, Pencil, Printer, QrCode } from 'lucide-react'

type Teacher = Record<string, any>
const badge = '/images/fju-badge.jpg'

function nameOf(t: Teacher) {
  return t.fullName || t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || 'Professor FJU'
}

function photoOf(t: Teacher, id: string) {
  return id ? `/api/student-photo/${encodeURIComponent(id)}?v=${encodeURIComponent(t.updatedAt || t.createdAt || id)}` : badge
}

function InfoBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-h-[104px] border-b border-r border-zinc-800 px-5 py-4 last:border-b-0 odd:last:border-b sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-sm font-black uppercase tracking-[0.34em] text-zinc-500">{label}</p>
      <p className="mt-4 whitespace-pre-line font-serif text-2xl font-black text-white">{value || 'Nao informado'}</p>
    </div>
  )
}

export default function TeacherCardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState('')
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { params.then(p => setId(decodeURIComponent(p.id))) }, [params])
  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch('/api/teachers', { cache: 'no-store' })
      .then(r => r.json())
      .then(json => {
        const list = Array.isArray(json) ? json : json.teachers || []
        setTeacher(list.find((t: Teacher) => t.id === id) || null)
      })
      .finally(() => setLoading(false))
  }, [id])

  const qr = useMemo(() => {
    if (!id || typeof window === 'undefined') return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${window.location.origin}/teacher-card/${id}`)}`
  }, [id])

  if (loading) return <main className="min-h-screen bg-black p-8 text-white">Carregando cartao digital...</main>
  if (!teacher) return <main className="min-h-screen bg-black p-8 text-white">Professor nao encontrado.</main>

  const fullName = nameOf(teacher)
  const location = [teacher.city, teacher.state, teacher.country].filter(Boolean).join(', ') || 'Local nao informado'
  const managedStudentCount = Number(teacher.managedStudentCount || 0)

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-[680px] flex-wrap justify-end gap-3 print:hidden">
        <button onClick={() => window.print()} className="inline-flex h-11 items-center gap-2 rounded-md bg-red-600 px-5 font-black hover:bg-red-500"><Printer className="h-5 w-5" /> Imprimir</button>
        <Link href={`/professor-voluntario?id=${encodeURIComponent(id)}`} className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-700 px-5 font-bold hover:border-red-500"><ArrowLeft className="h-5 w-5" /> Voltar</Link>
      </div>

      <section className="mx-auto w-full max-w-[680px] rounded-[10px] border border-red-950 bg-[#18181d] px-8 py-8 shadow-2xl print:border-zinc-300">
        <div className="relative overflow-hidden rounded-[10px]">
          <img src="/images/fju-badge.jpg" alt="" className="pointer-events-none absolute left-1/2 top-[48%] h-[58%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.09]" />
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-5">
              <img src="/images/fju-logo.png" alt="FJU" className="h-24 w-auto max-w-[260px] object-contain" />
              <img src={photoOf(teacher, id)} onError={(e) => { e.currentTarget.src = badge }} alt={fullName} className="h-36 w-36 rounded-[10px] border border-red-700 object-cover" />
            </div>

            <p className="mt-8 text-lg font-black uppercase tracking-[0.42em] text-red-300">Digital ID Card</p>
            <h1 className="mt-3 max-w-[420px] font-serif text-4xl font-black leading-tight text-white">FJU BJJ Martial Arts</h1>
            <div className="my-8 h-px bg-red-700" />

            <p className="text-base uppercase tracking-[0.42em] text-zinc-500">Professor</p>
            <h2 className="mt-3 font-serif text-4xl font-black leading-tight text-white">{fullName}</h2>
            <p className="mt-3 break-all font-mono text-xl text-zinc-500">ID: {id}</p>

            <div className="mt-8 grid overflow-hidden rounded-md border border-zinc-800 sm:grid-cols-2">
              <InfoBox label="Funcao" value={teacher.volunteerRole || teacher.role || 'Professor voluntario'} />
              <InfoBox label="Alunos" value={managedStudentCount} />
              <InfoBox label="Graduacao" value={teacher.beltRank || teacher.graduation || 'Nao informada'} />
              <InfoBox label="Local" value={location} />
              <InfoBox label="Status" value={teacher.status || 'active'} />
              <InfoBox label="Contato" value={teacher.phone || teacher.email || 'Nao informado'} />
            </div>

            <div className="my-8 h-px bg-zinc-800" />

            <div className="grid gap-3 print:hidden">
              <Link className="action" href={`/professor-checkin?teacherId=${encodeURIComponent(id)}`}><CheckCircle2 /> Check-in dos meus alunos</Link>
              <Link className="action" href={`/professor-aulas?teacherId=${encodeURIComponent(id)}`}><BookOpen /> Plataforma de aulas</Link>
              <Link className="action" href={`/teacher-print/${encodeURIComponent(id)}`}><FileText /> Minha ficha PDF</Link>
              <Link className="action" href={`/professor-voluntario/novo?edit=${encodeURIComponent(id)}`}><Pencil /> Editar dados, foto e certificados</Link>
            </div>

            <div className="my-8 h-px bg-zinc-800" />

            <div className="grid items-center gap-7 sm:grid-cols-[190px_1fr]">
              {qr ? <img src={qr} alt="QR do professor" className="h-48 w-48 rounded-md bg-white p-3" /> : <QrCode className="h-20 w-20 text-zinc-700" />}
              <div>
                <p className="text-lg font-black uppercase tracking-[0.42em] text-zinc-500">QR Professor</p>
                <p className="mt-4 font-serif text-2xl leading-relaxed text-zinc-200">Use este ID para acessar check-in, plataforma de aulas e ficha do professor.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style jsx>{`.action{display:flex;align-items:center;justify-content:center;gap:.55rem;min-height:3.2rem;border:1px solid #27272a;background:#050505;border-radius:.375rem;padding:.85rem;font-weight:900;color:white;text-align:center}.action:hover{border-color:#ef4444;background:#19070a}.action :global(svg){width:1.1rem;height:1.1rem;color:#f87171}`}</style>
    </main>
  )
}
