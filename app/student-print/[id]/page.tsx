import { promises as fs } from 'fs'
import path from 'path'
import { cookies } from 'next/headers'
import { isValidAdminSession } from '@/lib/admin-auth'
import type { Student } from '@/lib/database'
import type { ReactNode } from 'react'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

const dataFile = path.join(process.cwd(), 'data', 'students.json')

async function getStudent(id: string) {
  try {
    const fileData = await fs.readFile(dataFile, 'utf8')
    const students = JSON.parse(fileData || '[]')
    return Array.isArray(students)
      ? students.find((student: Student) => student.id === id) as Student | undefined
      : undefined
  } catch {
    return undefined
  }
}

function formatDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('pt-BR')
}

export default async function StudentPrintPage({ params }: PageProps) {
  const cookieStore = await cookies()
  const session = cookieStore.get('fju_admin_session')?.value

  if (!isValidAdminSession(session)) {
    return (
      <main className="min-h-screen bg-white p-8 text-zinc-950">
        <h1 className="text-2xl font-bold">Acesso administrativo necessario</h1>
      </main>
    )
  }

  const { id } = await params
  const student = await getStudent(decodeURIComponent(id))

  if (!student) {
    return (
      <main className="min-h-screen bg-white p-8 text-zinc-950">
        <h1 className="text-2xl font-bold">Aluno nao encontrado</h1>
      </main>
    )
  }

  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim()
  const signerName = student.guardianName || fullName
  const signerLabel = student.guardianName ? 'Assinatura do responsavel' : 'Assinatura do aluno'
  const signatureIsImage = Boolean(student.waiverSignature?.startsWith('data:image'))

  return (
    <main className="min-h-screen bg-white p-8 text-zinc-950">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .print-actions { display: none !important; }
          main { padding: 0 !important; }
        }
      `}</style>

      <div className="print-actions mb-6 flex gap-3">
        <button className="rounded bg-red-600 px-4 py-2 font-semibold text-white">
          Imprimir
        </button>
      </div>

      <script dangerouslySetInnerHTML={{ __html: `
        document.addEventListener('DOMContentLoaded', function () {
          var button = document.querySelector('.print-actions button');
          if (button) button.addEventListener('click', function () { window.print(); });
          setTimeout(function () { window.print(); }, 500);
        });
      ` }} />

      <section className="relative mx-auto max-w-4xl overflow-hidden">
        <img
          src="/images/fju-watermark-circle.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-[520px] -translate-x-1/2 -translate-y-1/2 opacity-[0.045] grayscale"
        />

        <header className="relative z-10 mb-6 flex items-center justify-between border-b-4 border-red-600 pb-4">
          <div className="flex items-center gap-4">
            <img src="/images/fju-logo-user.png" alt="FJU" className="h-16 object-contain" />
            <div>
              <div className="text-3xl font-black text-red-700">FJU ARTES MARCIAIS</div>
              <div className="text-sm uppercase tracking-[0.2em]">United States & Canada</div>
            </div>
          </div>
          <img
            src={student.photo || '/images/fju-badge.jpg'}
            alt={fullName}
            className="h-28 w-28 rounded-lg border object-cover"
          />
        </header>

        <h1 className="mb-6 text-3xl font-bold">Ficha Completa do Aluno</h1>

        <Section title="Dados Pessoais">
          <Info label="Nome" value={fullName} />
          <Info label="Data de nascimento" value={student.dateOfBirth || ''} />
          <Info label="Email" value={student.email || ''} />
          <Info label="Telefone" value={student.phone || ''} />
          <Info label="Endereco" value={student.address || ''} />
          <Info label="Cidade/Estado" value={`${student.city || ''} - ${student.state || ''}`} />
          <Info label="CEP" value={student.zipCode || ''} />
          <Info label="Pais" value={student.country || ''} />
        </Section>

        <Section title="Programas">
          <Info label="Jiu-Jitsu" value={student.programs?.bjj ? 'Sim' : 'Nao'} />
          <Info label="Karate" value={student.programs?.karate ? 'Sim' : 'Nao'} />
          <Info label="Faixa BJJ" value={student.bjj?.beltRank || student.beltRank || ''} />
          <Info label="Graus BJJ" value={String(student.bjj?.stripes ?? student.stripes ?? 0)} />
          <Info label="Faixa Karate" value={student.karate?.beltRank || ''} />
          <Info label="Kyu Karate" value={student.karate?.kyu ? `${student.karate.kyu} Kyu` : ''} />
        </Section>

        <Section title="Contato de Emergencia">
          <Info label="Nome" value={student.emergencyName || ''} />
          <Info label="Telefone" value={student.emergencyPhone || ''} />
          <Info label="Relacao" value={student.emergencyRelationship || ''} />
        </Section>

        {(student.guardianName || student.guardianPhone || student.guardianRelationship) && (
          <Section title="Responsavel">
            <Info label="Nome" value={student.guardianName || ''} />
            <Info label="Telefone" value={student.guardianPhone || ''} />
            <Info label="Parentesco" value={student.guardianRelationship || ''} />
          </Section>
        )}

        <Section title="Informacoes Medicas">
          <Info label="Alergias" value={student.allergies || 'Nenhuma'} />
          <Info label="Condicoes medicas" value={student.medicalConditions || 'Nenhuma'} />
          <Info label="Medicamentos" value={student.medications || 'Nenhum'} />
        </Section>

        <section className="mt-7 break-inside-avoid">
          <h2 className="mb-3 border-b border-zinc-300 pb-1 text-xl font-bold text-red-700">
            Termo de Responsabilidade
          </h2>
          <p className="text-sm leading-6">
            Declaro que as informacoes fornecidas nesta ficha sao verdadeiras. Reconheco que a pratica de artes
            marciais, incluindo Jiu-Jitsu e Karate, envolve riscos fisicos.
          </p>
        </section>

        <section className="mt-7 break-inside-avoid">
          <h2 className="mb-3 border-b border-zinc-300 pb-1 text-xl font-bold text-red-700">
            Assinatura para Arquivo
          </h2>
          <div className="rounded-lg border border-zinc-300 bg-white p-4">
            <div className="flex min-h-32 flex-col justify-end">
              {signatureIsImage ? (
                <img
                  src={student.waiverSignature}
                  alt={`Assinatura de ${signerName}`}
                  className="mx-auto mb-2 max-h-28 max-w-sm object-contain"
                />
              ) : (
                <div className="mx-auto mb-2 mt-16 w-full max-w-sm border-t border-zinc-950" />
              )}
              <div className="text-center text-sm leading-6">
                <div className="font-bold">{signerName}</div>
                <div>{signerLabel}</div>
                {student.guardianRelationship && <div>Parentesco: {student.guardianRelationship}</div>}
                {student.waiverSignedAt && <div>Assinado em: {formatDate(student.waiverSignedAt)}</div>}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-7 break-inside-avoid">
      <h2 className="mb-3 border-b border-zinc-300 pb-1 text-xl font-bold text-red-700">{title}</h2>
      <div className="grid grid-cols-2 gap-x-8 gap-y-2">{children}</div>
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="font-bold">{label}:</span> {value}
    </div>
  )
}
