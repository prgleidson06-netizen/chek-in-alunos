import { cookies } from 'next/headers'
import { isValidAdminSession } from '@/lib/admin-auth'
import { getStudent } from '@/lib/server-storage'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ id: string }> }

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

function valueOrEmpty(value: unknown) {
  return value === undefined || value === null || value === '' ? 'Nao informado' : String(value)
}

export default async function StudentPrintPage({ params }: PageProps) {
  const cookieStore = await cookies()
  const session = cookieStore.get('fju_admin_session')?.value

  if (!isValidAdminSession(session)) {
    return <main className="min-h-screen bg-white p-8 text-zinc-950"><h1 className="text-2xl font-bold">Acesso administrativo necessario</h1></main>
  }

  const { id } = await params
  const student: any = await getStudent(decodeURIComponent(id))

  if (!student) {
    return <main className="min-h-screen bg-white p-8 text-zinc-950"><h1 className="text-2xl font-bold">Aluno nao encontrado</h1></main>
  }

  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.name || 'Aluno FJU'
  const signerName = student.guardianName || student.signatureName || fullName
  const signerLabel = student.guardianName ? 'Assinatura do responsavel' : 'Assinatura do aluno'
  const photo = `/api/student-photo/${encodeURIComponent(student.id)}?v=${encodeURIComponent(student.updatedAt || student.createdAt || student.id)}`
  const signature = `/api/student-signature/${encodeURIComponent(student.id)}?v=${encodeURIComponent(student.waiverSignedAt || student.updatedAt || student.id)}`
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(`https://fju-martial-arts.vercel.app/id-card/${student.id}`)}`
  const totalClasses = Number(student.totalClasses || student.bjj?.classes || 0)

  return (
    <main className="min-h-screen bg-white p-8 text-zinc-950">
      <style>{`@media print{body{background:#fff!important}.print-actions{display:none!important}main{padding:0!important}.sheet{border:0!important;box-shadow:none!important}}`}</style>
      <script dangerouslySetInnerHTML={{ __html: "document.addEventListener('DOMContentLoaded',function(){var b=document.querySelector('[data-print]');if(b)b.addEventListener('click',function(){window.print()})})" }} />
      <div className="print-actions mx-auto mb-6 flex max-w-5xl gap-3">
        <button data-print className="rounded bg-red-600 px-5 py-3 font-bold text-white">Imprimir / Salvar PDF</button>
        <a href="/" className="rounded border border-zinc-400 px-5 py-3 font-bold">Voltar</a>
      </div>

      <section className="sheet relative mx-auto max-w-5xl overflow-hidden border border-zinc-300 bg-white p-8 shadow-sm">
        <img src="/images/fju-watermark-circle.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[580px] -translate-x-1/2 -translate-y-1/2 opacity-[0.045] grayscale" />
        <div className="relative z-10">
          <header className="mb-6 flex items-center justify-between border-b-4 border-red-600 pb-5">
            <div className="flex items-center gap-4">
              <img src="/images/fju-logo-user.png" alt="FJU" className="h-16 object-contain" />
              <div><div className="text-3xl font-black text-red-700">FJU ARTES MARCIAIS</div><div className="text-sm uppercase tracking-[0.2em]">United States & Canada</div></div>
            </div>
            <div className="flex items-center gap-4"><img src={qr} alt="QR ID do aluno" className="h-24 w-24 rounded border bg-white p-1" /><img src={photo} alt={fullName} className="h-28 w-28 rounded-lg border object-cover" /></div>
          </header>

          <div className="mb-6 flex items-start justify-between gap-6">
            <div><h1 className="text-3xl font-black">Ficha Completa do Aluno</h1><p className="mt-1 font-mono text-sm text-zinc-600">ID: {student.id}</p></div>
            <div className="rounded-lg border border-zinc-300 p-4 text-center"><p className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">Total de aulas</p><p className="text-3xl font-black text-red-700">{totalClasses}</p></div>
          </div>

          <Section title="Dados Pessoais"><Info label="Nome" value={fullName} /><Info label="Data de nascimento" value={formatDate(student.dateOfBirth)} /><Info label="Email" value={student.email} /><Info label="Telefone" value={student.phone} /><Info label="Endereco" value={student.address} /><Info label="Cidade/Estado" value={`${student.city || ''} - ${student.state || ''}`} /><Info label="CEP" value={student.zipCode} /><Info label="Pais" value={student.country} /></Section>
          <Section title="Programas e Graduacao"><Info label="Jiu-Jitsu" value={student.programs?.bjj ? 'Sim' : 'Nao'} /><Info label="Karate" value={student.programs?.karate ? 'Sim' : 'Nao'} /><Info label="Faixa BJJ" value={student.bjj?.beltRank || student.beltRank} /><Info label="Graus BJJ" value={student.bjj?.stripes ?? student.stripes ?? 0} /><Info label="Aulas BJJ" value={student.bjj?.classes ?? totalClasses} /><Info label="Faixa Karate" value={student.karate?.beltRank} /><Info label="Kyu Karate" value={student.karate?.kyu ? `${student.karate.kyu} Kyu` : ''} /><Info label="Aulas Karate" value={student.karate?.classes ?? 0} /></Section>
          <Section title="Contato de Emergencia"><Info label="Nome" value={student.emergencyName} /><Info label="Telefone" value={student.emergencyPhone} /><Info label="Relacao" value={student.emergencyRelationship} /></Section>
          {(student.guardianName || student.guardianPhone || student.guardianRelationship) && <Section title="Responsavel"><Info label="Nome" value={student.guardianName} /><Info label="Telefone" value={student.guardianPhone} /><Info label="Parentesco" value={student.guardianRelationship} /></Section>}
          <Section title="Informacoes Medicas"><Info label="Alergias" value={student.allergies || 'Nenhuma'} /><Info label="Condicoes medicas" value={student.medicalConditions || 'Nenhuma'} /><Info label="Medicamentos" value={student.medications || 'Nenhum'} /></Section>

          <section className="mt-7 break-inside-avoid"><h2 className="mb-3 border-b border-zinc-300 pb-1 text-xl font-bold text-red-700">Termo de Responsabilidade</h2><p className="text-sm leading-6">Declaro que as informacoes fornecidas nesta ficha sao verdadeiras. Reconheco que a pratica de artes marciais envolve riscos fisicos e autorizo o registro interno da matricula, presencas, fotos e assinaturas para administracao do projeto FJU.</p></section>
          <section className="mt-7 break-inside-avoid"><h2 className="mb-3 border-b border-zinc-300 pb-1 text-xl font-bold text-red-700">Assinatura para Arquivo</h2><div className="rounded-lg border border-zinc-300 bg-white p-4"><div className="flex min-h-36 flex-col justify-end"><img src={signature} alt={`Assinatura de ${signerName}`} className="mx-auto mb-2 max-h-28 max-w-sm object-contain" /><div className="mx-auto mb-2 w-full max-w-sm border-t border-zinc-950" /><div className="text-center text-sm leading-6"><div className="font-bold">{signerName}</div><div>{signerLabel}</div>{student.guardianRelationship && <div>Parentesco: {student.guardianRelationship}</div>}{student.waiverSignedAt && <div>Assinado em: {formatDate(student.waiverSignedAt)}</div>}</div></div></div></section>
        </div>
      </section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) { return <section className="mt-7 break-inside-avoid"><h2 className="mb-3 border-b border-zinc-300 pb-1 text-xl font-bold text-red-700">{title}</h2><div className="grid grid-cols-2 gap-x-8 gap-y-2">{children}</div></section> }
function Info({ label, value }: { label: string; value: unknown }) { return <div className="text-sm"><span className="font-bold">{label}:</span> {valueOrEmpty(value)}</div> }
