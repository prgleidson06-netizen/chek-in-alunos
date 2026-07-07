import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import fsSync from 'fs'
import path from 'path'
import type { Student } from '@/lib/database' // 👈 Garante a tipagem correta no build
import { isAdminRequest } from '@/lib/admin-auth'

const filePath = path.join(process.cwd(), 'data', 'students.json')

// Cabeçalhos CORS industriais e limpos
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

// GET: Leitura assíncrona de alta performance
export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Acesso administrativo necessario" }, { status: 401 })
  }

  try {
    if (!fsSync.existsSync(filePath)) {
      return NextResponse.json([], { headers: corsHeaders() })
    }
    // 🚀 Otimização: Não bloqueia a Thread principal do Mac durante a leitura
    const fileData = await fs.readFile(filePath, 'utf8')
    const students = JSON.parse(fileData || '[]')
    return NextResponse.json(Array.isArray(students) ? students : [], { headers: corsHeaders() })
  } catch (error) {
    console.error("Erro GET students:", error)
    return NextResponse.json({ error: "Erro ao ler alunos" }, { status: 500, headers: corsHeaders() })
  }
}

// POST: Sincronização inteligente sem inundação de arquivos de backup
export async function POST(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "Acesso administrativo necessario" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    // Garante a existência do diretório e do arquivo de forma segura
    const dirPath = path.dirname(filePath)
    if (!fsSync.existsSync(dirPath)) {
      await fs.mkdir(dirPath, { recursive: true })
    }
    if (!fsSync.existsSync(filePath)) {
      await fs.writeFile(filePath, JSON.stringify([]))
    }
    
    const fileData = await fs.readFile(filePath, 'utf8')
    let currentStudents = JSON.parse(fileData || '[]')

    // CENÁRIO 1: Recebeu apenas um aluno modificado
    if (body && body.id && !Array.isArray(body)) {
      const studentExists = currentStudents.some((s: any) => s.id === body.id)
      
      if (!studentExists) {
        // Validação estrita de duplicidade apenas para novas matrículas
        const newKey = `${(body.firstName || '').trim().toLowerCase()}|${(body.lastName || '').trim().toLowerCase()}|${(body.dateOfBirth || '').trim()}`
        
        const isDuplicate = currentStudents.some((s: any) => {
          const currentKey = `${(s.firstName || '').trim().toLowerCase()}|${(s.lastName || '').trim().toLowerCase()}|${(s.dateOfBirth || '').trim()}`
          return currentKey === newKey
        })

        if (isDuplicate) {
          return NextResponse.json(
            { error: "Este estudante já está cadastrado no sistema (Nome e Data de Nascimento idênticos)." },
            { status: 400, headers: corsHeaders() }
          )
        }

        // 🛡️ Backup estratégico: SÓ cria backup se for uma NOVA matrícula. Evita entupir o Mac em horários de check-in.
        const backupDir = path.join(process.cwd(), 'data', 'backups')
        if (!fsSync.existsSync(backupDir)) {
          await fs.mkdir(backupDir, { recursive: true })
        }
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = path.join(backupDir, `students-new-enrollment-${timestamp}.json`)
        await fs.writeFile(backupPath, fileData)
      }

      // Atualiza ou insere o aluno de forma cirúrgica
      if (studentExists) {
        currentStudents = currentStudents.map((s: any) => s.id === body.id ? { ...s, ...body } : s)
      } else {
        currentStudents.push(body)
      }
      
      // Escrita assíncrona rápida
      await fs.writeFile(filePath, JSON.stringify(currentStudents, null, 2))
      return NextResponse.json({ success: true, message: "Aluno salvo com segurança." }, { headers: corsHeaders() })
    } 
    
    // CENÁRIO 2: Recebeu a lista completa (Sincronização em lote)
    if (Array.isArray(body)) {
      await fs.writeFile(filePath, JSON.stringify(body, null, 2))
      return NextResponse.json({ success: true, message: "Lista sincronizada com sucesso." }, { headers: corsHeaders() })
    }

    return NextResponse.json({ error: "Formato de dados inválido" }, { status: 400, headers: corsHeaders() })
  } catch (error) {
    console.error("Erro POST students:", error)
    return NextResponse.json({ error: "Erro interno no servidor de dados" }, { status: 500, headers: corsHeaders() })
  }
}
