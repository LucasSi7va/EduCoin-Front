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
  const { isModoIdoso, toggleModoIdoso } = useAcessibilidade()

  // Carrega todas as moedas na inicialização
  useEffect(() => {
    carregarTodas()
  }, [])

  function carregarTodas() {
    setCarregando(true)
    api.get('/coin')
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false))
  }

  // Busca por nome (debounce simples com useCallback)
  const buscarPorNome = useCallback((nome: string) => {
    if (!nome.trim()) { carregarTodas(); return }
    setCarregando(true)
    api.get(`/coin/nome/${nome}`)
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false))
  }, [])

  // Dispara busca por nome enquanto digita
  useEffect(() => {
    const timer = setTimeout(() => buscarPorNome(busca), 400)
    return () => clearTimeout(timer)
  }, [busca, buscarPorNome])

  // Aplica filtros de preço/rank
  function aplicarFiltros() {
    if (!precoMin && !precoMax && !rank) { carregarTodas(); return }
    setCarregando(true)
    const params = new URLSearchParams()
    if (precoMin) params.append('precoMin', precoMin)
    if (precoMax) params.append('precoMax', precoMax)
    if (rank)     params.append('rank', rank)
    api.get(`/coin/filtra?${params.toString()}`)
      .then(res => setMoedas(res.data))
      .catch(err => console.error(err))
      .finally(() => setCarregando(false))
  }

  function limparFiltros() {
    setBusca('')
    setPrecoMin('')
    setPrecoMax('')
    setRank('')
    carregarTodas()
  }

  const fs = (idoso: string, normal: string) => isModoIdoso ? idoso : normal

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', color: 'white', backgroundColor: '#121212', minHeight: '100vh' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{ fontSize: fs('40px', '28px') }}>CoinEdu</h1>
        <button onClick={toggleModoIdoso} style={{ padding: isModoIdoso ? '20px 40px' : '10px 20px', fontSize: fs('24px', '16px'), backgroundColor: isModoIdoso ? '#FFD700' : '#007bff', color: isModoIdoso ? 'black' : 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }} className="btn-toggle-modo" >
          {isModoIdoso ? '✨ Modo Padrão' : '👴 Modo Acessível'}
        </button>
      </header>

      {/* Barra de Busca */}
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

      {/* Filtros */}
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
        <button onClick={aplicarFiltros} style={{ padding: isModoIdoso ? '14px 30px' : '10px 20px', fontSize: fs('20px', '14px'), backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} className="btn-filtrar">
          Filtrar
        </button>
        <button onClick={limparFiltros} style={{ padding: isModoIdoso ? '14px 30px' : '10px 20px', fontSize: fs('20px', '14px'), backgroundColor: '#444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }} className="btn-limpar">
          Limpar
        </button>
      </div>

      {/* Feedback de estado */}
      {carregando && <p style={{ color: '#aaa', textAlign: 'center', fontSize: fs('22px', '16px') }}>Buscando...</p>}
      {!carregando && moedas.length === 0 && <p style={{ color: '#aaa', textAlign: 'center', fontSize: fs('22px', '16px') }}>Nenhuma moeda encontrada.</p>}

      {/* Grid de Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: isModoIdoso ? '30px' : '20px' }}  className="coin-card" >
        {moedas.map(moeda => (
          <div key={moeda.id} style={{ backgroundColor: '#1e1e1e', borderRadius: '15px', padding: isModoIdoso ? '30px' : '20px', border: isModoIdoso ? '4px solid #FFD700' : '1px solid #333', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <img src={moeda.imagem} alt={moeda.nome} style={{ width: isModoIdoso ? '100px' : '50px', height: isModoIdoso ? '100px' : '50px' }} />
            <div style={{ fontSize: fs('28px', '20px'), fontWeight: 'bold' }}>
              {moeda.nome} <span style={{ opacity: 0.6 }}>({moeda.simbolo?.toUpperCase()})</span>
            </div>
            <div style={{ fontSize: fs('32px', '22px'), color: '#4caf50', fontWeight: '900', backgroundColor: isModoIdoso ? '#000' : 'transparent', padding: isModoIdoso ? '10px' : '0', borderRadius: '8px' }} className="coin-price" >
              R$ {moeda.precoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
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