import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import { isAdminRequest } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'checkins.json')

// 🚀 Blindagem CORS para o tablet e celular conseguirem salvar check-ins sem bloqueio
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

async function readCheckIns() {
  try {
    if (!fsSync.existsSync(filePath)) {
      return []
    }
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data || '[]')
  } catch {
    return []
  }
}

// GET: Retorna apenas os check-ins recentes para não sobrecarregar a memória do tablet
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Acesso administrativo necessario' }, { status: 401 })
  }

  try {
    const allCheckIns = await readCheckIns()
    
    // 💡 OTIMIZAÇÃO DE FLUXO: Filtra para enviar apenas os check-ins dos últimos 3 dias.
    // O arquivo guarda tudo, mas o tablet só baixa o que precisa para a tela principal!
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const recentCheckIns = Array.isArray(allCheckIns) 
      ? allCheckIns.filter((c: any) => {
          if (!c.checkInTime) return false
          const checkInDate = new Date(c.checkInTime)
          return !isNaN(checkInDate.getTime()) && checkInDate >= threeDaysAgo
        })
      : []

    return NextResponse.json(recentCheckIns, { headers: corsHeaders() })
  } catch (error) {
    return NextResponse.json([], { headers: corsHeaders() })
  }
}

// POST: Salva novos check-ins de forma assíncrona e segura
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Acesso administrativo necessario' }, { status: 401 })
  }

  try {
    const checkIn = await request.json()
    
    if (!fsSync.existsSync(dataDir)) {
      await fs.mkdir(dataDir, { recursive: true })
    }

    const checkIns = await readCheckIns()
    checkIns.push(checkIn)

    await fs.writeFile(filePath, JSON.stringify(checkIns, null, 2))

    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error("Erro POST checkins:", error)
    return NextResponse.json({ success: false, error: 'Erro ao salvar' }, { status: 500, headers: corsHeaders() })
  }
}
