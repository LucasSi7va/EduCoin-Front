import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useFala, useTalkBack } from '../hooks/UseTalkBack';
import { useModoLeitura } from '../contexts/ModoLeituraContext';

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
  const [mostraFavoritos, setMostraFavoritos] = useState(false);
  const [moedas, setMoedas] = useState<any[]>([]);
  const [carregandoFav, setCarregandoFav] = useState(false);


const {
  modoLeitura,
  setModoLeitura
} = useModoLeitura();

const fala = useFala();

const {talkClick,estiloTalkBack} = useTalkBack(modoLeitura, fala);






  const inputFotoRef = useRef<HTMLInputElement>(null);
  const inputCapaRef = useRef<HTMLInputElement>(null);

  const cores = { primaria: '#3b82f6', secundaria: '#262626', fundo: '#0a0b10' };

  async function abrirFavoritos() {
    if (mostraFavoritos) { setMostraFavoritos(false); return; }
    setCarregandoFav(true);
    try {
      const res = await api.get('/coin');
      const todas = res.data;
      const favIds: string[] = usuario?.moedasFavoritas || [];
      setMoedas(todas.filter((m: any) => favIds.includes(m.id)));
      setMostraFavoritos(true);
    } catch {
      alert('Erro ao carregar favoritos.');
    } finally {
      setCarregandoFav(false);
    }
  }




  
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



