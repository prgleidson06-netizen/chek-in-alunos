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
  const { t, isAdmin } = useApp()
  const [activeTab, setActiveTab] = useState('CHECK-IN')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [showStudentsList, setShowStudentsList] = useState(false)
  
  // Sinalizador de controle rígido de requisições
  const isFetchingRef = useRef(false)

  const loadAll = async () => {
    if (!isAdmin) {
      setStudents([])
      setCheckIns([])
      setFilteredStudents([])
      isFetchingRef.current = false
      return
    }

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
    if (!isAdmin) {
      setStudents([])
      setCheckIns([])
      setFilteredStudents([])
      return
    }

    loadAll()
    
    // 🔄 Aumentado para 8 segundos para dar fôlego ao Wi-Fi da recepção
    const interval = setInterval(loadAll, 8000)
    return () => clearInterval(interval)
  }, [isAdmin])

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
    if (!isAdmin) {
      toast.error(t.adminRequiredForCheckIn)
      return
    }

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
      
      const checkInResponse = await fetch(`${baseUrl}/api/checkins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn),
      })

      if (!checkInResponse.ok) {
        throw new Error('checkins API returned an error')
      }
      
      const updatedStudent: Student = {
        ...student,
        totalClasses: (student.totalClasses || 0) + 1,
        updatedAt: now.toISOString(),
      }
      
      const studentResponse = await fetch(`${baseUrl}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      })

      if (!studentResponse.ok) {
        throw new Error('students API returned an error')
      }

      await loadAll()
      setFilteredStudents([])
      setSearchQuery('')
      toast.success(`Check-in realizado - ${student.firstName}`)
    } catch (err) {
      setCheckIns(prev => prev.filter(item => item.id !== checkIn.id))
      toast.error(t.checkInSaveError)
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

    if (!isAdmin) {
      return (
        <>
          <SearchSection
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={() => toast.error(t.adminRequiredForCheckIn)}
          />
          <section className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full relative z-10">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/70 p-6 text-center text-zinc-200">
              <h2 className="text-lg font-bold uppercase tracking-wide">{t.checkInBlocked}</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {t.checkInBlockedMessage}
              </p>
            </div>
          </section>
          <InfoBar />
        </>
      )
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
    <div className="app-watermark min-h-screen flex flex-col bg-background relative">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[url('/images/fju-badge.jpg')] bg-center bg-no-repeat opacity-[0.07] grayscale-[15%] [background-size:min(62vw,560px)] max-sm:opacity-[0.055] max-sm:[background-size:82vw]"
      />
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
