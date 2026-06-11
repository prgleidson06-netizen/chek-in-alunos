'use client'

import { ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Student, CheckIn } from '@/lib/database'
import { useApp } from '@/components/app-provider'

const beltColors: Record<string, { bg: string }> = {
  white: { bg: 'bg-white' },
  blue: { bg: 'bg-blue-500' },
  purple: { bg: 'bg-purple-500' },
  brown: { bg: 'bg-amber-700' },
  black: { bg: 'bg-gray-900 border border-white/20' },
}

function BeltBadge({ beltColor, stripes }: { beltColor: string; stripes: number }) {
  const belt = beltColors[beltColor] || beltColors.white
  
  return (
    <div className="flex items-center gap-1">
      <div className={`w-8 h-4 rounded-sm ${belt.bg}`} />
      <div className="flex gap-0.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm ${
              i < stripes ? 'bg-white' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

interface StudentCardProps {
  student: Student
  onCheckIn: (student: Student) => void
  isCheckedIn?: boolean
}

export function StudentCard({ student, onCheckIn, isCheckedIn }: StudentCardProps) {
  const { t } = useApp()
  
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
      {/* FJU Watermark */}
      <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
        <img src="/images/fju-logo.png" alt="" className="w-8" />
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={student.firstName}
              className="w-full h-full object-cover grayscale"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {student.firstName?.charAt(0) || ''}{student.lastName?.charAt(0) || ''}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase">
              {t[student.beltRank]} {t.belt} • {student.stripes} {t.stripes}
            </p>
            <BeltBadge beltColor={student.beltRank} stripes={student.stripes} />
          </div>
          <h4 className="font-bold text-foreground truncate">
            {student.firstName} {student.lastName}
          </h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t[student.membershipType]}
          </p>
        </div>
      </div>
      
      <Button
        onClick={() => onCheckIn(student)}
        disabled={isCheckedIn}
        className={`w-full mt-4 gap-2 ${
          isCheckedIn 
            ? 'bg-green-600 hover:bg-green-600 cursor-not-allowed' 
            : 'bg-primary hover:bg-primary/90 group-hover:bg-primary/80'
        } text-primary-foreground`}
      >
        {isCheckedIn ? (
          <>
            <CheckCircle className="h-4 w-4" />
            {t.checkedIn}
          </>
        ) : (
          <>
            CHECK-IN
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
}

// Card for recent check-ins (showing check-in info)
interface CheckInCardProps {
  checkIn: CheckIn
}

export function CheckInCard({ checkIn }: CheckInCardProps) {
  const { t } = useApp()
  const checkInTime = new Date(checkIn.checkInTime)
  const timeString = checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  return (
    <div className="bg-card border border-border rounded-lg p-4 relative overflow-hidden">
      {/* FJU Watermark */}
      <div className="absolute bottom-2 right-2 opacity-10 pointer-events-none">
        <img src="/images/fju-logo.png" alt="" className="w-8" />
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
          {checkIn.studentPhoto ? (
            <img
              src={checkIn.studentPhoto}
              alt={checkIn.studentName}
              className="w-full h-full object-cover grayscale"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {checkIn.studentName?.charAt(0) || 'S'}
            </div>
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase">
              {t[checkIn.beltRank as keyof typeof t] || checkIn.beltRank} {t.belt} • {checkIn.stripes} {t.stripes}
            </p>
            <BeltBadge beltColor={checkIn.beltRank} stripes={checkIn.stripes} />
          </div>
          <h4 className="font-bold text-foreground truncate">{checkIn.studentName}</h4>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {t[checkIn.membershipType as keyof typeof t] || checkIn.membershipType}
          </p>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{checkIn.className}</span>
        <span className="text-xs text-green-500 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {timeString}
        </span>
      </div>
    </div>
  )
}

interface RecentArrivalsProps {
  students: Student[]
  checkIns: CheckIn[]
  onCheckIn: (student: Student) => void
  onViewAll: () => void
}

export function RecentArrivals({ students, checkIns, onCheckIn, onViewAll }: RecentArrivalsProps) {
  const { t } = useApp()
  
  // Get IDs of students who already checked in today
  const checkedInIds = new Set(checkIns.map(c => c.studentId))
  
  return (
    <section className="py-8 px-4 relative">
      {/* FJU Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <img src="/images/fju-badge.jpg" alt="" className="w-64" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-black text-foreground tracking-tight italic">
            {t.recentArrivals}
          </h3>
          <button 
            onClick={onViewAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {t.view} ({students.length})
          </button>
        </div>
        
        <div className="border-t border-primary mb-6" />
        
        {/* Show recent check-ins if any */}
        {checkIns.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-muted-foreground mb-4">{checkIns.length} {t.classesToday}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {checkIns.slice(0, 4).map((checkIn) => (
                <CheckInCard key={checkIn.id} checkIn={checkIn} />
              ))}
            </div>
          </div>
        )}
        
        {/* Show students for check-in */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {students.slice(0, 8).map((student) => (
            <StudentCard 
              key={student.id} 
              student={student} 
              onCheckIn={onCheckIn}
              isCheckedIn={checkedInIds.has(student.id)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
