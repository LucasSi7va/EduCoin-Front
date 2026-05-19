import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useAcessibilidade } from '../contexts/AcessibilidadeContext';

export function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { isModoIdoso } = useAcessibilidade();
  const fs = (idoso: string, normal: string) => isModoIdoso ? idoso : normal;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const response = await api.post('/usuario/login', { email, senha });

      localStorage.setItem('usuario', JSON.stringify({
        id: response.data.id,
        nome: response.data.nome,
        email: response.data.email,
        fotoPerfil: response.data.fotoPerfil,
        capaPerfil: response.data.capaPerfil,
        moedasFavoritas: response.data.moeda ?? []
      }));

      alert('Bem-vindo de volta!');
      navigate('/');
    } catch (err: any) {
      setErro('Usuário não encontrado ou credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>

      <div className="coin-card" style={{
        backgroundColor: '#1e1e1e',
        padding: '40px',
        borderRadius: '15px',
        width: '100%',
        maxWidth: '400px',
        border: isModoIdoso ? '4px solid #FFD700' : '1px solid #333',
        textAlign: 'center'
      }}>

        <h2 style={{ fontSize: fs('32px', '24px'), color: 'white', marginBottom: '30px' }}>Entrar no CoinEdu</h2>

        {erro && (
          <p style={{ color: '#ff4444', marginBottom: '15px', fontSize: fs('18px', '14px') }}>{erro}</p>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            placeholder="E-mail"
            className="search-input"
            style={{ padding: isModoIdoso ? '18px' : '12px', backgroundColor: '#1e1e1e', color: 'white', borderRadius: '10px', border: '1px solid #444' }}
            onChange={e => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Senha"
            className="search-input"
            style={{ padding: isModoIdoso ? '18px' : '12px', backgroundColor: '#1e1e1e', color: 'white', borderRadius: '10px', border: '1px solid #444' }}
            onChange={e => setSenha(e.target.value)}
          />

          <button
            type="submit"
            className="btn-filtrar"
            style={{
              padding: '14px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: fs('20px', '14px'),
              cursor: 'pointer'
            }}
          >
            {loading ? 'Carregando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '20px' }}>
          <Link to="/cadastro" style={{ color: '#007bff', textDecoration: 'none', fontSize: fs('18px', '14px') }}>
            Criar uma conta
          </Link>
        </div>
      </div>
    </div>
  );
}