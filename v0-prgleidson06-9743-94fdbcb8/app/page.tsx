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
import { 
  Student, CheckIn,
  getStudents, getTodayCheckIns, checkInStudent, searchStudents, initializeDemoData 
} from '@/lib/database'
import { toast } from 'sonner'
import { Toaster } from 'sonner'

function KioskApp() {
  const { t, isAdmin } = useApp()
  const [activeTab, setActiveTab] = useState('CHECK-IN')
  const [searchQuery, setSearchQuery] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [showStudentsList, setShowStudentsList] = useState(false)

  // Load data
  useEffect(() => {
    initializeDemoData() // Initialize demo data if no students exist
    setStudents(getStudents())
    setCheckIns(getTodayCheckIns())
  }, [])

  // Refresh check-ins periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCheckIns(getTodayCheckIns())
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchStudents(searchQuery)
      setFilteredStudents(results)
    } else {
      setFilteredStudents([])
    }
  }

  const handleCheckIn = (student: Student) => {
    const result = checkInStudent(student.id)
    if (result) {
      setCheckIns(getTodayCheckIns())
      toast.success(`${t.checkInSuccess} - ${student.firstName} ${student.lastName}`)
    }
  }

  const handleEnrollmentComplete = (student: Student) => {
    setStudents(getStudents())
    setActiveTab('CHECK-IN')
    toast.success(t.enrollmentSuccess)
  }

  const renderContent = () => {
    // Show students list view
    if (showStudentsList) {
      return (
        <StudentsList
          onBack={() => setShowStudentsList(false)}
          onCheckIn={(student) => {
            handleCheckIn(student)
          }}
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
                if (!value.trim()) {
                  setFilteredStudents([])
                }
              }}
              onSearch={handleSearch}
            />
            
            <RecentArrivals
              students={filteredStudents.length > 0 ? filteredStudents : students}
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
      {/* Global FJU Watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] z-0">
        <img src="/images/fju-badge.jpg" alt="" className="w-[600px]" />
      </div>

      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative z-10">
        {renderContent()}
      </main>

      {/* FJU Logo Watermark in Corner */}
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
