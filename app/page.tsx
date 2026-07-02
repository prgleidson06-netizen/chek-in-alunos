'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { Header } from '@/components/header'
import { SearchSection } from '@/components/search-section'
import { RecentArrivals } from '@/components/student-cards'
import { InfoBar } from '@/components/info-bar'
import { EnrollmentForm } from '@/components/enrollment-form'
import { AdminPanel } from '@/components/admin-panel'
import { StudentsList } from '@/components/students-list'
import { AppProvider, useApp } from '@/components/app-provider'
import type { Student, CheckIn } from '@/lib/database'
import { toast, Toaster } from 'sonner'

const getBaseUrl = () => {
  return ''
}

function KioskApp() {
  const { t } = useApp()
  const [activeTab, setActiveTab] = useState('CHECK-IN')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [showStudentsList, setShowStudentsList] = useState(false)
  
  // Sinalizador de controle rígido de requisições
  const isFetchingRef = useRef(false)

  const loadAll = async () => {
    // 🛡️ Se já houver uma busca rodando na rede local, ignora completamente a nova para não travar o tablet
    if (isFetchingRef.current) return
    isFetchingRef.current = true

    const baseUrl = getBaseUrl()

    try {
      const resStudents = await fetch(`${baseUrl}/api/students`, { cache: 'no-store' })
      if (resStudents.ok) {
        const dataStudents = await resStudents.json()
        setStudents(Array.isArray(dataStudents) ? dataStudents : [])
      }
    } catch (err) {
      console.error("Erro estudantes:", err)
    }

    try {
      const resCheckIns = await fetch(`${baseUrl}/api/checkins`, { cache: 'no-store' })
      if (resCheckIns.ok) {
        const dataCheckIns = await resCheckIns.json()
        const validCheckIns = Array.isArray(dataCheckIns) 
          ? dataCheckIns.filter(c => c.checkInTime && !isNaN(new Date(c.checkInTime).getTime())) 
          : []
        setCheckIns(validCheckIns)
      }
    } catch (err) {
      console.error("Erro check-ins:", err)
    }

    isFetchingRef.current = false
  }

  useEffect(() => {
    loadAll()
    
    // 🔄 Aumentado para 8 segundos para dar fôlego ao Wi-Fi da recepção
    const interval = setInterval(loadAll, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) {
      setFilteredStudents([])
      return
    }
    const results = students.filter(s => 
      s.firstName?.toLowerCase().includes(q) || 
      s.lastName?.toLowerCase().includes(q) || 
      s.email?.toLowerCase().includes(q) || 
      s.id?.toLowerCase().includes(q)
    )
    setFilteredStudents(results)
  }

  const handleCheckIn = async (student: Student) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    const alreadyChecked = checkIns.some(c => 
      c.studentId === student.id && c.checkInTime && c.checkInTime.startsWith(today)
    )

    if (alreadyChecked) {
      toast.warning('Este aluno já fez check-in hoje.')
      return
    }

    const checkIn: CheckIn = {
      id: `${student.id}-${Date.now()}`,
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      studentPhoto: student.photo || '/images/fju-badge.jpg',
      beltRank: student.beltRank || 'white',
      stripes: student.stripes || 0,
      membershipType: student.membershipType || 'monthly',
      classId: 'open-mat',
      className: 'Open Mat',
      checkInTime: now.toISOString(),
    }

    setCheckIns(prev => [...prev, checkIn])

    try {
      const baseUrl = getBaseUrl()
      
      await fetch(`${baseUrl}/api/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn),
      })
      
      const updatedStudent: Student = {
        ...student,
        totalClasses: (student.totalClasses || 0) + 1,
        updatedAt: now.toISOString(),
      }
      
      await fetch(`${baseUrl}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      })

      await loadAll()
      setFilteredStudents([])
      setSearchQuery('')
      toast.success(`Check-in realizado - ${student.firstName}`)
    } catch (err) {
      loadAll()
    }
  }

  const handleEnrollmentComplete = async () => {
    await loadAll()
    setActiveTab('CHECK-IN')
    toast.success('Matrícula salva!')
  }

  const visibleStudents = filteredStudents.length > 0 ? filteredStudents : students

  const renderContent = () => {
    if (showStudentsList) {
      return <StudentsList onBack={() => setShowStudentsList(false)} onCheckIn={handleCheckIn} />
    }
    if (activeTab === 'MATRÍCULA') {
      return <EnrollmentForm onComplete={handleEnrollmentComplete} onCancel={() => setActiveTab('CHECK-IN')} />
    }
    if (activeTab === 'ALUNOS') {
      return <StudentsList onBack={() => setActiveTab('CHECK-IN')} onCheckIn={handleCheckIn} />
    }
    if (activeTab === 'ADMIN') {
      return <AdminPanel />
    }
    return (
      <>
        <SearchSection 
          searchQuery={searchQuery} 
          onSearchChange={(value) => {
            setSearchQuery(value)
            if (!value.trim()) setFilteredStudents([])
          }}
          onSearch={handleSearch}
        />
        <RecentArrivals 
          students={visibleStudents} 
          checkIns={checkIns} 
          onCheckIn={handleCheckIn} 
          onViewAll={() => setShowStudentsList(true)} 
        />
        <InfoBar />
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 flex flex-col relative z-10">
        {renderContent()}
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <KioskApp />
      <Toaster position="top-center" richColors />
    </AppProvider>
  )
}