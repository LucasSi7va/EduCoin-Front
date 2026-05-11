import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAcessibilidade } from '../contexts/AcessibilidadeContext';

export function Cadastro() {
  const [passo, setPasso] = useState(1);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
  const [codigo, setCodigo] = useState(''); // Estado para o código
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { isModoIdoso } = useAcessibilidade();
  const fs = (idoso: string, normal: string) => isModoIdoso ? idoso : normal;

  const handleSubmitDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await api.post('/usuario/cadastrar', formData);
      setPasso(2);
      setCodigo('');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

 const handleSubmitCodigo = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErro('');

  try {
    const response = await api.post('/usuario/confirmar-cadastro', {
      email: formData.email,
      codigo: codigo
    });

    localStorage.setItem('usuario', JSON.stringify(response.data));

    alert('Conta confirmada!');
    navigate('/perfil');

  } catch (err: any) {
    console.error("Erro na resposta:", err.response);
    setErro('Código inválido ou expirado.');
  } finally {
    setLoading(false);
  }
};

  // Estilo base reutilizado da sua lista
  const inputStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: '#1e1e1e',
    color: 'white',
    borderRadius: '10px',
    border: '1px solid #444',
    width: '100%',
    boxSizing: 'border-box'
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
      <div className="coin-card" style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '15px', width: '100%', maxWidth: '400px', border: isModoIdoso ? '4px solid #FFD700' : '1px solid #333' }}>
        
        <h2 style={{ fontSize: fs('32px', '24px'), color: 'white', marginBottom: '25px', textAlign: 'center' }}>
          {passo === 1 ? 'Criar Conta' : 'Confirmar E-mail'}
        </h2>

        {erro && <p style={{ color: '#ff4444', textAlign: 'center', marginBottom: '15px' }}>{erro}</p>}

        {passo === 1 ? (
          <form onSubmit={handleSubmitDados} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input type="text" placeholder="Nome" className="search-input" style={inputStyle} required onChange={e => setFormData({...formData, nome: e.target.value})} />
            <input type="email" placeholder="E-mail" className="search-input" style={inputStyle} required onChange={e => setFormData({...formData, email: e.target.value})} />
            <input type="password" placeholder="Senha" className="search-input" style={inputStyle} required onChange={e => setFormData({...formData, senha: e.target.value})} />
            <button type="submit" disabled={loading} className="btn-filtrar" style={{ padding: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitCodigo} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <p style={{ color: '#aaa', textAlign: 'center' }}>Digite o código enviado para <br/> <b>{formData.email}</b></p>
            <input 
              type="text" 
              placeholder="Digite o código" 
              className="search-input" 
              value={codigo} // ✨ Vincula ao estado
              autoComplete="off"
              style={{ ...inputStyle, textAlign: 'center', fontSize: '20px', letterSpacing: '2px' }} 
              onChange={e => setCodigo(e.target.value)} 
              required 
            />
            <button type="submit" disabled={loading} className="btn-filtrar" style={{ padding: '14px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Verificando...' : 'Confirmar Cadastro'}
            </button>
            <button type="button" onClick={() => setPasso(1)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', textDecoration: 'underline' }}>
              Voltar
            </button>
          </form>
        )}
      </div>
    </div>
  );
}