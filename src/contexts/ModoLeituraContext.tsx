import { createContext, useContext, useEffect, useState } from "react";

interface ModoLeituraContextType {
  modoLeitura: boolean;
  setModoLeitura: React.Dispatch<React.SetStateAction<boolean>>;
}

const ModoLeituraContext =
  createContext({} as ModoLeituraContextType);

export function ModoLeituraProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modoLeitura, setModoLeitura] = useState(() => {
    return localStorage.getItem("modoLeitura") === "true";
  });

  useEffect(() => {
    localStorage.setItem(
      "modoLeitura",
      String(modoLeitura)
    );
  }, [modoLeitura]);

  return (
    <ModoLeituraContext.Provider
      value={{
        modoLeitura,
        setModoLeitura,
      }}
    >
      {children}
    </ModoLeituraContext.Provider>
  );
}

export function useModoLeitura() {
  return useContext(ModoLeituraContext);
}