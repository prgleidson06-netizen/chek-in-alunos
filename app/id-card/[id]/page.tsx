import Link from 'next/link'
import { getStudent } from '@/lib/server-storage'
import { ArrowLeft, Printer } from 'lucide-react'
import { StudentIdPhotoEditor } from '@/components/student-id-photo-editor'

export const dynamic = 'force-dynamic'

function formatDate(value?: string) {
  if (!value) return new Date().toLocaleDateString('pt-BR')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

function addOneYear(value?: string) {
  const base = value ? new Date(value) : new Date()
  if (Number.isNaN(base.getTime())) return ''
  base.setFullYear(base.getFullYear() + 1)
  return base.toLocaleDateString('pt-BR')
}

function displayBelt(student: any) {
  return student?.bjj?.beltRank || student?.beltRank || 'White'
}

function displayStripes(student: any) {
  return Number(student?.bjj?.stripes ?? student?.stripes ?? 0)
}

function displayProgram(student: any) {
  const hasBjj = student?.programs?.bjj || student?.bjj
  const hasKarate = student?.programs?.karate || student?.karate
  if (hasBjj && hasKarate) return 'Jiu-Jitsu / Karate'
  if (hasKarate) return 'Karate'
  return 'Jiu-Jitsu'
}

function displayStatus(student: any) {
  const value = String(student?.status || 'active').toLowerCase()
  if (value === 'inactive' || value === 'inativo') return 'Inativo'
  if (value === 'pending' || value === 'pendente') return 'Pendente'
  return 'Ativo'
}

function classBreakdown(student: any) {
  const hasBjj = student?.programs?.bjj || student?.bjj
  const hasKarate = student?.programs?.karate || student?.karate
  const total = Number(student?.totalClasses ?? 0)
  const bjjClasses = Number(student?.bjj?.classes ?? (hasBjj ? total : 0))
  const karateClasses = Number(student?.karate?.classes ?? 0)

  if (hasBjj && hasKarate) return `Jiu-Jitsu ${bjjClasses}\nKarate ${karateClasses}`
  if (hasKarate) return `Karate ${karateClasses || total}`
  return `Jiu-Jitsu ${bjjClasses || total}`
}

export default async function StudentIdCard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const student: any = await getStudent(decodeURIComponent(id))
  const studentId = decodeURIComponent(id)
  const fullName =
    student
      ? [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || student.name || 'Aluno FJU'
      : 'Aluno FJU'
  const version = encodeURIComponent(student?.updatedAt || student?.createdAt || studentId)
  const photo = `/api/student-photo/${encodeURIComponent(studentId)}?v=${version}`
  const issuedAt = student?.startDate || student?.createdAt
  const qrData = `https://fju-martial-arts.vercel.app/id-card/${studentId}`
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`

  return (
    <main className="min-h-screen bg-black px-4 py-6 text-white print:bg-white print:p-0">
      <div className="mx-auto mb-5 flex max-w-[680px] justify-end gap-3 print:hidden">
        <button
          id="print-button"
          className="inline-flex h-11 items-center gap-2 rounded-md bg-red-600 px-5 font-black hover:bg-red-500"
        >
          <Printer className="h-5 w-5" />
          Imprimir
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-zinc-700 px-5 font-bold hover:border-red-500"
        >
          <ArrowLeft className="h-5 w-5" />
          Voltar
        </Link>
      </div>

      <section className="mx-auto w-full max-w-[680px] rounded-[10px] border border-red-950 bg-[#18181d] px-8 py-8 shadow-2xl print:border-zinc-300">
        <div className="relative overflow-hidden rounded-[10px]">
          <img
            src="/images/fju-badge.jpg"
            alt=""
            className="pointer-events-none absolute left-1/2 top-[48%] h-[58%] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.09]"
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between gap-5">
              <img src="/images/fju-logo.png" alt="FJU" className="h-24 w-auto max-w-[260px] object-contain" />
              <StudentIdPhotoEditor studentId={studentId} photoUrl={photo} studentName={fullName} />
            </div>

            <p className="mt-8 text-lg font-black uppercase tracking-[0.42em] text-red-300">Digital ID Card</p>
            <h1 className="mt-3 max-w-[420px] font-serif text-4xl font-black leading-tight text-white">
              FJU BJJ Martial Arts
            </h1>

            <div className="my-8 h-px bg-red-700" />

            <p className="text-base uppercase tracking-[0.42em] text-zinc-500">Aluno</p>
            <h2 className="mt-3 font-serif text-4xl font-black leading-tight text-white">{fullName}</h2>
            <p className="mt-3 break-all font-mono text-xl text-zinc-500">ID: {studentId}</p>

            <div className="mt-8 grid overflow-hidden rounded-md border border-zinc-800 sm:grid-cols-2">
              <InfoBox label="Modalidade" value={displayProgram(student)} />
              <InfoBox label="Status" value={displayStatus(student)} />
              <InfoBox label="Aulas" value={classBreakdown(student)} />
              <InfoBox label="Faixa BJJ" value={displayBelt(student)} />
              <InfoBox label="Graus" value={String(displayStripes(student))} />
              <InfoBox label="Emissao" value={formatDate(issuedAt)} />
              <InfoBox label="Valido Ate" value={addOneYear(issuedAt)} />
            </div>

            <div className="my-8 h-px bg-zinc-800" />

            <div className="grid items-center gap-7 sm:grid-cols-[190px_1fr]">
              <img src={qr} alt="QR Check-in" className="h-48 w-48 rounded-md bg-white p-3" />
              <div>
                <p className="text-lg font-black uppercase tracking-[0.42em] text-zinc-500">QR Check-In</p>
                <p className="mt-4 font-serif text-2xl leading-relaxed text-zinc-200">
                  Escaneie este codigo na entrada para registrar a aula automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <script
        dangerouslySetInnerHTML={{
          __html: "document.addEventListener('click',function(e){if(e.target.closest('#print-button')) window.print()})",
        }}
      />
    </main>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[104px] border-b border-r border-zinc-800 px-5 py-4 last:border-b-0 odd:last:border-b sm:[&:nth-child(2n)]:border-r-0 sm:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-sm font-black uppercase tracking-[0.34em] text-zinc-500">{label}</p>
      <p className="mt-4 whitespace-pre-line font-serif text-2xl font-black text-white">{value || 'Nao informado'}</p>
    </div>
  )
}
