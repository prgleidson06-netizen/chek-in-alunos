"use client"

import { Search, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SearchSectionProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onSearch: () => void
}

export function SearchSection({ searchQuery, onSearchChange, onSearch }: SearchSectionProps) {
  return (
    <section className="py-12 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight italic">
          CHECK-IN DO ALUNO
        </h2>
        <p className="text-muted-foreground mb-8">
          Bem-vindo de volta, guerreiro. Busque o seu nome abaixo para registrar seu treino de hoje.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-center">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="DIGITE SEU NOME PARA COMEÇAR..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-12 h-14 bg-input border-border text-foreground placeholder:text-muted-foreground text-sm tracking-wide"
            />
          </div>
          
          <Button
            variant="outline"
            className="h-14 px-6 border-border bg-transparent hover:bg-secondary gap-2"
          >
            <Smartphone className="h-4 w-4" />
            ID KEYPAD
          </Button>
          
          <Button
            onClick={onSearch}
            className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            BUSCAR
          </Button>
        </div>
      </div>
    </section>
  )
}
