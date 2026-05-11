

export function UsuarioLogado() {

  const usuario = JSON.parse(
    localStorage.getItem('usuario') || 'null'
  );

  if (!usuario) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}
    >

      <img
        src={`https://ui-avatars.com/api/?name=${usuario.nome}`}
        alt="perfil"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%'
        }}
      />

      <span style={{ color: 'white' }}>
        {usuario.nome}
      </span>

    </div>
  );
}