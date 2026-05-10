import { createContext, useContext, useState, type ReactNode } from "react";


interface AcessibilidadeContextData {
  isModoIdoso: boolean;
  toggleModoIdoso: () => void;
}

const AcessibilidadeContext = createContext<AcessibilidadeContextData>({} as AcessibilidadeContextData);

export function AcessibilidadeProvider({ children }: { children: ReactNode }) {
  const [isModoIdoso, setIsModoIdoso] = useState(false);

  const toggleModoIdoso = () => {
    setIsModoIdoso(!isModoIdoso);
  };

  return (
    <AcessibilidadeContext.Provider value={{ isModoIdoso, toggleModoIdoso }}>
      {children}
    </AcessibilidadeContext.Provider>
  );
}


export const useAcessibilidade = () => useContext(AcessibilidadeContext);