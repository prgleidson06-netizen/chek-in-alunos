import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getSignedStoragePhotoUrl, getSignedStoragePhotoUrlByOwnerId, getStudentRawImage } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FALLBACK = '/images/fju-badge.jpg'

function dataUrlResponse(dataUrl: string) {
  try {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return null
    const [, contentType, base64] = match
    return new NextResponse(Buffer.from(base64, 'base64'), {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
        'Content-Type': contentType,
      },
    })
  } catch {
    return null
  }
}

function redirectTo(request: NextRequest, target: string, foundPhoto: boolean) {
  return NextResponse.redirect(new URL(target, request.url), {
    headers: {
      'Cache-Control': foundPhoto ? 'public, max-age=300, stale-while-revalidate=3600' : 'public, max-age=60',
    },
  })
}

function usableImage(value: unknown) {
  if (!value || typeof value !== 'string') return ''
  const image = value.trim()
  if (!image || image === FALLBACK || image.startsWith('/images/') || image.startsWith('/api/student-photo/')) return ''
  return image
}

function recoveredPhotoUrl(id: string) {
  const safeId = id.replace(/[^a-zA-Z0-9_-]/g, '-')
  for (const extension of ['jpg', 'jpeg', 'png', 'webp']) {
    const publicPath = `/recovered-student-photos/${safeId}.${extension}`
    const filePath = path.join(process.cwd(), 'public', 'recovered-student-photos', `${safeId}.${extension}`)
    if (fs.existsSync(filePath)) return publicPath
  }

  return ''
}

async function safeRawPhoto(id: string) {
  try {
    return usableImage(await getStudentRawImage(id, 'photo'))
  } catch (error) {
    console.error('student-photo raw lookup failed:', error)
    return ''
  }
}

async function safeSignedStorage(ref: string) {
  try {
    return await getSignedStoragePhotoUrl(ref)
  } catch (error) {
    console.error('student-photo signed ref failed:', error)
    return null
  }
}

async function safeOwnerLookup(id: string) {
  try {
    return await getSignedStoragePhotoUrlByOwnerId(id)
  } catch (error) {
    console.error('student-photo owner lookup failed:', error)
    return null
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const decodedId = decodeURIComponent(id || '')

  if (!decodedId) return redirectTo(request, FALLBACK, false)

  const raw = await safeRawPhoto(decodedId)

  if (raw.startsWith('data:image/')) {
    const response = dataUrlResponse(raw)
    if (response) return response
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return redirectTo(request, raw, true)
  }

  if (raw.startsWith('supabase-storage:')) {
    const signed = await safeSignedStorage(raw)
    if (signed) return redirectTo(request, signed, true)
  }

  const recovered = recoveredPhotoUrl(decodedId)
  if (recovered) return redirectTo(request, recovered, true)

  const byOwner = await safeOwnerLookup(decodedId)
  if (byOwner) return redirectTo(request, byOwner, true)

  return redirectTo(request, FALLBACK, false)
}
