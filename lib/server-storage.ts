import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { CheckIn, Student } from '@/lib/database'

const dataDir = path.join(process.cwd(), 'data')
const studentsFile = path.join(dataDir, 'students.json')
const checkinsFile = path.join(dataDir, 'checkins.json')
const photoBucket = process.env.SUPABASE_PHOTO_BUCKET || 'student-photos'
const storagePhotoPrefix = 'supabase-storage:'

let cachedClient: SupabaseClient | null | undefined
let photoBucketReady = false
const signedPhotoCache = new Map<string, { value: string | null; expiresAt: number }>()

function hasRealSupabaseServerConfig(url?: string, key?: string) {
  if (!url || !key) return false
  if (url.includes('seu-projeto.supabase.co')) return false
  if (key.includes('sua-chave')) return false
  if (!url.startsWith('https://')) return false
  return true
}

function getSupabaseServerClient() {
  if (cachedClient !== undefined) return cachedClient

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  cachedClient =
    hasRealSupabaseServerConfig(supabaseUrl, serviceKey)
      ? createClient(supabaseUrl!, serviceKey!, {
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
  const data = row.data && typeof row.data === 'object' ? row.data : row

  return {
    ...data,
    id: row.id || data.id,
    firstName: data.firstName || row.firstName || row.first_name || '',
    lastName: data.lastName || row.lastName || row.last_name || '',
    dateOfBirth: data.dateOfBirth || row.dateOfBirth || row.date_of_birth || '',
    email: data.email || row.email || '',
    phone: data.phone || row.phone || '',
    photo: imageApiPath(row.id || data.id, data.photo || data.photo_url || data.photoUrl || row.photo || row.photo_url || row.photoUrl || '', 'student-photo'),
  } as Student
}

function dataUrlToBytes(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null

  const [, contentType, base64] = match
  const extension =
    contentType === 'image/png'
      ? 'png'
      : contentType === 'image/webp'
        ? 'webp'
        : 'jpg'

  return {
    contentType,
    extension,
    bytes: Buffer.from(base64, 'base64'),
  }
}

function storagePhotoRef(bucket: string, filePath: string) {
  return `${storagePhotoPrefix}${bucket}/${filePath}`
}

function imageApiPath(id: string, image: string, endpoint: 'student-photo' | 'student-signature') {
  if (!image) return '/images/fju-badge.jpg'
  if (image.startsWith('data:image/') || image.startsWith(storagePhotoPrefix)) {
    return `/api/${endpoint}/${encodeURIComponent(id)}`
  }
  return image
}

export function parseStoragePhotoRef(photo: string) {
  if (!photo?.startsWith(storagePhotoPrefix)) return null

  const value = photo.slice(storagePhotoPrefix.length)
  const slashIndex = value.indexOf('/')
  if (slashIndex <= 0) return null

  return {
    bucket: value.slice(0, slashIndex),
    path: value.slice(slashIndex + 1),
  }
}


export async function getSignedStoragePhotoUrlByOwnerId(ownerId: string) {
  const supabase = getSupabaseServerClient()
  if (!supabase || !ownerId) return null

  const cacheKey = `owner:${ownerId}`
  const cached = signedPhotoCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const remember = (value: string | null) => {
    signedPhotoCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + (value ? 50 * 60 * 1000 : 5 * 60 * 1000),
    })
    return value
  }

  const safeOwnerId = ownerId.replace(/[^a-zA-Z0-9_-]/g, '-')
  const ownerIds = Array.from(new Set([ownerId, safeOwnerId]))
  const names = ['profile.jpg', 'profile.jpeg', 'profile.png', 'profile.webp', 'photo.jpg', 'photo.png']

  for (const folder of ownerIds) {
    for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
      const directPaths = [
        `${folder}.${extension}`,
        `students/${folder}.${extension}`,
        `students/${folder}/profile.${extension}`,
        `students/${folder}/photo.${extension}`,
      ]

      for (const filePath of directPaths) {
        const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(filePath, 60 * 60)
        if (!error && data?.signedUrl) return remember(data.signedUrl)
      }
    }

    for (const name of names) {
      const filePath = `${folder}/${name}`
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(filePath, 60 * 60)
      if (!error && data?.signedUrl) return remember(data.signedUrl)
    }

    const { data: files } = await supabase.storage.from(photoBucket).list(folder, { limit: 20 })
    const image = files?.find((file) => /\.(jpe?g|png|webp)$/i.test(file.name))
    if (image?.name) {
      const { data, error } = await supabase.storage.from(photoBucket).createSignedUrl(`${folder}/${image.name}`, 60 * 60)
      if (!error && data?.signedUrl) return remember(data.signedUrl)
    }
  }

  return remember(null)
}

