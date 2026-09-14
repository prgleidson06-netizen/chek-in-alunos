import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteStudentRecord, saveStudentRecord } from '@/lib/server-storage'
import { isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

type AnyRow = Record<string, any>

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || !url.startsWith('https://') || url.includes('seu-projeto') || key.includes('sua-chave')) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return { firstName: parts[0] || 'Professor', lastName: 'FJU' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) return value.filter(Boolean).map(String)
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}


function normLocation(value: unknown) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function sameLocation(teacher: AnyRow, student: AnyRow) {
  const teacherCity = normLocation(teacher.city)
  const teacherState = normLocation(teacher.state)
  const teacherCountry = normLocation(teacher.country)
  const studentCity = normLocation(student.city)
  const studentState = normLocation(student.state)
  const studentCountry = normLocation(student.country)
  if (teacherCity && teacherState) return teacherCity === studentCity && teacherState === studentState && (!teacherCountry || !studentCountry || teacherCountry === studentCountry)
  if (teacherState) return teacherState === studentState && (!teacherCountry || !studentCountry || teacherCountry === studentCountry)
  return false
}

async function attachManagedStudentCounts(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, teachers: AnyRow[]) {
  if (!teachers.length) return teachers
  const { data, error } = await supabase.from('students').select('id, data, city, state, country').limit(10000)
  if (error || !data) return teachers
  const students = data
    .filter((row: AnyRow) => !String(row.id || '').startsWith('teacher-') && !String(row.id || '').startsWith('class-'))
    .map((row: AnyRow) => ({ ...(row.data || {}), ...row }))
  return teachers.map((teacher) => {
    const managedStudents = students.filter((student: AnyRow) => sameLocation(teacher, student))
    return { ...teacher, managedStudentCount: managedStudents.length, managedStudents: managedStudents.map((student: AnyRow) => String(student.id || '')).filter(Boolean) }
  })
}

