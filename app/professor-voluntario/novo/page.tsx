'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Save, Upload, X } from 'lucide-react'
import { SignaturePad, type SignaturePadRef } from '@/components/signature-pad'

type Teacher = Record<string, any>

const emptyTeacher: Teacher = {
  fullName: '', email: '', phone: '', birthDate: '', address: '', city: '', state: '', country: 'USA', beltRank: '', yearsExperience: '',
  role: 'Professor voluntario', churchLocation: '', activityDescription: '', certifications: '', certificateLinks: '', emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '',
  medicalConditions: '', allergies: '', medications: '', termsAccepted: false, signatureName: '', guardianName: '', guardianRelationship: '',
}

const MAX_PHOTO_SIDE = 760
const PHOTO_QUALITY = 0.74

function readFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) return Promise.reject(new Error('Selecione uma imagem valida.'))

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      try {
        const sourceWidth = image.naturalWidth || image.width
        const sourceHeight = image.naturalHeight || image.height
        const scale = Math.min(1, MAX_PHOTO_SIDE / Math.max(sourceWidth, sourceHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(sourceWidth * scale))
        canvas.height = Math.max(1, Math.round(sourceHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) throw new Error('Nao foi possivel preparar a imagem.')
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', PHOTO_QUALITY))
      } catch (error) {
        reject(error)
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Nao foi possivel ler a foto.'))
    }
    image.src = objectUrl
  })
}

