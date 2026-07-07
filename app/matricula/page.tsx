'use client'

import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { AppProvider } from '@/components/app-provider'
import { EnrollmentForm } from '@/components/enrollment-form'
import type { Student } from '@/lib/database'
import { Button } from '@/components/ui/button'

function PublicEnrollmentPage() {
  const [submittedStudent, setSubmittedStudent] = useState<Student | null>(null)
  const [formKey, setFormKey] = useState(0)

  const resetForm = () => {
    setSubmittedStudent(null)
    setFormKey((current) => current + 1)
  }

  if (submittedStudent) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center shadow-lg">
          <img src="/images/fju-logo.png" alt="FJU" className="h-20 object-contain" />
          <CheckCircle2 className="h-16 w-16 text-green-500" />
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Matricula realizada com sucesso!</h1>
            <p className="text-muted-foreground">
              {submittedStudent.firstName}, voce esta inscrito com sucesso. Bons treinos!
            </p>
          </div>
          <Button onClick={resetForm}>Fazer outra matricula</Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground">
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
