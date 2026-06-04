import { useNavigate, useParams } from "react-router-dom";
import { GraficoMoeda } from "../components/GraficoMoeda";
import { useAcessibilidade } from "../contexts/AcessibilidadeContext";
import { useEffect, useState } from "react";
import api from "../services/api";
import { useFala, useTalkBack } from "../hooks/UseTalkBack";
import { useModoLeitura } from "../contexts/ModoLeituraContext";


export function DetalhesMoeda() {
  const { id } = useParams();
  const { isModoIdoso } = useAcessibilidade();
  const [historico, setHistorico] = useState<any[]>([]);
  const [valorSimulacao, setValorSimulacao] = useState<number>(0);
  const [precoAtual, setPrecoAtual] = useState<number>(1);
  const [resultadoSimulacao, setResultadoSimulacao] = useState<any>(null);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingSim, setLoadingSim] = useState(false);
  const {
    modoLeitura,
    setModoLeitura
  } = useModoLeitura();
  
const fala = useFala();

const {
  talkClick,
  estiloTalkBack
} = useTalkBack(modoLeitura, fala);
  
  const navigate = useNavigate();

  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
  const favoritosLocais: string[] = usuario?.moedasFavoritas || [];
  const [isFavorita, setIsFavorita] = useState(favoritosLocais.includes(id || ''));

  const conteudosEducativos = [
    { id: "bitcoin", titulo: "O que é Bitcoin?", descricao: "É um tipo de dinheiro totalmente digital, que não depende de bancos ou governos.", dicaIdoso: "Pense no Bitcoin como um 'ouro digital' que você guarda no seu celular." },
    { id: "volatilidade", titulo: "Por que o preço muda?", descricao: "O preço muda conforme muitas pessoas querem comprar ou vender ao mesmo tempo.", dicaIdoso: "Não se preocupe com mudanças rápidas; o mercado de moedas é como uma maré." }
  ];

  const infoEducativa = conteudosEducativos.find(c => c.id === id);


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
  
  useEffect(() => {
    api.get(`/coin/${id}/historico/lista?dias=7`)
      .then(res => {
        const lista: any[] = res.data;
        setPrecoAtual(lista[0]?.preco_brl ?? 1);
        setHistorico([...lista].reverse());
      })
      .catch(err => console.error("Erro ao carregar histórico", err));
  }, [id]);

  async function toggleFavorito() {
    if (!usuario) { alert('Faça login para favoritar!'); return; }
    setLoadingFav(true);
    try {
      if (isFavorita) {
        await api.delete(`/usuario/carteira/remover?usuarioId=${usuario.id}&moeda=${id}`);
        const novaLista = favoritosLocais.filter(m => m !== id);
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, moedasFavoritas: novaLista }));
        setIsFavorita(false);
        setResultadoSimulacao(null);
      } else {
        await api.post(`/usuario/carteira/favoritar?usuarioId=${usuario.id}&moeda=${id}`);
        const novaLista = [...favoritosLocais, id!];
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, moedasFavoritas: novaLista }));
        setIsFavorita(true);
      }
    } catch (err: any) {
      alert('Erro ao atualizar favoritos.');
    } finally {
      setLoadingFav(false);
    }
  }

  async function simularCompra() {
    if (!usuario) { alert('Faça login para simular!'); return; }
    if (valorSimulacao <= 0) { alert('Digite um valor para simular.'); return; }
    setLoadingSim(true);
    try {
      const res = await api.get(`/usuario/carteira/simulacao`, {
        params: { moeda: id, valorCompra: valorSimulacao, usuarioId: usuario.id , precoAtual : precoAtual }
      });
      setResultadoSimulacao(res.data);
    } catch {
      alert('Erro ao simular compra.');
    } finally {
      setLoadingSim(false);
    }
  }

  const fs = (idoso: string, normal: string) => isModoIdoso ? idoso : normal;

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#121212', minHeight: '100vh' }}>

    <button
  onClick={talkClick(
  "voltar",
  "Voltar para a página anterior. Toque novamente para confirmar.",
  () => navigate(-1)
)}
style={estiloTalkBack(
  "voltar",
  {
    padding: isModoIdoso ? '20px 36px' : '10px 20px',
    marginBottom: '30px',
    fontSize: fs('24px', '16px'),
    cursor: 'pointer',
    backgroundColor: '#333',
    color: 'white',
    border: '1px solid #555',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
)}
>
  ⬅️ Voltar
</button>

      {/* Cabeçalho com botão de favorito */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: fs('50px', '32px'), margin: 0 }}>
          {id?.toUpperCase()}
        </h1>

        {usuario && (
          <button
            onClick={toggleFavorito}
            disabled={loadingFav}
            style={{
              padding: fs('20px 36px', '12px 24px'),
              fontSize: fs('22px', '16px'),
              fontWeight: 'bold',
              borderRadius: '12px',
              border: 'none',
              cursor: loadingFav ? 'not-allowed' : 'pointer',
              backgroundColor: isFavorita ? '#ff4444' : '#f59e0b',
              color: 'white',
              opacity: loadingFav ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {loadingFav ? '⏳' : isFavorita ? '💔 Remover dos favoritos' : '⭐ Adicionar aos favoritos'}
          </button>
        )}
      </div>

      {/* Gráfico */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: fs('30px', '22px'), marginBottom: '10px' }}>Evolução do Valor</h2>
        {historico.length > 0 ? <GraficoMoeda dados={historico} /> : <p>Carregando gráfico...</p>}
      </div>

      {/* Seção Educativa */}
      <div style={{ backgroundColor: '#1e1e1e', padding: isModoIdoso ? '40px' : '25px', borderRadius: '20px', border: isModoIdoso ? '5px solid #FFD700' : '1px solid #444', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
        <h2 style={{ color: '#FFD700', fontSize: fs('40px', '26px'), marginBottom: '15px' }}>
          {infoEducativa?.titulo || "Aprendendo sobre esta moeda"}
        </h2>
        <p style={{ fontSize: fs('28px', '18px'), lineHeight: '1.6', color: '#ccc' }}>
          {infoEducativa?.descricao || "Esta é uma moeda digital protegida por criptografia."}
        </p>
        {isModoIdoso && infoEducativa && (
          <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '15px', borderLeft: '8px solid #FFD700' }}>
            <p style={{ fontSize: '26px', color: '#FFD700', margin: 0 }}>
              <strong>👵 Explicação Simples:</strong> {infoEducativa.dicaIdoso}
            </p>
          </div>
        )}
      </div>

      {/* Simulador — só aparece se for favorita */}
      {isFavorita && usuario ? (
        <div style={{ marginTop: '40px', backgroundColor: '#1e1e1e', padding: isModoIdoso ? '40px' : '28px', borderRadius: '20px', border: '1px solid #2a2a2a', textAlign: 'center' }}>
          <h3 style={{ fontSize: fs('30px', '22px'), marginBottom: '8px' }}>💰 Simulador de Compra</h3>
          <p style={{ color: '#aaa', fontSize: fs('22px', '14px'), marginBottom: '20px' }}>
            Preço atual: R$ {precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>

          <input
            type="number"
            placeholder="R$ Quanto quer investir?"
            aria-label="Valor para investir"
            style={{ padding: '15px', fontSize: fs('22px', '20px'), borderRadius: '10px', width: '80%', maxWidth: '400px', backgroundColor: '#121212', color: 'white', border: '1px solid #444' }}
            onChange={(e) => setValorSimulacao(Number(e.target.value))}
          />

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={talkClick(
  "simular",
  "Simular compra desta moeda. Toque novamente para confirmar.",
  () => simularCompra()
)}
              disabled={loadingSim}
  style={estiloTalkBack(
  "simular",
  {
    padding: fs('20px 40px', '12px 28px'),
    fontSize: fs('22px', '16px'),
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    opacity: loadingSim ? 0.7 : 1
  }
)}          >
              {loadingSim ? '⏳ Calculando...' : '📊 Simular compra'}
            </button>
          </div>

          {/* Resultado da simulação */}
     {resultadoSimulacao && (
  <div style={{ marginTop: '24px', backgroundColor: '#0f2e1a', border: '1px solid #28a745', borderRadius: '14px', padding: '24px' }}>
    <p style={{ fontSize: fs('26px', '18px'), color: '#4caf50', fontWeight: 'bold', margin: '0 0 8px' }}>
      Com R$ {Number(resultadoSimulacao.valorInvestido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} você teria:
    </p>
    <p style={{ fontSize: fs('40px', '28px'), color: '#fff', fontWeight: '900', margin: 0 }}>
      {Number(resultadoSimulacao.quantidadeObtida).toFixed(6)} {id?.toUpperCase()}
    </p>
    <p style={{ fontSize: fs('20px', '14px'), color: '#aaa', marginTop: '8px' }}>
      Preço usado: R$ {Number(resultadoSimulacao.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>
  </div>
)}
        </div>
      ) : (
        /* Preview do simulador para não-favoritos */
        <div style={{ marginTop: '40px', backgroundColor: '#1a1a1a', padding: '28px', borderRadius: '20px', border: '1px dashed #444', textAlign: 'center' }}>
          <p style={{ color: '#aaa', fontSize: fs('22px', '16px'), margin: 0 }}>
            ⭐ Adicione esta moeda aos favoritos para usar o simulador de compra
          </p>
        </div>
      )}

<button
  onClick={toggleModoLeituraHandler}
  aria-pressed={modoLeitura}
  aria-label={
    modoLeitura
      ? 'Desativar modo leitura TalkBack'
      : 'Ativar modo leitura TalkBack'
  }
  title={
    modoLeitura
      ? 'Desativar modo leitura'
      : 'Ativar modo leitura'
  }
  style={{
    position: 'fixed',
    bottom: isModoIdoso ? '32px' : '24px',
    right: isModoIdoso ? '32px' : '24px',
    width: isModoIdoso ? '80px' : '62px',
    height: isModoIdoso ? '80px' : '62px',
    borderRadius: '50%',
    backgroundColor: modoLeitura ? '#4caf50' : '#1e3a5f',
    color: 'white',
    border: `2px solid ${
      modoLeitura ? '#4caf50' : '#3b82f6'
    }`,
    cursor: 'pointer',
    fontSize: isModoIdoso ? '30px' : '22px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: modoLeitura
      ? '0 0 0 6px rgba(76,175,80,0.25), 0 4px 20px rgba(0,0,0,0.5)'
      : '0 4px 20px rgba(0,0,0,0.4)',
    transition: 'all 0.2s',
    zIndex: 1000,
    animation: modoLeitura
      ? 'fab-pulse 1.6s ease-in-out infinite'
      : 'none',
  }}
>
  🔊
</button>

{modoLeitura && (
  <div
    style={{
      position: 'fixed',
      bottom: isModoIdoso ? '122px' : '96px',
      right: isModoIdoso ? '16px' : '12px',
      backgroundColor: '#1e1e1e',
      border: '1px solid #4caf50',
      borderRadius: '10px',
      padding: '8px 12px',
      fontSize: '12px',
      color: '#4caf50',
      zIndex: 999,
      maxWidth: '180px',
      textAlign: 'center',
      lineHeight: '1.5',
      pointerEvents: 'none',
    }}
  >
    1º toque = ouvir
    <br />
    2º toque = confirmar
  </div>
)}

    </div>
  );
  
}