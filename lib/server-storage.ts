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

function rowToStudentSummary(row: any): Student {
  return {
    id: row.id,
    firstName: row.first_name || '',
    lastName: row.last_name || '',
    dateOfBirth: row.date_of_birth || '',
    email: row.email || '',
    phone: row.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    allergies: '',
    medicalConditions: '',
    medications: '',
    photo: '/images/fju-badge.jpg',
    membershipType: 'monthly',
    beltRank: 'white',
    stripes: 0,
    startDate: '',
    waiverSignature: '',
    waiverSignedAt: '',
    waiverAgreed: false,
    totalClasses: 0,
    attendanceHistory: [],
    createdAt: '',
    updatedAt: row.updated_at || '',
  } as Student
}

function rowToCheckIn(row: any): CheckIn {
  return {
    ...(row.data || {}),
    id: row.id,
  } as CheckIn
}

function normalizeCheckIn(checkIn: CheckIn): CheckIn {
  const now = new Date().toISOString()
  return {
    ...checkIn,
    id: checkIn.id || `${checkIn.studentId || 'checkin'}-${Date.now()}`,
    checkInTime: checkIn.checkInTime || now,
  }
}

function checkInsFromStudents(students: Student[]) {
  const checkIns: CheckIn[] = []

  for (const student of students) {
    for (const record of student.attendanceHistory || []) {
      checkIns.push({
        id: record.id,
        studentId: record.studentId || student.id,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        studentPhoto: student.photo || '/images/fju-badge.jpg',
        beltRank: student.beltRank || 'white',
        stripes: student.stripes || 0,
        membershipType: student.membershipType || 'monthly',
        classId: record.classId || 'open-mat',
        className: record.className || 'Open Mat',
        checkInTime: record.checkInTime,
      })
    }
  }

  return checkIns
}

async function saveCheckInOnStudent(checkIn: CheckIn) {
  if (!checkIn.studentId) return

  const student = await getStudent(checkIn.studentId)
  if (!student) return

  const attendanceHistory = Array.isArray(student.attendanceHistory)
    ? student.attendanceHistory
    : []

  if (attendanceHistory.some((record) => record.id === checkIn.id)) return

  const checkInTime = checkIn.checkInTime || new Date().toISOString()
  await saveStudentRecord({
    ...student,
    totalClasses: Math.max(Number(student.totalClasses || 0) + 1, 1),
    attendanceHistory: [
      ...attendanceHistory,
      {
        id: checkIn.id,
        studentId: checkIn.studentId,
        classId: checkIn.classId || 'open-mat',
        className: checkIn.className || 'Open Mat',
        checkInTime,
        date: checkInTime.split('T')[0],
      },
    ],
    updatedAt: new Date().toISOString(),
  })
}

export async function listStudents() {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, date_of_birth, email, phone, updated_at')
      .order('first_name', { ascending: true })

    if (error) throw error
    return (data || []).map(rowToStudentSummary)
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
    const { data: existingRow } = await supabase
      .from('students')
      .select('data')
      .eq('id', nextStudent.id)
      .maybeSingle()

    const mergedStudent = {
      ...(existingRow?.data || {}),
      ...nextStudent,
      totalClasses: Math.max(
        Number(nextStudent.totalClasses || 0),
        Number(existingRow?.data?.totalClasses || 0),
      ),
      attendanceHistory:
        nextStudent.attendanceHistory || existingRow?.data?.attendanceHistory || [],
      waiverSignature:
        nextStudent.waiverSignature || existingRow?.data?.waiverSignature || '',
      photo:
        nextStudent.photo && nextStudent.photo !== '/images/fju-badge.jpg'
          ? nextStudent.photo
          : existingRow?.data?.photo || nextStudent.photo || '/images/fju-badge.jpg',
      createdAt: nextStudent.createdAt || existingRow?.data?.createdAt || now,
      updatedAt: now,
    } as Student

    const { error } = await supabase.from('students').upsert({
      id: mergedStudent.id,
      first_name: mergedStudent.firstName || '',
      last_name: mergedStudent.lastName || '',
      date_of_birth: mergedStudent.dateOfBirth || null,
      email: mergedStudent.email || null,
      phone: mergedStudent.phone || null,
      data: mergedStudent,
      updated_at: now,
    })

    if (error) throw error
    return mergedStudent
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

    if (error) {
      const students = await listStudents()
      return checkInsFromStudents(students)
        .filter((checkIn) => {
          const checkInDate = new Date(checkIn.checkInTime)
          return !Number.isNaN(checkInDate.getTime()) && checkInDate >= threeDaysAgo
        })
        .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
    }

    const directCheckIns = (data || []).map(rowToCheckIn)
    if (directCheckIns.length > 0) return directCheckIns

    const { data: studentRows } = await supabase
      .from('students')
      .select('id, data')

    return (studentRows || [])
      .map(rowToStudent)
      .flatMap((student) => checkInsFromStudents([student]))
      .filter((checkIn) => {
        const checkInDate = new Date(checkIn.checkInTime)
        return !Number.isNaN(checkInDate.getTime()) && checkInDate >= threeDaysAgo
      })
      .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
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
  const nextCheckIn = normalizeCheckIn(checkIn)
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const canonicalRow = {
      id: nextCheckIn.id,
      student_id: nextCheckIn.studentId,
      check_in_time: nextCheckIn.checkInTime,
      data: nextCheckIn,
    }

    const { error } = await supabase.from('checkins').upsert(canonicalRow)
    if (!error) return nextCheckIn

    const legacyRow = {
      id: nextCheckIn.id,
      studentId: nextCheckIn.studentId,
      studentName: nextCheckIn.studentName,
      studentPhoto: nextCheckIn.studentPhoto,
      beltRank: nextCheckIn.beltRank,
      stripes: nextCheckIn.stripes,
      membershipType: nextCheckIn.membershipType,
      classId: nextCheckIn.classId,
      className: nextCheckIn.className,
      checkInTime: nextCheckIn.checkInTime,
    }

    const { error: legacyError } = await supabase.from('checkins').upsert(legacyRow)
    if (legacyError) {
      console.error('Erro ao salvar check-in no Supabase:', legacyError.message)
    }

    await saveCheckInOnStudent(nextCheckIn)
    return nextCheckIn
  }

  const checkIns = await readJsonFile<CheckIn>(checkinsFile)
  await writeJsonFile(checkinsFile, [...checkIns, nextCheckIn])

  const students = await readJsonFile<Student>(studentsFile)
  const nextStudents = students.map((student) => {
    if (student.id !== nextCheckIn.studentId) return student
    const attendanceHistory = Array.isArray(student.attendanceHistory) ? student.attendanceHistory : []
    if (attendanceHistory.some((record) => record.id === nextCheckIn.id)) return student
    return {
      ...student,
      totalClasses: Number(student.totalClasses || 0) + 1,
      attendanceHistory: [
        ...attendanceHistory,
        {
          id: nextCheckIn.id,
          studentId: nextCheckIn.studentId,
          classId: nextCheckIn.classId || 'open-mat',
          className: nextCheckIn.className || 'Open Mat',
          checkInTime: nextCheckIn.checkInTime,
          date: nextCheckIn.checkInTime.split('T')[0],
        },
      ],
      updatedAt: new Date().toISOString(),
    }
  })
  await writeJsonFile(studentsFile, nextStudents)

  return nextCheckIn
}
