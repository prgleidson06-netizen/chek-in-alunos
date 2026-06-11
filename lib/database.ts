export interface Student {
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

// Local Storage Keys
const STUDENTS_KEY = 'fju_students'
const CLASSES_KEY = 'fju_classes'
const CHECKINS_KEY = 'fju_checkins'
const ADMIN_KEY = 'fju_admin'
const SETTINGS_KEY = 'fju_settings'

// Helper to generate IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Student Operations
export function getStudents(): Student[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(STUDENTS_KEY)
  return data ? JSON.parse(data) : []
}

export function getStudentById(id: string): Student | undefined {
  const students = getStudents()
  return students.find(s => s.id === id)
}

export function searchStudents(query: string): Student[] {
  const students = getStudents()
  const lowerQuery = query.toLowerCase()
  return students.filter(s => 
    s.firstName.toLowerCase().includes(lowerQuery) ||
    s.lastName.toLowerCase().includes(lowerQuery) ||
    s.id.includes(lowerQuery) ||
    s.email.toLowerCase().includes(lowerQuery)
  )
}

export async function saveStudent(student: Student): Promise<Student> {
  student = {
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
  const students = getStudents()
  const existingIndex = students.findIndex(s => s.id === student.id)
  
  if (existingIndex >= 0) {
    students[existingIndex] = { ...student, updatedAt: new Date().toISOString() }
  } else {
    students.push(student)
  }
  
await fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(student),
})
return student
}
export function deleteStudent(id: string): boolean {
  const students = getStudents()
  const filtered = students.filter(s => s.id !== id)
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered))
  return filtered.length < students.length
}

// Class Operations
export function getClasses(): GymClass[] {
  if (typeof window === 'undefined') return getDefaultClasses()
  const data = localStorage.getItem(CLASSES_KEY)
  if (!data) {
    // Initialize with default classes
    const defaults = getDefaultClasses()
    localStorage.setItem(CLASSES_KEY, JSON.stringify(defaults))
    return defaults
  }
  return JSON.parse(data)
}

