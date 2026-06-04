import { useState, useEffect, useRef, useCallback } from "react";

// ─── Hook de fala ─────────────────────────────────────────────────────────────
export function useFala() {
  const [falando, setFalando] = useState(false);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  const falar = useCallback((texto: string, aoConcluir?: () => void) => {
    if (!("speechSynthesis" in window)) { aoConcluir?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = "pt-BR";
    u.rate = 0.93;
    u.pitch = 1;
    u.onstart = () => setFalando(true);
    u.onend   = () => { setFalando(false); aoConcluir?.(); };
    u.onerror = () => { setFalando(false); aoConcluir?.(); };
    window.speechSynthesis.speak(u);
  }, []);

  const parar = useCallback(() => {
    window.speechSynthesis.cancel();
    setFalando(false);
  }, []);

  return { falando, falar, parar };
}

// ─── Hook TalkBack ─────────────────────────────────────────────────────────────
export function useTalkBack(ativo: boolean, fala: ReturnType<typeof useFala>) {
  const [pendente, setPendente] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ativo) {
      setPendente(null);
      if (timerRef.current) clearTimeout(timerRef.current);
      window.speechSynthesis.cancel();
    }
  }, [ativo]);

  /**
   * Envolve um clique com lógica TalkBack.
   * acao agora recebe o evento — compatível com toggleFavorito(e, id) e
   * com handlers simples que ignoram o evento (() => navigate(...)).
   */
  const talkClick = useCallback(
    (id: string, label: string, acao: (e: React.MouseEvent) => void) =>
      (e: React.MouseEvent) => {
        if (!ativo) { acao(e); return; }
        e.preventDefault();
        e.stopPropagation();

        if (pendente === id) {
          if (timerRef.current) clearTimeout(timerRef.current);
          setPendente(null);
          fala.parar();
          acao(e);
        } else {
          if (timerRef.current) clearTimeout(timerRef.current);
          setPendente(id);
          fala.falar(label);
          timerRef.current = setTimeout(() => setPendente(null), 4000);
        }
      },
    [ativo, pendente, fala]
  );

  /** Retorna estilo extra quando o botão está pendente (selecionado) */
  const estiloTalkBack = useCallback(
    (id: string, base: React.CSSProperties): React.CSSProperties => {
      if (!ativo || pendente !== id) return base;
      return {
        ...base,
        outline: "3px solid #f59e0b",
        outlineOffset: "2px",
        boxShadow: "0 0 0 6px rgba(245,158,11,0.25)",
      };
    },
    [ativo, pendente]
  );

  return { pendente, talkClick, estiloTalkBack };
}