function toggleModoLeituraHandler() {
  const novo = !modoLeitura;

  setModoLeitura(novo);

  if (novo) {
    fala.falar(
      "Modo leitura ativado. Toque uma vez para ouvir e duas vezes para confirmar."
    );
  } else {
    fala.parar();
  }
}

  async function salvar() {
    setSalvando(true);
    try {
      const payload = { email: usuario.email, fotoPerfil, capaPerfil: capaPerfil || 'default-cover-url.jpg' };
      const response = await fetch('http://localhost:8080/usuario/editar-fotoPerfil/capaPerfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) {
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, fotoPerfil, capaPerfil }));
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
    padding: '14px 28px', borderRadius: '14px',
    border: primary ? 'none' : '1px solid rgba(255,255,255,0.2)',
    backgroundColor: bg, color: 'white', fontWeight: 'bold',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: cores.fundo, color: 'white', fontFamily: 'sans-serif' }}>




    
      {modalAberto && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#1e1e1e', borderRadius: '16px', padding: '32px', width: '380px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0 }}>{modalAberto === 'foto' ? '📷 Alterar foto de perfil' : '🖼️ Alterar capa'}</h2>
            <button onClick={() => modalAberto === 'foto' ? inputFotoRef.current?.click() : inputCapaRef.current?.click()} style={{ ...btnStyle('#007bff', true), justifyContent: 'center' }}>
              ⬆️ Enviar imagem do dispositivo
            </button>
            <input type="text" placeholder="Ou cole uma URL de imagem..." value={urlInput} onChange={e => setUrlInput(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#121212', color: 'white', fontSize: '14px' }} />
            <button onClick={aplicarUrl} style={{ ...btnStyle('#28a745', true), justifyContent: 'center' }}>✅ Usar essa URL</button>
            <button onClick={() => { setModalAberto(null); setUrlInput(''); }} style={{ ...btnStyle('#444', false), justifyContent: 'center' }}>Cancelar</button>
          </div>
        </div>
      )}

      <input ref={inputFotoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'foto')} />
      <input ref={inputCapaRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'capa')} />

      <div style={{ position: 'relative', width: '100%' }}>
        {/* CAPA */}
        <div
  onClick={talkClick(
    "capa",
    "Alterar imagem de capa. Toque novamente para confirmar.",
    () => setModalAberto('capa')
  )}
  onMouseEnter={() => setHoverCapa(true)}
  onMouseLeave={() => setHoverCapa(false)}
          style={{ height: '250px', background: capaPerfil ? `url(${capaPerfil}) center/cover no-repeat` : 'linear-gradient(135deg, #1e40af, #3b82f6)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hoverCapa ? 1 : 0, transition: '0.3s' }}>
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>✏️ Alterar capa</span>
          </div>
        </div>

    
        <div
  onClick={talkClick(
    "foto",
    "Alterar foto de perfil. Toque novamente para confirmar.",
    () => setModalAberto('foto')
  )}
  onMouseEnter={() => setHoverFoto(true)}
  onMouseLeave={() => setHoverFoto(false)}
          style={{ position: 'absolute', bottom: '-75px', left: '50%', transform: `translateX(-50%) ${hoverFoto ? 'scale(1.08)' : 'scale(1)'}`, width: '150px', height: '150px', borderRadius: '50%', border: `6px solid ${cores.fundo}`, overflow: 'hidden', cursor: 'pointer', zIndex: 10, transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
          <img src={fotoPerfil || `https://ui-avatars.com/api/?name=${usuario?.nome}&background=333&color=fff`} alt="perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hoverFoto ? 1 : 0, transition: '0.2s' }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>📷 Editar</span>
          </div>
        </div>
      </div>

   
      <div style={{ paddingTop: '100px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '25px', letterSpacing: '-1px' }}>
          {usuario?.nome}
        </h1>


        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>

 <button
  onClick={talkClick(
    "voltar",
    "Voltar para a página anterior. Toque novamente para confirmar.",
    () => navigate(-1)
  )}
  style={estiloTalkBack(
    "voltar",
    btnStyle('#444', false)
  )}
>
  ⬅️ Voltar
</button>

         <button
  onClick={talkClick(
    "favoritos",
    mostraFavoritos
      ? "Fechar lista de favoritos. Toque novamente para confirmar."
      : "Abrir lista de moedas favoritas. Toque novamente para confirmar.",
    () => abrirFavoritos()
  )}
  style={estiloTalkBack(
    "favoritos",
    btnStyle(
      mostraFavoritos ? '#f59e0b' : cores.primaria,
      true
    )
  )}
>
            {carregandoFav ? '⏳' : '⭐ Favoritos'}
            {!carregandoFav && usuario?.moedasFavoritas?.length > 0 && (
              <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '20px', padding: '2px 10px', fontSize: '14px' }}>
                {usuario.moedasFavoritas.length}
              </span>
            )}
          </button>
         <button
  onClick={talkClick(
    "config",
    "Abrir configurações. Toque novamente para confirmar.",
    () => navigate('/configuracoes')
  )}
  style={estiloTalkBack(
    "config",
    btnStyle(cores.secundaria, false)
  )}
>
  ⚙️ Configurações
</button>
          <button
  onClick={talkClick(
    "salvar",
    "Salvar alterações do perfil. Toque novamente para confirmar.",
    () => salvar()
  )}
  disabled={salvando}
  style={estiloTalkBack(
    "salvar",
    {
      ...btnStyle('#28a745', true),
      opacity: salvando ? 0.7 : 1
    }
  )}
>
            {salvando ? '⏳ Salvando...' : '💾 Salvar alterações'}
          </button>
        </div>

        {mostraFavoritos && (
          <div style={{ marginTop: '40px', padding: '0 20px', maxWidth: '800px', margin: '40px auto 0' }}>
            <h2 style={{ marginBottom: '20px' }}>⭐ Minhas moedas favoritas</h2>
            {moedas.length === 0 ? (
              <p style={{ color: '#aaa' }}>Você ainda não tem moedas favoritas.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                {moedas.map(moeda => (
                  <div
  key={moeda.id}
  onClick={talkClick(
    `moeda-${moeda.id}`,
    `Abrir detalhes da moeda ${moeda.nome}. Toque novamente para confirmar.`,
    () => navigate(`/moeda/${moeda.id}`)
  )}
  style={estiloTalkBack(
    `moeda-${moeda.id}`,
    {
      textDecoration: 'none'
    }
  )}
>
                    <div style={{ backgroundColor: '#1e1e1e', borderRadius: '12px', padding: '20px', border: '1px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                      <img src={moeda.imagem} alt={moeda.nome} style={{ width: '48px', height: '48px' }} />
                      <span style={{ fontWeight: 'bold', color: 'white' }}>{moeda.nome}</span>
                      <span style={{ color: '#4caf50', fontWeight: '900' }}>
                        R$ {moeda.precoAtual?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── FAB modo leitura ── */}
<button
  onClick={toggleModoLeituraHandler}
  aria-pressed={modoLeitura}
  aria-label={modoLeitura ? 'Desativar modo leitura TalkBack' : 'Ativar modo leitura TalkBack'}
  title={modoLeitura ? 'Desativar modo leitura' : 'Ativar modo leitura'}
  style={{
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '62px',
    height: '62px',
    borderRadius: '50%',
    backgroundColor: modoLeitura ? '#4caf50' : '#1e3a5f',
    color: 'white',
    border: `2px solid ${modoLeitura ? '#4caf50' : '#3b82f6'}`,
    cursor: 'pointer',
    fontSize: '22px',
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
    </div>
  );
}