import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAcessibilidade } from '../contexts/AcessibilidadeContext';
import { useFala, useTalkBack } from "../hooks/UseTalkBack";
import { useModoLeitura } from "../contexts/ModoLeituraContext";

export function Cadastro() {
  const [passo, setPasso] = useState(1);
  const [formData, setFormData] = useState({ nome: '', email: '', senha: '' });
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [anuncio, setAnuncio] = useState('');

  const navigate = useNavigate();
  const { isModoIdoso } = useAcessibilidade();
  const { modoLeitura } = useModoLeitura();
  
  const fala = useFala();
  const { talkClick, estiloTalkBack } = useTalkBack(modoLeitura, fala);

  const fs = (idoso: string, normal: string) => isModoIdoso ? idoso : normal;

  // Força parar qualquer fala residual ao desmontar o componente
  useEffect(() => {
    return () => fala.parar();
  }, [fala]);

  const handleSubmitDados = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      await api.post('/usuario/cadastrar', formData);
      setPasso(2);
      setCodigo('');
      setAnuncio('Código enviado com sucesso. Avançando para a etapa de confirmação.');
    } catch (err: any) {
      const msgErro = err.response?.data?.message || 'Erro ao cadastrar';
      setErro(msgErro);
      if (modoLeitura) fala.falar(`Erro: ${msgErro}`);
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
      window.dispatchEvent(new Event('storage')); // Notifica o cabeçalho sobre o login

      alert('Conta confirmada!');
      navigate('/');
    } catch (err: any) {
      console.error("Erro na resposta:", err.response);
      setErro('Código inválido ou expirado.');
      if (modoLeitura) fala.falar('Código inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lm-root" style={styles.root}>
      
      {/* Região live para leitores de tela */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {anuncio}
      </div>

      <div 
        className={`lm-card coin-card ${isModoIdoso ? 'idoso' : ''}`} 
        style={{
          ...styles.card,
          border: isModoIdoso ? '4px solid #FFD700' : '1px solid #333',
          padding: isModoIdoso ? '36px 24px' : '40px'
        }}
      >
        <h2 style={{ ...styles.title, fontSize: fs('36px', '26px') }}>
          {passo === 1 ? 'Criar Conta' : 'Confirmar E-mail'}
        </h2>

        {erro && <p style={styles.errorText}>{erro}</p>}

        {passo === 1 ? (
          <form onSubmit={handleSubmitDados} style={styles.form}>
            <div style={styles.inputGroup}>
              <input 
                type="text" 
                placeholder="Nome" 
                className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} 
                style={{ ...styles.input, fontSize: fs('20px', '16px'), height: fs('60px', '50px') }} 
                required 
                onChange={e => setFormData({...formData, nome: e.target.value})} 
              />
            </div>

            <div style={styles.inputGroup}>
              <input 
                type="email" 
                placeholder="E-mail" 
                className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} 
                style={{ ...styles.input, fontSize: fs('20px', '16px'), height: fs('60px', '50px') }} 
                required 
                onChange={e => setFormData({...formData, email: e.target.value})} 
              />
            </div>

            <div style={styles.inputGroup}>
              <input 
                type="password" 
                placeholder="Senha" 
                className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} 
                style={{ ...styles.input, fontSize: fs('20px', '16px'), height: fs('60px', '50px') }} 
                required 
                onChange={e => setFormData({...formData, senha: e.target.value})} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              onClick={talkClick('btn-enviar-dados', 'Enviar dados de cadastro e gerar código. Toque duas vezes para confirmar.', () => {})}
              style={estiloTalkBack('btn-enviar-dados', { ...styles.btnPrimary, height: fs('64px', '54px'), fontSize: fs('18px', '15px') })}
              className={`lm-btn-fav ${isModoIdoso ? 'idoso' : ''}`}
            >
              {loading ? 'Enviando...' : 'Enviar Código'}
            </button>
            
            <button
              type="button"
              onClick={talkClick('btn-voltar-home', 'Voltar para a tela inicial de moedas. Toque duas vezes para retornar.', () => navigate('/'))}
              style={estiloTalkBack('btn-voltar-home', styles.btnLink)}
            >
              Voltar para moedas
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitCodigo} style={styles.form}>
            <p style={{ ...styles.instructions, fontSize: fs('18px', '15px') }}>
              Digite o código enviado para <br/> <span style={{ color: '#f59e0b' }}>{formData.email}</span>
            </p>

            <div style={styles.inputGroup}>
              <input 
                type="text" 
                placeholder="000000" 
                className={`lm-filter-input filter-input ${isModoIdoso ? 'idoso' : ''}`} 
                value={codigo}
                autoComplete="off"
                style={{ 
                  ...styles.input, 
                  textAlign: 'center', 
                  fontSize: fs('26px', '22px'), 
                  letterSpacing: '4px',
                  height: fs('64px', '54px')
                }} 
                onChange={e => setCodigo(e.target.value)} 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              onClick={talkClick('btn-confirmar-codigo', 'Confirmar o código digitado e finalizar cadastro. Toque duas vezes para validar.', () => {})}
              style={estiloTalkBack('btn-confirmar-codigo', { ...styles.btnConfirm, height: fs('64px', '54px'), fontSize: fs('18px', '15px') })}
              className={`lm-btn-fav ${isModoIdoso ? 'idoso' : ''}`}
            >
              {loading ? 'Verificando...' : 'Confirmar Cadastro'}
            </button>

            <button 
              type="button" 
              onClick={talkClick('btn-passo-anterior', 'Voltar para corrigir os dados de cadastro. Toque duas vezes para voltar.', () => setPasso(1))} 
              style={estiloTalkBack('btn-passo-anterior', styles.btnLink)}
            >
              Corrigir e-mail/senha
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Estilos padronizados em JS (alinhados com as classes da Lista)
const styles: { [key: string]: React.CSSProperties } = {
  root: {
    backgroundColor: '#121212',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box'
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column'
  },
  title: {
    color: 'white',
    marginBottom: '24px',
    textAlign: 'center',
    fontWeight: 'bold',
    margin: 0
  },
  errorText: {
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: '16px',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%'
  },
  inputGroup: {
    width: '100%'
  },
  input: {
    backgroundColor: '#121212',
    color: 'white',
    borderRadius: '10px',
    border: '1px solid #444',
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 14px'
  },
  instructions: {
    color: '#aaa',
    textAlign: 'center',
    lineHeight: '1.5',
    margin: '0 0 8px 0'
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  },
  btnConfirm: {
    width: '100%',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box'
  },
  btnLink: {
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    textDecoration: 'underline',
    fontSize: '14px',
    textAlign: 'center',
    marginTop: '4px',
    padding: '8px'
  }
};