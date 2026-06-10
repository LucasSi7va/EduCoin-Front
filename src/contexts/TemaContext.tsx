import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface TemaContextType {
  tema: 'claro' | 'escuro';
  toggleTema: () => void;
}

const TemaContext = createContext<TemaContextType | undefined>(undefined);

export function TemaProvider({ children }: { children: ReactNode }) {
  // Inicializa lendo do localStorage para garantir a persistência
  const [tema, setTema] = useState<'claro' | 'escuro'>(() => {
    const salvo = localStorage.getItem('coinedu-tema');
    return (salvo as 'claro' | 'escuro') || 'escuro'; // Escuro é o padrão
  });

  // Sempre que o tema mudar, salva no localStorage
  useEffect(() => {
    localStorage.setItem('coinedu-tema', tema);
  }, [tema]);

  function toggleTema() {
    setTema(prev => prev === 'claro' ? 'escuro' : 'claro');
  }

  return (
    <TemaContext.Provider value={{ tema, toggleTema }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema() {
  const context = useContext(TemaContext);
  if (!context) {
    throw new Error('useTema deve ser usado dentro de um TemaProvider');
  }
  return context;
}