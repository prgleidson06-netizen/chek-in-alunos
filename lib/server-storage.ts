import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CheckIn, Student } from '@/lib/database'

const dataDir = path.join(process.cwd(), 'data')
const studentsFile = path.join(dataDir, 'students.json')
const checkinsFile = path.join(dataDir, 'checkins.json')

let cachedClient: SupabaseClient | null | undefined

function getSupabaseServerClient() {
  if (cachedClient !== undefined) return cachedClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  cachedClient =
    supabaseUrl && serviceKey
      ? createClient(supabaseUrl, serviceKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })
      : null

  return cachedClient
}

export function isUsingOnlineDatabase() {
  return Boolean(getSupabaseServerClient())
}

async function ensureDataFile(filePath: string) {
  if (!fsSync.existsSync(dataDir)) {
    await fs.mkdir(dataDir, { recursive: true })
  }
  if (!fsSync.existsSync(filePath)) {
    await fs.writeFile(filePath, JSON.stringify([]))
  }
}

async function readJsonFile<T>(filePath: string): Promise<T[]> {
  try {
    if (!fsSync.existsSync(filePath)) return []
    const fileData = await fs.readFile(filePath, 'utf8')
    const parsed = JSON.parse(fileData || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function writeJsonFile<T>(filePath: string, data: T[]) {
  await ensureDataFile(filePath)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

function studentDuplicateKey(student: Pick<Student, 'firstName' | 'lastName' | 'dateOfBirth'>) {
  return `${(student.firstName || '').trim().toLowerCase()}|${(student.lastName || '').trim().toLowerCase()}|${(student.dateOfBirth || '').trim()}`
}

function rowToStudent(row: any): Student {
  return {
    ...(row.data || {}),
    id: row.id,
  } as Student
}

function rowToCheckIn(row: any): CheckIn {
  return {
    ...(row.data || {}),
    id: row.id,
  } as CheckIn
}

export async function listStudents() {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('students')
      .select('id, data')
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToStudent)
  }

  return readJsonFile<Student>(studentsFile)
}

export async function getStudent(id: string) {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('students')
      .select('id, data')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? rowToStudent(data) : undefined
  }

  const students = await readJsonFile<Student>(studentsFile)
  return students.find((student) => student.id === id)
}

export async function hasDuplicateStudent(student: Student, ignoreId?: string) {
  const key = studentDuplicateKey(student)
  const students = await listStudents()

  return students.some((item) => {
    if (ignoreId && item.id === ignoreId) return false
    return studentDuplicateKey(item) === key
  })
}

export async function saveStudentRecord(student: Student) {
  const now = new Date().toISOString()
  const nextStudent: Student = {
    ...student,
    createdAt: student.createdAt || now,
    updatedAt: now,
  }

  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.from('students').upsert({
      id: nextStudent.id,
      first_name: nextStudent.firstName || '',
      last_name: nextStudent.lastName || '',
      date_of_birth: nextStudent.dateOfBirth || null,
      email: nextStudent.email || null,
      phone: nextStudent.phone || null,
      data: nextStudent,
      updated_at: now,
    })

    if (error) throw error
    return nextStudent
  }

  const students = await readJsonFile<Student>(studentsFile)
  const exists = students.some((item) => item.id === nextStudent.id)
  const nextStudents = exists
    ? students.map((item) => (item.id === nextStudent.id ? { ...item, ...nextStudent } : item))
    : [...students, nextStudent]

  await writeJsonFile(studentsFile, nextStudents)
  return nextStudent
}

export async function replaceStudents(students: Student[]) {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const rows = students.map((student) => ({
      id: student.id,
      first_name: student.firstName || '',
      last_name: student.lastName || '',
      date_of_birth: student.dateOfBirth || null,
      email: student.email || null,
      phone: student.phone || null,
      data: student,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase.from('students').upsert(rows)
    if (error) throw error
    return students
  }

  await writeJsonFile(studentsFile, students)
  return students
}

export async function deleteStudentRecord(id: string) {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw error
    return true
  }

  const students = await readJsonFile<Student>(studentsFile)
  await writeJsonFile(
    studentsFile,
    students.filter((student) => student.id !== id),
  )
  return true
}

export async function listRecentCheckIns() {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data, error } = await supabase
      .from('checkins')
      .select('id, data')
      .gte('check_in_time', threeDaysAgo.toISOString())
      .order('check_in_time', { ascending: false })

    if (error) throw error
    return (data || []).map(rowToCheckIn)
  }

  const checkIns = await readJsonFile<CheckIn>(checkinsFile)
  const threeDaysAgo = new Date()
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  return checkIns.filter((checkIn) => {
    if (!checkIn.checkInTime) return false
    const checkInDate = new Date(checkIn.checkInTime)
    return !Number.isNaN(checkInDate.getTime()) && checkInDate >= threeDaysAgo
  })
}

export async function saveCheckInRecord(checkIn: CheckIn) {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { error } = await supabase.from('checkins').upsert({
      id: checkIn.id,
      student_id: checkIn.studentId,
      check_in_time: checkIn.checkInTime,
      data: checkIn,
    })

    if (error) throw error
    return checkIn
  }

  const checkIns = await readJsonFile<CheckIn>(checkinsFile)
  await writeJsonFile(checkinsFile, [...checkIns, checkIn])
  return checkIn
}
