'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import type { Student, GymClass, AdminSettings } from '@/lib/database'
import { getClasses, getSettings, saveClass, saveSettings, deleteClass, generateId } from '@/lib/database'
import { Users, Calendar, Settings, BarChart3, Plus, Save } from 'lucide-react'

type AdminTab = 'students' | 'classes' | 'settings' | 'reports'

export function AdminPanel() {
  const { t, isAdmin } = useApp()
  const [activeTab, setActiveTab] = useState<AdminTab>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [settings, setSettingsState] = useState<AdminSettings>(getSettings())
  const [searchQuery, setSearchQuery] = useState('')

  const tt = (key: string, fallback: string) => ((t as any)[key] as string) || fallback

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch {
      setStudents([])
    }
  }

  const refreshData = async () => {
    await loadStudents()
    setClasses(getClasses())
    setSettingsState(getSettings())
  }

  useEffect(() => {
    refreshData()
  }, [])

  const safePhoto = (photo?: string) => {
    if (!photo) return '/images/fju-badge.jpg'
    if (photo.startsWith('data:image') && photo.length > 250000) return '/images/fju-badge.jpg'
    return photo
  }

  const handleAddStudent = async () => {
    const firstName = prompt('First name / Nome')
    if (!firstName) return

    const lastName = prompt('Last name / Sobrenome') || ''
    const email = prompt('Email') || ''
    const phone = prompt('Phone / Telefone') || ''
    const now = new Date().toISOString()

    const newStudent: Student = {
      id: generateId(),
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth: '',
      photo: '/images/fju-badge.jpg',
      beltRank: 'white',
      stripes: 0,
      membershipType: 'monthly',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelationship: '',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelationship: '',
      medicalConditions: '',
      allergies: '',
      medications: '',
      waiverAgreed: false,
      waiverSignature: '',
      waiverSignedAt: '',
      startDate: now.split('T')[0],
      createdAt: now,
      updatedAt: now,
      totalClasses: 0,
      attendanceHistory: [],
    }

    await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent),
    })

    await refreshData()
    alert('Student saved successfully!')
  }

  const handleSaveSettings = () => {
    saveSettings(settings)
    alert('Settings saved!')
  }

  const handleAddClass = () => {
    const name = prompt('Class name / Nome da aula')
    if (!name) return

    const newClass: GymClass = {
      id: generateId(),
      name,
      instructor: '',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      maxCapacity: 30,
    }

    saveClass(newClass)
    refreshData()
  }

  const handleDeleteClass = (id: string) => {
    if (!confirm('Delete this class?')) return
    deleteClass(id)
    refreshData()
  }

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase()
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    )
  })

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{tt('accessDenied', 'Access denied. Please login as admin.')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <img src="/images/fju-badge.jpg" alt="FJU" className="h-12 rounded-full" />
        <div>
          <h1 className="text-2xl font-bold">{tt('adminPanel', 'Admin Panel')}</h1>
          <p className="text-muted-foreground text-sm">FJU BJJ Academy</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={() => setActiveTab('students')} variant={activeTab === 'students' ? 'default' : 'outline'}>
          <Users className="w-4 h-4 mr-2" />
          {tt('manageStudents', 'Students')}
        </Button>
        <Button onClick={() => setActiveTab('classes')} variant={activeTab === 'classes' ? 'default' : 'outline'}>
          <Calendar className="w-4 h-4 mr-2" />
          {tt('manageClasses', 'Classes')}
        </Button>
        <Button onClick={() => setActiveTab('settings')} variant={activeTab === 'settings' ? 'default' : 'outline'}>
          <Settings className="w-4 h-4 mr-2" />
          {tt('settings', 'Settings')}
        </Button>
        <Button onClick={() => setActiveTab('reports')} variant={activeTab === 'reports' ? 'default' : 'outline'}>
          <BarChart3 className="w-4 h-4 mr-2" />
          {tt('reports', 'Reports')}
        </Button>
      </div>

      {activeTab === 'students' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>{tt('students', 'Students')}</CardTitle>
              <Button onClick={handleAddStudent}>
                <Plus className="w-4 h-4 mr-2" />
                {tt('addStudent', 'Add Student')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder={tt('searchPlaceholder', 'Search students...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="space-y-2">
              {filteredStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <img src={safePhoto(student.photo)} alt="" className="w-10 h-10 rounded-full object-cover bg-secondary" />
                    <div>
                      <p className="font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground">{student.email || student.phone || student.id}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p>{tt(student.beltRank || 'white', student.beltRank || 'white')}</p>
                    <p className="text-muted-foreground">{student.totalClasses || 0} classes</p>
                  </div>
                </div>
              ))}

              {filteredStudents.length === 0 && (
                <p className="text-center text-muted-foreground py-8">{tt('noStudentsFound', 'No students found.')}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'classes' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{tt('manageClasses', 'Classes')}</CardTitle>
              <Button onClick={handleAddClass}>
                <Plus className="w-4 h-4 mr-2" />
                {tt('addClass', 'Add Class')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {classes.map((gymClass) => (
              <div key={gymClass.id} className="border rounded-lg p-3 flex justify-between">
                <div>
                  <p className="font-medium">{gymClass.name}</p>
                  <p className="text-sm text-muted-foreground">{gymClass.startTime} - {gymClass.endTime}</p>
                </div>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteClass(gymClass.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>{tt('settings', 'Settings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{tt('gymName', 'Gym Name')}</Label>
              <Input value={settings.gymName} onChange={(e) => setSettingsState({ ...settings, gymName: e.target.value })} />
            </div>
            <div>
              <Label>{tt('maxCapacity', 'Max Capacity')}</Label>
              <Input
                type="number"
                value={settings.gymCapacity}
                onChange={(e) => setSettingsState({ ...settings, gymCapacity: Number(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={handleSaveSettings}>
              <Save className="w-4 h-4 mr-2" />
              {tt('save', 'Save')}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader><CardTitle>{tt('students', 'Students')}</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-primary">{students.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{tt('manageClasses', 'Classes')}</CardTitle></CardHeader>
            <CardContent><p className="text-4xl font-bold text-primary">{classes.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{tt('totalClasses', 'Total Classes')}</CardTitle></CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                {students.reduce((sum, s) => sum + (s.totalClasses || 0), 0)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
