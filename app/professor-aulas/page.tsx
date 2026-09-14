'use client'

import { useEffect, useState } from 'react'
import { BookOpen, ExternalLink, FolderOpen, PlayCircle, Upload } from 'lucide-react'

type LessonVideo = {
  id: string
  title: string
  belt: string
  technique: string
  url: string
  teacherId?: string
  teacherName?: string
  updatedAt: string
}

export default function ProfessorAulasPage() {
  const [videos, setVideos] = useState<LessonVideo[]>([])
  const [teacherId, setTeacherId] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('teacherId') || ''
    setTeacherId(id)

    async function load() {
      try {
        const response = await fetch(`/api/lesson-videos${id ? `?teacherId=${encodeURIComponent(id)}` : ''}`, { cache: 'no-store' })
        const data = await response.json()
        setVideos(Array.isArray(data?.videos) ? data.videos : [])
      } catch {
        setVideos([])
      }
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-black p-4 text-white md:p-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 border-b border-zinc-800 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-red-400">FJU Professor</p>
            <h1 className="mt-2 text-3xl font-black">Plataforma de aulas e videos</h1>
            <p className="mt-2 max-w-2xl text-zinc-400">
              Guia tecnico restaurado com tecnicas por faixa, idiomas, anotacoes e video ao lado da aula.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={teacherId ? `/professor/aulas.html?teacherId=${encodeURIComponent(teacherId)}` : '/professor/aulas.html'} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700">
              <PlayCircle className="h-4 w-4" /> Abrir plataforma
            </a>
            <a href={teacherId ? `/professor-checkin?teacherId=${encodeURIComponent(teacherId)}` : '/professor-checkin'} className="rounded-md border border-zinc-700 px-4 py-2 font-semibold text-zinc-200 hover:border-red-500">Check-in</a>
            <a href={teacherId ? `/professor-voluntario?id=${encodeURIComponent(teacherId)}` : '/professor-voluntario'} className="rounded-md border border-zinc-700 px-4 py-2 font-semibold text-zinc-200 hover:border-red-500">Perfil</a>
            <a href="/" className="rounded-md border border-zinc-700 px-4 py-2 font-semibold text-zinc-200 hover:border-red-500">Painel</a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <BookOpen className="mb-4 h-7 w-7 text-red-400" />
            <h2 className="text-xl font-black">Tecnicas ate faixa preta</h2>
            <p className="mt-2 text-sm text-zinc-400">Faixa branca, cinza, amarela, laranja, verde, azul, roxa, marrom e preta.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <Upload className="mb-4 h-7 w-7 text-red-400" />
            <h2 className="text-xl font-black">Video local</h2>
            <p className="mt-2 text-sm text-zinc-400">Clique em “Video local” dentro da plataforma para abrir qualquer MP4 sem subir arquivo pesado.</p>
          </div>
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
            <FolderOpen className="mb-4 h-7 w-7 text-red-400" />
            <h2 className="text-xl font-black">Offline</h2>
            <p className="mt-2 text-sm text-zinc-400">As anotacoes e conclusoes ficam salvas no navegador do professor.</p>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-950">
          <div className="border-b border-zinc-800 p-5">
            <h2 className="text-xl font-black">Videos vinculados por link</h2>
            <p className="mt-1 text-sm text-zinc-500">{videos.length} links cadastrados na API atual.</p>
          </div>
          <div className="divide-y divide-zinc-800">
            {videos.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Nenhum link salvo ainda. A plataforma offline ja abre os videos locais pelo botao “Video local”.</p>
            ) : videos.map((video) => (
              <a key={video.id} href={video.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 p-5 hover:bg-white/5">
                <span>
                  <span className="block font-semibold text-zinc-100">{video.title || video.technique}</span>
                  <span className="mt-1 block text-sm text-zinc-500">{video.belt} • {video.teacherName || 'Professor FJU'}</span>
                </span>
                <ExternalLink className="h-5 w-5 text-red-400" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
