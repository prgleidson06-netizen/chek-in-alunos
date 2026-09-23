'use client'

import { useEffect, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { preparePhotoFile, validateStudentFace } from '@/lib/photo-validation'

export function StudentIdPhotoEditor({ studentId, photoUrl, studentName }: { studentId: string; photoUrl: string; studentName: string }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl)

  useEffect(() => {
    fetch('/api/admin-session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setIsAdmin(Boolean(data?.isAdmin)))
      .catch(() => setIsAdmin(false))
  }, [])

  const changePhoto = async (file: File | null) => {
    if (!file) return
    setSaving(true)
    setMessage('Verificando a foto...')

    try {
      const photo = await preparePhotoFile(file)
      const validation = await validateStudentFace(photo)
      if (validation.supported && !validation.hasFace) {
        throw new Error('Foto recusada: nenhum rosto humano foi encontrado. Escolha uma foto clara do aluno.')
      }
      if (!window.confirm(`Confirma que esta foto mostra claramente o rosto de ${studentName}?`)) {
        setMessage('Alteracao cancelada.')
        return
      }

      setMessage('Salvando e sincronizando a foto...')
      const response = await fetch(`/api/student-photo/${encodeURIComponent(studentId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result?.error || 'Nao foi possivel salvar a foto.')

      setCurrentPhoto(`/api/student-photo/${encodeURIComponent(studentId)}?v=${encodeURIComponent(result.updatedAt || Date.now())}`)
      setMessage('Foto atualizada. A nova imagem sera usada em todas as paginas do aluno.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Nao foi possivel alterar a foto.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <img
        src={currentPhoto}
        alt={studentName}
        className="h-36 w-36 rounded-[10px] border border-red-700 object-cover"
        onError={(event) => { event.currentTarget.src = '/images/fju-badge.jpg' }}
      />
      {isAdmin && (
        <>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-500 print:hidden">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Alterar foto'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={saving}
              onChange={(event) => {
                void changePhoto(event.target.files?.[0] || null)
                event.target.value = ''
              }}
            />
          </label>
          {message && <p className="max-w-72 text-right text-xs text-zinc-400 print:hidden">{message}</p>}
        </>
      )}
    </div>
  )
}
