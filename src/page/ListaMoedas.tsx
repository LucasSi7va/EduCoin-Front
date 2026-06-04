import { useEffect, useState, useCallback } from "react";
import type { Moeda } from "../types/Moeda";
import { useAcessibilidade } from "../contexts/AcessibilidadeContext";
import { useFala, useTalkBack } from "../hooks/UseTalkBack";
import api from "../services/api";
import { Link, useNavigate } from 'react-router-dom';
import "../animations.css"
import { useModoLeitura } from "../contexts/ModoLeituraContext";

function ListaMoedas() {
  const [moedas, setMoedas] = useState<Moeda[]>([])
  const [busca, setBusca] = useState('')
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [rank, setRank] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [favoritando, setFavoritando] = useState<string | null>(null)
  const [apenasFantavoritos, setApenasFantavoritos] = useState(false)
const {modoLeitura,setModoLeitura} = useModoLeitura();
  const [anuncio, setAnuncio] = useState('')
  const { isModoIdoso, toggleModoIdoso } = useAcessibilidade()
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(() =>
    JSON.parse(localStorage.getItem('usuario') || 'null')
  );

  // TalkBack
  const fala = useFala()
  const { talkClick, estiloTalkBack } = useTalkBack(modoLeitura, fala)

  useEffect(() => {
    function syncUsuario() {
      setUsuario(JSON.parse(localStorage.getItem('usuario') || 'null'));
    }
    window.addEventListener('storage', syncUsuario);
    return () => window.removeEventListener('storage', syncUsuario);
  }, []);

  const moedasExibidas = apenasFantavoritos
    ? moedas.filter(m => (usuario?.moedasFavoritas || []).includes(m.id))
    : moedas;

  useEffect(() => { carregarTodas() }, [])

  function carregarTodas() {
    setCarregando(true)
    api.get('/coin')
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false))
  }

  const buscarPorNome = useCallback((nome: string) => {
    if (!nome.trim()) { carregarTodas(); return }
    setCarregando(true)
    api.get(`/coin/nome/${nome}`)
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false))
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => buscarPorNome(busca), 400)
    return () => clearTimeout(timer)
  }, [busca, buscarPorNome])

  function aplicarFiltros() {
    if (!precoMin && !precoMax && !rank) { carregarTodas(); return }
    setCarregando(true)
    const params = new URLSearchParams()
    if (precoMin) params.append('precoMin', precoMin)
    if (precoMax) params.append('precoMax', precoMax)
    if (rank) params.append('rank', rank)
    api.get(`/coin/filtra?${params.toString()}`)
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false))
  }

  function limparFiltros() {
    setBusca(''); setPrecoMin(''); setPrecoMax(''); setRank('')
    carregarTodas()
  }

  const fs = (idoso: string, normal: string) => isModoIdoso ? idoso : normal

  function toggleModoLeituraHandler() {
    const novo = !modoLeitura
    setModoLeitura(novo)
    if (novo) {
      setAnuncio('Modo leitura ativado. Toque uma vez para ouvir, duas vezes para confirmar.')
      fala.falar('Modo leitura ativado. Toque uma vez em qualquer botão para ouvir o que ele faz. Toque duas vezes para confirmar a ação.')
    } else {
      fala.parar()
      setAnuncio('Modo leitura desativado.')
    }
  }

  async function toggleFavorito(e: React.MouseEvent, moedaId: string) {
    e.preventDefault();
    if (!usuario) { alert('Faça login para favoritar!'); return; }
    const usuarioAtual = JSON.parse(localStorage.getItem('usuario') || 'null');
    const favoritosLocais: string[] = usuarioAtual?.moedasFavoritas || [];
    const jaFavorita = favoritosLocais.includes(moedaId);
    setFavoritando(moedaId);
    try {
      if (jaFavorita) {
        await api.delete(`/usuario/carteira/remover?usuarioId=${usuarioAtual.id}&moeda=${moedaId}`);
        const novaLista = favoritosLocais.filter((m: string) => m !== moedaId);
        const atualizado = { ...usuarioAtual, moedasFavoritas: novaLista };
        localStorage.setItem('usuario', JSON.stringify(atualizado));
        setUsuario(atualizado);
      } else {
        await api.post(`/usuario/carteira/favoritar?usuarioId=${usuarioAtual.id}&moeda=${moedaId}`);
        const novaLista = [...favoritosLocais, moedaId];
        const atualizado = { ...usuarioAtual, moedasFavoritas: novaLista };
        localStorage.setItem('usuario', JSON.stringify(atualizado));
        setUsuario(atualizado);
      }
      window.dispatchEvent(new Event('storage'));
    } catch {
      alert('Erro ao atualizar favoritos.');
    } finally {
      setFavoritando(null);
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: 'white', backgroundColor: '#121212', minHeight: '100vh' }}>

      {/* Região live para leitores de tela */}
      <div role="status" aria-live="polite" aria-atomic="true"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        {anuncio}
      </div>

      {/* ── Header ── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>

        <h1 style={{ fontSize: fs('40px', '28px') }}>CoinEdu</h1>

        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>

          {usuario ? (
            <Link to="/PerfilUsuario" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img
                src={usuario.fotoPerfil || `https://ui-avatars.com/api/?name=${usuario.nome}&background=333&color=fff`}
                alt="perfil"
                style={{ width: isModoIdoso ? '60px' : '40px', height: isModoIdoso ? '60px' : '40px', borderRadius: '50%', border: '2px solid #007bff' }}
              />
              <span style={{ color: 'white', fontSize: fs('22px', '16px'), fontWeight: 'bold' }}>{usuario.nome}</span>
              <button
                onClick={talkClick('sair', 'Sair da conta. Toque novamente para confirmar.', (_e) => {
                  localStorage.removeItem('usuario');
                  window.location.reload();
                })}
                style={estiloTalkBack('sair', { padding: '8px 12px', backgroundColor: '#ff4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: fs('18px', '14px') })}
              >
                Sair
              </button>
            </Link>
          ) : (
            <>
              <button
                onClick={talkClick('entrar', 'Entrar na sua conta. Toque novamente para ir para a tela de login.', (_e) => navigate('/login'))}
                style={estiloTalkBack('entrar', { background: 'none', border: 'none', color: 'white', textDecoration: 'none', fontSize: fs('20px', '16px'), cursor: 'pointer', padding: '4px 0' })}
              >
                Entrar
              </button>

              <button
                onClick={talkClick('cadastro', 'Criar conta. Toque novamente para ir para o cadastro.', (_e) => navigate('/cadastro'))}
                style={estiloTalkBack('cadastro', { background: 'none', border: 'none', color: '#007bff', fontSize: fs('20px', '16px'), fontWeight: 'bold', cursor: 'pointer', padding: '4px 0' })}
              >
                Criar Conta
              </button>

              <button
                onClick={talkClick('tutorial', 'Tutorial. Aprenda como usar o CoinEdu. Toque novamente para abrir o tutorial.', (_e) => navigate('/tutorial'))}
                style={estiloTalkBack('tutorial', { background: 'none', border: 'none', color: '#f59e0b', fontSize: fs('20px', '16px'), cursor: 'pointer', padding: '4px 0' })}
              >
                📖 Tutorial
              </button>

              <button
                onClick={talkClick('modo-leitura', 'Modo leitura. Toque novamente para ir para a página de modo leitura.', (_e) => navigate('/modo-leitura'))}
                style={estiloTalkBack('modo-leitura', { background: 'none', border: 'none', color: '#4caf50', fontSize: fs('20px', '16px'), fontWeight: 'bold', cursor: 'pointer', padding: '4px 0' })}
              >
                🔊 Modo Leitura
              </button>
            </>
          )}

          {/* Botão modo acessível */}
          <button
            onClick={talkClick('modo-idoso', isModoIdoso
              ? 'Modo padrão. Toque novamente para voltar ao tamanho normal.'
              : 'Modo acessível. Aumenta o tamanho de todos os elementos da tela. Toque novamente para ativar.',
              (_e) => toggleModoIdoso()
            )}
            style={estiloTalkBack('modo-idoso', {
              padding: isModoIdoso ? '20px 40px' : '10px 20px',
              fontSize: fs('24px', '16px'),
              backgroundColor: isModoIdoso ? '#FFD700' : '#007bff',
              color: isModoIdoso ? 'black' : 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            })}
            className="btn-toggle-modo"
          >
            {isModoIdoso ? '✨ Modo Padrão' : '👴 Modo Acessível'}
          </button>

        </div>
      </header>

      {/* ── Busca ── */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar moeda pelo nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          aria-label="Buscar moeda pelo nome"
          style={{ width: '100%', padding: isModoIdoso ? '18px' : '12px', fontSize: fs('22px', '16px'), borderRadius: '10px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white', boxSizing: 'border-box' }}
          className="search-input"
        />
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: fs('18px', '13px'), color: '#aaa' }}>Preço mínimo (R$)</label>
          <input type="number" placeholder="Ex: 100" value={precoMin} onChange={e => setPrecoMin(e.target.value)}
            style={{ padding: isModoIdoso ? '14px' : '10px', fontSize: fs('20px', '14px'), borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white' }} className="filter-input" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: fs('18px', '13px'), color: '#aaa' }}>Preço máximo (R$)</label>
          <input type="number" placeholder="Ex: 50000" value={precoMax} onChange={e => setPrecoMax(e.target.value)}
            style={{ padding: isModoIdoso ? '14px' : '10px', fontSize: fs('20px', '14px'), borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white' }} className="filter-input" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: fs('18px', '13px'), color: '#aaa' }}>Rank mínimo</label>
          <input type="number" placeholder="Ex: 10" value={rank} onChange={e => setRank(e.target.value)}
            style={{ padding: isModoIdoso ? '14px' : '10px', fontSize: fs('20px', '14px'), borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white' }} className="filter-input" />
        </div>

        {usuario && (
          <button
            onClick={talkClick('favoritos-filtro',
              apenasFantavoritos ? 'Mostrar todas as moedas. Toque novamente para confirmar.' : 'Mostrar apenas moedas favoritas. Toque novamente para confirmar.',
              (_e) => setApenasFantavoritos(prev => !prev)
            )}
            style={estiloTalkBack('favoritos-filtro', {
              padding: isModoIdoso ? '14px 30px' : '10px 20px',
              fontSize: fs('20px', '14px'),
              backgroundColor: apenasFantavoritos ? '#f59e0b' : '#333',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            })}
          >
            {apenasFantavoritos ? '⭐ Todos' : '⭐ Favoritos'}
          </button>
        )}

        <button
          onClick={talkClick('filtrar', 'Filtrar moedas com os valores preenchidos. Toque novamente para aplicar.', (_e) => aplicarFiltros())}
          style={estiloTalkBack('filtrar', { padding: isModoIdoso ? '14px 30px' : '10px 20px', fontSize: fs('20px', '14px'), backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' })}
          className="btn-filtrar"
        >
          Filtrar
        </button>

        <button
          onClick={talkClick('limpar', 'Limpar filtros e mostrar todas as moedas. Toque novamente para confirmar.', (_e) => limparFiltros())}
          style={estiloTalkBack('limpar', { padding: isModoIdoso ? '14px 30px' : '10px 20px', fontSize: fs('20px', '14px'), backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' })}
          className="btn-limpar"
        >
          Limpar
        </button>
      </div>

      {/* ── Status ── */}
      {carregando && <p style={{ color: '#aaa', textAlign: 'center', fontSize: fs('22px', '16px') }}>Buscando...</p>}
      {!carregando && moedasExibidas.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', fontSize: fs('22px', '16px') }}>Nenhuma moeda encontrada.</p>}

      {/* ── Grid de moedas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: isModoIdoso ? '30px' : '20px' }}>
        {moedasExibidas.map(moeda => {
          const jaFavorita = (usuario?.moedasFavoritas || []).includes(moeda.id)
          return (
            <div key={moeda.id}
              style={{ backgroundColor: '#1e1e1e', borderRadius: '15px', padding: isModoIdoso ? '30px' : '20px', border: isModoIdoso ? '4px solid #FFD700' : '1px solid #333', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}
              className="coin-card"
            >
              <img src={moeda.imagem} alt={moeda.nome} style={{ width: isModoIdoso ? '100px' : '50px', height: isModoIdoso ? '100px' : '50px' }} />
              <div style={{ fontSize: fs('28px', '20px'), fontWeight: 'bold' }}>
                {moeda.nome} <span style={{ opacity: 0.6 }}>({moeda.simbolo?.toUpperCase()})</span>
              </div>
              <div style={{ fontSize: fs('32px', '22px'), color: '#4caf50', fontWeight: '900', backgroundColor: isModoIdoso ? '#000' : 'transparent', padding: isModoIdoso ? '10px' : '0', borderRadius: '8px' }} className="coin-price">
                R$ {moeda.precoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              {usuario && (
                <button
                  onClick={talkClick(
                    `fav-${moeda.id}`,
                    jaFavorita
                      ? `Remover ${moeda.nome} dos favoritos. Toque novamente para confirmar.`
                      : `Favoritar ${moeda.nome}, cotada a R$ ${moeda.precoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Toque novamente para confirmar.`,
                    (e2) => toggleFavorito(e2, moeda.id)
                  )}
                  disabled={favoritando === moeda.id}
                  style={estiloTalkBack(`fav-${moeda.id}`, {
                    width: '100%',
                    padding: isModoIdoso ? '14px' : '10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: jaFavorita ? '#ff4444' : '#f59e0b',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: fs('20px', '14px'),
                    cursor: favoritando === moeda.id ? 'not-allowed' : 'pointer',
                    opacity: favoritando === moeda.id ? 0.7 : 1,
                  })}
                >
                  {favoritando === moeda.id ? '⏳' : jaFavorita ? '💔 Remover' : '⭐ Favoritar'}
                </button>
              )}

              <button
                onClick={talkClick(
                  `detalhe-${moeda.id}`,
                  `Ver detalhes de ${moeda.nome}. Toque novamente para abrir a página da moeda.`,
                  (_e) => navigate(`/moeda/${moeda.id}`)
                )}
                style={estiloTalkBack(`detalhe-${moeda.id}`, {
                  marginTop: '10px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#333',
                  color: 'white',
                  border: '1px solid #555',
                  cursor: 'pointer',
                  fontSize: fs('20px', '14px'),
                })}
                className="btn-detail"
              >
                Ver Detalhes
              </button>
            </div>
          )
        })}
      </div>

      {/* ── FAB modo leitura ── */}
      <button
        onClick={toggleModoLeituraHandler}
        aria-pressed={modoLeitura}
        aria-label={modoLeitura ? 'Desativar modo leitura TalkBack' : 'Ativar modo leitura TalkBack'}
        title={modoLeitura ? 'Desativar modo leitura' : 'Ativar modo leitura'}
        style={{
          position: 'fixed',
          bottom: isModoIdoso ? '32px' : '24px',
          right: isModoIdoso ? '32px' : '24px',
          width: isModoIdoso ? '80px' : '62px',
          height: isModoIdoso ? '80px' : '62px',
          borderRadius: '50%',
          backgroundColor: modoLeitura ? '#4caf50' : '#1e3a5f',
          color: 'white',
          border: `2px solid ${modoLeitura ? '#4caf50' : '#3b82f6'}`,
          cursor: 'pointer',
          fontSize: isModoIdoso ? '30px' : '22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: modoLeitura
            ? '0 0 0 6px rgba(76,175,80,0.25), 0 4px 20px rgba(0,0,0,0.5)'
            : '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
          zIndex: 1000,
          animation: modoLeitura ? 'fab-pulse 1.6s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        🔊
      </button>

      {/* Legenda do FAB */}
      {modoLeitura && (
        <div style={{
          position: 'fixed',
          bottom: isModoIdoso ? '122px' : '96px',
          right: isModoIdoso ? '16px' : '12px',
          backgroundColor: '#1e1e1e',
          border: '1px solid #4caf50',
          borderRadius: '10px',
          padding: '8px 12px',
          fontSize: '12px',
          color: '#4caf50',
          zIndex: 999,
          maxWidth: '180px',
          textAlign: 'center',
          lineHeight: '1.5',
          pointerEvents: 'none',
        }}>
          1º toque = ouvir<br />2º toque = confirmar
        </div>
      )}

      <style>{`
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(76,175,80,0.25), 0 4px 20px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 0 14px rgba(76,175,80,0.06), 0 4px 20px rgba(0,0,0,0.5); }
        }
        *:focus-visible {
          outline: 3px solid #007bff;
          outline-offset: 3px;
        }
      `}</style>
    </div>
  )
}

export default ListaMoedas