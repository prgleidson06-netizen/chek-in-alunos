import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'

const filePath = path.join(process.cwd(), 'data', 'students.json')

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

    const dirPath = path.dirname(filePath)
    if (!fsSync.existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true })
    }
    if (!fsSync.existsSync(filePath)) {
      await fs.writeFile(filePath, JSON.stringify([]))
    }

    const fileData = await fs.readFile(filePath, 'utf8')
    const students = JSON.parse(fileData || '[]')
    const currentStudents = Array.isArray(students) ? students : []

    const newKey = `${student.firstName.trim().toLowerCase()}|${student.lastName.trim().toLowerCase()}|${student.dateOfBirth.trim()}`
    const isDuplicate = currentStudents.some((item: any) => {
      const currentKey = `${(item.firstName || '').trim().toLowerCase()}|${(item.lastName || '').trim().toLowerCase()}|${(item.dateOfBirth || '').trim()}`
      return currentKey === newKey
    })

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'Esta matricula ja existe no sistema.' },
        { status: 400, headers: jsonHeaders() },
      )
    }

    const backupDir = path.join(process.cwd(), 'data', 'backups')
    if (!fsSync.existsSync(backupDir)) {
      await fs.mkdir(backupDir, { recursive: true })
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    await fs.writeFile(path.join(backupDir, `students-public-enrollment-${timestamp}.json`), fileData)

    currentStudents.push({
      ...student,
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    await fs.writeFile(filePath, JSON.stringify(currentStudents, null, 2))

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