function normalizeTeacher(row: AnyRow) {
  const data = row.data && typeof row.data === 'object' ? row.data : row
  const fullName =
    data.fullName ||
    data.full_name ||
    data.name ||
    row.full_name ||
    row.fullName ||
    row.name ||
    `${data.firstName || row.first_name || ''} ${data.lastName || row.last_name || ''}`.trim() ||
    'Professor FJU'

  const id = String(row.id || data.id || `teacher-${fullName}`)
  const photo = data.photoUrl || data.photo_url || data.photo || row.photo_url || row.photo || ''

  return {
    id,
    fullName,
    name: fullName,
    firstName: data.firstName || row.first_name || splitName(fullName).firstName,
    lastName: data.lastName || row.last_name || splitName(fullName).lastName,
    email: data.email || row.email || '',
    phone: data.phone || row.phone || '',
    birthDate: data.birthDate || data.birth_date || row.birth_date || '',
    address: data.address || row.address || '',
    city: data.city || row.city || '',
    state: data.state || row.state || '',
    country: data.country || row.country || 'USA',
    beltRank: data.beltRank || data.belt_rank || row.belt_rank || row.beltRank || '',
    yearsExperience: Number(data.yearsExperience || data.years_experience || row.years_experience || row.yearsExperience || 0),
    certifications: arrayValue(data.certifications || row.certifications),
    certificateLinks: arrayValue(data.certificateLinks || data.certificate_links || row.certificate_links),
    specialties: arrayValue(data.specialties || row.specialties),
    emergencyContactName: data.emergencyContactName || data.emergency_contact_name || row.emergency_contact_name || '',
    emergencyContactPhone: data.emergencyContactPhone || data.emergency_contact_phone || row.emergency_contact_phone || '',
    emergencyContactRelationship: data.emergencyContactRelationship || data.emergency_contact_relationship || row.emergency_contact_relationship || '',
    medicalConditions: data.medicalConditions || data.medical_conditions || row.medical_conditions || '',
    medications: data.medications || row.medications || '',
    allergies: data.allergies || row.allergies || '',
    churchLocation: data.churchLocation || data.church_location || row.church_location || '',
    activityDescription: data.activityDescription || data.activity_description || row.activity_description || '',
    role: data.role || row.role || data.volunteerRole || data.volunteer_role || row.volunteer_role || 'Professor voluntario',
    volunteerRole: data.volunteerRole || data.volunteer_role || row.volunteer_role || data.role || row.role || 'Professor voluntario',
    termsAccepted: Boolean(data.termsAccepted ?? data.terms_accepted ?? data.waiverAgreed ?? row.terms_accepted ?? row.termsAccepted ?? row.waiver_agreed ?? false),
    waiverAgreed: Boolean(data.waiverAgreed ?? data.termsAccepted ?? data.terms_accepted ?? row.waiver_agreed ?? false),
    waiverSignature: data.waiverSignature || data.waiver_signature || row.waiver_signature || '',
    signatureName: data.signatureName || data.signature_name || row.signature_name || fullName,
    guardianName: data.guardianName || data.guardian_name || row.guardian_name || '',
    guardianRelationship: data.guardianRelationship || data.guardian_relationship || row.guardian_relationship || '',
    guardianPhone: data.guardianPhone || data.guardian_phone || row.guardian_phone || '',
    termsSignedAt: data.termsSignedAt || data.terms_signed_at || data.waiverSignedAt || data.waiver_signed_at || row.waiver_signed_at || '',
    photoUrl:
      photo && (photo.startsWith('supabase-storage:') || photo.startsWith('data:image/'))
        ? `/api/student-photo/${encodeURIComponent(id)}`
        : photo && photo.startsWith('/api/student-photo/')
          ? photo
          : photo || `/api/student-photo/${encodeURIComponent(id)}`,
    language: data.language || row.language || 'pt',
    status: data.status || row.status || 'active',
    videoLinks: arrayValue(data.videoLinks || data.video_links || data.lessonVideoLinks || data.lesson_video_links || row.video_links),
    lessonVideos: Array.isArray(data.lessonVideos || data.lesson_videos || row.lesson_videos) ? data.lessonVideos || data.lesson_videos || row.lesson_videos : [],
    createdAt: data.createdAt || data.created_at || row.created_at || '',
    updatedAt: data.updatedAt || data.updated_at || row.updated_at || '',
    source: row.__source || 'students:teacher-*',
  }
}

async function readTable(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, table: string) {
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false }).limit(1000)
  if (error) return { teachers: [], error }
  return { teachers: (data || []).map((row) => normalizeTeacher({ ...row, __source: table })), error: null }
}

