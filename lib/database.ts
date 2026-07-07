import { supabase } from './supabase'

export interface AttendanceRecord {
  id: string
  studentId: string
  classId: string
  className: string
  checkInTime: string
  date: string
}

export interface GymClass { 
  id: string
  name: string
  instructor: string
  dayOfWeek: number // 0-6 (Sunday-Saturday)
  startTime: string // HH:MM format
  endTime: string   // HH:MM format
  maxCapacity: number
  description?: string
}

export interface CheckIn {
  id: string
  studentId: string
  studentName: string
  studentPhoto: string
  beltRank: string
  stripes: number
  membershipType: string
  classId: string
  className: string
  checkInTime: string
}

export interface AdminSettings {
  gymName: string
  gymCapacity: number
  announcements: string[]
  defaultLanguage: string
}

export interface Student {
  programs?: {
    bjj: boolean
    karate: boolean
  }
  bjj?: {
    beltRank: string
    stripes: number
    classes: number
  }
  karate?: {
    beltRank: string
    kyu: number
    classes: number
  }
  programChoice?: string;
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  emergencyName: string
  emergencyPhone: string
  emergencyRelationship: string
  allergies: string
  medicalConditions: string
  medications: string
  photo: string
  membershipType: 'monthly' | 'quarterly' | 'annual' | 'trial'
  beltRank: 'white' | 'blue' | 'purple' | 'brown' | 'black'
  stripes: number
  startDate: string
  guardianName?: string
  guardianRelationship?: string
  guardianPhone?: string
  waiverSignature: string
  waiverSignedAt: string
  waiverAgreed: boolean
  totalClasses: number
  attendanceHistory: AttendanceRecord[]
  createdAt: string
  updatedAt: string
}

// Helper to generate IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// ==========================================
// Student Operations (Supabase)
// ==========================================
export async function getStudents(): Promise<Student[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('firstName', { ascending: true })

    if (error) {
      console.log('Aviso: Erro ao buscar alunos no banco')
      return []
    }
    return (data as Student[]) || []
  } catch (err) {
    return []
  }
}

export async function getStudentById(id: string): Promise<Student | undefined> {
  if (!supabase) return undefined

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.log('Aviso: Erro ao buscar aluno por ID')
      return undefined
    }
    return (data as Student) || undefined
  } catch (err) {
    return undefined
  }
}

export async function searchStudents(query: string): Promise<Student[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .or(`firstName.ilike.%${query}%,lastName.ilike.%${query}%,email.ilike.%${query}%`)

    if (error) {
      console.log('Aviso: Erro ao pesquisar alunos')
      return []
    }
    return (data as Student[]) || []
  } catch (err) {
    return []
  }
}

export async function saveStudent(student: Student): Promise<Student> {
  if (!supabase) return student

  const studentData = {
    ...student,
    photo: student.photo || '/images/fju-badge.jpg',
    attendanceHistory: student.attendanceHistory || [],
    totalClasses: student.totalClasses || 0,
    stripes: student.stripes || 0,
    beltRank: student.beltRank || 'white',
    membershipType: student.membershipType || 'monthly',
    createdAt: student.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('students')
    .upsert(studentData)

  if (error) {
    console.log('Aviso: Erro ao salvar aluno no Supabase')
    throw error
  }

  return studentData as Student
}

export async function deleteStudent(id: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Aviso: Erro ao deletar aluno')
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

// ==========================================
// Class Operations (Supabase)
// ==========================================
export async function getClasses(): Promise<GymClass[]> {
  if (!supabase) return []

  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('dayOfWeek', { ascending: true })
      .order('startTime', { ascending: true })

    if (error) {
      console.log('Aviso: Tabela de aulas nao encontrada ou vazia no Supabase.')
      return []
    }
    return (data as GymClass[]) || []
  } catch (err) {
    return []
  }
}

export async function saveClass(gymClass: GymClass): Promise<GymClass> {
  if (!supabase) return gymClass

  const { error } = await supabase
    .from('classes')
    .upsert(gymClass)

  if (error) {
    console.log('Aviso: Erro ao salvar aula no Supabase')
    throw error
  }
  return gymClass
}

export async function deleteClass(id: string): Promise<boolean> {
  if (!supabase) return false

  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id)

    if (error) {
      console.log('Aviso: Erro ao deletar aula')
      return false
    }
    return true
  } catch (err) {
    return false
  }
}

