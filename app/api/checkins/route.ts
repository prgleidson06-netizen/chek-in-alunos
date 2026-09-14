import { NextResponse } from 'next/server'
import type { CheckIn } from '@/lib/database'
import { isAdminRequest } from '@/lib/admin-auth'
import { listRecentCheckIns, saveCheckInRecord } from '@/lib/server-storage'

export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Acesso administrativo necessario' }, { status: 401, headers: corsHeaders() })
  }

  try {
    const checkIns = await listRecentCheckIns()
    return NextResponse.json(checkIns, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro GET checkins:', error)
    return NextResponse.json([], { headers: corsHeaders() })
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Acesso administrativo necessario' }, { status: 401, headers: corsHeaders() })
  }

  try {
    const checkIn = await request.json()
    const saved = await saveCheckInRecord(checkIn as CheckIn)
    return NextResponse.json(saved, { headers: corsHeaders() })
  } catch (error) {
    console.error('Erro POST checkins:', error)
    return NextResponse.json({ success: false, error: 'Erro ao salvar check-in' }, { status: 500, headers: corsHeaders() })
  }
}
