import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

type LessonVideo = {
  id: string
  title: string
  belt: string
  technique: string
  url: string
  teacherId?: string
  teacherName?: string
  updatedAt: string
  source?: string
}

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

function arrayValue(value: unknown) {
  if (Array.isArray(value)) return value
  if (typeof value === 'string' && value.trim()) return value.split(',').map((item) => item.trim()).filter(Boolean)
  return []
}

function teacherName(row: any, data: any) {
  return data.fullName || data.full_name || data.name || row.full_name || row.name || `${data.firstName || row.first_name || ''} ${data.lastName || row.last_name || ''}`.trim() || 'Professor FJU'
}

function normalizeVideo(row: any): LessonVideo {
  const data = row?.data && typeof row.data === 'object' ? row.data : row
  return {
    id: String(row?.id || data.id || crypto.randomUUID()),
    title: String(data.title || data.technique || data.tecnica || 'Video da tecnica'),
    belt: String(data.belt || data.faixa || 'white'),
    technique: String(data.technique || data.tecnica || ''),
    url: String(data.url || data.link || data.videoUrl || data.video_url || ''),
    teacherId: data.teacherId || data.teacher_id || '',
    teacherName: data.teacherName || data.teacher_name || '',
    updatedAt: String(data.updatedAt || data.updated_at || row?.updated_at || new Date().toISOString()),
    source: data.source || row?.__source || 'lesson-video',
  }
}

function videosFromTeacher(row: any): LessonVideo[] {
  const data = row?.data && typeof row.data === 'object' ? row.data : row
  const id = String(row.id || data.id || '')
  const name = teacherName(row, data)
  const updatedAt = String(data.updatedAt || data.updated_at || row.updated_at || new Date().toISOString())
  const directArrays = [
    ...arrayValue(data.lessonVideos || data.lesson_videos || row.lesson_videos),
    ...arrayValue(data.videos || row.videos),
    ...arrayValue(data.techniques || data.tecnicas || row.techniques),
  ]
  const links = arrayValue(data.videoLinks || data.video_links || data.lessonVideoLinks || data.lesson_video_links || row.video_links)

  const fromObjects = directArrays.map((item: any, index) => {
    if (typeof item === 'string') {
      return { id: `teacher-video-${id}-${index}`, title: `Video ${index + 1}`, belt: 'white', technique: 'Tecnica vinculada', url: item, teacherId: id, teacherName: name, updatedAt, source: 'teacher-profile' }
    }
    return normalizeVideo({ id: item.id || `teacher-video-${id}-${index}`, data: { ...item, teacherId: item.teacherId || id, teacherName: item.teacherName || name, updatedAt, source: 'teacher-profile' } })
  })

  const fromLinks = links.map((url: any, index) => ({
    id: `teacher-link-${id}-${index}`,
    title: `Video ${index + 1}`,
    belt: 'white',
    technique: 'Tecnica vinculada',
    url: String(url),
    teacherId: id,
    teacherName: name,
    updatedAt,
    source: 'teacher-profile',
  }))

  return [...fromObjects, ...fromLinks].filter((video) => video.url)
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  const supabase = getSupabaseServerClient()
  const params = new URL(request.url).searchParams
  const teacherId = params.get('teacherId') || ''
  if (!supabase) return NextResponse.json({ videos: [] }, { headers: corsHeaders() })

  try {
    const videos: LessonVideo[] = []

    const { data: videoRows } = await supabase
      .from('students')
      .select('id, data, updated_at')
      .like('id', 'lesson-video-%')
      .order('updated_at', { ascending: false })
      .limit(1000)
    for (const row of videoRows || []) videos.push(normalizeVideo({ ...row, __source: 'lesson-video-record' }))

    const { data: teacherRows } = await supabase
      .from('students')
      .select('*')
      .like('id', 'teacher-%')
      .limit(1000)
    for (const row of teacherRows || []) videos.push(...videosFromTeacher(row))

    const seen = new Set<string>()
    let unique = videos.filter((video) => {
      if (!video.url) return false
      if (teacherId && video.teacherId !== teacherId) return false
      const key = `${video.teacherId || ''}|${video.url}|${video.title}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return NextResponse.json({ videos: unique }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro GET lesson-videos:', error)
    return NextResponse.json({ videos: [] }, { headers: corsHeaders() })
  }
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: 'Banco online indisponivel.' }, { status: 500, headers: corsHeaders() })

  try {
    const body = await request.json().catch(() => ({}))
    const now = new Date().toISOString()
    const id = String(body.id || `lesson-video-${crypto.randomUUID()}`)
    const video = normalizeVideo({ id, data: { ...body, id, updatedAt: now } })
    if (!video.url) return NextResponse.json({ error: 'Link do video obrigatorio.' }, { status: 400, headers: corsHeaders() })

    const { error } = await supabase.from('students').upsert({
      id,
      first_name: 'Lesson',
      last_name: 'Video',
      data: { kind: 'lesson-video', ...video, updatedAt: now },
      updated_at: now,
    })
    if (error) throw error
    return NextResponse.json({ success: true, video }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro POST lesson-videos:', error)
    return NextResponse.json({ error: 'Erro ao salvar video.' }, { status: 500, headers: corsHeaders() })
  }
}

export async function DELETE(request: Request) {
  const supabase = getSupabaseServerClient()
  if (!supabase) return NextResponse.json({ error: 'Banco online indisponivel.' }, { status: 500, headers: corsHeaders() })
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id || '')
    if (!id) return NextResponse.json({ error: 'ID obrigatorio.' }, { status: 400, headers: corsHeaders() })
    const { error } = await supabase.from('students').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro DELETE lesson-videos:', error)
    return NextResponse.json({ error: 'Erro ao apagar video.' }, { status: 500, headers: corsHeaders() })
  }
}