function getDefaultClasses(): GymClass[] {
  return [
    { id: '1', name: 'Fundamentals', instructor: 'Prof. Carlos', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', maxCapacity: 30 },
    { id: '2', name: 'All Levels', instructor: 'Prof. Maria', dayOfWeek: 1, startTime: '18:00', endTime: '19:30', maxCapacity: 30 },
    { id: '3', name: 'Kids BJJ', instructor: 'Prof. João', dayOfWeek: 2, startTime: '16:00', endTime: '17:00', maxCapacity: 20 },
    { id: '4', name: 'Advanced', instructor: 'Prof. Carlos', dayOfWeek: 2, startTime: '19:00', endTime: '20:30', maxCapacity: 25 },
    { id: '5', name: 'No-Gi', instructor: 'Prof. Maria', dayOfWeek: 3, startTime: '18:00', endTime: '19:30', maxCapacity: 30 },
    { id: '6', name: 'Competition Team', instructor: 'Prof. Carlos', dayOfWeek: 4, startTime: '19:00', endTime: '21:00', maxCapacity: 20 },
    { id: '7', name: 'Open Mat', instructor: 'All', dayOfWeek: 5, startTime: '18:00', endTime: '20:00', maxCapacity: 40 },
    { id: '8', name: 'Fundamentals', instructor: 'Prof. João', dayOfWeek: 6, startTime: '10:00', endTime: '11:30', maxCapacity: 30 },
  ]
}

export function getCurrentClass(): GymClass | null {
  const classes = getClasses()
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  return classes.find(c => 
    c.dayOfWeek === currentDay && 
    c.startTime <= currentTime && 
    c.endTime >= currentTime
  ) || null
}

export function getNextClass(): GymClass | null {
  const classes = getClasses()
  const now = new Date()
  const currentDay = now.getDay()
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  
  // First, check for classes later today
  const todayClasses = classes
    .filter(c => c.dayOfWeek === currentDay && c.startTime > currentTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
  
  if (todayClasses.length > 0) return todayClasses[0]
  
  // Otherwise, find the next class in the week
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7
    const dayClasses = classes
      .filter(c => c.dayOfWeek === checkDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    if (dayClasses.length > 0) return dayClasses[0]
  }
  
  return null
}

export function saveClass(gymClass: GymClass): GymClass {
  const classes = getClasses()
  const existingIndex = classes.findIndex(c => c.id === gymClass.id)
  
  if (existingIndex >= 0) {
    classes[existingIndex] = gymClass
  } else {
    classes.push(gymClass)
  }
  
  localStorage.setItem(CLASSES_KEY, JSON.stringify(classes))
  return gymClass
}

export function deleteClass(id: string): boolean {
  const classes = getClasses()
  const filtered = classes.filter(c => c.id !== id)
  localStorage.setItem(CLASSES_KEY, JSON.stringify(filtered))
  return filtered.length < classes.length
}

// Check-in Operations
export function getTodayCheckIns(): CheckIn[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(CHECKINS_KEY)
  if (!data) return []
  
  const all: CheckIn[] = JSON.parse(data)
  const today = new Date().toISOString().split('T')[0]
  
  return all
    .filter(c => c.checkInTime.startsWith(today))
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
}

export async function checkInStudent(studentId: string, classId?: string): Promise<CheckIn | null> { 
 const student = getStudentById(studentId)
  if (!student) return null 
  const currentClass = classId ? getClasses().find(c => c.id === classId) : getCurrentClass() || getNextClass()
  
  const checkIn: CheckIn = {
    id: generateId(),
    studentId: student.id,
    studentName: `${student.firstName} ${student.lastName}`,
    studentPhoto: student.photo,
    beltRank: student.beltRank,
    stripes: student.stripes,
    membershipType: student.membershipType,
    classId: currentClass?.id || '',
    className: currentClass?.name || 'Open Training',
    checkInTime: new Date().toISOString(),
  }
  
  // Save check-in
  await fetch('/api/checkins', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(checkIn),
})
  
  // Update student attendance
  const attendance: AttendanceRecord = {
    id: checkIn.id,
    studentId: student.id,
    classId: checkIn.classId,
    className: checkIn.className,
    checkInTime: checkIn.checkInTime,
    date: new Date().toISOString().split('T')[0],
  }
  
  student.attendanceHistory.push(attendance)
  student.totalClasses++
  await saveStudent(student)
  
  return checkIn
}

// Admin Authentication
const ADMIN_PASSWORD = 'fju2024' // In production, this would be hashed and stored securely

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_KEY, 'true')
    }
    return true
  }
  return false
}

export function adminLogout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ADMIN_KEY)
  }
}

export function isAdminLoggedIn(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ADMIN_KEY) === 'true'
}

