import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'checkins.json')

// Função auxiliar para ler os check-ins de forma segura
async function readCheckIns(): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch {
    // Se o arquivo ou pasta não existir, cria e retorna um array vazio
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, '[]')
    return []
  }
}

export async function GET() {
  try {
    const data = await readCheckIns()
    // Retorna os check-ins ordenados do mais recente para o mais antigo
    const sortedData = data.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return NextResponse.json(sortedData)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar check-ins' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // 1. Validação básica de segurança
    if (!body.studentId) {
      return NextResponse.json({ error: 'ID do estudante é obrigatório' }, { status: 400 })
    }

    const checkins = await readCheckIns()

    // 2. Criação do objeto de check-in padronizado e limpo
    const newCheckIn = {
      id: body.id || `chk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      studentId: body.studentId,
      studentName: body.studentName || 'Estudante Sem Nome',
      createdAt: body.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // 3. Evitar duplicados exatos enviados por clique duplo acidental no mesmo segundo
    const isDuplicate = checkins.some(
      (c) => c.studentId === newCheckIn.studentId && 
             Math.abs(new Date(c.createdAt).getTime() - new Date(newCheckIn.createdAt).getTime()) < 2000
    )

    if (isDuplicate) {
      return NextResponse.json({ success: true, message: 'Check-in já registrado recentemente.' })
    }

    // Adiciona o novo check-in na lista
    checkins.push(newCheckIn)

    // 4. Salva o arquivo de forma assíncrona e segura
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(checkins, null, 2), 'utf8')

    return NextResponse.json({ success: true, checkin: newCheckIn })
  } catch (error) {
    console.error('Erro no endpoint de check-in:', error)
    return NextResponse.json({ error: 'Erro interno ao salvar check-in' }, { status: 500 })
  }
}