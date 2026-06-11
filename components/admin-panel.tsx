'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import { 
  Student, GymClass, AdminSettings,
  getStudents, getClasses, getSettings,
  saveStudent, saveClass, saveSettings,
  deleteStudent, deleteClass, generateId 
} from '@/lib/database'
import { AttendanceCard } from '@/components/attendance-card'
import { CameraCapture } from '@/components/camera-capture'
import { 
  Users, Calendar, Settings, BarChart3, 
  Plus, Edit2, Trash2, Eye, Search, Camera,
  Save, X
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'

type AdminTab = 'students' | 'classes' | 'settings' | 'reports'

export function AdminPanel() {
  const { t, isAdmin } = useApp()
  const [activeTab, setActiveTab] = useState<AdminTab>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [settings, setSettingsState] = useState<AdminSettings>(getSettings())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentDialog, setShowStudentDialog] = useState(false)
  const [showClassDialog, setShowClassDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditStudentDialog, setShowEditStudentDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'student' | 'class'; id: string } | null>(null)
  const [editingClass, setEditingClass] = useState<GymClass | null>(null)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showCameraDialog, setShowCameraDialog] = useState(false)

  useEffect(() => {
    fetch('/api/students')
  .then(res => res.json())
  .then(data => setStudents(data))
    setClasses(getClasses())
    setSettingsState(getSettings())
  }, [])

  const refreshData = () => {
    fetch('/api/students')
  .then(res => res.json())
  .then(data => setStudents(data))
    setClasses(getClasses())
    setSettingsState(getSettings())
  }

  const filteredStudents = students.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDeleteStudent = (id: string) => {
    setDeleteTarget({ type: 'student', id })
    setShowDeleteDialog(true)
  }

  const handleDeleteClass = (id: string) => {
    setDeleteTarget({ type: 'class', id })
    setShowDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    
    if (deleteTarget.type === 'student') {
      deleteStudent(deleteTarget.id)
    } else {
      deleteClass(deleteTarget.id)
    }
    
    refreshData()
    setShowDeleteDialog(false)
    setDeleteTarget(null)
  }

  const handleSaveSettings = () => {
    saveSettings(settings)
    alert(t.settingsSaved || 'Settings saved!')
  }

  const handleSaveClass = (gymClass: GymClass) => {
    saveClass(gymClass)
    refreshData()
    setShowClassDialog(false)
    setEditingClass(null)
  }

  const handleEditStudent = (student: Student) => {
    setEditingStudent({ ...student })
    setShowEditStudentDialog(true)
  }

  const handleSaveStudent = () => {
    if (!editingStudent) return
    saveStudent(editingStudent)
    refreshData()
    setShowEditStudentDialog(false)
    setEditingStudent(null)
  }

  const handleAddNewStudent = () => {
    const newStudent: Student = {
      id: generateId(),
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      photo: '',
      beltRank: 'white',
      stripes: 0,
      membershipType: 'unlimited',
      emergencyName: '',
      emergencyPhone: '',
      emergencyRelationship: '',
      medicalConditions: '',
      allergies: '',
      medications: '',
      waiverSigned: false,
      waiverSignature: '',
      waiverSignedDate: '',
      createdAt: new Date().toISOString(),
      totalClasses: 0,
      attendanceHistory: [],
    }
    setEditingStudent(newStudent)
    setShowEditStudentDialog(true)
  }

  const handlePhotoCapture = (photo: string) => {
    if (editingStudent) {
      setEditingStudent({ ...editingStudent, photo })
    }
    setShowCameraDialog(false)
  }

  const dayNames = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday]
  const beltOptions = ['white', 'blue', 'purple', 'brown', 'black']
  const membershipOptions = ['unlimited', 'monthly', 'trial', 'vip']

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t.accessDenied || 'Access denied. Please login as admin.'}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <img src="/images/fju-badge.jpg" alt="FJU" className="h-12 rounded-full" />
          <div>
            <h1 className="text-2xl font-bold">{t.adminPanel}</h1>
            <p className="text-muted-foreground text-sm">FJU BJJ Academy</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'students', icon: Users, label: t.manageStudents },
          { id: 'classes', icon: Calendar, label: t.manageClasses },
          { id: 'settings', icon: Settings, label: t.settings },
          { id: 'reports', icon: BarChart3, label: t.reports },
        ].map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'outline'}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className="gap-2"
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </Button>
        ))}
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="gap-2 bg-primary" onClick={handleAddNewStudent}>
              <Plus className="w-4 h-4" />
              {t.addStudent}
            </Button>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.name || 'Name'}</TableHead>
                  <TableHead>{t.belt}</TableHead>
                  <TableHead>{t.membershipType}</TableHead>
                  <TableHead>{t.totalClasses}</TableHead>
                  <TableHead className="text-right">{t.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t.noStudentsFound}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                            {student.photo ? (
                              <img src={student.photo} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{student.firstName} {student.lastName}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{t[student.beltRank] || student.beltRank} - {student.stripes} {t.stripes}</span>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{t[student.membershipType] || student.membershipType}</span>
                      </TableCell>
                      <TableCell>{student.totalClasses}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedStudent(student)
                              setShowStudentDialog(true)
                            }}
                            title={t.view || 'View'}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStudent(student)}
                            title={t.edit || 'Edit'}
                          >
                            <Edit2 className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStudent(student.id)}
                            title={t.delete || 'Delete'}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              className="gap-2 bg-primary"
              onClick={() => {
                setEditingClass({
                  id: generateId(),
                  name: '',
                  instructor: '',
                  dayOfWeek: 1,
                  startTime: '09:00',
                  endTime: '10:00',
                  maxCapacity: 30,
                })
                setShowClassDialog(true)
              }}
            >
              <Plus className="w-4 h-4" />
              {t.addClass}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((gymClass) => (
              <Card key={gymClass.id} className="relative overflow-hidden">
                <div className="absolute top-2 right-2 opacity-10">
                  <img src="/images/fju-logo.png" alt="" className="w-8" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{gymClass.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{gymClass.instructor}</p>
                    <p>{dayNames[gymClass.dayOfWeek]} - {gymClass.startTime} - {gymClass.endTime}</p>
                    <p className="text-muted-foreground">{t.maxCapacity}: {gymClass.maxCapacity}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingClass(gymClass)
                        setShowClassDialog(true)
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      {t.edit}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClass(gymClass.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1 text-red-500" />
                      {t.delete}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>{t.settings}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{t.gymName || 'Gym Name'}</Label>
              <Input
                value={settings.gymName}
                onChange={(e) => setSettingsState({ ...settings, gymName: e.target.value })}
              />
            </div>
            <div>
              <Label>{t.maxCapacity}</Label>
              <Input
                type="number"
                value={settings.gymCapacity}
                onChange={(e) => setSettingsState({ ...settings, gymCapacity: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t.announcements}</Label>
              <Textarea
                value={settings.announcements.join('\n')}
                onChange={(e) => setSettingsState({ ...settings, announcements: e.target.value.split('\n').filter(Boolean) })}
                rows={4}
                placeholder={t.oneAnnouncementPerLine || 'One announcement per line...'}
              />
            </div>
            <Button onClick={handleSaveSettings} className="bg-primary">
              <Save className="w-4 h-4 mr-2" />
              {t.save}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.totalClasses}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">
                {students.reduce((sum, s) => sum + s.totalClasses, 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{t.allTime || 'All time'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.students}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{students.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.activeMembers || 'Active members'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.manageClasses}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-primary">{classes.length}</p>
              <p className="text-sm text-muted-foreground mt-1">{t.weeklySchedule || 'Weekly schedule'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Student Detail Dialog (View) */}
      <Dialog open={showStudentDialog} onOpenChange={setShowStudentDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedStudent && (
                <>
                  <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
                    {selectedStudent.photo ? (
                      <img src={selectedStudent.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                        {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                      </div>
                    )}
                  </div>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Attendance Card */}
              <AttendanceCard student={selectedStudent} />
              
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t.email}</p>
                  <p>{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.phone}</p>
                  <p>{selectedStudent.phone}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.emergencyContact}</p>
                  <p>{selectedStudent.emergencyName} ({selectedStudent.emergencyRelationship})</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t.emergencyPhone}</p>
                  <p>{selectedStudent.emergencyPhone}</p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => {
                    setShowStudentDialog(false)
                    handleEditStudent(selectedStudent)
                  }}
                  className="gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  {t.edit}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Student Edit Dialog */}
      <Dialog open={showEditStudentDialog} onOpenChange={setShowEditStudentDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              {editingStudent?.id ? t.editStudent : t.addStudent}
            </DialogTitle>
          </DialogHeader>
          {editingStudent && (
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="personal">{t.personalInfo}</TabsTrigger>
                <TabsTrigger value="emergency">{t.emergencyContact}</TabsTrigger>
                <TabsTrigger value="membership">{t.membershipType}</TabsTrigger>
                <TabsTrigger value="photo">{t.studentPhoto}</TabsTrigger>
              </TabsList>

              {/* Personal Info Tab */}
              <TabsContent value="personal" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t.firstName}</Label>
                    <Input
                      value={editingStudent.firstName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>{t.lastName}</Label>
                    <Input
                      value={editingStudent.lastName}
                      onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>{t.email}</Label>
                  <Input
                    type="email"
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.phone}</Label>
                  <Input
                    value={editingStudent.phone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.dateOfBirth}</Label>
                  <Input
                    type="date"
                    value={editingStudent.dateOfBirth}
                    onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })}
                  />
                </div>
              </TabsContent>

              {/* Emergency Contact Tab */}
              <TabsContent value="emergency" className="space-y-4 mt-4">
                <div>
                  <Label>{t.emergencyName}</Label>
                  <Input
                    value={editingStudent.emergencyName}
                    onChange={(e) => setEditingStudent({ ...editingStudent, emergencyName: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.emergencyPhone}</Label>
                  <Input
                    value={editingStudent.emergencyPhone}
                    onChange={(e) => setEditingStudent({ ...editingStudent, emergencyPhone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.relationship}</Label>
                  <Input
                    value={editingStudent.emergencyRelationship}
                    onChange={(e) => setEditingStudent({ ...editingStudent, emergencyRelationship: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.medicalConditions}</Label>
                  <Textarea
                    value={editingStudent.medicalConditions}
                    onChange={(e) => setEditingStudent({ ...editingStudent, medicalConditions: e.target.value })}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>{t.allergies}</Label>
                  <Textarea
                    value={editingStudent.allergies}
                    onChange={(e) => setEditingStudent({ ...editingStudent, allergies: e.target.value })}
                    rows={2}
                  />
                </div>
              </TabsContent>

              {/* Membership Tab */}
              <TabsContent value="membership" className="space-y-4 mt-4">
                <div>
                  <Label>{t.membershipType}</Label>
                  <Select
                    value={editingStudent.membershipType}
                    onValueChange={(v) => setEditingStudent({ ...editingStudent, membershipType: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {membershipOptions.map((type) => (
                        <SelectItem key={type} value={type}>
                          {t[type] || type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.belt}</Label>
                  <Select
                    value={editingStudent.beltRank}
                    onValueChange={(v) => setEditingStudent({ ...editingStudent, beltRank: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {beltOptions.map((belt) => (
                        <SelectItem key={belt} value={belt}>
                          {t[belt] || belt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.stripes} (0-4)</Label>
                  <Select
                    value={editingStudent.stripes.toString()}
                    onValueChange={(v) => setEditingStudent({ ...editingStudent, stripes: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n} {t.stripes}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t.totalClasses}</Label>
                  <Input
                    type="number"
                    value={editingStudent.totalClasses}
                    onChange={(e) => setEditingStudent({ ...editingStudent, totalClasses: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </TabsContent>

              {/* Photo Tab */}
              <TabsContent value="photo" className="space-y-4 mt-4">
                <div className="flex flex-col items-center gap-4">
                  {editingStudent.photo ? (
                    <div className="relative">
                      <img 
                        src={editingStudent.photo} 
                        alt="Student" 
                        className="w-48 h-48 rounded-lg object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2"
                        onClick={() => setEditingStudent({ ...editingStudent, photo: '' })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-48 h-48 rounded-lg bg-secondary flex items-center justify-center">
                      <Camera className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowCameraDialog(true)}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    {editingStudent.photo ? t.retakePhoto : t.takePhoto}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowEditStudentDialog(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSaveStudent} className="bg-primary gap-2">
              <Save className="w-4 h-4" />
              {t.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={showCameraDialog} onOpenChange={setShowCameraDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{t.studentPhoto}</DialogTitle>
          </DialogHeader>
          <CameraCapture onCapture={handlePhotoCapture} />
        </DialogContent>
      </Dialog>

      {/* Class Edit Dialog */}
      <Dialog open={showClassDialog} onOpenChange={setShowClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass?.name ? t.editClass || 'Edit Class' : t.addClass}</DialogTitle>
          </DialogHeader>
          {editingClass && (
            <div className="space-y-4">
              <div>
                <Label>{t.className}</Label>
                <Input
                  value={editingClass.name}
                  onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                />
              </div>
              <div>
                <Label>{t.instructor}</Label>
                <Input
                  value={editingClass.instructor}
                  onChange={(e) => setEditingClass({ ...editingClass, instructor: e.target.value })}
                />
              </div>
              <div>
                <Label>{t.dayOfWeek}</Label>
                <Select
                  value={editingClass.dayOfWeek.toString()}
                  onValueChange={(v) => setEditingClass({ ...editingClass, dayOfWeek: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {dayNames.map((day, i) => (
                      <SelectItem key={i} value={i.toString()}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t.startTime}</Label>
                  <Input
                    type="time"
                    value={editingClass.startTime}
                    onChange={(e) => setEditingClass({ ...editingClass, startTime: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t.endTime}</Label>
                  <Input
                    type="time"
                    value={editingClass.endTime}
                    onChange={(e) => setEditingClass({ ...editingClass, endTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t.maxCapacity}</Label>
                <Input
                  type="number"
                  value={editingClass.maxCapacity}
                  onChange={(e) => setEditingClass({ ...editingClass, maxCapacity: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowClassDialog(false)}>
                  {t.cancel}
                </Button>
                <Button onClick={() => handleSaveClass(editingClass)} className="bg-primary gap-2">
                  <Save className="w-4 h-4" />
                  {t.save}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.confirmDelete}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteWarning || 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