// Settings Operations
export function getSettings(): AdminSettings {
  if (typeof window === 'undefined') return getDefaultSettings()
  const data = localStorage.getItem(SETTINGS_KEY)
  if (!data) {
    const defaults = getDefaultSettings()
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults))
    return defaults
  }
  return JSON.parse(data)
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
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// Initialize demo data
export function initializeDemoData(): void {
  if (typeof window === 'undefined') return
  
  const students = getStudents()
  if (students.length > 0) return // Already has data
  
  const demoStudents: Student[] = [
    {
      id: generateId(),
      firstName: 'Carlos',
      lastName: 'Silva',
      dateOfBirth: '1990-05-15',
      email: 'carlos@email.com',
      phone: '(11) 99999-1111',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      country: 'Brasil',
      emergencyName: 'Maria Silva',
      emergencyPhone: '(11) 99999-2222',
      emergencyRelationship: 'Esposa',
      allergies: '',
      medicalConditions: '',
      medications: '',
      photo: '/images/fju-badge.jpg',
      membershipType: 'monthly',
      beltRank: 'purple',
      stripes: 2,
      startDate: '2020-01-15',
      waiverSignature: 'Carlos Silva',
      waiverSignedAt: '2020-01-15T10:00:00Z',
      waiverAgreed: true,
      totalClasses: 245,
      attendanceHistory: [],
      createdAt: '2020-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: generateId(),
      firstName: 'Ana',
      lastName: 'Oliveira',
      dateOfBirth: '1995-08-20',
      email: 'ana@email.com',
      phone: '(11) 99999-3333',
      address: 'Av. Brasil, 456',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '04567-890',
      country: 'Brasil',
      emergencyName: 'João Oliveira',
      emergencyPhone: '(11) 99999-4444',
      emergencyRelationship: 'Pai',
      allergies: 'Nenhuma',
      medicalConditions: '',
      medications: '',
      photo: '/images/fju-badge.jpg',
      membershipType: 'annual',
      beltRank: 'blue',
      stripes: 4,
      startDate: '2021-06-01',
      waiverSignature: 'Ana Oliveira',
      waiverSignedAt: '2021-06-01T10:00:00Z',
      waiverAgreed: true,
      totalClasses: 180,
      attendanceHistory: [],
      createdAt: '2021-06-01T10:00:00Z',
      updatedAt: '2024-01-10T10:00:00Z',
    },
    {
      id: generateId(),
      firstName: 'Pedro',
      lastName: 'Santos',
      dateOfBirth: '1988-03-10',
      email: 'pedro@email.com',
      phone: '(11) 99999-5555',
      address: 'Rua Augusta, 789',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01305-100',
      country: 'Brasil',
      emergencyName: 'Lucia Santos',
      emergencyPhone: '(11) 99999-6666',
      emergencyRelationship: 'Mãe',
      allergies: '',
      medicalConditions: '',
      medications: '',
      photo: '/images/fju-badge.jpg',
      membershipType: 'quarterly',
      beltRank: 'brown',
      stripes: 1,
      startDate: '2018-09-01',
      waiverSignature: 'Pedro Santos',
      waiverSignedAt: '2018-09-01T10:00:00Z',
      waiverAgreed: true,
      totalClasses: 420,
      attendanceHistory: [],
      createdAt: '2018-09-01T10:00:00Z',
      updatedAt: '2024-01-20T10:00:00Z',
    },
    {
      id: generateId(),
      firstName: 'Lucas',
      lastName: 'Mendes',
      dateOfBirth: '2010-12-05',
      email: 'lucas.pai@email.com',
      phone: '(11) 99999-7777',
      address: 'Rua Bela Vista, 321',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '02345-678',
      country: 'Brasil',
      emergencyName: 'Roberto Mendes',
      emergencyPhone: '(11) 99999-8888',
      emergencyRelationship: 'Pai',
      allergies: 'Amendoim',
      medicalConditions: '',
      medications: '',
      photo: '/images/fju-badge.jpg',
      membershipType: 'monthly',
      beltRank: 'white',
      stripes: 3,
      startDate: '2023-03-01',
      guardianName: 'Roberto Mendes',
      guardianRelationship: 'Pai',
      guardianPhone: '(11) 99999-8888',
      waiverSignature: 'Roberto Mendes',
      waiverSignedAt: '2023-03-01T10:00:00Z',
      waiverAgreed: true,
      totalClasses: 45,
      attendanceHistory: [],
      createdAt: '2023-03-01T10:00:00Z',
      updatedAt: '2024-01-25T10:00:00Z',
    },
    {
      id: generateId(),
      firstName: 'Fernanda',
      lastName: 'Costa',
      dateOfBirth: '1992-07-18',
      email: 'fernanda@email.com',
      phone: '(11) 99999-9999',
      address: 'Av. Paulista, 1000',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100',
      country: 'Brasil',
      emergencyName: 'Ricardo Costa',
      emergencyPhone: '(11) 99999-0000',
      emergencyRelationship: 'Marido',
      allergies: '',
      medicalConditions: '',
      medications: '',
      photo: '/images/fju-badge.jpg',
      membershipType: 'annual',
      beltRank: 'black',
      stripes: 1,
      startDate: '2015-01-10',
      waiverSignature: 'Fernanda Costa',
      waiverSignedAt: '2015-01-10T10:00:00Z',
      waiverAgreed: true,
      totalClasses: 890,
      attendanceHistory: [],
      createdAt: '2015-01-10T10:00:00Z',
      updatedAt: '2024-01-28T10:00:00Z',
    },
  ]
  
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(demoStudents))
}
