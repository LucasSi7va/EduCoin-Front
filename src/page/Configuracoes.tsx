import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export function Configuracoes() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const [novoNome, setNovoNome] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  async function salvar() {
    setErro(''); setSucesso('');

    if (!novoNome && !novoEmail && !novaSenha) {
      setErro('Preencha ao menos um campo.'); return;
    }
    if (novaSenha && novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem.'); return;
    }
    if (novaSenha && novaSenha.length < 6) {
      setErro('Senha deve ter ao menos 6 caracteres.'); return;
    }

    setSalvando(true);
    const payload: any = {};
    if (novoNome) payload.novoNome = novoNome;
    if (novoEmail) payload.novoEmail = novoEmail;
    if (novaSenha) payload.novaSenha = novaSenha;

    try {
    await api.put('/usuario/atualizar-usuario', payload);

    // atualiza localStorage
    const usuarioAtual = JSON.parse(localStorage.getItem('usuario') || '{}');
    if (novoNome) usuarioAtual.nome = novoNome;
    if (novoEmail) usuarioAtual.email = novoEmail;
    localStorage.setItem('usuario', JSON.stringify(usuarioAtual));

    setSucesso('Alterações salvas com sucesso!');
    setNovoNome(''); setNovoEmail(''); setNovaSenha(''); setConfirmarSenha('');

  } catch (err: any) {
    setErro(err.response?.data?.message || 'Erro ao salvar.');
  } finally {
    setSalvando(false);
  }
  }

  return (
  <div style={{ minHeight: '100vh', backgroundColor: '#0a0b10', color: 'white', fontFamily: 'sans-serif' }}>
    <div style={{ padding: '2rem 1rem', maxWidth: '480px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '10px', padding: '8px 14px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⬅️ Voltar
        </button>
        <h1 style={{ fontSize: '22px', fontWeight: '700' }}>Configurações</h1>
      </div>

      {/* Mensagens */}
      {erro && (
        <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px' }}>
          ❌ {erro}
        </div>
      )}
      {sucesso && (
        <div style={{ backgroundColor: '#14532d', color: '#86efac', padding: '12px 16px', borderRadius: '10px', marginBottom: '1rem', fontSize: '14px' }}>
          ✅ {sucesso}
        </div>
      )}

      {/* Dados pessoais */}
      <div style={{ backgroundColor: '#1e1e1e', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Dados pessoais
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Novo nome</label>
          <input
            type="text"
            placeholder="Seu novo nome"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#121212', color: 'white', fontSize: '15px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Novo e-mail</label>
          <input
            type="email"
            placeholder="novo@email.com"
            value={novoEmail}
            onChange={e => setNovoEmail(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#121212', color: 'white', fontSize: '15px' }}
          />
          <p style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>Deixe em branco para não alterar</p>
        </div>
      </div>

      {/* Segurança */}
      <div style={{ backgroundColor: '#1e1e1e', borderRadius: '14px', padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ fontSize: '12px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
          Segurança
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Nova senha</label>
          <input
            type="password"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#121212', color: 'white', fontSize: '15px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', color: '#aaa', marginBottom: '6px' }}>Confirmar nova senha</label>
          <input
            type="password"
            placeholder="Repita a nova senha"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#121212', color: 'white', fontSize: '15px' }}
          />
          {novaSenha && confirmarSenha && (
            <p style={{ fontSize: '12px', marginTop: '5px', color: novaSenha === confirmarSenha ? '#4caf50' : '#f87171' }}>
              {novaSenha === confirmarSenha ? '✅ Senhas coincidem' : '❌ Senhas não coincidem'}
            </p>
          )}
        </div>
      </div>

      {/* Botão salvar */}
      <button
        onClick={salvar}
        disabled={salvando}
        style={{ width: '100%', padding: '14px', border: 'none', borderRadius: '12px', backgroundColor: salvando ? '#1d4ed8' : '#3b82f6', color: 'white', fontSize: '16px', fontWeight: '700', cursor: salvando ? 'not-allowed' : 'pointer', opacity: salvando ? 0.7 : 1 }}>
        {salvando ? '⏳ Salvando...' : '💾 Salvar alterações'}
      </button>

    </div>
  </div>
);
}




