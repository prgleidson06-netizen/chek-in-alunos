'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, CheckCircle2, CreditCard, Edit3, FileText, IdCard, Loader2, Printer, Trash2, Upload, UserPlus, Users } from 'lucide-react'

type Teacher = Record<string, any>

const badge = '/images/fju-badge.jpg'

function fullName(t: Teacher) {
  return t.fullName || t.name || [t.firstName, t.lastName].filter(Boolean).join(' ') || 'Professor FJU'
}

function photoOf(t: Teacher) {
  const id = t.id || ''
  const version = encodeURIComponent(t.updatedAt || t.createdAt || id || 'photo')
  return id ? `/api/student-photo/${encodeURIComponent(id)}?v=${version}` : badge
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfessorVoluntarioPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const selected = useMemo(() => teachers.find((t) => t.id === selectedId) || teachers[0], [teachers, selectedId])

  async function load() {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/teachers', { cache: 'no-store' })
      const json = await res.json()
      const list = Array.isArray(json) ? json : json.teachers || []
      setTeachers(list)
      const params = new URLSearchParams(window.location.search)
      setSelectedId(params.get('id') || list[0]?.id || '')
    } catch (error) {
      setMessage('Nao foi possivel carregar professores.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function updatePhoto(t: Teacher, file?: File) {
    if (!file || !t?.id) return
    setSaving(true)
    setMessage('Atualizando foto...')
    try {
      const photo = await readFile(file)
      const res = await fetch('/api/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...t, id: t.id, fullName: fullName(t), photo }),
      })
      if (!res.ok) throw new Error('Falha ao salvar foto')
      setMessage('Foto atualizada.')
      await load()
    } catch (error) {
      setMessage('Erro ao atualizar foto.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTeacher(t: Teacher) {
    if (!t?.id) return
    if (!confirm(`Deletar professor ${fullName(t)}?`)) return
    setSaving(true)
    try {
      const res = await fetch('/api/teachers', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id }),
      })
      if (!res.ok) throw new Error('Falha ao deletar')
      setSelectedId('')
      await load()
      setMessage('Professor deletado.')
    } catch (error) {
      setMessage('Nao foi possivel deletar professor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col gap-5 border-b border-zinc-800 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-red-400">FJU BJJ Martial Arts</p>
            <h1 className="text-4xl font-black">Professores voluntarios</h1>
            <p className="mt-3 text-lg text-zinc-400">Perfis, IDs, fotos e acesso rapido aos alunos e aulas.</p>
          </div>
          <Link href="/professor-voluntario/novo" className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-red-600 px-5 font-bold text-white hover:bg-red-500">
            <UserPlus className="h-5 w-5" /> Novo professor
          </Link>
        </div>

        {message && <div className="mt-5 rounded-md border border-red-900/60 bg-red-950/20 px-4 py-3 text-red-200">{message}</div>}

        {loading ? (
          <div className="mt-8 flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-950 p-8 text-zinc-300"><Loader2 className="h-5 w-5 animate-spin" /> Carregando professores...</div>
        ) : !teachers.length ? (
          <div className="mt-8 rounded-md border border-zinc-800 bg-zinc-950 p-8 text-zinc-300">Nenhum professor encontrado.</div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[360px_1fr]">
            <aside className="rounded-md border border-zinc-800 bg-zinc-950">
              <div className="border-b border-zinc-800 p-4 font-bold">Lista de professores ({teachers.length})</div>
              <div className="max-h-[720px] overflow-auto p-3">
                {teachers.map((teacher) => (
                  <button key={teacher.id} onClick={() => setSelectedId(teacher.id)} className={`mb-2 flex w-full items-center gap-3 rounded-md border p-3 text-left ${selected?.id === teacher.id ? 'border-red-500 bg-red-950/30' : 'border-zinc-800 bg-black hover:border-zinc-700'}`}>
                    <img src={photoOf(teacher)} alt="" className="h-12 w-12 rounded-md object-cover" onError={(e) => { e.currentTarget.src = badge }} />
                    <span className="min-w-0"><span className="block truncate font-bold">{fullName(teacher)}</span><span className="block truncate text-sm text-zinc-500">{teacher.city || 'Cidade'} {teacher.state || ''}</span></span>
                  </button>
                ))}
              </div>
            </aside>

            {selected && (
              <section className="rounded-md border border-zinc-800 bg-zinc-950">
                <div className="flex flex-col gap-4 border-b border-zinc-800 p-5 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <img src={photoOf(selected)} alt="" className="h-28 w-28 rounded-md border border-zinc-800 object-cover" onError={(e) => { e.currentTarget.src = badge }} />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.25em] text-red-400">Professor FJU</p>
                      <h2 className="mt-2 text-3xl font-black">{fullName(selected)}</h2>
                      <p className="mt-1 text-zinc-400">ID: {selected.id}</p>
                      <p className="mt-1 text-zinc-400">{selected.city || 'Cidade nao informada'}, {selected.state || 'Estado'} , {selected.country || 'Pais'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-zinc-700 px-4 font-bold hover:border-red-500">
                      <Upload className="h-4 w-4" /> Trocar foto
                      <input type="file" accept="image/*" className="hidden" disabled={saving} onChange={(e) => updatePhoto(selected, e.target.files?.[0])} />
                    </label>
                    <button onClick={() => deleteTeacher(selected)} disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-md border border-red-800 px-4 font-bold text-red-300 hover:bg-red-950"><Trash2 className="h-4 w-4" /> Deletar</button>
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                  <Link className="action" href={`/professor-checkin?teacherId=${encodeURIComponent(selected.id)}`}><CheckCircle2 /> Check-in dos alunos</Link>
                  <Link className="action" href={`/professor-aulas?teacherId=${encodeURIComponent(selected.id)}`}><BookOpen /> Plataforma de aulas</Link>
                  <Link className="action" href={`/professor/${encodeURIComponent(selected.id)}`}><CreditCard /> Link do professor</Link>
                  <Link className="action" href={`/teacher-print/${encodeURIComponent(selected.id)}`}><Printer /> Ficha completa</Link>
                  <Link className="action" href={`/professor-voluntario/novo?edit=${encodeURIComponent(selected.id)}`}><Edit3 /> Editar dados</Link>
                  <Link className="action" href="/"><Users /> Painel principal</Link>
                </div>

                <div className="grid gap-3 border-t border-zinc-800 p-5 md:grid-cols-2">
                  {[
                    ['Email', selected.email], ['Telefone', selected.phone], ['Graduacao', selected.beltRank || selected.graduation], ['Funcao', selected.role || selected.volunteerRole || 'Professor voluntario'], ['Experiencia', `${selected.yearsExperience || 0} anos`], ['Igreja / polo', selected.churchLocation], ['Emergencia', selected.emergencyContactName], ['Status', selected.status || 'active'],
                  ].map(([label, value]) => <div key={label} className="rounded-md border border-zinc-800 bg-black p-4"><p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p><p className="mt-2 text-lg font-bold">{value || 'Nao informado'}</p></div>)}
                </div>

                <div className="border-t border-zinc-800 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Observacoes / atividades / videos</p>
                  <p className="mt-2 whitespace-pre-wrap text-zinc-300">{selected.activityDescription || selected.notes || 'Nenhuma observacao registrada.'}</p>
                </div>
              </section>
            )}
          </div>
        )}
      </section>
      <style jsx>{`.action{display:flex;align-items:center;gap:.65rem;border:1px solid #27272a;background:#050505;border-radius:.375rem;padding:1rem;font-weight:800;color:white}.action:hover{border-color:#ef4444;background:#19070a}.action :global(svg){width:1.1rem;height:1.1rem;color:#f87171}`}</style>
    </main>
  )
}
