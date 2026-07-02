'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useApp } from '@/components/app-provider'
import type { Student, GymClass } from '@/lib/database'
import { generateId } from '@/lib/database'
import { Users, Calendar, Plus, Trash2, Edit2, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

export function AdminPanel() {
  const { isAdmin } = useApp()
  const [activeTab, setActiveTab] = useState<'students' | 'classes'>('students')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  const loadStudents = async () => {
    try {
      const res = await fetch('/api/students', { cache: 'no-store' })
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch {
      setStudents([])
    }
  }

  const loadClasses = () => {
    try {
      const savedClasses = localStorage.getItem('fju_classes')
      if (savedClasses) {
        setClasses(JSON.parse(savedClasses))
      } else {
        const defaultClasses = [
          { id: '1', name: 'Jiujitsu - Adulto', instructor: 'Pr. Gleidson', startTime: '19:00', endTime: '20:30', maxCapacity: 30, dayOfWeek: 1 },
          { id: '2', name: 'Jiujitsu - Infantil', instructor: 'Aux. Ivan', startTime: '17:30', endTime: '18:30', maxCapacity: 20, dayOfWeek: 1 },
          { id: '3', name: 'Open Mat', instructor: 'Gleidson De Oliveira', startTime: '10:00', endTime: '12:00', maxCapacity: 50, dayOfWeek: 6 }
        ]
        localStorage.setItem('fju_classes', JSON.stringify(defaultClasses))
        setClasses(defaultClasses)
      }
    } catch {
      toast.error('Erro ao carregar as aulas.')
    }
  }

  useEffect(() => {
    loadStudents()
    loadClasses()
  }, [])

  const handleDeleteStudent = async (id: string, name: string) => {
    const confirmDelete = window.confirm(`Deseja realmente deletar o aluno ${name}? Essa ação é permanente.`)
    if (!confirmDelete) return

    try {
      setStudents(prev => prev.filter(s => s.id !== id))
      await fetch('/api/students', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      toast.success(`Aluno ${name} removido com sucesso!`)
    } catch {
      toast.error('Erro ao deletar o aluno no servidor.')
      loadStudents()
    }
  }

  // FUNÇÃO: EDITAR DADOS DO ALUNO COM TRAVA INTELIGENTE E ENVIO ISOLADO SEGURO
  const handleEditStudent = async (student: Student) => {
    const newFirstName = prompt('Editar Primeiro Nome:', student.firstName)
    if (newFirstName === null) return 
    
    const newLastName = prompt('Editar Sobrenome:', student.lastName)
    if (newLastName === null) return

    const confirmarCategoria = window.confirm(`O aluno ${newFirstName} é da categoria INFANTIL / KIDS?\n\n[Clique em OK para Infantil]\n[Clique em Cancelar para Adulto]`)
    const ehInfantil = confirmarCategoria

    const faixasInfantil = ['branca', 'cinza', 'amarela', 'laranja', 'verde']
    const faixasAdulto = ['branca', 'azul', 'roxa', 'marrom', 'preta', 'coral', 'vermelha']

    const faixasDisponiveis = ehInfantil ? faixasInfantil : faixasAdulto
    const mensagemFaixa = ehInfantil 
      ? `🥋 Categoria: INFANTIL / KIDS.\nOpções: ${faixasInfantil.join(', ')}`
      : `🥋 Categoria: ADULTO.\nOpções: ${faixasAdulto.join(', ')}`

    let newBelt = prompt(`${mensagemFaixa}\n\nDigite a nova faixa exatamente como listada acima:`, student.beltRank || 'branca')
    if (newBelt === null) return
    
    newBelt = newBelt.trim().toLowerCase()

    if (!faixasDisponiveis.includes(newBelt)) {
      toast.error(`Faixa "${newBelt}" inválida para esta categoria.`)
      return
    }

    const updatedStudent: Student = {
      ...student,
      firstName: newFirstName.trim() || student.firstName,
      lastName: newLastName.trim() || student.lastName,
      beltRank: newBelt as any,
      updatedAt: new Date().toISOString()
    }

    try {
      // 🚀 ENVIA APENAS UM OBJETO: A API intercepta e altera cirurgicamente no JSON do Mac
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      })

      setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s))
      toast.success('Cadastro do aluno atualizado com sucesso!')
    } catch {
      toast.error('Erro ao salvar edições do aluno.')
      loadStudents()
    }
  }

  const handleEditPhoto = async (student: Student) => {
    const currentPhoto = student.photo || '/images/fju-badge.jpg'
    const newPhotoUrl = prompt('Cole o link (URL) da nova foto do aluno:', currentPhoto)
    
    if (newPhotoUrl === null || newPhotoUrl.trim() === '' || newPhotoUrl === currentPhoto) {
      return
    }

    const updatedStudent: Student = {
      ...student,
      photo: newPhotoUrl.trim(),
      updatedAt: new Date().toISOString()
    }

    try {
      // 🚀 ENVIA APENAS UM OBJETO
      await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedStudent),
      })

      setStudents(prev => prev.map(s => s.id === student.id ? updatedStudent : s))
      toast.success(`Foto de ${student.firstName} atualizada!`)
    } catch {
      toast.error('Erro ao salvar a nova foto.')
      loadStudents()
    }
  }

  const handleAddClass = () => {
    const name = prompt('Nome da Aula (ex: Jiujitsu - Infantil, Jiujitsu - Adulto):')
    if (!name) return
    const instructor = prompt('Nome do Professor / Instrutor:') || 'Instrutor FJU'
    const startTime = prompt('Horário de Início (ex: 19:00):') || '19:00'
    const endTime = prompt('Horário de Término (ex: 20:30):') || '20:30'

    const newClass: GymClass = {
      id: generateId(),
      name,
      instructor,
      startTime,
      endTime,
      maxCapacity: 30,
      dayOfWeek: 1
    }

    const updatedClasses = [...classes, newClass]
    setClasses(updatedClasses)
    localStorage.setItem('fju_classes', JSON.stringify(updatedClasses))
    toast.success('Nova aula adicionada!')
  }

  const handleDeleteClass = (id: string) => {
    if (!confirm('Deseja remover este horário de aula da grade?')) return
    const updatedClasses = classes.filter(c => c.id !== id)
    setClasses(updatedClasses)
    localStorage.setItem('fju_classes', JSON.stringify(updatedClasses))
    toast.success('Horário de aula removido.')
  }

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase()
    return (
      s.firstName?.toLowerCase().includes(q) ||
      s.lastName?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.id?.toLowerCase().includes(q)
    )
  })

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Acesso negado. Por favor, faça login como Administrador.</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 text-white relative z-10">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <img src="/images/fju-badge.jpg" alt="FJU" className="h-12 w-12 rounded-full object-cover" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Painel de Controle</h1>
          <p className="text-zinc-400 text-xs uppercase tracking-widest">FJU BJJ Academy</p>
        </div>
      </div>

      <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 w-fit">
        <Button 
          onClick={() => setActiveTab('students')} 
          variant={activeTab === 'students' ? 'default' : 'ghost'}
          className={activeTab === 'students' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-zinc-400'}
        >
          <Users className="w-4 h-4 mr-2" /> Gerenciar Alunos
        </Button>
        <Button 
          onClick={() => setActiveTab('classes')} 
          variant={activeTab === 'classes' ? 'default' : 'ghost'}
          className={activeTab === 'classes' ? 'bg-red-600 hover:bg-red-700 text-white' : 'text-zinc-400'}
        >
          <Calendar className="w-4 h-4 mr-2" /> Gerenciar Aulas
        </Button>
      </div>

      {activeTab === 'students' && (
        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl text-zinc-100">Alunos Registrados</CardTitle>
              <Input 
                placeholder="🔎 Pesquisar por nome, e-mail ou ID..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-950 border-zinc-800 focus-visible:ring-red-600 max-w-sm text-white"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredStudents.map((student) => {
                const studentPhoto = student.photo || '/images/fju-badge.jpg'

                return (
                  <div key={student.id} className="flex items-center justify-between border border-zinc-800/80 bg-zinc-950/40 rounded-xl p-4 hover:border-zinc-700 transition group">
                    <div className="flex items-center gap-4">
                      <img 
                        src={studentPhoto} 
                        alt={`${student.firstName} ${student.lastName}`} 
                        className="w-12 h-12 rounded-full object-cover border border-zinc-700 flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/fju-badge.jpg'
                        }}
                      />
                      <div>
                        <p className="font-semibold text-zinc-200">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-zinc-500">{student.email || 'Sem e-mail cadastrado'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right hidden sm:block text-sm mr-4">
                        <p className="capitalize text-zinc-300 font-medium">🥋 {student.beltRank}</p>
                        <p className="text-xs text-zinc-500">{student.totalClasses || 0} aulas</p>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditPhoto(student)}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-emerald-400 h-9 w-9 rounded-xl transition"
                        title="Editar Foto do Aluno"
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditStudent(student)}
                        className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 h-9 w-9 rounded-xl transition"
                        title="Editar Dados do Aluno"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleDeleteStudent(student.id, `${student.firstName} ${student.lastName}`)}
                        className="bg-zinc-900/80 hover:bg-red-950 border border-zinc-800 hover:border-red-900 text-zinc-400 hover:text-red-400 h-9 w-9 rounded-xl transition"
                        title="Deletar Aluno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
              {filteredStudents.length === 0 && (
                <p className="text-center text-zinc-500 py-8 text-sm relative z-10">Nenhum aluno encontrado.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'classes' && (
        <Card className="bg-zinc-900/40 border-zinc-800 backdrop-blur-md relative z-10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-zinc-100">Grade de Horários</CardTitle>
              <Button onClick={handleAddClass} className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl px-4 shadow-lg">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Aula
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((gymClass) => (
                <div key={gymClass.id} className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between hover:border-zinc-700 transition shadow-md">
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-bold text-zinc-100 text-base">{gymClass.name}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteClass(gymClass.id)}
                        className="text-zinc-500 hover:text-red-400 hover:bg-transparent transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-red-400 font-medium flex items-center gap-1.5 mb-1">
                      🕒 {gymClass.startTime}h - {gymClass.endTime}h
                    </p>
                    <p className="text-xs text-zinc-400">
                      Professor: <span className="text-zinc-300 font-semibold">{gymClass.instructor || 'A definir'}</span>
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-900 text-[11px] text-zinc-500 flex justify-between">
                    <span>Status: <strong className="text-emerald-500">Ativa</strong></span>
                    <span>Capacidade: {gymClass.maxCapacity || 30} alunos</span>
                  </div>
                </div>
              ))}
              {classes.length === 0 && (
                <p className="text-center text-zinc-500 col-span-full py-8 text-sm relative z-10">Nenhuma aula cadastrada na grade.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}