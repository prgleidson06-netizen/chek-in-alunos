'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer } from 'lucide-react'

type Teacher = Record<string, any>

function nameOf(t: Teacher) {
  return t?.fullName || t?.name || `${t?.firstName || ''} ${t?.lastName || ''}`.trim() || 'Professor FJU'
}
function photoOf(t: Teacher) {
  return t?.id ? `/api/student-photo/${encodeURIComponent(t.id)}?v=${encodeURIComponent(t.updatedAt || t.createdAt || t.id)}` : '/images/fju-badge.jpg'
}
function signatureOf(t: Teacher) {
  return t?.id ? `/api/student-signature/${encodeURIComponent(t.id)}?v=${encodeURIComponent(t.updatedAt || t.createdAt || t.id)}` : ''
}

export default function TeacherPrintPage() {
  const params = useParams<{ id: string }>()
  const id = decodeURIComponent(String(params?.id || ''))
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    let active = true
    fetch('/api/teachers', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return
        const teachers = Array.isArray(data?.teachers) ? data.teachers : []
        setTeacher(teachers.find((item: Teacher) => item.id === id) || null)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [id])

  const rows = useMemo(() => {
    if (!teacher) return []
    return [
      ['ID', teacher.id], ['Nome', nameOf(teacher)], ['Email', teacher.email || 'Nao informado'],
      ['Telefone', teacher.phone || 'Nao informado'], ['Graduacao', teacher.beltRank || 'Nao informada'],
      ['Funcao', teacher.volunteerRole || 'Professor voluntario'], ['Experiencia', `${teacher.yearsExperience || 0} anos`],
      ['Cidade', teacher.city || 'Nao informada'], ['Estado', teacher.state || 'Nao informado'], ['Pais', teacher.country || 'Nao informado'],
      ['Igreja/Polo', teacher.churchLocation || 'Nao informado'], ['Termos aceitos', teacher.termsAccepted ? 'Sim' : 'Nao'], ['Status', teacher.status || 'active'],
    ]
  }, [teacher])

  if (loading) return <main className="min-h-screen bg-white p-8 text-black">Carregando ficha...</main>
  if (!teacher) return <main className="min-h-screen bg-white p-8 text-black">Professor nao encontrado: {id}</main>

  return (
    <main className="min-h-screen bg-white p-6 text-black print:p-0">
      <style jsx global>{`@media print { .no-print { display:none!important; } }`}</style>
      <section className="mx-auto max-w-4xl border border-zinc-300 p-8 print:border-0">
        <div className="no-print mb-6 flex justify-end gap-2">
          <button onClick={() => window.print()} className="rounded-md bg-red-600 px-4 py-2 font-semibold text-white"><Printer className="mr-2 inline h-4 w-4" />Imprimir</button>
          <a href={`/professor-voluntario?id=${encodeURIComponent(teacher.id)}`} className="rounded-md border border-zinc-400 px-4 py-2 font-semibold">Voltar</a>
        </div>
        <header className="flex gap-5 border-b border-zinc-300 pb-6">
          <img src="/images/fju-badge.jpg" alt="" className="h-20 w-20 object-contain" />
          <div className="flex-1">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-700">FJU BJJ Martial Arts</p>
            <h1 className="mt-1 text-3xl font-black">Ficha do Professor</h1>
            <p className="mt-1 font-mono text-xs text-zinc-600">{teacher.id}</p>
          </div>
          <div className="flex items-center gap-3"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`${window.location.origin}/professor-voluntario?id=${teacher.id}`)}`} alt="QR professor" className="h-24 w-24 rounded border bg-white p-1" /><img src={photoOf(teacher)} alt="" className="h-28 w-28 rounded-md border border-zinc-300 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/images/fju-badge.jpg' }} /></div>
        </header>
        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          {rows.map(([label, value]) => <div key={label} className="rounded-md border border-zinc-300 p-3"><p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>)}
        </section>
        <section className="mt-6 rounded-md border border-zinc-300 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Observacoes / atividades</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{teacher.activityDescription || 'Nenhuma observacao registrada.'}</p>
        </section>
        <section className="mt-6 rounded-md border border-zinc-300 p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Assinatura do professor</p><div className="mt-4 min-h-24 text-center"><img src={signatureOf(teacher)} alt="Assinatura" className="mx-auto mb-2 max-h-24 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /><div className="mx-auto mt-8 w-full max-w-sm border-t border-zinc-500 pt-2 text-sm">{nameOf(teacher)}</div></div></section><footer className="mt-10 grid gap-8 sm:grid-cols-2"><div className="border-t border-zinc-400 pt-2 text-center text-sm">Assinatura do professor</div><div className="border-t border-zinc-400 pt-2 text-center text-sm">Responsavel FJU</div></footer>
      </section>
    </main>
  )
}
