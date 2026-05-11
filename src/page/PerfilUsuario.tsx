import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function PerfilUsuario() {
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{"nome": "Usuário"}');

  const [fotoPerfil, setFotoPerfil] = useState(usuario?.fotoPerfil || '');
  const [capaPerfil, setCapaPerfil] = useState(usuario?.capaPerfil || '');
  const [hoverCapa, setHoverCapa] = useState(false);
  const [hoverFoto, setHoverFoto] = useState(false);
  const [modalAberto, setModalAberto] = useState<'foto' | 'capa' | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [salvando, setSalvando] = useState(false);

  const inputFotoRef = useRef<HTMLInputElement>(null);
  const inputCapaRef = useRef<HTMLInputElement>(null);

  const cores = {
    primaria: '#3b82f6',
    secundaria: '#262626',
    fundo: '#0a0b10'
  };

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>, tipo: 'foto' | 'capa') {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (tipo === 'foto') setFotoPerfil(reader.result as string);
      else setCapaPerfil(reader.result as string);
      setModalAberto(null);
    };
    reader.readAsDataURL(file);
  }

  function aplicarUrl() {
    if (!urlInput.trim()) return;
    if (modalAberto === 'foto') setFotoPerfil(urlInput.trim());
    else setCapaPerfil(urlInput.trim());
    setUrlInput('');
    setModalAberto(null);
  }

  async function salvar() {
    setSalvando(true);
    try {
      const payload = {
        email: usuario.email,
        fotoPerfil,
        capaPerfil: capaPerfil || 'default-cover-url.jpg'
      };

      const response = await fetch('http://localhost:8080/usuario/editar-fotoPerfil/capaPerfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        localStorage.setItem('usuario', JSON.stringify({
          ...usuario,
          fotoPerfil,
          capaPerfil
        }));
        alert('Perfil atualizado!');
      } else {
        alert('Erro ao salvar.');
      }
    } catch {
      alert('Erro de conexão.');
    } finally {
      setSalvando(false);
    }
  }

  const btnStyle = (bg: string, primary: boolean): React.CSSProperties => ({
    padding: '14px 28px',
    borderRadius: '14px',
    border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
    backgroundColor: bg,
    color: 'white',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: cores.fundo, color: 'white', fontFamily: 'sans-serif' }}>

      {/* MODAL */}
      {modalAberto && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#1e1e1e', borderRadius: '16px',
            padding: '32px', width: '380px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <h2 style={{ margin: 0 }}>
              {modalAberto === 'foto' ? '📷 Alterar foto de perfil' : '🖼️ Alterar capa'}
            </h2>

            {/* Upload de arquivo */}
            <button
              onClick={() => modalAberto === 'foto' ? inputFotoRef.current?.click() : inputCapaRef.current?.click()}
              style={{ ...btnStyle('#007bff', true), justifyContent: 'center' }}
            >
              ⬆️ Enviar imagem do dispositivo
            </button>

            {/* URL */}
            <input
              type="text"
              placeholder="Ou cole uma URL de imagem..."
              value={urlInput}
              onChange={e => setUrlInput(e.target.value)}
              style={{
                padding: '12px', borderRadius: '8px', border: '1px solid #444',
                backgroundColor: '#121212', color: 'white', fontSize: '14px'
              }}
            />
            <button
              onClick={aplicarUrl}
              style={{ ...btnStyle('#28a745', true), justifyContent: 'center' }}
            >
              ✅ Usar essa URL
            </button>

            <button
              onClick={() => { setModalAberto(null); setUrlInput(''); }}
              style={{ ...btnStyle('#444', false), justifyContent: 'center' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Inputs de arquivo ocultos */}
      <input ref={inputFotoRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleUpload(e, 'foto')} />
      <input ref={inputCapaRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => handleUpload(e, 'capa')} />

      <div style={{ position: 'relative', width: '100%' }}>

        {/* CAPA */}
        <div
          onClick={() => setModalAberto('capa')}
          onMouseEnter={() => setHoverCapa(true)}
          onMouseLeave={() => setHoverCapa(false)}
          style={{
            height: '250px',
            background: capaPerfil
              ? `url(${capaPerfil}) center/cover no-repeat`
              : 'linear-gradient(135deg, #1e40af, #3b82f6)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer'
          }}
        >
          <div style={{
            position: 'absolute', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hoverCapa ? 1 : 0,
            transition: '0.3s',
          }}>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>✏️ Alterar capa</span>
          </div>
        </div>

        {/* FOTO DE PERFIL */}
        <div
          onClick={() => setModalAberto('foto')}
          onMouseEnter={() => setHoverFoto(true)}
          onMouseLeave={() => setHoverFoto(false)}
          style={{
            position: 'absolute',
            bottom: '-75px',
            left: '50%',
            transform: `translateX(-50%) ${hoverFoto ? 'scale(1.08)' : 'scale(1)'}`,
            width: '150px', height: '150px',
            borderRadius: '50%',
            border: `6px solid ${cores.fundo}`,
            overflow: 'hidden',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
          }}
        >
          <img
            src={fotoPerfil || `https://ui-avatars.com/api/?name=${usuario?.nome}&background=333&color=fff`}
            alt="perfil"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: hoverFoto ? 1 : 0, transition: '0.2s'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📷 Editar</span>
          </div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '25px', letterSpacing: '-1px' }}>
          {usuario?.nome}
        </h1>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
          <button style={btnStyle(cores.primaria, true)}>
            ⭐ Favoritos
          </button>
          <button style={btnStyle(cores.secundaria, false)}>
            ⚙️ Configurações
          </button>
          <button
            onClick={salvar}
            disabled={salvando}
            style={{ ...btnStyle('#28a745', true), opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? '⏳ Salvando...' : '💾 Salvar alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}