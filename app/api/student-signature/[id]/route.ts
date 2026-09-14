import { NextResponse } from 'next/server'
import { getSignedStoragePhotoUrl, getStudentRawImage } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'

function imageResponseFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) return null
  const [, contentType, base64] = match
  return new NextResponse(Uint8Array.from(Buffer.from(base64, 'base64')), {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      'Content-Type': contentType,
    },
  })
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const decodedId = decodeURIComponent(id)
    const signature = String(await getStudentRawImage(decodedId, 'waiverSignature') || '')

    if (signature.startsWith('data:image/')) {
      const response = imageResponseFromDataUrl(signature)
      if (response) return response
    }

    if (signature.startsWith('supabase-storage:')) {
      const signed = await getSignedStoragePhotoUrl(signature)
      if (signed) return NextResponse.redirect(signed, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } })
    }

    if (signature.startsWith('http://') || signature.startsWith('https://')) {
      return NextResponse.redirect(signature, { headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' } })
    }
  } catch (error) {
    console.error('Erro ao carregar assinatura:', error)
  }

  return NextResponse.json({ error: 'Assinatura nao encontrada' }, { status: 404 })
}
