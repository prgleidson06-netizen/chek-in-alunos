import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const filePath = path.join(dataDir, 'students.json')

// Função auxiliar para ler os estudantes de forma segura
async function readStudents(): Promise<any[]> {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data)
  } catch {
    // Se a pasta ou arquivo não existirem, cria a estrutura do zero
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, '[]', 'utf8')
    return []
  }
}

export async function GET() {
  try {
    const students = await readStudents()
    
    // Opcional: Retorna os alunos em ordem alfabética por padrão
    const sortedStudents = students.sort((a, b) => 
      (a.firstName || '').localeCompare(b.firstName || '')
    )
    
    return NextResponse.json(sortedStudents)
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar estudantes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const student = await request.json()

    // Validação básica para evitar cadastros vazios acidentais
    if (!student.firstName || !student.lastName) {
      return NextResponse.json({ error: 'Nome e sobrenome são obrigatórios' }, { status: 400 })
    }

    const students = await readStudents()

    // Função para gerar uma chave única baseada nos dados do aluno (evita duplicações por dados idênticos)
    const generateDataKey = (s: any) =>
      `${s.firstName}-${s.lastName}-${s.phone || s.email || ''}`.toLowerCase().trim()

    const targetKey = generateDataKey(student)

    // Procura se o aluno já existe: seja pelo ID único OU pelos dados idênticos (Nome + Sobrenome + Contato)
    const index = students.findIndex((s: any) => 
      s.id === student.id || generateDataKey(s) === targetKey
    )

    const now = new Date().toISOString()

    if (index >= 0) {
      // 1. Atualização de Aluno Existente
      students[index] = { 
        ...students[index], 
        ...student, 
        updatedAt: now 
      }
    } else {
      // 2. Cadastro de Novo Aluno
      students.push({
        ...student,
        // ID ultra seguro combinando timestamp e string aleatória
        id: student.id || `std_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: student.createdAt || now,
        updatedAt: now,
      })
    }

    // Salva o arquivo de forma assíncrona
    await fs.mkdir(dataDir, { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(students, null, 2), 'utf8')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro no endpoint de estudantes:', error)
    return NextResponse.json({ error: 'Erro interno ao salvar estudante' }, { status: 500 })
  }
}