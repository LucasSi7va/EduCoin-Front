import { useEffect, useState, useCallback } from "react";
import type { Moeda } from "../types/Moeda";
import { useAcessibilidade } from "../contexts/AcessibilidadeContext";
import api from "../services/api";
import { Link } from 'react-router-dom';
import "../animations.css"

function ListaMoedas() {
  const [moedas, setMoedas] = useState<Moeda[]>([])
  const [busca, setBusca] = useState('')
  const [precoMin, setPrecoMin] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [rank, setRank] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [favoritando, setFavoritando] = useState<string | null>(null)
  const [apenasFantavoritos, setApenasFantavoritos] = useState(false)
  const { isModoIdoso, toggleModoIdoso } = useAcessibilidade()

  // ← usuario vira state para re-renderizar quando mudar
  const [usuario, setUsuario] = useState(() =>
    JSON.parse(localStorage.getItem('usuario') || 'null')
  );

  // ← escuta mudanças no localStorage (favoritar/desfavoritar)
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

  async function toggleFavorito(e: React.MouseEvent, moedaId: string) {
    e.preventDefault();
    if (!usuario) { alert('Faça login para favoritar!'); return; }

    // ← relê sempre o localStorage mais recente
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
        setUsuario(atualizado); // ← atualiza o state direto também
      } else {
        await api.post(`/usuario/carteira/favoritar?usuarioId=${usuarioAtual.id}&moeda=${moedaId}`);
        const novaLista = [...favoritosLocais, moedaId];
        const atualizado = { ...usuarioAtual, moedasFavoritas: novaLista };
        localStorage.setItem('usuario', JSON.stringify(atualizado));
        setUsuario(atualizado); // ← atualiza o state direto também
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
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        
        <h1 style={{ fontSize: fs('40px', '28px') }}>CoinEdu</h1>
        
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {/* Se não estiver logado, mostra botão de login */}
      {usuario ? (

<Link
  to="/PerfilUsuario"
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none'
  }}
>

    <img
      src={
  usuario.fotoPerfil ||
  `https://ui-avatars.com/api/?name=${usuario.nome}&background=333&color=fff`
}
      alt="perfil"
      style={{
        width: isModoIdoso ? '60px' : '40px',
        height: isModoIdoso ? '60px' : '40px',
        borderRadius: '50%',
        border: '2px solid #007bff'
      }}
    />

    <span
      style={{
        color: 'white',
        fontSize: fs('22px', '16px'),
        fontWeight: 'bold'
      }}
    >
      {usuario.nome}
    </span>

    <button
      onClick={() => {
        localStorage.removeItem('usuario');
        window.location.reload();
      }}
      style={{
        padding: '8px 12px',
        backgroundColor: '#ff4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer'
      }}
    >
      Sair
    </button>

  </Link>

) : (

  <>
    <Link
      to="/login"
      style={{
        color: 'white',
        textDecoration: 'none',
        fontSize: fs('20px', '16px')
      }}
    >
      Entrar
    </Link>

    <Link
      to="/cadastro"
      style={{
        color: '#007bff',
        textDecoration: 'none',
        fontSize: fs('20px', '16px'),
        fontWeight: 'bold'
      }}
    >
      Criar Conta
    </Link>



    <Link
  to="/tutorial"
  style={{ color: '#f59e0b', textDecoration: 'none', fontSize: fs('20px', '16px') }}
>
  📖 Tutorial
</Link>
  </>

)}

        <button onClick={toggleModoIdoso} style={{ padding: isModoIdoso ? '20px 40px' : '10px 20px', fontSize: fs('24px', '16px'), backgroundColor: isModoIdoso ? '#FFD700' : '#007bff', color: isModoIdoso ? 'black' : 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} className="btn-toggle-modo" >
          {isModoIdoso ? '✨ Modo Padrão' : '👴 Modo Acessível'}
        </button>
        </div>
      </header>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar moeda pelo nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
          style={{ width: '100%', padding: isModoIdoso ? '18px' : '12px', fontSize: fs('22px', '16px'), borderRadius: '10px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white', boxSizing: 'border-box' }}
        className="search-input"
       />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: fs('18px', '13px'), color: '#aaa' }}>Preço mínimo (R$)</label>
          <input
            type="number"
            placeholder="Ex: 100"
            value={precoMin}
            onChange={e => setPrecoMin(e.target.value)}
            style={{ padding: isModoIdoso ? '14px' : '10px', fontSize: fs('20px', '14px'), borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white' }}
            className="filter-input"
         />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: fs('18px', '13px'), color: '#aaa' }}>Preço máximo (R$)</label>
          <input
            type="number"
            placeholder="Ex: 50000"
            value={precoMax}
            onChange={e => setPrecoMax(e.target.value)}
            style={{ padding: isModoIdoso ? '14px' : '10px', fontSize: fs('20px', '14px'), borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white' }}
            className="filter-input"
         />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '140px' }}>
          <label style={{ fontSize: fs('18px', '13px'), color: '#aaa' }}>Rank mínimo</label>
          <input
            type="number"
            placeholder="Ex: 10"
            value={rank}
            onChange={e => setRank(e.target.value)}
            style={{ padding: isModoIdoso ? '14px' : '10px', fontSize: fs('20px', '14px'), borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1e1e1e', color: 'white' }}
            className="filter-input"
        />
        </div>

      {usuario && (
        <button
          onClick={() => setApenasFantavoritos(prev => !prev)}
          style={{
            padding: isModoIdoso ? '14px 30px' : '10px 20px',
            fontSize: fs('20px', '14px'),
            backgroundColor: apenasFantavoritos ? '#f59e0b' : '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {apenasFantavoritos ? '⭐ Todos' : '⭐ Favoritos'}
        </button>
      )}

        <button onClick={aplicarFiltros} style={{ padding: isModoIdoso ? '14px 30px' : '10px 20px', fontSize: fs('20px', '14px'), backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} className="btn-filtrar">
          Filtrar
        </button>
        <button onClick={limparFiltros} style={{ padding: isModoIdoso ? '14px 30px' : '10px 20px', fontSize: fs('20px', '14px'), backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} className="btn-limpar">
          Limpar
        </button>
      </div>

  
      {carregando && <p style={{ color: '#aaa', textAlign: 'center', fontSize: fs('22px', '16px') }}>Buscando...</p>}
      {!carregando && moedasExibidas.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', fontSize: fs('22px', '16px') }}>Nenhuma moeda encontrada.</p>}

   
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: isModoIdoso ? '30px' : '20px' }}  >
        {moedasExibidas.map(moeda => (
          <div key={moeda.id} style={{ backgroundColor: '#1e1e1e', borderRadius: '15px', padding: isModoIdoso ? '30px' : '20px', border: isModoIdoso ? '4px solid #FFD700' : '1px solid #333', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }} className="coin-card">
            <img src={moeda.imagem} alt={moeda.nome} style={{ width: isModoIdoso ? '100px' : '50px', height: isModoIdoso ? '100px' : '50px' }} />
            <div style={{ fontSize: fs('28px', '20px'), fontWeight: 'bold' }}>
              {moeda.nome} <span style={{ opacity: 0.6 }}>({moeda.simbolo?.toUpperCase()})</span>
            </div>
            <div style={{ fontSize: fs('32px', '22px'), color: '#4caf50', fontWeight: '900', backgroundColor: isModoIdoso ? '#000' : 'transparent', padding: isModoIdoso ? '10px' : '0', borderRadius: '8px' }} className="coin-price" >
              R$ {moeda.precoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            {usuario && (
            <button
              onClick={(e) => toggleFavorito(e, moeda.id)}
              disabled={favoritando === moeda.id}
              style={{
                width: '100%',
                padding: isModoIdoso ? '14px' : '10px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: (usuario.moedasFavoritas || []).includes(moeda.id) ? '#ff4444' : '#f59e0b',
                color: 'white',
                fontWeight: 'bold',
                fontSize: fs('20px', '14px'),
                cursor: favoritando === moeda.id ? 'not-allowed' : 'pointer',
                opacity: favoritando === moeda.id ? 0.7 : 1,
              }}
            >
              {favoritando === moeda.id ? '⏳' : (usuario.moedasFavoritas || []).includes(moeda.id) ? '💔 Remover' : '⭐ Favoritar'}
            </button>
          )}
            <Link to={`/moeda/${moeda.id}`} style={{ marginTop: '10px', width: '100%', padding: '12px', borderRadius: '8px', backgroundColor: '#333', color: 'white', border: '1px solid #555', cursor: 'pointer', fontSize: fs('20px', '14px'), textDecoration: 'none', display: 'block', boxSizing: 'border-box' }} className="btn-detail" >
              Ver Detalhes
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
 
export default ListaMoedas