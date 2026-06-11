import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'students.json')

async function readStudents() {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
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
  const student = await request.json()
  const students = await readStudents()

  const key = (s: any) =>
    (s.email || `${s.firstName}-${s.lastName}-${s.phone}`)
      .toLowerCase()
      .trim()

  const index = students.findIndex((s: any) => s.id === student.id)

  if (index >= 0) {
    students[index] = { ...students[index], ...student, updatedAt: new Date().toISOString() }
  } else {
    students.push({
      ...student,
      id: student.id || Date.now().toString(),
      createdAt: student.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }

  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(filePath, JSON.stringify(students, null, 2))

  return NextResponse.json({ success: true })
}