import { NextResponse } from 'next/server'
import type { Student } from '@/lib/database'
import { hasDuplicateStudent, saveStudentRecord } from '@/lib/server-storage'

function jsonHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: jsonHeaders() })
}

export async function GET() {
  return NextResponse.json(
    { error: 'Esta rota aceita apenas envio de matricula.' },
    { status: 405, headers: jsonHeaders() },
  )
}

export async function POST(request: Request) {
  try {
    const student = await request.json()

    if (!student?.id || !student?.firstName || !student?.lastName || !student?.dateOfBirth) {
      return NextResponse.json(
        { error: 'Dados obrigatorios da matricula ausentes.' },
        { status: 400, headers: jsonHeaders() },
      )
    }

    if (!student?.photo || student?.photoPolicyConfirmed !== true) {
      return NextResponse.json(
        { error: 'Envie e confirme uma foto atual que mostre claramente o rosto do aluno. Paisagens, animais e objetos nao sao permitidos.' },
        { status: 400, headers: jsonHeaders() },
      )
    }

    if (await hasDuplicateStudent(student as Student)) {
      return NextResponse.json(
        { error: 'Esta matricula ja existe no sistema.' },
        { status: 400, headers: jsonHeaders() },
      )
    }

    await saveStudentRecord({
      ...student,
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Student)

    return NextResponse.json(
      { success: true, message: 'Matricula recebida com sucesso.' },
      { headers: jsonHeaders() },
    )
  } catch (error) {
    console.error('Erro public-enrollment:', error)
    return NextResponse.json(
      { error: 'Erro interno ao salvar matricula.' },
      { status: 500, headers: jsonHeaders() },
    )
  }
}
