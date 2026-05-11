import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Perfil() {

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem('usuario') || 'null'
  );

const [foto, setFoto] = useState(
  usuario?.fotoPerfil || '' 
);

  function handleUploadFoto(
    e: React.ChangeEvent<HTMLInputElement>
  ) {

    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      setFoto(reader.result as string);
    };

    reader.readAsDataURL(file);
  }

async function salvarPerfil() {
  if (!usuario || !usuario.email) {
    alert("Usuário não identificado.");
    return;
  }

  const payload = {
    email: usuario.email,
    fotoPerfil: foto, 
    capaPerfil: usuario.capaPerfil || 'default-cover-url.jpg'
  };

  try {
    // ADICIONADO O /usuario NA URL
    const response = await fetch(`http://localhost:8080/usuario/editar-fotoPerfil/capaPerfil`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
    const usuarioAtualizado = {
  ...usuario,
  fotoPerfil: foto 
};

      localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));

      alert('Perfil atualizado com sucesso!');
      navigate('/'); // Certifique-se que essa rota existe no seu App.js/router
    } else {
      // Se cair aqui, o Java retornou erro (ex: 400, 500)
      const errorData = await response.json().catch(() => ({}));
      alert('Erro ao salvar: ' + (errorData.error || 'Erro desconhecido'));
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    alert("Erro de conexão. O servidor está rodando?");
  }
}

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#121212',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white'
      }}
    >

      <div
        style={{
          backgroundColor: '#1e1e1e',
          padding: '40px',
          borderRadius: '16px',
          width: '400px',
          textAlign: 'center'
        }}
      >

        <h1>Editar Perfil</h1>
<div
  style={{
    position: 'relative',
    width: '140px',
    height: '140px',
    margin: '0 auto 25px auto',
    cursor: 'pointer'
  }}
>

  <label
    htmlFor="upload-foto"
    style={{
      cursor: 'pointer'
    }}
  >

    <img
      src={
        foto ||
        `https://ui-avatars.com/api/?name=${usuario.nome}`
      }
      alt="perfil"
      style={{
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '3px solid #007bff'
      }}
    />

    {/* Overlay */}
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        opacity: 0,
        transition: '0.3s'
      }}
      className="overlay-foto"
    >
      📷 Alterar Foto
    </div>

  </label>

  <input
    id="upload-foto"
    type="file"
    accept="image/png, image/jpeg, image/jpg"
    onChange={handleUploadFoto}
    style={{
      display: 'none'
    }}
  />

</div>
        {/* URL */}
        <input
          type="text"
          placeholder="Cole URL da foto"
          value={foto.startsWith('data:') ? '' : foto}
          onChange={(e) => setFoto(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #444',
            backgroundColor: '#121212',
            color: 'white',
            marginBottom: '15px',
            boxSizing: 'border-box'
          }}
        />


        <button
          onClick={salvarPerfil}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Salvar Perfil
        </button>

      </div>

    </div>
  );
}