async function readTeacherRecords(supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>) {
  const { data, error } = await supabase.from('students').select('*').like('id', 'teacher-%').limit(1000)
  if (error) return { teachers: [], error }
  return { teachers: (data || []).map((row) => normalizeTeacher({ ...row, ...(row.data || {}), __source: 'students:teacher-*' })), error: null }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient()
    if (!supabase) return NextResponse.json({ teachers: [] }, { headers: corsHeaders() })

    const debug = new URL(request.url).searchParams.get('debug') === '1'
    const attempts: Array<{ table: string; count: number; error?: string }> = []

    const teacherRecords = await readTeacherRecords(supabase)
    attempts.push({ table: 'students:teacher-*', count: teacherRecords.teachers.length, error: teacherRecords.error?.message })
    if (teacherRecords.teachers.length > 0) {
      const teachersWithCounts = await attachManagedStudentCounts(supabase, teacherRecords.teachers)
      return NextResponse.json(debug ? { teachers: teachersWithCounts, source: 'students:teacher-*', attempts } : { teachers: teachersWithCounts }, { headers: corsHeaders() })
    }

    for (const table of ['volunteer_teachers', 'teachers']) {
      const result = await readTable(supabase, table)
      attempts.push({ table, count: result.teachers.length, error: result.error?.message })
      if (result.teachers.length > 0) {
        const teachersWithCounts = await attachManagedStudentCounts(supabase, result.teachers)
        return NextResponse.json(debug ? { teachers: teachersWithCounts, source: table, attempts } : { teachers: teachersWithCounts }, { headers: corsHeaders() })
      }
    }

    return NextResponse.json(debug ? { teachers: [], attempts } : { teachers: [] }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro GET teachers:', error)
    return NextResponse.json({ teachers: [], error: 'Erro ao carregar professores' }, { status: 500, headers: corsHeaders() })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const fullName = String(body.fullName || body.full_name || body.name || '').trim()
    const email = String(body.email || '').trim()

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Nome completo e email sao obrigatorios.' }, { status: 400, headers: corsHeaders() })
    }

    const id = String(body.id || `teacher-${crypto.randomUUID()}`)
    const { firstName, lastName } = splitName(fullName)
    const now = new Date().toISOString()

    const teacherPayload: any = {
      id,
      firstName,
      lastName,
      fullName,
      email,
      phone: body.phone || '',
      dateOfBirth: body.birthDate || body.birth_date || '',
      address: body.address || '',
      city: body.city || '',
      state: body.state || '',
      country: body.country || 'USA',
      photo: body.photo || body.photoUrl || body.photo_url || '/images/fju-badge.jpg',
      membershipType: 'teacher',
      beltRank: body.beltRank || body.belt_rank || '',
      stripes: 0,
      programs: { bjj: false, karate: false },
      startDate: body.startDate || now.split('T')[0],
      waiverSignature: body.signature || body.waiverSignature || body.waiver_signature || '',
      waiverSignedAt: body.waiverSignedAt || body.waiver_signed_at || body.termsSignedAt || now,
      waiverAgreed: Boolean(body.termsAccepted ?? body.terms_accepted ?? body.waiverAgreed ?? true),
      termsAccepted: Boolean(body.termsAccepted ?? body.terms_accepted ?? body.waiverAgreed ?? true),
      termsSignedAt: body.termsSignedAt || body.terms_signed_at || now,
      signatureName: body.signatureName || body.signature_name || fullName,
      guardianName: body.guardianName || body.guardian_name || '',
      guardianRelationship: body.guardianRelationship || body.guardian_relationship || '',
      guardianPhone: body.guardianPhone || body.guardian_phone || '',
      totalClasses: 0,
      attendanceHistory: [],
      volunteerRole: body.volunteerRole || body.volunteer_role || 'Professor voluntario',
      yearsExperience: Number(body.yearsExperience || body.years_experience || 0),
      certifications: arrayValue(body.certifications),
      certificateLinks: arrayValue(body.certificateLinks || body.certificate_links),
      specialties: arrayValue(body.specialties),
      churchLocation: body.churchLocation || body.church_location || '',
      activityDescription: body.activityDescription || body.activity_description || '',
      emergencyContactName: body.emergencyContactName || body.emergency_contact_name || '',
      emergencyContactPhone: body.emergencyContactPhone || body.emergency_contact_phone || '',
      emergencyContactRelationship: body.emergencyContactRelationship || body.emergency_contact_relationship || '',
      medicalConditions: body.medicalConditions || body.medical_conditions || '',
      medications: body.medications || '',
      allergies: body.allergies || '',
      status: body.status || 'active',
      language: body.language || 'pt',
      kind: 'volunteer-teacher',
      createdAt: body.createdAt || now,
      updatedAt: now,
    }

    const saved = await saveStudentRecord(teacherPayload)
    return NextResponse.json({ success: true, teacher: normalizeTeacher({ id, data: saved }) }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro POST teachers:', error)
    return NextResponse.json({ error: 'Erro ao salvar professor.' }, { status: 500, headers: corsHeaders() })
  }
}

export async function DELETE(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Acesso administrativo necessario.' }, { status: 401, headers: corsHeaders() })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'ID obrigatorio.' }, { status: 400, headers: corsHeaders() })
    if (!id.startsWith('teacher-')) return NextResponse.json({ error: 'ID de professor invalido.' }, { status: 400, headers: corsHeaders() })

    await deleteStudentRecord(id)
    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro DELETE teachers:', error)
    return NextResponse.json({ error: 'Erro ao apagar professor.' }, { status: 500, headers: corsHeaders() })
  }
}