export async function getSignedStoragePhotoUrl(photo: string) {
  const supabase = getSupabaseServerClient()
  const ref = parseStoragePhotoRef(photo)
  if (!supabase || !ref) return null

  const cacheKey = `ref:${ref.bucket}/${ref.path}`
  const cached = signedPhotoCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  const { data, error } = await supabase.storage
    .from(ref.bucket)
    .createSignedUrl(ref.path, 60 * 60)

  if (error) return null
  const signedUrl = data?.signedUrl || null
  signedPhotoCache.set(cacheKey, {
    value: signedUrl,
    expiresAt: Date.now() + (signedUrl ? 50 * 60 * 1000 : 5 * 60 * 1000),
  })
  return signedUrl
}

export async function getStudentRawImage(id: string, field: 'photo' | 'waiverSignature') {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    const payload = data?.data && typeof data.data === 'object' ? data.data : data
    if (field === 'photo') {
      const row = data as any
      return payload?.photo || payload?.photo_url || payload?.photoUrl || row?.photo || row?.photo_url || row?.photoUrl || ''
    }
    return payload?.waiverSignature || payload?.waiver_signature || (data as any)?.waiver_signature || ''
  }

  const students = await readJsonFile<Student>(studentsFile)
  const student = students.find((item) => item.id === id)
  return field === 'photo' ? student?.photo || '' : student?.waiverSignature || ''
}

async function ensurePhotoBucket(supabase: SupabaseClient) {
  if (photoBucketReady) return true

  const { data: buckets, error: listError } = await supabase.storage.listBuckets()
  if (listError) return false

  if (!buckets?.some((bucket) => bucket.name === photoBucket)) {
    const { error: createError } = await supabase.storage.createBucket(photoBucket, {
      public: false,
      fileSizeLimit: 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })

    if (createError) return false
  }

  photoBucketReady = true
  return true
}

async function saveStudentPhoto(supabase: SupabaseClient, student: Student) {
  if (!student.photo?.startsWith('data:image/')) return student.photo

  const image = dataUrlToBytes(student.photo)
  if (!image) return student.photo

  const bucketReady = await ensurePhotoBucket(supabase)
  if (!bucketReady) return student.photo

  const safeStudentId = student.id.replace(/[^a-zA-Z0-9_-]/g, '-')
  // A versioned object path prevents browsers/CDNs from continuing to show an
  // older photo after the administrator replaces it.
  const filePath = `${safeStudentId}/profile-${Date.now()}.${image.extension}`
  const { error } = await supabase.storage.from(photoBucket).upload(filePath, image.bytes, {
    contentType: image.contentType,
    cacheControl: '0',
    upsert: true,
  })

  if (error) {
    console.error('Erro ao salvar foto no Supabase Storage:', error.message)
    return ''
  }

  return storagePhotoRef(photoBucket, filePath)
}

function rowToStudentSummary(row: any): Student {
  const data = row.data && typeof row.data === 'object' ? row.data : row
  const id = row.id || data.id
  const override = row.classOverride && typeof row.classOverride === 'object' ? row.classOverride : null
  const totalClasses = Number(
    override?.totalClasses ?? row.total_classes ?? row.totalClasses ?? data.totalClasses ?? data.bjj?.classes ?? 0,
  )
  const hasBjj = data.programs?.bjj ?? data.bjj !== undefined ?? true
  const hasKarate = data.programs?.karate ?? Boolean(data.karate)
  const photo = data.photo || data.photo_url || data.photoUrl || row.photo || row.photo_url || row.photoUrl || ''

  return {
    id,
    firstName: data.firstName || row.firstName || row.first_name || '',
    lastName: data.lastName || row.lastName || row.last_name || '',
    dateOfBirth: data.dateOfBirth || row.dateOfBirth || row.date_of_birth || '',
    email: data.email || row.email || '',
    phone: data.phone || row.phone || '',
    address: data.address || row.address || '',
    city: data.city || row.city || '',
    state: data.state || row.state || '',
    zipCode: data.zipCode || row.zipCode || row.zip_code || '',
    country: data.country || row.country || '',
    emergencyName: data.emergencyName || row.emergencyName || row.emergency_name || '',
    emergencyPhone: data.emergencyPhone || row.emergencyPhone || row.emergency_phone || '',
    emergencyRelationship:
      data.emergencyRelationship || row.emergencyRelationship || row.emergency_relationship || '',
    allergies: data.allergies || row.allergies || '',
    medicalConditions: data.medicalConditions || row.medicalConditions || row.medical_conditions || '',
    medications: data.medications || row.medications || '',
    photo: imageApiPath(id, photo, 'student-photo'),
    membershipType: data.membershipType || row.membershipType || row.membership_type || 'monthly',
    beltRank: data.beltRank || row.beltRank || row.belt_rank || data.bjj?.beltRank || 'white',
    stripes: Number(data.stripes ?? row.stripes ?? data.bjj?.stripes ?? 0),
    programs: { bjj: hasBjj, karate: hasKarate },
    bjj: {
      beltRank: data.bjj?.beltRank || data.beltRank || row.beltRank || row.belt_rank || 'white',
      stripes: Number(data.bjj?.stripes ?? data.stripes ?? row.stripes ?? 0),
      classes: Number(override?.bjjClasses ?? data.bjj?.classes ?? totalClasses),
    },
    karate: hasKarate
      ? {
          beltRank: data.karate?.beltRank || 'white',
          kyu: Number(data.karate?.kyu || 10),
          classes: Number(override?.karateClasses ?? data.karate?.classes ?? 0),
        }
      : undefined,
    startDate: data.startDate || row.startDate || row.start_date || '',
    waiverSignature: data.waiverSignature || row.waiverSignature || row.waiver_signature || '',
    waiverSignedAt: data.waiverSignedAt || row.waiverSignedAt || row.waiver_signed_at || '',
    waiverAgreed: Boolean(data.waiverAgreed ?? row.waiverAgreed ?? row.waiver_agreed ?? false),
    totalClasses,
    attendanceHistory: data.attendanceHistory || row.attendanceHistory || row.attendance_history || [],
    createdAt: data.createdAt || row.createdAt || row.created_at || '',
    updatedAt: data.updatedAt || row.updatedAt || row.updated_at || '',
  } as Student
}