// ==========================================
// Check-in Operations (Supabase) - VERSÃO ANTI-TRAVAMENTO
// ==========================================
export async function getTodayCheckIns(): Promise<CheckIn[]> {
  if (!supabase) return []

  try {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .gte('checkInTime', `${today}T00:00:00.000Z`)
      .lte('checkInTime', `${today}T23:59:59.999Z`)
      .order('checkInTime', { ascending: false })

    if (error) {
      console.log('Aviso: Erro ao buscar check-ins de hoje (ignorado).')
      return []
    }
    return (data as CheckIn[]) || []
  } catch (err) {
    return []
  }
}

export async function checkInStudent(studentId: string, classId?: string): Promise<CheckIn | null> { 
  if (!supabase) return null

  const student = await getStudentById(studentId)
  if (!student) {
    console.log('Aviso: Estudante não encontrado')
    return null
  }

  let targetClass: GymClass | null = null
  const classes = await getClasses()
  
  if (classId) {
    targetClass = classes.find(c => c.id === classId) || null
  } else {
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    targetClass = classes.find(c => 
      c.dayOfWeek === currentDay && 
      c.startTime <= currentTime && 
      c.endTime >= currentTime
    ) || null
  }

  if (!targetClass) {
    console.log('Aviso: Nenhuma aula disponível para check-in neste horário.')
    return null
  }

  const checkInTime = new Date().toISOString()
  const newCheckIn: CheckIn = {
    id: generateId(),
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentPhoto: student.photo || '/images/fju-badge.jpg',
    beltRank: student.beltRank,
    stripes: student.stripes,
    membershipType: student.membershipType,
    classId: targetClass.id,
    className: targetClass.name,
    checkInTime
  }

  const { error: checkInError } = await supabase.from('checkins').insert(newCheckIn)
  if (checkInError) {
    console.log('Aviso: Erro ao registrar check-in')
    return null
  }

  const attendanceRecord: AttendanceRecord = {
    id: generateId(),
    studentId: student.id,
    classId: targetClass.id,
    className: targetClass.name,
    checkInTime,
    date: checkInTime.split('T')[0]
  }

  const updatedStudent: Student = {
    ...student,
    totalClasses: (student.totalClasses || 0) + 1,
    attendanceHistory: [...(student.attendanceHistory || []), attendanceRecord]
  }

  await saveStudent(updatedStudent)
  return newCheckIn
}

// ==========================================
// Admin & Settings (LocalStorage)
// ==========================================
const ADMIN_PASSWORD = 'fju2024'

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fju_admin', 'true')
    }
    return true
  }
  return false
}

export function adminLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('fju_admin')
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('fju_admin') === 'true'
}

export function getSettings(): AdminSettings {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('fju_settings')
    if (!data) {
      const defaults = getDefaultSettings()
      localStorage.setItem('fju_settings', JSON.stringify(defaults))
      return defaults
    }
    return JSON.parse(data)
  }
  return getDefaultSettings()
}

function getDefaultSettings(): AdminSettings {
  return {
    gymName: 'FJU Artes Marciais',
    gymCapacity: 50,
    announcements: ['Bem-vindo ao FJU BJJ Academy!', 'Competição regional em 2 semanas'],
    defaultLanguage: 'pt',
  }
}

export function saveSettings(settings: AdminSettings): void {
  localStorage.setItem('fju_settings', JSON.stringify(settings))
}

export function initializeDemoData(): void {}

// ==========================================
// Horários e Aulas Atuais
// ==========================================
export async function getCurrentClass(): Promise<GymClass | null> {
  const classes = await getClasses()
  if (!classes || classes.length === 0) return null

  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return classes.find(c => 
    c.dayOfWeek === currentDay && 
    c.startTime <= currentTime && 
    c.endTime >= currentTime
  ) || null
}

export async function getNextClass(): Promise<GymClass | null> {
  const classes = await getClasses()
  if (!classes || classes.length === 0) return null

  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  const todayUpcoming = classes
    .filter(c => c.dayOfWeek === currentDay && c.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  if (todayUpcoming.length > 0) {
    return todayUpcoming[0]
  }

  for (let i = 1; i <= 7; i++) {
    const nextDay = (currentDay + i) % 7
    const nextDayClasses = classes
      .filter(c => c.dayOfWeek === nextDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      
    if (nextDayClasses.length > 0) {
      return nextDayClasses[0]
    }
  }

  return null
}
