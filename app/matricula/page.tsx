'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Copy, ExternalLink, Globe2, IdCard } from 'lucide-react'
import { AppProvider, useApp } from '@/components/app-provider'
import { EnrollmentForm } from '@/components/enrollment-form'
import type { Student } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import type { Language } from '@/lib/i18n'
import { languageFlags } from '@/lib/i18n'


function LanguageSelector() {
  const { language, setLanguage } = useApp()
  const languages: Array<{ code: Language; label: string }> = [
    { code: 'pt', label: 'Português' },
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border bg-card/80 px-3" aria-label="Selecionar idioma">
          <Globe2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-lg leading-none">{languageFlags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.code}
            onClick={() => setLanguage(item.code)}
            className={language === item.code ? 'bg-accent font-semibold' : ''}
          >
            <span className="mr-2 text-lg" aria-hidden="true">{languageFlags[item.code]}</span>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PublicEnrollmentPage() {
  const [submittedStudent, setSubmittedStudent] = useState<Student | null>(null)
  const [formKey, setFormKey] = useState(0)

  const resetForm = () => {
    setSubmittedStudent(null)
    setFormKey((current) => current + 1)
  }

  if (submittedStudent) {
    const studentIdPath = `/id-card/${encodeURIComponent(submittedStudent.id)}`
    const studentIdUrl = typeof window !== 'undefined' ? `${window.location.origin}${studentIdPath}` : studentIdPath
    const firstName = submittedStudent.firstName || 'Aluno'
    const bjjClasses = submittedStudent.bjj?.classes ?? 0
    const karateClasses = submittedStudent.karate?.classes ?? 0
    const hasBjj = Boolean(submittedStudent.programs?.bjj)
    const hasKarate = Boolean(submittedStudent.programs?.karate)
    const classesLabel = hasBjj && hasKarate ? `Jiu-Jitsu ${bjjClasses} / Karate ${karateClasses}` : `${submittedStudent.totalClasses ?? 0}`

    async function copyIdLink() {
      try {
        await navigator.clipboard.writeText(studentIdUrl)
        alert('Link do ID digital copiado.')
      } catch {
        alert(studentIdUrl)
      }
    }

    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto mb-4 flex max-w-xl justify-end">
          <LanguageSelector />
        </div>
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center shadow-lg">
          <img src="/images/fju-logo.png" alt="FJU" className="h-20 object-contain" />
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Matricula realizada com sucesso!</h1>
            <p className="text-muted-foreground">
              {firstName}, seu ID digital ja esta pronto para apresentar ao professor e acompanhar suas aulas em tempo real.
            </p>
          </div>

          <div className="grid w-full gap-3 rounded-lg border border-red-900/50 bg-red-950/20 p-4 text-left sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">ID do aluno</p>
              <p className="mt-1 break-all font-mono text-sm text-foreground">{submittedStudent.id}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Status</p>
              <p className="mt-1 text-lg font-black text-green-500">Ativo</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Aulas assistidas</p>
              <p className="mt-1 text-lg font-black text-foreground">{classesLabel}</p>
            </div>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1 gap-2">
              <Link href={studentIdPath} target="_blank">
                <IdCard className="h-5 w-5" /> Abrir ID Digital <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
            <Button type="button" variant="outline" onClick={copyIdLink} className="flex-1 gap-2">
              <Copy className="h-5 w-5" /> Copiar link do ID
            </Button>
          </div>
          <Button variant="ghost" onClick={resetForm}>Fazer outra matricula</Button>
        </div>
      </main>
    )
  }


  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto mb-3 flex max-w-2xl justify-end">
        <LanguageSelector />
      </div>
      <div className="mx-auto mb-6 flex max-w-2xl flex-col items-center gap-2 text-center">
        <img src="/images/fju-logo.png" alt="FJU" className="h-16 object-contain" />
        <h1 className="text-2xl font-bold">FJU BJJ Martial Arts</h1>
        <p className="text-sm text-muted-foreground">
          Preencha sua matricula. Somente a administracao tera acesso aos dados enviados.
        </p>
      </div>
      <EnrollmentForm
        key={formKey}
        submitEndpoint="/api/public-enrollment"
        cancelLabel="Limpar"
        onCancel={resetForm}
        onComplete={setSubmittedStudent}
      />
    </main>
  )
}

export default function Matricula() {
  return (
    <AppProvider>
      <PublicEnrollmentPage />
    </AppProvider>
  )
}
