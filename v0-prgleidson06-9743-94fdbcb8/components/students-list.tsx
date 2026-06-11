'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import { Student, getStudents, checkInStudent } from '@/lib/database'
import { AttendanceCardMini } from '@/components/attendance-card'
import { Search, ArrowLeft, CheckCircle, IdCard } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AttendanceCard } from '@/components/attendance-card'

interface StudentsListProps {
  onBack: () => void
  onCheckIn: (student: Student) => void
}

export function StudentsList({ onBack, onCheckIn }: StudentsListProps) {
  const { t, isAdmin } = useApp()
  const [students, setStudents] = useState<Student[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  useEffect(() => {
    setStudents(getStudents())
  }, [])

  const filteredStudents = students.filter(s =>
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.includes(searchQuery)
  )

  const handleCheckIn = (student: Student) => {
    checkInStudent(student.id)
    onCheckIn(student)
  }

  const beltColors: Record<string, string> = {
    white: 'bg-white text-gray-900',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
    brown: 'bg-amber-700 text-white',
    black: 'bg-gray-900 text-white',
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.checkIn}
        </Button>
        <h1 className="text-2xl font-bold">{t.studentList}</h1>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="overflow-hidden hover:border-primary/50 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                  {student.photo ? (
                    <img src={student.photo} alt={student.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl font-bold text-muted-foreground">
                      {student.firstName[0]}{student.lastName[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{student.firstName} {student.lastName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${beltColors[student.beltRank]}`}>
                      {t[student.beltRank]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {student.stripes} {t.stripes}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{t[student.membershipType]}</p>
                </div>
              </div>

              {/* Attendance Mini Card */}
              <div className="mt-4">
                <AttendanceCardMini student={student} />
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedStudent(student)}
                >
                  <IdCard className="w-4 h-4 mr-1" />
                  {t.attendanceCard}
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-primary"
                  onClick={() => handleCheckIn(student)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  CHECK-IN
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {t.noStudentsFound}
        </div>
      )}

      {/* Attendance Card Dialog */}
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.attendanceCard}</DialogTitle>
          </DialogHeader>
          {selectedStudent && <AttendanceCard student={selectedStudent} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
