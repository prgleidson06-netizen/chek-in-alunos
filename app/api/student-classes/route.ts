import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { saveClassCountOverride } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { error: 'Acesso administrativo necessário' },
      { status: 401, headers: corsHeaders() },
    )
  }

  try {
    const body = await request.json()
    const studentId = String(body.studentId || '')
    const totalClasses = Number(body.totalClasses)

    if (!studentId || Number.isNaN(totalClasses)) {
      return NextResponse.json(
        { error: 'Aluno e total de aulas são obrigatórios.' },
        { status: 400, headers: corsHeaders() },
      )
    }

    const bjjClasses = body.bjjClasses === undefined ? undefined : Number(body.bjjClasses)
    const karateClasses = body.karateClasses === undefined ? undefined : Number(body.karateClasses)
    const saved = await saveClassCountOverride(studentId, totalClasses, { bjjClasses, karateClasses })
    return NextResponse.json(saved, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro POST student-classes:', error)
    return NextResponse.json(
      {
        error: 'Erro ao atualizar aulas.',
      },
      { status: 500, headers: corsHeaders() },
    )
  }
}
