import { NextResponse } from 'next/server'
import type { Student } from '@/lib/database'
import { isAdminRequest } from '@/lib/admin-auth'
import {
  deleteStudentRecord,
  hasDuplicateStudent,
  listStudents,
  replaceStudents,
  saveStudentRecord,
} from '@/lib/server-storage'

function safeErrorDetails(error: unknown) {
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>
    return {
      name: typeof record.name === 'string' ? record.name : undefined,
      message: typeof record.message === 'string' ? record.message : String(error),
      code: typeof record.code === 'string' ? record.code : undefined,
      details: typeof record.details === 'string' ? record.details : undefined,
      hint: typeof record.hint === 'string' ? record.hint : undefined,
    }
  }
  return { message: String(error) }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { error: 'Acesso administrativo necessário' },
      { status: 401, headers: corsHeaders() },
    )
  }

  try {
    const students = await listStudents()
    return NextResponse.json(students, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro GET students:', error)
    const debug = new URL(request.url).searchParams.get('debug') === '1'
    return NextResponse.json(
      debug
        ? { error: 'Erro ao carregar alunos', details: safeErrorDetails(error) }
        : { error: 'Erro ao carregar alunos' },
      { status: 500, headers: corsHeaders() },
    )
  }
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

    if (body && body.id && !Array.isArray(body)) {
      const currentStudents = await listStudents()
      const exists = currentStudents.some((student) => student.id === body.id)

      if (!exists && await hasDuplicateStudent(body as Student)) {
        return NextResponse.json(
          { error: 'Este aluno já está cadastrado (Nome + Data de nascimento).' },
          { status: 400, headers: corsHeaders() },
        )
      }

      const saved = await saveStudentRecord(body as Student)
      return NextResponse.json(saved, { headers: corsHeaders() })
    }

    if (Array.isArray(body)) {
      const saved = await replaceStudents(body as Student[])
      return NextResponse.json(saved, { headers: corsHeaders() })
    }

    return NextResponse.json({ error: 'Formato inválido.' }, { status: 400, headers: corsHeaders() })
  } catch (error) {
    console.error('Erro POST students:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500, headers: corsHeaders() })
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { error: 'Acesso administrativo necessário' },
      { status: 401, headers: corsHeaders() },
    )
  }

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400, headers: corsHeaders() })
    await deleteStudentRecord(String(id))
    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro DELETE students:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500, headers: corsHeaders() })
  }
}
