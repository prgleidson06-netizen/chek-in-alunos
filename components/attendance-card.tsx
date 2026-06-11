'use client'

import { Student } from '@/lib/database'
import { useApp } from '@/components/app-provider'

interface AttendanceCardProps {
  student: Student
  onPrint?: () => void
}

export function AttendanceCard({ student, onPrint }: AttendanceCardProps) {
  const { t } = useApp()
  
  // Create a 10x8 grid (80 classes total per card)
  const totalCells = 80
  const attendedClasses = student.totalClasses % totalCells
  
  const handlePrint = () => {
    if (onPrint) onPrint()
    window.print()
  }

  return (
    <div className="bg-white text-gray-900 rounded-lg overflow-hidden print:shadow-none" id="attendance-card">
      {/* Card Header */}
      <div className="bg-[#1a1f3c] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/images/fju-logo.png" alt="FJU" className="h-10" />
          <div>
            <h2 className="font-bold text-lg">FJU BJJ Academy</h2>
            <p className="text-xs opacity-80">{t.attendanceCard}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold">{student.firstName} {student.lastName}</p>
          <p className="text-xs opacity-80">ID: {student.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 relative">
        {/* Watermark */}
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5"
          style={{
            backgroundImage: 'url(/images/fju-badge.jpg)',
            backgroundSize: '200px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        {/* Student Info Row */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b relative z-10">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
            {student.photo ? (
              <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-2xl font-bold">{student.firstName[0]}{student.lastName[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-gray-500 text-xs">{t.belt}</p>
              <p className="font-semibold capitalize">{t[student.beltRank]} - {student.stripes} {t.stripes}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t.membershipType}</p>
              <p className="font-semibold capitalize">{t[student.membershipType]}</p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">{t.totalClasses}</p>
              <p className="font-semibold">{student.totalClasses}</p>
            </div>
          </div>
        </div>

        {/* Attendance Grid */}
        <div className="grid grid-cols-10 gap-1 relative z-10">
          {Array.from({ length: totalCells }).map((_, index) => {
            const isAttended = index < attendedClasses
            return (
              <div
                key={index}
                className={`aspect-square rounded-sm border flex items-center justify-center text-xs font-medium ${
                  isAttended
                    ? 'bg-[#c41e3a] border-[#c41e3a] text-white'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                {index + 1}
              </div>
            )
          })}
        </div>

        {/* FJU Badge Stamps */}
        <div className="flex justify-between mt-4 relative z-10">
          <img src="/images/fju-badge.jpg" alt="FJU" className="h-12 opacity-60" />
          <div className="text-center">
            <p className="text-xs text-gray-500">Card #{Math.ceil(student.totalClasses / totalCells)}</p>
            <p className="text-xs text-gray-400">{new Date(student.startDate).toLocaleDateString()}</p>
          </div>
          <img src="/images/fju-badge.jpg" alt="FJU" className="h-12 opacity-60" />
        </div>
      </div>

      {/* Print Button */}
      <div className="p-4 border-t bg-gray-50 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full py-2 px-4 bg-[#1a1f3c] text-white rounded-lg hover:bg-[#1a1f3c]/90 transition-colors"
        >
          {t.printCard}
        </button>
      </div>
    </div>
  )
}

// Mini version for display in student list
export function AttendanceCardMini({ student }: { student: Student }) {
  const totalCells = 80
  const attendedClasses = student.totalClasses % totalCells
  const progress = (attendedClasses / totalCells) * 100

  return (
    <div className="bg-card rounded-lg p-3 border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground">Card Progress</span>
        <span className="text-xs font-medium">{attendedClasses}/{totalCells}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Total: {student.totalClasses} classes
      </div>
    </div>
  )
}
