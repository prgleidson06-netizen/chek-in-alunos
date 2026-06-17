'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
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

function KioskApp() {
  const { t } = useApp()
  const [activeTab, setActiveTab] = useState('CHECK-IN')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [showStudentsList, setShowStudentsList] = useState(false)

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students', { cache: 'no-store' })
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch {
      setStudents([])
    }
  }

  const loadCheckIns = async () => {
    try {
      const res = await fetch('/api/checkins', { cache: 'no-store' })
      const data = await res.json()
      const valid = Array.isArray(data) ? data.filter(c => c.checkInTime && !isNaN(new Date(c.checkInTime).getTime())) : []
      setCheckIns(valid)
    } catch {
      setCheckIns([])
    }
  }

  const loadAll = async () => {
    await loadStudents()
    await loadCheckIns()
  }

  useEffect(() => {
    loadAll()
    // Sincroniza as telas a cada 5 segundos de forma dinâmica
    const interval = setInterval(loadAll, 5000)
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

    // Atualização visual imediata na tela do dispositivo que clicou
    setCheckIns(prev => [...prev, checkIn])

    try {
      await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkIn),
      })
      
      const updatedStudent: Student = {
        ...student,
        totalClasses: (student.totalClasses || 0) + 1,
        updatedAt: now.toISOString(),
      }
      await fetch('/api/students', {
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