async function localStudentCache() {
  const students = await readJsonFile<Student>(studentsFile)
  return new Map(students.map((student) => [student.id, student]))
}

async function classCountOverrides(supabase: SupabaseClient) {
  const overrides = new Map<string, { totalClasses: number; bjjClasses?: number; karateClasses?: number }>()

  const { data, error } = await supabase
    .from('students')
    .select('id, data, updated_at')
    .like('id', 'class-%')
    .order('updated_at', { ascending: false })
    .limit(1000)

  if (error) return overrides

  for (const row of data || []) {
    const payload = row.data || {}
    if (payload.kind !== 'class-count') continue
    if (!payload.studentId || overrides.has(payload.studentId)) continue
    overrides.set(payload.studentId, {
      totalClasses: Number(payload.totalClasses || 0),
      bjjClasses: payload.bjjClasses === undefined ? undefined : Number(payload.bjjClasses || 0),
      karateClasses: payload.karateClasses === undefined ? undefined : Number(payload.karateClasses || 0),
    })
  }

  return overrides
}

function rowToCheckIn(row: any): CheckIn {
  const data = row.data || {}

  return {
    ...data,
    id: row.id,
    studentId: data.studentId || row.student_id || row.studentId || '',
    checkInTime: data.checkInTime || row.check_in_time || row.checkInTime || '',
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
  const className = String(checkIn.className || '').toLowerCase()
  const checkInProgram = String((checkIn as any).program || '').toLowerCase()
  const hasBjj = Boolean(student.programs?.bjj ?? student.bjj)
  const hasKarate = Boolean(student.programs?.karate ?? student.karate)
  const program = checkInProgram === 'karate' || className.includes('karate') ? 'karate' : 'bjj'
  const currentBjjClasses = Number(student.bjj?.classes ?? (hasBjj ? student.totalClasses || 0 : 0))
  const currentKarateClasses = Number(student.karate?.classes ?? 0)
  const nextBjjClasses = program === 'bjj' ? currentBjjClasses + 1 : currentBjjClasses
  const nextKarateClasses = program === 'karate' ? currentKarateClasses + 1 : currentKarateClasses
  const nextTotalClasses = hasBjj || hasKarate
    ? nextBjjClasses + nextKarateClasses
    : Math.max(Number(student.totalClasses || 0) + 1, 1)

  await saveStudentRecord({
    ...student,
    totalClasses: nextTotalClasses,
    bjj: student.bjj ? { ...student.bjj, classes: nextBjjClasses } : student.bjj,
    karate: student.karate ? { ...student.karate, classes: nextKarateClasses } : student.karate,
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
      .select('*')
      .limit(10000)

    if (error) throw error

    const overrides = await classCountOverrides(supabase)

    return (data || [])
      .filter((row) => {
        const id = String(row.id || '')
        return !id.startsWith('class-') && !id.startsWith('teacher-')
      })
      .map((row) =>
        rowToStudentSummary({
          ...row,
          classOverride: overrides.get(row.id),
          total_classes: overrides.get(row.id)?.totalClasses,
        }),
      )
      .sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`))
  }

  return readJsonFile<Student>(studentsFile)
}

export async function listStudentsForReport() {
  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .limit(10000)

    if (error) throw error

    return (data || [])
      .filter((row) => !String(row.id || '').startsWith('class-'))
      .map((row) => {
        const student = rowToStudent(row)
        return {
          ...rowToStudentSummary(row),
          ...student,
          id: row.id,
          waiverSignature: '',
        } as Student
      })
  }

  return readJsonFile<Student>(studentsFile)
}

export async function listCheckInsForPeriod(startDate: Date, endDate: Date) {
  const byId = new Map<string, CheckIn>()
  const addCheckIn = (checkIn: CheckIn) => {
    if (!checkIn.checkInTime) return
    const checkInDate = new Date(checkIn.checkInTime)
    if (Number.isNaN(checkInDate.getTime())) return
    if (checkInDate < startDate || checkInDate > endDate) return
    byId.set(checkIn.id || `${checkIn.studentId}-${checkIn.checkInTime}`, checkIn)
  }

  const supabase = getSupabaseServerClient()

  if (supabase) {
    const { data, error } = await supabase
      .from('checkins')
      .select('id, student_id, check_in_time, data')
      .gte('check_in_time', startDate.toISOString())
      .lte('check_in_time', endDate.toISOString())
      .order('check_in_time', { ascending: true })
      .limit(10000)

    if (!error) {
      for (const row of data || []) addCheckIn(rowToCheckIn(row))
    }

    if (error || byId.size === 0) {
      const { data: allCheckInRows, error: allCheckInError } = await supabase
        .from('checkins')
        .select('*')
        .limit(10000)

      if (!allCheckInError) {
        for (const row of allCheckInRows || []) addCheckIn(rowToCheckIn(row))
      }
    }

    const students = await listStudentsForReport()
    for (const checkIn of checkInsFromStudents(students)) addCheckIn(checkIn)

    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime(),
    )
  }

  const checkIns = await readJsonFile<CheckIn>(checkinsFile)
  for (const checkIn of checkIns) addCheckIn(checkIn)

  const students = await readJsonFile<Student>(studentsFile)
  for (const checkIn of checkInsFromStudents(students)) addCheckIn(checkIn)

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime(),
  )
}

export async function saveClassCountOverride(studentId: string, totalClasses: number, counts?: { bjjClasses?: number; karateClasses?: number }) {
  const supabase = getSupabaseServerClient()
  const nextCount = Math.max(0, totalClasses)
  const now = new Date().toISOString()
  const id = crypto.randomUUID()
  const payload = {
    id,
    kind: 'class-count',
    studentId,
    totalClasses: nextCount,
    bjjClasses: counts?.bjjClasses === undefined || Number.isNaN(Number(counts.bjjClasses)) ? undefined : Math.max(0, Number(counts.bjjClasses)),
    karateClasses: counts?.karateClasses === undefined || Number.isNaN(Number(counts.karateClasses)) ? undefined : Math.max(0, Number(counts.karateClasses)),
    checkInTime: now,
  }

  if (supabase) {
    const { error } = await supabase.from('students').upsert({
      id: `class-${studentId}`,
      first_name: '__class_count__',
      last_name: studentId,
      data: payload,
      updated_at: now,
    })

    if (error) throw error
    return payload
  }

  const students = await readJsonFile<Student>(studentsFile)
  await writeJsonFile(
    studentsFile,
    students.map((student) =>
      student.id === studentId
        ? {
            ...student,
            totalClasses: nextCount,
            bjj: student.bjj ? { ...student.bjj, classes: counts?.bjjClasses ?? nextCount } : student.bjj,
            karate: student.karate ? { ...student.karate, classes: counts?.karateClasses ?? student.karate.classes } : student.karate,
            updatedAt: now,
          }
        : student,
    ),
  )

  return payload
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
      totalClasses:
        typeof nextStudent.totalClasses === 'number'
          ? Math.max(0, nextStudent.totalClasses)
          : Number(existingRow?.data?.totalClasses || 0),
      attendanceHistory:
        nextStudent.attendanceHistory || existingRow?.data?.attendanceHistory || [],
      waiverSignature:
        nextStudent.waiverSignature || existingRow?.data?.waiverSignature || '',
      photo:
        nextStudent.photo &&
        nextStudent.photo !== '/images/fju-badge.jpg' &&
        !nextStudent.photo.startsWith('/api/student-photo/')
          ? (await saveStudentPhoto(supabase, nextStudent)) || existingRow?.data?.photo || '/images/fju-badge.jpg'
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
    if (!error) {
      await saveCheckInOnStudent(nextCheckIn)
      return nextCheckIn
    }

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
