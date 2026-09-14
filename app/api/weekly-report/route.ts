import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/admin-auth'
import { listCheckInsForPeriod, listStudentsForReport } from '@/lib/server-storage'
import type { CheckIn, Student } from '@/lib/database'

export const dynamic = 'force-dynamic'

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() })
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function startOfDay(value: string | null, fallback: Date) {
  const date = value ? new Date(`${value}T00:00:00`) : fallback
  if (Number.isNaN(date.getTime())) return fallback
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfDay(value: string | null, fallback: Date) {
  const date = value ? new Date(`${value}T23:59:59.999`) : fallback
  if (Number.isNaN(date.getTime())) return fallback
  date.setHours(23, 59, 59, 999)
  return date
}

function normalizeText(value?: string) {
  return (value || '').trim()
}

function compactLocation(student?: Student) {
  const country = normalizeText(student?.country) || 'Pais nao informado'
  const state = normalizeText(student?.state) || 'Estado nao informado'
  const city = normalizeText(student?.city) || 'Cidade nao informada'
  const label = [country, state, city].filter(Boolean).join(' / ')

  return { country, state, city, label }
}

function classProgram(checkIn: CheckIn, student?: Student) {
  const program = String((checkIn as any).program || '').toLowerCase()
  const className = `${checkIn.className || ''} ${checkIn.classId || ''}`.toLowerCase()
  if (program === 'karate' || className.includes('karate') || className.includes('karatê')) return 'karate'
  if (program === 'bjj' || className.includes('bjj') || className.includes('jiu')) return 'bjj'
  if (student?.programs?.karate && !student.programs?.bjj) return 'karate'
  return 'bjj'
}

function formatPeriod(startDate: Date, endDate: Date) {
  return `${startDate.toLocaleDateString('pt-BR')} a ${endDate.toLocaleDateString('pt-BR')}`
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) {
    return NextResponse.json(
      { error: 'Acesso administrativo necessario' },
      { status: 401, headers: corsHeaders() },
    )
  }

  const url = new URL(request.url)
  const fallbackEnd = new Date()
  fallbackEnd.setHours(23, 59, 59, 999)
  const fallbackStart = new Date(fallbackEnd)
  fallbackStart.setDate(fallbackStart.getDate() - 6)
  fallbackStart.setHours(0, 0, 0, 0)

  const startDate = startOfDay(url.searchParams.get('start'), fallbackStart)
  const endDate = endOfDay(url.searchParams.get('end'), fallbackEnd)

  try {
    const [students, checkIns] = await Promise.all([
      listStudentsForReport(),
      listCheckInsForPeriod(startDate, endDate),
    ])
    const studentsById = new Map(students.map((student) => [student.id, student]))
    const groups = new Map<string, {
      country: string
      state: string
      city: string
      label: string
      bjj: number
      karate: number
      total: number
      uniqueStudentIds: Set<string>
    }>()
    const dailyTotals = new Map<string, number>()
    let bjjTotal = 0
    let karateTotal = 0
    const uniqueStudentIds = new Set<string>()

    for (const checkIn of checkIns) {
      const student = studentsById.get(checkIn.studentId)
      const location = compactLocation(student)
      const key = `${location.country}|${location.state}|${location.city}`
      const program = classProgram(checkIn, student)
      const day = dateOnly(new Date(checkIn.checkInTime))
      const group = groups.get(key) || {
        ...location,
        bjj: 0,
        karate: 0,
        total: 0,
        uniqueStudentIds: new Set<string>(),
      }

      group[program] += 1
      group.total += 1
      if (checkIn.studentId) {
        group.uniqueStudentIds.add(checkIn.studentId)
        uniqueStudentIds.add(checkIn.studentId)
      }
      groups.set(key, group)
      dailyTotals.set(day, (dailyTotals.get(day) || 0) + 1)

      if (program === 'karate') karateTotal += 1
      else bjjTotal += 1
    }

    const locations = Array.from(groups.values())
      .map((group, index) => ({
        rank: index + 1,
        country: group.country,
        state: group.state,
        city: group.city,
        label: group.label,
        bjj: group.bjj,
        karate: group.karate,
        total: group.total,
        uniqueStudents: group.uniqueStudentIds.size,
      }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
      .map((group, index) => ({ ...group, rank: index + 1 }))

    return NextResponse.json(
      {
        startDate: dateOnly(startDate),
        endDate: dateOnly(endDate),
        periodLabel: formatPeriod(startDate, endDate),
        totals: {
          bjj: bjjTotal,
          karate: karateTotal,
          general: bjjTotal + karateTotal,
          uniqueStudents: uniqueStudentIds.size,
          checkIns: checkIns.length,
        },
        dailyTotals: Array.from(dailyTotals.entries()).map(([date, total]) => ({ date, total })),
        locations,
      },
      { headers: corsHeaders() },
    )
  } catch (error) {
    console.error('Erro GET weekly-report:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatorio semanal.' },
      { status: 500, headers: corsHeaders() },
    )
  }
}
