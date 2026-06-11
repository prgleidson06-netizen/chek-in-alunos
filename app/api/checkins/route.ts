import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

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
  const data = await readCheckIns()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()

  const checkins = await readCheckIns()
  checkins.push(body)

  await fs.mkdir(dataDir, { recursive: true })
  await fs.writeFile(
    filePath,
    JSON.stringify(checkins, null, 2)
  )

  return NextResponse.json({ success: true })
}