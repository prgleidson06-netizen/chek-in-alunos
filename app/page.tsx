'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { SearchSection } from '@/components/search-section'
import { RecentArrivals } from '@/components/student-cards'
import { InfoBar } from '@/components/info-bar'
import { EnrollmentForm } from '@/components/enrollment-form'
import { AdminPanel } from '@/components/admin-panel'
import { StudentsList } from '@/components/students-list'
import { AppProvider, useApp } from '@/components/app-provider'
import { Student, CheckIn } from '@/lib/database'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

function KioskApp() {
  const { t } = useApp()
  const [activeTab, setActiveTab] = useState('CHECK-IN')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [showStudentsList, setShowStudentsList] = useState(false)

  const loadStudents = async () => {
    const data = await fetch('/api/students').then(res => res.json())
    setStudents(data)
  }

  const loadCheckIns = async () => {
    const data = await fetch('/api/checkins').then(res => res.json())
    setCheckIns(data)
  }

  const loadAll = async () => {
    await loadStudents()
    await loadCheckIns()
  }

  useEffect(() => {
    loadAll()
    const interval = setInterval(loadAll, 15000)
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
      c.studentId === student.id &&
      c.checkInTime?.startsWith(today)
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

    await fetch('/api/checkins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkIn),
    })

    const updatedStudent: Student = {
      ...student,
      photo: student.photo || '/images/fju-badge.jpg',
      attendanceHistory: [
        ...(student.attendanceHistory || []),
        {
          id: checkIn.id,
          studentId: student.id,
          classId: checkIn.classId,
          className: checkIn.className,
          checkInTime: checkIn.checkInTime,
          date: today,
        },
      ],
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

    toast.success(`${t.checkInSuccess} - ${student.firstName} ${student.lastName}`)
  }

  const handleEnrollmentComplete = async () => {
    await loadStudents()
    setActiveTab('CHECK-IN')
    toast.success(t.enrollmentSuccess)
  }

  const visibleStudents = Array.from(
    new Map(
      (filteredStudents.length > 0 ? filteredStudents : students).map(s => [s.id, s])
    ).values()
  )

  const renderContent = () => {
    if (showStudentsList) {
      return (
        <StudentsList
          onBack={() => setShowStudentsList(false)}
          onCheckIn={handleCheckIn}
        />
      )
    }

    switch (activeTab) {
      case 'MATRÍCULA':
        return (
          <EnrollmentForm
            onComplete={handleEnrollmentComplete}
            onCancel={() => setActiveTab('CHECK-IN')}
          />
        )

      case 'ALUNOS':
        return (
          <StudentsList
            onBack={() => setActiveTab('CHECK-IN')}
            onCheckIn={handleCheckIn}
          />
        )

      case 'ADMIN':
        return <AdminPanel />

      default:
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
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0">
        <img src="/images/fju-badge.jpg" alt="" className="w-[600px]" />
      </div>

      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col relative z-10">
        {renderContent()}
      </main>

      <div className="fixed bottom-4 right-4 pointer-events-none opacity-20 z-50">
        <img src="/images/fju-logo.png" alt="" className="w-16" />
      </div>
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