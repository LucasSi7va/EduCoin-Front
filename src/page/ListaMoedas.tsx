import { useEffect, useState, useCallback } from "react";
import type { Moeda } from "../types/Moeda";
import { useAcessibilidade } from "../contexts/AcessibilidadeContext";
import api from "../services/api";
import { Link, useNavigate } from 'react-router-dom';
import "../animations.css";
  import { useTema } from "../contexts/TemaContext";


function ListaMoedas() {
  const { tema, toggleTema } = useTema();
  const [moedas, setMoedas] = useState<Moeda[]>([]);
  const [busca, setBusca] = useState('');
  const [precoMin, setPrecoMin] = useState('');
  const [precoMax, setPrecoMax] = useState('');
  const [rank, setRank] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [favoritando, setFavoritando] = useState<string | null>(null);
  const [apenasFantavoritos, setApenasFantavoritos] = useState(false);
  const { isModoIdoso, toggleModoIdoso } = useAcessibilidade();
  const navigate = useNavigate();
  // Estados para controle de interface responsiva
  const [menuAberto, setMenuAberto] = useState(false);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  
  // Estado para controlar a visibilidade do botão "Voltar ao Topo"
  const [mostrarVoltarTopo, setMostrarVoltarTopo] = useState(false);

  const [usuario, setUsuario] = useState(() =>
    JSON.parse(localStorage.getItem('usuario') || 'null')
  );

  // Inicialização única do Script do Google Tradutor evitando ID duplicado
  useEffect(() => {
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: 'pt',
          includedLanguages: 'en,es,pt',
          layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        'google_translate_element'
      );
    };

    const idScript = 'google-translate-script';
    if (!document.getElementById(idScript)) {
      const addScript = document.createElement('script');
      addScript.id = idScript;
      addScript.setAttribute(
        'src',
        '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      );
      document.body.appendChild(addScript);
    }
  }, []);

  useEffect(() => {
    function syncUsuario() {
      setUsuario(JSON.parse(localStorage.getItem('usuario') || 'null'));
    }
    window.addEventListener('storage', syncUsuario);
    return () => window.removeEventListener('storage', syncUsuario);
  }, []);

  // Monitora a rolagem da página para exibir/esconder o botão
  useEffect(() => {
    function verificarRolagem() {
      if (window.scrollY > 300) {
        setMostrarVoltarTopo(true);
      } else {
        setMostrarVoltarTopo(false);
      }
    }

    window.addEventListener("scroll", verificarRolagem);
    return () => window.removeEventListener("scroll", verificarRolagem);
  }, []);

  const moedasExibidas = apenasFantavoritos
    ? moedas.filter(m => (usuario?.moedasFavoritas || []).includes(m.id))
    : moedas;

  useEffect(() => { carregarTodas() }, []);

  function carregarTodas() {
    setCarregando(true);
    api.get('/coin')
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }

  const buscarPorNome = useCallback((nome: string) => {
    if (!nome.trim()) { carregarTodas(); return; }
    setCarregando(true);
    api.get(`/coin/nome/${nome}`)
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => buscarPorNome(busca), 400);
    return () => clearTimeout(timer);
  }, [busca, buscarPorNome]);

  function aplicarFiltros() {
    if (!precoMin && !precoMax && !rank) { carregarTodas(); return; }
    setCarregando(true);
    const params = new URLSearchParams();
    if (precoMin) params.append('precoMin', precoMin);
    if (precoMax) params.append('precoMax', precoMax);
    if (rank) params.append('rank', rank);
    api.get(`/coin/filtra?${params.toString()}`)
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false));
  }

  function limparFiltros() {
    setBusca(''); setPrecoMin(''); setPrecoMax(''); setRank('');
    carregarTodas();
  }

  function rolarParaOTopo() {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  // Função espelho para simular o clique no seletor do Google a partir do menu mobile
  function simularCliqueTradutorMobile() {
    const elementoGoogle = document.querySelector('.goog-te-gadget-simple') as HTMLElement;
    if (elementoGoogle) {
      elementoGoogle.click();
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
        await api.delete(`/carteira/remover?usuarioId=${usuarioAtual.id}&moeda=${moedaId}`);
        const novaLista = favoritosLocais.filter((m: string) => m !== moedaId);
        const atualizado = { ...usuarioAtual, moedasFavoritas: novaLista };
        localStorage.setItem('usuario', JSON.stringify(atualizado));
        setUsuario(atualizado);
      } else {
        await api.post(`/carteira/favoritar?usuarioId=${usuarioAtual.id}&moeda=${moedaId}`);
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
    <div className={`lm-root ${tema === 'claro' ? 'claro' : ''}`}>

      {/* ── Header ── */}
      <header className="lm-header">
        <h1 className={`lm-title ${isModoIdoso ? 'idoso' : ''}`}>CoinEdu</h1>

        {/* Botão Hambúrguer Animado */}
        <button
          className={`lm-menu-btn ${menuAberto ? 'aberto' : ''}`}
          onClick={() => setMenuAberto(!menuAberto)}
          aria-label="Menu de navegação"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Backdrop escuro clicável para fechar o menu mobile */}
        {menuAberto && <div className="lm-menu-backdrop" onClick={() => setMenuAberto(false)} />}

        {/* Menu Mobile Lateral (Drawer) */}
        <div className={`lm-mobile-menu ${menuAberto ? 'aberto' : ''}`}>
          <div className="lm-mobile-menu-header">
            <h3>Navegação</h3>
          </div>
          
          {usuario && (
            <button
              className="lm-menu-user-info-btn"
              onClick={() => { navigate('/PerfilUsuario'); setMenuAberto(false); }}
            >
              <img
                src={usuario.fotoPerfil || `https://ui-avatars.com/api/?name=${usuario.nome}&background=333&color=fff`}
                alt="perfil"
                className="lm-avatar"
              />
              <span className="lm-menu-user-name-text">{usuario.nome} (Ver Perfil)</span>
            </button>
          )}

          {/* Botão Mobile customizado que simula o acionamento do tradutor principal */}
          <button 
            onClick={() => { simularCliqueTradutorMobile(); setMenuAberto(false); }}
            className="lm-mb-translate-btn"
          >
            🌐 Alterar Idioma / Language
          </button>

          <button onClick={() => { navigate('/tutorial'); setMenuAberto(false); }}>
            📖 Tutorial
          </button>
          
          <button 
            className="lm-btn-toggle-menu" 
            onClick={() => { toggleModoIdoso(); setMenuAberto(false); }}
          >
            {isModoIdoso ? '✨ Modo Padrão' : '👴 Modo Acessível'}
          </button>
          
          <div className="lm-menu-divider"></div>

          {usuario ? (
            <button 
              className="lm-menu-btn-sair" 
              onClick={() => {
                localStorage.removeItem('usuario');
                window.location.reload();
              }}
            >
              Sair da Conta
            </button>
          ) : (
            <>
              <button onClick={() => { navigate('/login'); setMenuAberto(false); }}>
                Entrar
              </button>
              <button 
                className="lm-menu-btn-primary" 
                onClick={() => { navigate('/cadastro'); setMenuAberto(false); }}
              >
                Criar Conta
              </button>
            </>
          )}
        </div>

    {/* Desktop Header Actions */}
        <div className="lm-header-actions">
          
<button
  onClick={toggleTema}
  className={`lm-btn-ghost ${isModoIdoso ? 'idoso' : ''}`}
  title="Alternar Tema"
>
  {tema === 'escuro' ? '☀️ Claro' : '🌙 Escuro'}
</button>


          {/* Container nativo do Google Tradutor visível */}
          <div id="google_translate_element" className="lm-google-translate" />

          {/* ── BOTÕES GLOBAIS ── */}
          <button
            onClick={() => navigate('/tutorial')}
            className={`lm-btn-ghost amber ${isModoIdoso ? 'idoso' : ''}`}
          >
            📖 Tutorial
          </button>

          {/* ── BOTÕES DEPENDENTES DE LOGIN ── */}
          {usuario ? (
            <div className="lm-user-container">
              <Link to="/PerfilUsuario" className="lm-user-link">
                <img
                  src={usuario.fotoPerfil || `https://ui-avatars.com/api/?name=${usuario.nome}&background=333&color=fff`}
                  alt="perfil"
                  className={`lm-avatar ${isModoIdoso ? 'idoso' : ''}`}
                />
                <span className={`lm-user-name ${isModoIdoso ? 'idoso' : ''}`}>{usuario.nome}</span>
              </Link>
              <button
                onClick={() => {
                  localStorage.removeItem('usuario');
                  window.location.reload();
                }}
                className={`lm-btn-sair ${isModoIdoso ? 'idoso' : ''}`}
              >
                Sair
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className={`lm-btn-ghost ${isModoIdoso ? 'idoso' : ''}`}
              >
                Entrar
              </button>
              <button
                onClick={() => navigate('/cadastro')}
                className={`lm-btn-ghost blue ${isModoIdoso ? 'idoso' : ''}`}
              >
                Criar Conta
              </button>
            </>
          )}

          {/* Botão de Acessibilidade (Sempre visível) */}
          <button
            onClick={() => toggleModoIdoso()}
            className={`lm-btn-modo ${isModoIdoso ? 'ativo' : ''} btn-toggle-modo`}
          >
            {isModoIdoso ? '✨ Modo Padrão' : '👴 Modo Acessível'}
          </button>
        </div>

      </header>

      {/* ── Seção de Busca Dinâmica ── */}
      <div className="lm-search-wrap">
        <input
          type="text"
          placeholder="🔍 Buscar moeda pelo nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          aria-label="Buscar moeda pelo nome"
          className={`lm-search search-input ${isModoIdoso ? 'idoso' : ''}`}
        />
        <button 
          className={`lm-toggle-filters-btn ${mostrarFiltros ? 'ativo' : ''}`}
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          {mostrarFiltros ? '▲ Ocultar Filtros' : '▼ Filtrar Avançado'}
        </button>
      </div>

      {/* ── Filtros Avançados ── */}
      <div className={`lm-filters ${mostrarFiltros ? 'expandido' : ''}`}>
        <div className="lm-filter-field">
          <label className={`lm-filter-label ${isModoIdoso ? 'idoso' : ''}`}>Preço mínimo (R$)</label>
          <input type="number" placeholder="Ex: 100" value={precoMin} onChange={e => setPrecoMin(e.target.value)}
            className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} />
        </div>
        <div className="lm-filter-field">
          <label className={`lm-filter-label ${isModoIdoso ? 'idoso' : ''}`}>Preço máximo (R$)</label>
          <input type="number" placeholder="Ex: 50000" value={precoMax} onChange={e => setPrecoMax(e.target.value)}
            className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} />
        </div>
        <div className="lm-filter-field">
          <label className={`lm-filter-label ${isModoIdoso ? 'idoso' : ''}`}>Rank mínimo</label>
          <input type="number" placeholder="Ex: 10" value={rank} onChange={e => setRank(e.target.value)}
            className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} />
        </div>

        <div className="lm-filter-actions">
          {usuario && (
            <button
              onClick={() => setApenasFantavoritos(prev => !prev)}
              className={`lm-btn-fav-filter ${apenasFantavoritos ? 'ativo' : ''} ${isModoIdoso ? 'idoso' : ''}`}
            >
              {apenasFantavoritos ? '⭐ Todos' : '⭐ Favoritos'}
            </button>
          )}

          <button
            onClick={() => aplicarFiltros()}
            className={`lm-btn-filtrar btn-filtrar ${isModoIdoso ? 'idoso' : ''}`}
          >
            Aplicar
          </button>

          <button
            onClick={() => limparFiltros()}
            className={`lm-btn-limpar btn-limpar ${isModoIdoso ? 'idoso' : ''}`}
          >
            Limpar
          </button>
        </div>
      </div>

      {/* ── Status ── */}
      {carregando && (
        <div className="lm-loader-container">
          <div className="lm-spinner"></div>
          <p className={`lm-status ${isModoIdoso ? 'idoso' : ''}`}>Buscando mercado...</p>
        </div>
      )}
      {!carregando && moedasExibidas.length === 0 && <p className={`lm-status empty ${isModoIdoso ? 'idoso' : ''}`}>Nenhuma moeda encontrada.</p>}

      {/* ── Grid de Moedas Animado ── */}
      <div className={`lm-grid ${isModoIdoso ? 'idoso' : ''}`}>
        {moedasExibidas.map(moeda => {
          const jaFavorita = (usuario?.moedasFavoritas || []).includes(moeda.id);
          return (
            <div key={moeda.id} className={`lm-card coin-card ${isModoIdoso ? 'idoso' : ''}`}>
              <div className="lm-card-header">
                <img src={moeda.imagem} alt={moeda.nome} className={`lm-coin-img ${isModoIdoso ? 'idoso' : ''}`} />
                <div className="lm-coin-info-block">
                  <span className={`lm-coin-name ${isModoIdoso ? 'idoso' : ''}`}>{moeda.nome}</span>
                  <span className="lm-coin-symbol">({moeda.simbolo?.toUpperCase()})</span>
                </div>
              </div>

              <div className={`lm-coin-price coin-price ${isModoIdoso ? 'idoso' : ''}`}>
                R$ {moeda.precoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>

              <div className="lm-card-actions">
                {usuario && (
                  <button
                    onClick={(e) => toggleFavorito(e, moeda.id)}
                    disabled={favoritando === moeda.id}
                    className={`lm-btn-fav ${jaFavorita ? 'ativo' : ''} ${isModoIdoso ? 'idoso' : ''}`}
                  >
                    {favoritando === moeda.id ? '⏳' : jaFavorita ? '💔 Remover' : '⭐ Favoritar'}
                  </button>
                )}

                <button
                  onClick={() => navigate(`/moeda/${moeda.id}`)}
                  className={`lm-btn-detail btn-detail ${isModoIdoso ? 'idoso' : ''}`}
                >
                  Ver Detalhes →
                </button>
              </div>
            </div>
          );
        })}
      </div>


        {/* ── Banner Patrocínio / Créditos CoinGecko (AQUI É O LUGAR CORRETO) ── */}
      <div className={`lm-sponsor-banner ${isModoIdoso ? 'idoso' : ''}`}>
        <div className="lm-sponsor-content">
          <span className="lm-sponsor-text">Dados de mercado fornecidos por</span>
          <img
            src="https://static.coingecko.com/s/coingecko-logo-8903d34ce19ca411472aa5f49b6b7722744888be6cd24f92bc3c582eb7277271.png"
            alt="CoinGecko Logo"
            className="lm-sponsor-logo"
          />
          <p className="lm-sponsor-desc">
            Explore análises detalhadas do mercado cripto e descubra as melhores corretoras para adquirir seus ativos.
          </p>
        </div>
        <a
          href="https://www.coingecko.com/pt"
          target="_blank"
          rel="noopener noreferrer"
          className={`lm-btn-sponsor ${isModoIdoso ? 'idoso' : ''}`}
        >
          Explorar na CoinGecko 🦎
        </a>
      </div>

      {/* FAB: Voltar ao Topo */}
      <button
        onClick={rolarParaOTopo}
        className={`lm-fab-top ${mostrarVoltarTopo ? 'visivel' : ''} ${isModoIdoso ? 'idoso' : ''}`}
        aria-label="Voltar para o topo da página"
        title="Voltar ao topo"
      >
        ▲
      </button>  


      {/* FAB: Voltar ao Topo */}
      <button
        onClick={rolarParaOTopo}
        className={`lm-fab-top ${mostrarVoltarTopo ? 'visivel' : ''} ${isModoIdoso ? 'idoso' : ''}`}
        aria-label="Voltar para o topo da página"
        title="Voltar ao topo"
      >
        ▲
      </button>

      <style>{`
        /* ── CORREÇÃO DE PRECEDÊNCIA DO GOOGLE TRADUTOR ── */
        html, body {
          top: 0px !important;
          position: static !important;
          margin-top: 0px !important;
          padding-top: 0px !important;
        }

        /* Força a remoção de elementos de topo injetados por iframe */
        iframe[id*="translate"], 
        .goog-te-banner-frame, 
        .goog-te-banner,
        #goog-gt-tt,
        .goog-te-balloon-frame {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0px !important;
          width: 0px !important;
        }

        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
          box-sizing: border-box;
        }

        /* Design System Clássico (Fundo Escuro Original) */
        .lm-root {
          padding: clamp(16px, 4vw, 32px);
          font-family: Arial, sans-serif;
          color: white;
          background-color: #121212;
          min-height: 100vh;
          box-sizing: border-box;
        }

        .sr-only {
          position: absolute;
          width: 1px; height: 1px;
          overflow: hidden;
          clip: rect(0,0,0,0);
          white-space: nowrap;
          border: 0;
        }

        /* Header Original */
        .lm-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: clamp(24px, 5vw, 40px);
          gap: 12px;
        }

        .lm-title { font-size: clamp(24px, 5vw, 32px); margin: 0; color: white; font-weight: bold; }
        .lm-title.idoso { font-size: clamp(32px, 6vw, 46px); }

        .lm-header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .lm-user-container {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .lm-user-link {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .lm-avatar {
          width: 44px; height: 44px;
          border-radius: 50%;
          border: 2px solid #007bff;
        }
        .lm-avatar.idoso { width: 64px; height: 64px; }

        .lm-user-name { color: white; font-size: clamp(14px, 3vw, 16px); font-weight: bold; }
        .lm-user-name.idoso { font-size: clamp(18px, 4vw, 22px); }

        .lm-btn-sair {
          padding: 8px 16px;
          background-color: #ff4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: clamp(13px, 2.5vw, 14px);
          font-weight: bold;
        }
        .lm-btn-sair.idoso { font-size: clamp(16px, 3vw, 18px); padding: 12px 20px; }

        .lm-btn-ghost {
          background: none; border: none; color: white;
          font-size: clamp(14px, 3vw, 16px); cursor: pointer;
          padding: 6px 12px; white-space: nowrap;
        }
        .lm-btn-ghost.idoso { font-size: clamp(18px, 4vw, 20px); }
        .lm-btn-ghost.blue { color: #007bff; font-weight: bold; }
        .lm-btn-ghost.amber { color: #f59e0b; }
        .lm-btn-ghost.green { color: #4caf50; font-weight: bold; }

        .lm-btn-modo {
          padding: 12px 24px;
          font-size: clamp(14px, 3vw, 16px);
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: bold;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        }
        .lm-btn-modo.ativo { background-color: #FFD700; color: black; }
        .lm-btn-modo.ativo.idoso,
        .lm-btn-modo.idoso { font-size: clamp(18px, 4vw, 24px); padding: 18px 36px; }

        /* Filtros e Busca Clássicos */
        .lm-search-wrap {
          display: flex; gap: 12px; margin-bottom: 24px;
        }
        .lm-search {
          flex: 1; padding: clamp(12px, 3vw, 16px); font-size: clamp(16px, 3.5vw, 18px);
          border-radius: 10px; border: 1px solid #444; background-color: #1e1e1e; color: white;
          box-sizing: border-box;
        }
        .lm-search.idoso { padding: clamp(16px, 4vw, 22px); font-size: clamp(20px, 4vw, 24px); }

        .lm-toggle-filters-btn {
          background: #333; border: 1px solid #555;
          color: white; padding: 0 24px; border-radius: 10px; cursor: pointer;
          font-weight: bold; font-size: 14px; transition: background 0.2s;
        }
        .lm-toggle-filters-btn:hover { background: #444; }

        .lm-filters {
          display: flex; gap: 12px; align-items: flex-end; flex-wrap: wrap;
          max-height: 0; overflow: hidden; opacity: 0; transition: all 0.3s ease-out;
        }
        .lm-filters.expandido { max-height: 500px; opacity: 1; margin-bottom: clamp(24px, 5vw, 36px); }

        .lm-filter-field { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 140px; }
        .lm-filter-label { font-size: clamp(13px, 2.5vw, 14px); color: #aaa; font-weight: bold; }
        .lm-filter-label.idoso { font-size: clamp(16px, 3vw, 20px); }
        .lm-filter-input {
          padding: clamp(10px, 2.5vw, 12px); font-size: clamp(14px, 3vw, 15px);
          border-radius: 8px; border: 1px solid #444; background-color: #1e1e1e; color: white; width: 100%; box-sizing: border-box;
        }
        .lm-filter-input.idoso { padding: clamp(14px, 3vw, 18px); font-size: clamp(18px, 3.5vw, 22px); }

        .lm-filter-actions { display: flex; gap: 10px; margin-left: auto; }
        .lm-btn-fav-filter, .lm-btn-filtrar, .lm-btn-limpar {
          padding: clamp(10px, 2.5vw, 12px) clamp(16px, 4vw, 24px); font-size: clamp(14px, 3vw, 15px); font-weight: bold; border-radius: 8px; cursor: pointer;
        }
        .lm-btn-fav-filter { background-color: #333; border: 1px solid #555; color: white; }
        .lm-btn-fav-filter.ativo { background-color: #f59e0b; }
        .lm-btn-fav-filter.idoso { font-size: clamp(18px, 3.5vw, 22px); padding: 14px 28px; }
        .lm-btn-filtrar { background-color: #007bff; border: none; color: white; }
        .lm-btn-filtrar.idoso { font-size: clamp(18px, 3.5vw, 22px); padding: 14px 28px; }
        .lm-btn-limpar { background-color: #444; border: none; color: white; }
        .lm-btn-limpar.idoso { font-size: clamp(18px, 3.5vw, 22px); padding: 14px 28px; }

        /* Loader & Status */
        .lm-loader-container { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; width: 100%; }
        .lm-spinner { width: 36px; height: 36px; border: 3px solid #333; border-top-color: #007bff; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lm-status { color: #aaa; text-align: center; font-size: clamp(16px, 3.5vw, 18px); }
        .lm-status.idoso { font-size: clamp(20px, 4vw, 24px); }

        /* Grid */
        .lm-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr));
          gap: 24px;
        }
        .lm-grid.idoso { gap: 32px; }

        /* Card Encorpado */
        .lm-card {
          background-color: #1e1e1e; border: 1px solid #333; border-radius: 18px;
          padding: clamp(32px, 4vw, 40px); display: flex; flex-direction: column; align-items: center; gap: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .lm-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.4); }
        .lm-card.idoso { padding: clamp(26px, 5vw, 36px); border: 4px solid #FFD700; gap: 20px; }

        .lm-card-header { display: flex; align-items: center; gap: 16px; width: 100%; }
        .lm-coin-img { width: 56px; height: 56px; }
        .lm-coin-img.idoso { width: 88px; height: 88px; }
        
        .lm-coin-info-block { display: flex; flex-direction: column; align-items: flex-start; }
        .lm-coin-name { font-size: clamp(18px, 4vw, 22px); font-weight: bold; }
        .lm-coin-name.idoso { font-size: clamp(24px, 5vw, 30px); }
        .lm-coin-symbol { opacity: 0.6; font-size: 15px; margin-top: 2px; }

        .lm-coin-price { font-size: clamp(22px, 4.5vw, 28px); color: #4caf50; font-weight: 900; width: 100%; text-align: left; }
        .lm-coin-price.idoso { font-size: clamp(26px, 5vw, 36px); background-color: #000; padding: 10px 16px; border-radius: 8px; text-align: center; }

        .lm-card-actions { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 8px; }
        
        .lm-btn-fav, .lm-btn-detail { 
          width: 100%; 
          height: 54px; 
          border-radius: 12px; 
          font-weight: bold; 
          font-size: clamp(15px, 3vw, 16px); 
          cursor: pointer; 
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease-in-out;
          box-sizing: border-box;
        }
        .lm-btn-fav { background-color: #f59e0b; color: white; border: none; }
        .lm-btn-fav:hover { background-color: #d97706; transform: scale(1.02); }
        .lm-btn-fav.ativo { background-color: #ff4444; }
        .lm-btn-fav.ativo:hover { background-color: #dc2626; }
        
        .lm-btn-detail { background-color: #333; color: white; border: 1px solid #555; }
        .lm-btn-detail:hover { background-color: #444; border-color: #666; transform: scale(1.02); }

        .lm-btn-fav.idoso, .lm-btn-detail.idoso { font-size: clamp(18px, 3.5vw, 22px); padding: 16px; height: auto; }

        /* Escondidos por padrão no Desktop */
        .lm-menu-btn, .lm-mobile-menu, .lm-menu-backdrop { display: none; }

        /* FAB Topo */
        .lm-fab-top {
          position: fixed; bottom: 24px; left: 24px; width: 58px; height: 58px;
          border-radius: 50%; background-color: #222; color: #f59e0b; border: 2px solid #444;
          cursor: pointer; font-size: 20px; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5); z-index: 1000;
          opacity: 0; transform: translateY(20px); pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lm-fab-top.visivel { opacity: 1; transform: translateY(0); pointer-events: auto; }
        .lm-fab-top:hover { background-color: #333; border-color: #f59e0b; }
        .lm-fab-top.idoso { width: 78px; height: 78px; font-size: 28px; background-color: #000; border: 4px solid #FFD700; color: #FFD700; }

        /* Estilização Persistente do Container do Google Tradutor */
        #google_translate_element {
          display: inline-block !important;
          margin-right: 12px;
          visibility: visible !important;
        }

        .goog-te-gadget-simple {
          background-color: #1e1e1e !important;
          border: 1px solid #444 !important;
          padding: 8px 12px !important;
          border-radius: 10px !important;
          font-family: Arial, sans-serif !important;
          cursor: pointer;
          transition: border-color 0.2s;
          display: flex !important;
          align-items: center;
        }

        .goog-te-gadget-simple:hover {
          border-color: #f59e0b !important;
        }

        .goog-te-gadget-simple span {
          color: white !important;
          font-weight: bold;
          font-size: 14px;
        }

        .goog-te-gadget-icon,
        .goog-te-menu-value img,
        .goog-te-menu-value span:last-child {
          display: none !important;
        }

        /* ── Media Query Mobile ── */
        @media (max-width: 900px) {
          .lm-header-actions { display: none; }
          
          .lm-menu-btn {
            display: flex; flex-direction: column; justify-content: space-around;
            width: 32px; height: 26px; background: transparent; border: none; cursor: pointer; padding: 0; z-index: 2001;
          }
          .lm-menu-btn span { width: 32px; height: 3px; background: #fff; border-radius: 10px; transition: all 0.3s linear; transform-origin: 1px; }
          .lm-menu-btn.aberto span:first-child { transform: rotate(45deg); background: #ff4444; }
          .lm-menu-btn.aberto span:nth-child(2) { opacity: 0; transform: translateX(20px); }
          .lm-menu-btn.aberto span:last-child { transform: rotate(-45deg); background: #ff4444; }

          .lm-menu-backdrop {
            display: block; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 1999;
          }

          .lm-mobile-menu {
            display: flex; position: fixed; top: 0; right: 0; width: 80%; max-width: 340px; height: 100vh;
            background: #1e1e1e; box-shadow: -10px 0 30px rgba(0,0,0,0.5);
            flex-direction: column; padding: 32px 24px; gap: 14px; z-index: 2000;
            transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-sizing: border-box;
          }
          .lm-mobile-menu.aberto { transform: translateX(0); }
          .lm-mobile-menu-header { font-size: 18px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 12px; color: #aaa; }
          
          .lm-menu-user-info-btn {
            width: 100%; padding: 12px; background: rgba(255, 255, 255, 0.05);
            border: 1px solid #333 !important; border-radius: 12px; color: white; cursor: pointer;
            display: flex; align-items: center; gap: 12px; box-sizing: border-box; text-align: left !important;
          }
          .lm-menu-user-name-text { font-weight: bold; font-size: 15px; color: #60a5fa; }

          .lm-mb-translate-btn {
            background: rgba(245, 158, 11, 0.1) !important;
            color: #f59e0b !important;
            border: 1px solid rgba(245, 158, 11, 0.3) !important;
          }

          .lm-mobile-menu button {
            width: 100%; height: 54px; font-size: 16px; font-weight: bold; border-radius: 10px;
            border: 1px solid #444; background: #333; color: white; text-align: left; padding-left: 16px; cursor: pointer;
            box-sizing: border-box; display: flex; align-items: center;
          }
          .lm-mobile-menu button:active { background: #444; }
          .lm-mobile-menu .lm-btn-toggle-menu { background: rgba(0, 123, 255, 0.1); color: #007bff; border-color: rgba(0, 123, 255, 0.2); }
          .lm-mobile-menu .lm-menu-btn-primary { background: #007bff; border: none; justify-content: center; padding-left: 0; }
          .lm-mobile-menu .lm-menu-btn-sair { background: rgba(255, 68, 68, 0.1); color: #ff4444; border-color: rgba(255, 68, 68, 0.2); }

          .lm-search-wrap { flex-direction: column; }
          .lm-toggle-filters-btn { height: 52px; font-size: 15px; }
          .lm-filters { flex-direction: column; align-items: stretch; }
          .lm-filter-actions { width: 100%; flex-direction: column; gap: 8px; margin-top: 12px; }
          .lm-filter-actions button { width: 100%; height: 50px; }
        }



        /* ── Banner CoinGecko ── */
        .lm-sponsor-banner {
          margin-top: 40px;
          background-color: #1e1e1e;
          border: 1px solid #333;
          border-radius: 16px;
          padding: clamp(24px, 4vw, 32px);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }
        .lm-sponsor-banner.idoso { border: 2px solid #8cc63f; padding: 32px; }

        .lm-sponsor-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 600px;
        }

        .lm-sponsor-text { color: #aaa; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; }
        
        /* O filtro invert deixa a logo da CoinGecko branca para combinar com seu fundo escuro */
        .lm-sponsor-logo { height: 40px; object-fit: contain; align-self: flex-start; margin-bottom: 8px; filter: brightness(0) invert(1); }
        .lm-sponsor-logo.idoso { height: 60px; }

        .lm-sponsor-desc { margin: 0; color: #ddd; font-size: clamp(14px, 3vw, 16px); line-height: 1.5; }
        .lm-sponsor-banner.idoso .lm-sponsor-desc { font-size: clamp(18px, 4vw, 22px); }

        .lm-btn-sponsor {
          background-color: #8cc63f; /* Verde característico da CoinGecko */
          color: #000;
          font-weight: bold;
          text-decoration: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-size: clamp(16px, 3vw, 18px);
          transition: transform 0.2s, background-color 0.2s;
          text-align: center;
        }
        .lm-btn-sponsor:hover { background-color: #7ab32e; transform: scale(1.05); }
        .lm-btn-sponsor.idoso { font-size: clamp(20px, 4vw, 24px); padding: 20px 32px; }

        @media (max-width: 768px) {
          .lm-sponsor-banner { flex-direction: column; text-align: center; }
          .lm-sponsor-logo { align-self: center; }
          .lm-btn-sponsor { width: 100%; box-sizing: border-box; }
        }

        @media (max-width: 600px) {
          .lm-grid { grid-template-columns: 1fr; gap: 20px; }
          .lm-root { padding: 16px; }
          .lm-card { padding: 32px; gap: 18px; }
          .lm-btn-fav, .lm-btn-detail { height: 64px; font-size: 17px; }
          .lm-fab-top { bottom: 16px; left: 16px; }
        }
      
        /* =========================================
           ☀️ TEMA CLARO (Sobrescritas)
           ========================================= */
        .lm-root.claro {
          background-color: #f3f4f6;
          color: #1f2937;
        }

        .lm-root.claro .lm-title,
        .lm-root.claro .lm-user-name,
        .lm-root.claro .lm-filter-label {
          color: #1f2937;
        }

        .lm-root.claro .lm-btn-ghost {
          color: #4b5563;
        }
        .lm-root.claro .lm-btn-ghost:hover { color: #111827; }
        .lm-root.claro .lm-btn-ghost.blue { color: #2563eb; }
        .lm-root.claro .lm-btn-ghost.amber { color: #d97706; }

        /* Campos de Busca e Filtros */
        .lm-root.claro .lm-search,
        .lm-root.claro .lm-filter-input {
          background-color: #ffffff;
          color: #1f2937;
          border: 1px solid #d1d5db;
        }
        .lm-root.claro .lm-search::placeholder,
        .lm-root.claro .lm-filter-input::placeholder { color: #9ca3af; }

        .lm-root.claro .lm-toggle-filters-btn {
          background: #e5e7eb; color: #374151; border-color: #d1d5db;
        }
        .lm-root.claro .lm-toggle-filters-btn:hover { background: #d1d5db; }

        /* Cards e Banner Patrocínio */
        .lm-root.claro .lm-card,
        .lm-root.claro .lm-sponsor-banner {
          background-color: #ffffff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .lm-root.claro .lm-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.15);
        }
        
        .lm-root.claro .lm-coin-price { color: #16a34a; }
        .lm-root.claro .lm-sponsor-text { color: #6b7280; }
        .lm-root.claro .lm-sponsor-desc { color: #374151; }
        
        /* Remove o filtro invertido da logo da CoinGecko no modo claro */
        .lm-root.claro .lm-sponsor-logo { filter: none; }

        /* Botões secundários */
        .lm-root.claro .lm-btn-detail {
          background-color: #f3f4f6; color: #374151; border-color: #d1d5db;
        }
        .lm-root.claro .lm-btn-detail:hover { background-color: #e5e7eb; border-color: #9ca3af; }

        /* Mobile Menu */
        .lm-root.claro .lm-mobile-menu {
          background: #f9fafb; color: #1f2937; box-shadow: -10px 0 30px rgba(0,0,0,0.1);
        }
        .lm-root.claro .lm-mobile-menu-header { color: #374151; border-bottom-color: #e5e7eb; }
        .lm-root.claro .lm-mobile-menu button {
          background: #ffffff; color: #374151; border-color: #e5e7eb;
        }
        .lm-root.claro .lm-menu-user-info-btn { border-color: #e5e7eb !important; background: #ffffff; }
        .lm-root.claro .lm-btn-limpar { background-color: #e5e7eb; color: #374151; }

        /* Menu Burguer Escuro no Fundo Claro */
        .lm-root.claro .lm-menu-btn span { background: #1f2937; }
        .lm-root.claro .lm-menu-btn.aberto span { background: #ef4444; }


      `}</style>
    </div>
  );
}

export default ListaMoedas;