export default function NovoProfessorPage() {
  const [form, setForm] = useState<Teacher>(emptyTeacher)
  const [photoPreview, setPhotoPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [savedId, setSavedId] = useState('')
  const signatureRef = useRef<SignaturePadRef>(null)
  const editId = useMemo(() => typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('edit') : '', [])

  useEffect(() => {
    if (!editId) return
    fetch('/api/teachers', { cache: 'no-store' }).then(r => r.json()).then((json) => {
      const list = Array.isArray(json) ? json : json.teachers || []
      const teacher = list.find((t: Teacher) => t.id === editId)
      if (teacher) {
        const fullName = teacher.fullName || teacher.name || [teacher.firstName, teacher.lastName].filter(Boolean).join(' ')
        const nextForm = {
          ...emptyTeacher,
          ...teacher,
          fullName,
          birthDate: teacher.birthDate || teacher.dateOfBirth || teacher.date_of_birth || '',
          role: teacher.role || teacher.volunteerRole || teacher.volunteer_role || 'Professor voluntario',
          churchLocation: teacher.churchLocation || teacher.church_location || '',
          activityDescription: teacher.activityDescription || teacher.activity_description || teacher.notes || '',
          termsAccepted: Boolean(teacher.termsAccepted ?? teacher.terms_accepted ?? teacher.waiverAgreed ?? teacher.waiver_agreed),
          waiverSignature: teacher.waiverSignature || teacher.waiver_signature || teacher.signature || '',
          signatureName: teacher.signatureName || teacher.signature_name || fullName,
          guardianName: teacher.guardianName || teacher.guardian_name || '',
          guardianRelationship: teacher.guardianRelationship || teacher.guardian_relationship || '',
          guardianPhone: teacher.guardianPhone || teacher.guardian_phone || '',
          certifications: Array.isArray(teacher.certifications) ? teacher.certifications.join(', ') : teacher.certifications || '',
          certificateLinks: Array.isArray(teacher.certificateLinks) ? teacher.certificateLinks.join(', ') : teacher.certificateLinks || teacher.certificate_links || '',
        }
        setForm(nextForm)
        setPhotoPreview(`/api/student-photo/${encodeURIComponent(teacher.id)}?v=${encodeURIComponent(teacher.updatedAt || teacher.createdAt || teacher.id)}`)
        setSavedId(teacher.id)
      }
    }).catch(() => setMessage('Nao foi possivel carregar o professor para edicao.'))
  }, [editId])

  function setField(field: string, value: any) { setForm((current) => ({ ...current, [field]: value })) }

  async function onPhoto(file?: File) {
    if (!file) return
    const dataUrl = await readFile(file)
    setPhotoPreview(dataUrl)
    setField('photo', dataUrl)
  }

  async function save() {
    setMessage('')
    if (!form.fullName || !form.email) return setMessage('Informe nome completo e email.')
    if (!form.termsAccepted) return setMessage('Os termos precisam ser aceitos.')
    if (!editId && !form.waiverSignature) return setMessage('Assine no campo de assinatura antes de salvar.')
    setSaving(true)
    try {
      const payload = { ...form, id: editId || form.id, signature: form.waiverSignature || undefined, waiverSignature: form.waiverSignature || undefined, certifications: String(form.certifications || '').split(',').map((x) => x.trim()).filter(Boolean), certificateLinks: String(form.certificateLinks || '').split(',').map((x) => x.trim()).filter(Boolean), termsSignedAt: new Date().toISOString(), signatureName: form.signatureName || form.fullName }
      const res = await fetch('/api/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Erro ao salvar professor')
      const id = json.teacher?.id || json.id || payload.id
      setSavedId(id)
      setMessage(`Professor salvo com sucesso. Link do professor: ${window.location.origin}/professor/${id}`)
    } catch (error: any) {
      setMessage(error?.message || 'Erro ao salvar professor.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'h-12 rounded-md border border-zinc-800 bg-black px-4 text-white outline-none focus:border-red-500'

  return (
    <main className="min-h-screen bg-[#050607] text-white">
      <section className="mx-auto max-w-6xl px-5 py-10">
        <Link href="/professor-voluntario" className="mb-8 inline-flex items-center gap-2 text-zinc-300 hover:text-white"><ArrowLeft className="h-4 w-4" /> Voltar para professores</Link>
        <div className="mb-8">
          <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-red-400">FJU BJJ Martial Arts</p>
          <h1 className="text-4xl font-black">{editId ? 'Editar professor' : 'Inscrever novo professor'}</h1>
          <p className="mt-3 text-zinc-400">Cadastro separado com foto, termos e assinatura.</p>
        </div>

        <div className="rounded-md border border-zinc-800 bg-zinc-950 p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <input className={input} placeholder="Nome completo *" value={form.fullName || ''} onChange={e => setField('fullName', e.target.value)} />
            <input className={input} placeholder="Email *" value={form.email || ''} onChange={e => setField('email', e.target.value)} />
            <input className={input} placeholder="Telefone" value={form.phone || ''} onChange={e => setField('phone', e.target.value)} />
            <input className={input} placeholder="Data de nascimento" type="date" value={form.birthDate || ''} onChange={e => setField('birthDate', e.target.value)} />
            <select className={input} value={form.beltRank || ''} onChange={e => setField('beltRank', e.target.value)}><option value="">Graduacao</option><option>White</option><option>Blue</option><option>Purple</option><option>Brown</option><option>Black</option></select>
            <input className={input} placeholder="Anos de experiencia" value={form.yearsExperience || ''} onChange={e => setField('yearsExperience', e.target.value)} />
            <input className={input} placeholder="Endereco" value={form.address || ''} onChange={e => setField('address', e.target.value)} />
            <input className={input} placeholder="Cidade" value={form.city || ''} onChange={e => setField('city', e.target.value)} />
            <input className={input} placeholder="Estado" value={form.state || ''} onChange={e => setField('state', e.target.value)} />
            <input className={input} placeholder="Pais" value={form.country || ''} onChange={e => setField('country', e.target.value)} />
            <input className={input} placeholder="Igreja / polo" value={form.churchLocation || ''} onChange={e => setField('churchLocation', e.target.value)} />
            <input className={input} placeholder="Funcao" value={form.role || ''} onChange={e => setField('role', e.target.value)} />
            <input className={input} placeholder="Contato de emergencia" value={form.emergencyContactName || ''} onChange={e => setField('emergencyContactName', e.target.value)} />
            <input className={input} placeholder="Telefone de emergencia" value={form.emergencyContactPhone || ''} onChange={e => setField('emergencyContactPhone', e.target.value)} />
            <input className={input} placeholder="Parentesco / relacao emergencia" value={form.emergencyContactRelationship || ''} onChange={e => setField('emergencyContactRelationship', e.target.value)} />
            <input className={input} placeholder="Alergias" value={form.allergies || ''} onChange={e => setField('allergies', e.target.value)} />
            <input className={input} placeholder="Condicoes medicas" value={form.medicalConditions || ''} onChange={e => setField('medicalConditions', e.target.value)} />
            <input className={input} placeholder="Medicamentos" value={form.medications || ''} onChange={e => setField('medications', e.target.value)} />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="rounded-md border border-zinc-800 bg-black p-4">
              <div className="mb-3 aspect-square overflow-hidden rounded-md bg-zinc-900"><img src={photoPreview || '/images/fju-badge.jpg'} alt="" className="h-full w-full object-cover" /></div>
              <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-zinc-700 font-bold hover:border-red-500"><Upload className="h-4 w-4" /> Foto<input type="file" accept="image/*" className="hidden" onChange={e => onPhoto(e.target.files?.[0])} /></label>
              {photoPreview && <button className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-md border border-zinc-800 text-zinc-300" onClick={() => { setPhotoPreview(''); setField('photo', '') }}><X className="h-4 w-4" /> Remover foto</button>}
            </div>
            <textarea className="min-h-[250px] rounded-md border border-zinc-800 bg-black p-4 text-white outline-none focus:border-red-500" placeholder="Descricao das atividades, videos ou observacoes" value={form.activityDescription || ''} onChange={e => setField('activityDescription', e.target.value)} />
          </div>
        </div>

        <div id="certificados" className="mt-6 rounded-md border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-2xl font-black">Certificados e especialidades</h2>
          <p className="mt-2 text-sm text-zinc-400">Coloque nomes separados por virgula e links dos certificados separados por virgula. Para arquivo grande, envie para Drive/Dropbox e cole o link aqui.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <textarea className="min-h-[120px] rounded-md border border-zinc-800 bg-black p-4 text-white outline-none focus:border-red-500" placeholder="Certificados escritos: CPR, IBJJF, curso infantil..." value={form.certifications || ''} onChange={e => setField('certifications', e.target.value)} />
            <textarea className="min-h-[120px] rounded-md border border-zinc-800 bg-black p-4 text-white outline-none focus:border-red-500" placeholder="Links dos certificados" value={form.certificateLinks || ''} onChange={e => setField('certificateLinks', e.target.value)} />
          </div>
        </div>

        <div className="mt-6 rounded-md border border-zinc-800 bg-zinc-950 p-5">
          <h2 className="text-2xl font-black">Termo de responsabilidade do professor voluntario</h2>
          <div className="mt-3 max-h-72 overflow-y-auto rounded-md border border-zinc-800 bg-black p-4 text-sm leading-6 text-zinc-300 whitespace-pre-wrap">{`Eu, abaixo assinado, declaro estar ciente e concordo com os seguintes termos para atuar como professor voluntario no projeto FJU BJJ Martial Arts:

1. RECONHECIMENTO DE RISCOS
Reconheco que Jiu-Jitsu, Karate, artes marciais, condicionamento fisico, aulas, demonstracoes, sparring e atividades relacionadas envolvem riscos inerentes, incluindo quedas, impactos, torcoes, contusoes, lesoes musculares, articulares, na cabeca, pescoco, coluna, agravamento de condicoes medicas e outros danos possiveis.

2. CONDICAO FISICA E RESPONSABILIDADE
Declaro estar em condicoes fisicas e tecnicas adequadas para auxiliar ou ministrar atividades dentro da minha capacidade. Comprometo-me a agir com prudencia, respeito, disciplina, higiene, cuidado com menores de idade e obediencia as orientacoes da coordenacao FJU.

3. VERACIDADE DAS INFORMACOES
Confirmo que as informacoes, graduacao, certificados, experiencia, contatos e documentos fornecidos sao verdadeiros e autorizo seu uso para administracao interna, identificacao, emissao de ID, controle de aulas, check-ins e organizacao do projeto.

4. USO DE IMAGEM E DADOS
Autorizo o uso da minha foto, nome, ID, localidade, certificados e registros de atividades para fins internos do projeto e comunicacoes relacionadas a FJU BJJ Martial Arts, respeitando a finalidade administrativa e organizacional.

5. CONDUTA E SEGURANCA
Concordo em seguir as regras da FJU BJJ Martial Arts, tratar alunos, pais, professores e voluntarios com respeito, proteger a integridade fisica e emocional dos participantes, e comunicar qualquer incidente, limitacao medica ou situacao de risco a coordenacao.

6. MENORES DE IDADE
Se eu for menor de 18 anos, meu responsavel legal tambem concorda com estes termos e autoriza minha participacao como voluntario conforme permitido pela coordenacao.

Ao assinar abaixo, aceito estes termos de forma livre e consciente.`}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input className={input} placeholder="Nome para assinatura" value={form.signatureName || ''} onChange={e => setField('signatureName', e.target.value)} />
            <input className={input} placeholder="Nome do responsavel, se menor" value={form.guardianName || ''} onChange={e => setField('guardianName', e.target.value)} />
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-bold text-zinc-300">Assinatura obrigatoria</p>
            <SignaturePad ref={signatureRef} onSignature={(sig) => setField('waiverSignature', sig)} />
            <button type="button" className="mt-2 rounded-md border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-200 hover:border-red-500" onClick={() => { signatureRef.current?.clear(); setField('waiverSignature', '') }}>Limpar assinatura</button>
          </div>
          <label className="mt-4 flex gap-3 text-zinc-200"><input type="checkbox" checked={!!form.termsAccepted} onChange={e => setField('termsAccepted', e.target.checked)} /> Li, aceito e assino os termos acima.</label>
        </div>

        {message && <div className="mt-5 rounded-md border border-red-900/60 bg-red-950/20 px-4 py-3 text-red-200">{message}</div>}
        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={save} disabled={saving} className="inline-flex h-12 items-center gap-2 rounded-md bg-red-600 px-5 font-black hover:bg-red-500 disabled:opacity-60"><Save className="h-5 w-5" /> {saving ? 'Salvando...' : 'Salvar professor'}</button>
          {savedId && <Link href={`/professor/${encodeURIComponent(savedId)}`} className="inline-flex h-12 items-center gap-2 rounded-md border border-zinc-700 px-5 font-bold"><CheckCircle2 className="h-5 w-5" /> Abrir link do professor</Link>}
        </div>
      </section>
    </main>
  )
}
