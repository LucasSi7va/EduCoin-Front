import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Hook de leitura ─────────────────────────────────────────────────────────
function useFala() {
  const [falando, setFalando] = useState(false);

  useEffect(() => () => window.speechSynthesis.cancel(), []);

  const falar = useCallback((texto: string, aoConcluir?: () => void) => {
    if (!('speechSynthesis' in window)) { aoConcluir?.(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(texto);
    u.lang = 'pt-BR';
    u.rate = 0.93;
    u.pitch = 1;
    u.onstart = () => setFalando(true);
    u.onend = () => { setFalando(false); aoConcluir?.(); };
    u.onerror = () => { setFalando(false); aoConcluir?.(); };
    window.speechSynthesis.speak(u);
  }, []);

  const parar = useCallback(() => {
    window.speechSynthesis.cancel();
    setFalando(false);
  }, []);

  return { falando, falar, parar };
}

// ─── Hook TalkBack ────────────────────────────────────────────────────────────
// Primeiro clique: anuncia o label. Segundo clique (dentro de 4s): executa ação.
function useTalkBack(ativo: boolean, fala: ReturnType<typeof useFala>) {
  // id do botão que está "pendente" (já foi anunciado, esperando 2º clique)
  const [pendente, setPendente] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpa pendência quando o modo é desativado
  useEffect(() => {
    if (!ativo) {
      setPendente(null);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [ativo]);

  /**
   * Envolve um handler de clique com a lógica TalkBack.
   * @param id      identificador único do botão
   * @param label   texto que será lido em voz alta
   * @param acao    função executada no segundo clique
   */
  const talkClick = useCallback(
    (id: string, label: string, acao: (e: React.MouseEvent) => void) =>
      (e: React.MouseEvent) => {
        if (!ativo) { acao(e); return; }
        e.preventDefault();
        e.stopPropagation();

        if (pendente === id) {
          // Segundo clique: executa
          if (timerRef.current) clearTimeout(timerRef.current);
          setPendente(null);
          fala.parar();
          acao(e);
        } else {
          // Primeiro clique: anuncia
          if (timerRef.current) clearTimeout(timerRef.current);
          setPendente(id);
          fala.falar(label);
          // Após 4s sem segundo clique, cancela pendência
          timerRef.current = setTimeout(() => {
            setPendente(null);
          }, 4000);
        }
      },
    [ativo, pendente, fala]
  );

  return { pendente, talkClick };
}

// ─── Passos do tutorial ───────────────────────────────────────────────────────
const passos = [
  {
    titulo: 'O que é uma criptomoeda?',
    descricao:
      'Criptomoedas são moedas digitais que existem apenas na internet. Assim como o real vale dinheiro no Brasil, o Bitcoin vale dinheiro no mundo todo — mas só existe no computador.',
    visual: (
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '20px' }}>
        <div style={{ flex: 1, minWidth: '120px', backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>💵</div>
          <p style={{ color: '#aaa', margin: 0 }}>Real (física)</p>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0' }}>Banco Central controla</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: '#666', fontSize: '20px' }}>vs</div>
        <div style={{ flex: 1, minWidth: '120px', backgroundColor: '#1e3a5f', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #3b82f6' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>₿</div>
          <p style={{ color: '#93c5fd', margin: 0 }}>Bitcoin (digital)</p>
          <p style={{ color: '#60a5fa', fontSize: '13px', margin: '4px 0 0' }}>Ninguém controla</p>
        </div>
      </div>
    ),
  },
  {
    titulo: 'O que significa o preço?',
    descricao:
      'O preço mostra quanto você precisaria pagar em reais para comprar 1 unidade daquela moeda. Você não precisa comprar 1 inteiro — pode comprar uma fração pequena com qualquer valor!',
    visual: (
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[['₿', 'Bitcoin', 'R$ 520.000,00'], ['Ξ', 'Ethereum', 'R$ 18.400,00'], ['◎', 'Solana', 'R$ 780,00']].map(
          ([icon, nome, preco]) => (
            <div key={nome} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>{icon}</span>
                <span style={{ fontWeight: 'bold' }}>{nome}</span>
              </div>
              <span style={{ color: '#4caf50', fontWeight: 'bold' }}>{preco}</span>
            </div>
          )
        )}
        <p style={{ color: '#666', fontSize: '13px', textAlign: 'center', margin: '4px 0 0' }}>
          Com R$ 100 você compraria 0,000192 BTC ou 0,0054 ETH
        </p>
      </div>
    ),
  },
  {
    titulo: 'Como ler o gráfico?',
    descricao:
      'O gráfico mostra como o preço mudou nos últimos dias. Linha subindo = preço aumentou. Linha descendo = preço caiu. É normal oscilar — isso se chama volatilidade.',
    visual: (
      <div style={{ marginTop: '20px', backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '16px' }}>
        <svg viewBox="0 0 300 100" style={{ width: '100%', height: '100px' }}>
          <polyline points="0,80 40,65 80,70 120,45 160,55 200,30 240,40 300,20" fill="none" stroke="#3b82f6" strokeWidth="2" />
          <polyline points="0,80 40,65 80,70 120,45 160,55 200,30 240,40 300,20 300,100 0,100" fill="#1e3a5f" stroke="none" opacity="0.5" />
          <circle cx="200" cy="30" r="4" fill="#22c55e" />
          <text x="205" y="28" fontSize="9" fill="#4ade80">Alta!</text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
          <span>7 dias atrás</span><span>hoje</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '10px', fontSize: '13px', flexWrap: 'wrap' }}>
          <span style={{ color: '#4caf50' }}>↑ Subiu = bom para quem tem</span>
          <span style={{ color: '#f87171' }}>↓ Caiu = oportunidade?</span>
        </div>
      </div>
    ),
  },
  {
    titulo: 'Como favoritar uma moeda?',
    descricao:
      'Crie uma conta e clique no botão ⭐ em qualquer moeda para adicioná-la aos seus favoritos. Seus favoritos ficam salvos no seu perfil e você recebe alertas quando o preço variar muito.',
    visual: (
      <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ backgroundColor: '#1e1e1e', borderRadius: '10px', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>₿</span>
            <span style={{ fontWeight: 'bold' }}>Bitcoin</span>
          </div>
          <button style={{ padding: '8px 16px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'default' }}>
            ⭐ Favoritar
          </button>
        </div>
        <div style={{ backgroundColor: '#0f2e1a', border: '1px solid #22c55e', borderRadius: '10px', padding: '12px 16px', color: '#4ade80', fontSize: '14px' }}>
          ✅ Moeda favoritada! Acesse em Perfil → Favoritos
        </div>
      </div>
    ),
  },
  {
    titulo: 'O simulador de compra',
    descricao:
      'Depois de favoritar uma moeda, você pode simular quanto receberia investindo um valor. Nenhum dinheiro real é movimentado — é só para aprender e entender melhor o mercado!',
    visual: (
      <div style={{ marginTop: '20px', backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px' }}>
        <p style={{ color: '#aaa', fontSize: '14px', margin: '0 0 12px' }}>💰 Simulador de Compra — Bitcoin</p>
        <input type="text" defaultValue="R$ 500,00" readOnly style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#121212', color: 'white', marginBottom: '12px', boxSizing: 'border-box' }} />
        <div style={{ backgroundColor: '#0f2e1a', border: '1px solid #28a745', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
          <p style={{ color: '#4caf50', fontWeight: 'bold', margin: '0 0 6px' }}>Com R$ 500,00 você teria:</p>
          <p style={{ color: 'white', fontSize: '24px', fontWeight: '900', margin: 0 }}>0.000961 BTC</p>
          <p style={{ color: '#aaa', fontSize: '12px', marginTop: '6px' }}>Preço usado: R$ 520.000,00</p>
        </div>
      </div>
    ),
  },
];

// ─── Componente principal ─────────────────────────────────────────────────────
export function Tutorial() {
  const [atual, setAtual] = useState(0);
  const [modoLeitura, setModoLeitura] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const navigate = useNavigate();
  const fala = useFala();
  const { pendente, talkClick } = useTalkBack(modoLeitura, fala);

  const passo = passos[atual];
  const progresso = ((atual + 1) / passos.length) * 100;

  // Lê o conteúdo do passo automaticamente quando modo leitura está ativo
  useEffect(() => {
    if (!modoLeitura) return;
    fala.falar(`Passo ${atual + 1} de ${passos.length}. ${passo.titulo}. ${passo.descricao}`);
  }, [atual, modoLeitura]); // eslint-disable-line

  // Avança passo
  function irPara(index: number) {
    fala.parar();
    setAtual(index);
  }

  // Toggle modo leitura
  function toggleModoLeitura() {
    const novoEstado = !modoLeitura;
    setModoLeitura(novoEstado);
    if (novoEstado) {
      setAnuncio('Modo leitura ativado. Toque uma vez para ouvir, duas vezes para confirmar.');
      fala.falar(
        `Modo leitura ativado. Toque uma vez em qualquer botão para ouvir o que ele faz. Toque duas vezes para confirmar a ação.`
      );
    } else {
      fala.parar();
      setAnuncio('Modo leitura desativado.');
    }
  }

  // Estilo do botão com indicador de "pendente" (TalkBack selecionado)
  function estiloTalkBack(id: string, base: React.CSSProperties): React.CSSProperties {
    if (!modoLeitura) return base;
    if (pendente === id) {
      return {
        ...base,
        outline: '3px solid #f59e0b',
        outlineOffset: '2px',
        boxShadow: '0 0 0 6px rgba(245,158,11,0.25)',
      };
    }
    return base;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: 'white', fontFamily: 'Arial, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>

      {/* Região live para leitores de tela */}
      <div role="status" aria-live="polite" aria-atomic="true"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {anuncio}
      </div>

      <div style={{ width: '100%', maxWidth: '560px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '22px', margin: 0 }}>Tutorial CoinEdu</h1>
            <p style={{ color: '#aaa', fontSize: '14px', margin: '4px 0 0' }}>
              Passo {atual + 1} de {passos.length}
              {modoLeitura && <span style={{ color: '#4caf50', marginLeft: '8px' }}>🔊 Modo leitura ativo</span>}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Botão modo leitura */}
            <button
              onClick={toggleModoLeitura}
              aria-pressed={modoLeitura}
              aria-label={modoLeitura ? 'Desativar modo leitura' : 'Ativar modo leitura'}
              style={{
                padding: '8px 14px',
                backgroundColor: modoLeitura ? '#4caf50' : '#1e3a5f',
                color: modoLeitura ? 'white' : '#93c5fd',
                border: `1px solid ${modoLeitura ? '#4caf50' : '#3b82f6'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🔊 {modoLeitura ? 'Leitura ON' : 'Leitura'}
            </button>

            {/* Pular tutorial */}
            <button
              onClick={talkClick('pular', 'Pular tutorial. Toque novamente para voltar à lista de moedas.', (_e) => navigate('/'))}
              style={estiloTalkBack('pular', {
                padding: '8px 16px',
                backgroundColor: '#333',
                color: '#aaa',
                border: '1px solid #444',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
              })}
            >
              Pular tutorial
            </button>
          </div>
        </div>

        {/* ── Barra de progresso ── */}
        <div style={{ height: '4px', backgroundColor: '#333', borderRadius: '2px', marginBottom: '28px' }}>
          <div style={{ height: '4px', backgroundColor: '#3b82f6', borderRadius: '2px', width: `${progresso}%`, transition: 'width 0.4s ease' }} />
        </div>

        {/* ── Card do passo ── */}
        <div
          style={{ backgroundColor: '#1a1a1a', borderRadius: '16px', padding: '28px', border: modoLeitura ? '2px solid #4caf50' : '1px solid #2a2a2a', marginBottom: '24px', cursor: modoLeitura ? 'pointer' : 'default' }}
          onClick={modoLeitura ? () => {
            fala.falar(`${passo.titulo}. ${passo.descricao}`);
            setAnuncio(`Lendo: ${passo.titulo}`);
          } : undefined}
          role={modoLeitura ? 'button' : undefined}
          aria-label={modoLeitura ? `Ouvir: ${passo.titulo}` : undefined}
          tabIndex={modoLeitura ? 0 : undefined}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#1e3a5f', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#93c5fd', flexShrink: 0 }}>
              {atual + 1}
            </div>
            <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 'bold' }}>{passo.titulo}</h2>
          </div>
          <p style={{ color: '#ccc', lineHeight: '1.7', fontSize: '15px', margin: 0 }}>{passo.descricao}</p>
          {passo.visual}

          {/* Dica de toque quando modo leitura ativo */}
          {modoLeitura && (
            <p style={{ marginTop: '16px', color: '#4caf50', fontSize: '12px', textAlign: 'center', margin: '16px 0 0' }}>
              👆 Toque aqui para ouvir este conteúdo
            </p>
          )}
        </div>

        {/* ── Dots ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
          {passos.map((p, i) => (
            <div
              key={i}
              onClick={talkClick(`dot-${i}`, `Ir para o passo ${i + 1}: ${p.titulo}. Toque novamente para confirmar.`, (_e) => irPara(i))}
              role="button"
              aria-label={`Passo ${i + 1}: ${p.titulo}`}
              aria-current={i === atual ? 'step' : undefined}
              style={estiloTalkBack(`dot-${i}`, {
                width: i === atual ? '20px' : '8px',
                height: '8px',
                borderRadius: i === atual ? '4px' : '50%',
                backgroundColor: i === atual ? '#3b82f6' : '#444',
                cursor: 'pointer',
                transition: 'all 0.2s',
              })}
            />
          ))}
        </div>

        {/* ── Navegação ── */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={talkClick(
              'anterior',
              atual === 0 ? 'Botão anterior desabilitado. Você já está no primeiro passo.' : `Passo anterior. Toque novamente para ir ao passo ${atual}: ${passos[atual - 1]?.titulo}.`,
              () => { if (atual > 0) irPara(atual - 1); }
            )}
            disabled={atual === 0}
            aria-label={`Ir para passo anterior${atual === 0 ? ' (desabilitado)' : ''}`}
            style={estiloTalkBack('anterior', {
              flex: 1,
              padding: '14px',
              backgroundColor: '#333',
              color: atual === 0 ? '#555' : 'white',
              border: '1px solid #444',
              borderRadius: '10px',
              cursor: atual === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '15px',
            })}
          >
            ← Anterior
          </button>

          {atual < passos.length - 1 ? (
            <button
              onClick={talkClick(
                'proximo',
                `Próximo passo. Toque novamente para ir ao passo ${atual + 2}: ${passos[atual + 1]?.titulo}.`,
                (_e) => irPara(atual + 1)
              )}
              aria-label={`Ir para próximo passo: ${passos[atual + 1]?.titulo}`}
              style={estiloTalkBack('proximo', {
                flex: 2,
                padding: '14px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
              })}
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={talkClick(
                'comecar',
                'Começar a usar o CoinEdu. Toque novamente para confirmar e ir para a lista de moedas.',
                (_e) => navigate('/')
              )}
              aria-label="Concluir tutorial e ir para a lista de moedas"
              style={estiloTalkBack('comecar', {
                flex: 2,
                padding: '14px',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '15px',
              })}
            >
              ✅ Começar a usar!
            </button>
          )}
        </div>

        {/* ── Dica geral do modo leitura ── */}
        {modoLeitura && (
          <p style={{ marginTop: '20px', color: '#666', fontSize: '12px', textAlign: 'center', lineHeight: '1.6' }}>
            🔊 <strong style={{ color: '#aaa' }}>Modo leitura:</strong> 1º toque = ouvir · 2º toque = confirmar · Botão amarelo = selecionado
          </p>
        )}
      </div>

      <style>{`
        *:focus-visible {
          outline: 3px solid #3b82f6;
          outline-offset: 3px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}