import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'checkins.json')

async function readCheckIns() {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, '[]')
    return []
  }
}

export async function GET() {
  const checkIns = await readCheckIns()
  return NextResponse.json(checkIns)
}

export async function POST(request: Request) {
  try {
    const checkIn = await request.json()
    const checkIns = await readCheckIns()

    checkIns.push(checkIn)

    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(checkIns, null, 2))

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erro ao salvar' }, { status: 500 })
  }
}
