import { NextResponse } from 'next/server'
import {
  clearAdminCookie,
  isAdminRequest,
  setAdminCookie,
  verifyAdminPassword,
} from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  return NextResponse.json({ isAdmin: isAdminRequest(request) })
}

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!verifyAdminPassword(String(password || ''))) {
      return NextResponse.json({ error: 'Senha invalida' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true, isAdmin: true })
    setAdminCookie(response)
    return response
  } catch {
    return NextResponse.json({ error: 'Nao foi possivel entrar' }, { status: 400 })
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, isAdmin: false })
  clearAdminCookie(response)
  return response
}
