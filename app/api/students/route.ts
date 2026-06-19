import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'students.json')

async function readStudents() {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(data)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, '[]')
    return []
  }
}

export async function GET() {
  const students = await readStudents()
  return NextResponse.json(students)
}

export async function POST(request: Request) {
  try {
    const student = await request.json()
    // Lê todos os alunos existentes primeiro para NÃO perder ninguém
    const students = await readStudents()

    const index = students.findIndex((s: any) => s.id === student.id)
    if (index !== -1) {
      // Se o aluno já existe, atualiza mantendo os dados antigos que não foram mexidos
      students[index] = { ...students[index], ...student, updatedAt: new Date().toISOString() }
    } else {
      // Se for aluno novo, adiciona na lista existente
      students.push({
        ...student,
        id: student.id || Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    // Salva a lista COMPLETA de volta no arquivo
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(students, null, 2))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    let students = await readStudents()

    students = students.filter((s: any) => s.id !== id)

    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(students, null, 2))
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
