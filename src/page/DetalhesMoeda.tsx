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
  const { modoLeitura, setModoLeitura } = useModoLeitura();

  const fala = useFala();
  const { talkClick, estiloTalkBack } = useTalkBack(modoLeitura, fala);
  const navigate = useNavigate();

 const [usuario] = useState(() => JSON.parse(localStorage.getItem('usuario') || 'null'));
  const favoritosLocais: string[] = usuario?.moedasFavoritas || [];
  const [isFavorita, setIsFavorita] = useState(favoritosLocais.includes(id || ''));


const [querSalvar, setQuerSalvar] = useState<boolean | null>(null);
const [historicoSimulacoes, setHistoricoSimulacoes] = useState<any[]>([]);
const [loadingHistorico, setLoadingHistorico] = useState(false);

  const conteudosEducativos = [
    { id: "bitcoin", titulo: "O que é Bitcoin?", descricao: "É um tipo de dinheiro totalmente digital, que não depende de bancos ou governos.", dicaIdoso: "Pense no Bitcoin como um 'ouro digital' que você guarda no seu celular." },
    { id: "volatilidade", titulo: "Por que o preço muda?", descricao: "O preço muda conforme muitas pessoas querem comprar ou vender ao mesmo tempo.", dicaIdoso: "Não se preocupe com mudanças rápidas; o mercado de moedas é como uma maré." }
  ];

  const infoEducativa = conteudosEducativos.find(c => c.id === id);

  function toggleModoLeituraHandler() {
    const novo = !modoLeitura;
    setModoLeitura(novo);
    if (novo) {
      fala.falar("Modo leitura ativado. Toque uma vez para ouvir e duas vezes para confirmar.");
    } else {
      fala.parar();
    }
  }

  useEffect(() => {
  if (!usuario || !isFavorita) return;

  api.get(`/carteira/historico/${usuario.id}/${id}`)
    .then(res => setHistoricoSimulacoes(res.data))
    .catch(() => {});

  api.get(`/coin/${id}/historico/lista?dias=7`)
    .then(res => {
      const lista: any[] = res.data;
      setPrecoAtual(lista[0]?.preco_brl ?? 1);
      setHistorico([...lista].reverse());
    })
    .catch(err => console.error("Erro ao carregar histórico", err));

}, [isFavorita, id]);

  async function toggleFavorito() {
    if (!usuario) { alert('Faça login para favoritar!'); return; }
    setLoadingFav(true);
    try {
      if (isFavorita) {
        await api.delete(`/carteira/remover?usuarioId=${usuario.id}&moeda=${id}`);
        const novaLista = favoritosLocais.filter(m => m !== id);
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, moedasFavoritas: novaLista }));
        setIsFavorita(false);
        setResultadoSimulacao(null);
      } else {
        await api.post(`/carteira/favoritar?usuarioId=${usuario.id}&moeda=${id}`);
        const novaLista = [...favoritosLocais, id!];
        localStorage.setItem('usuario', JSON.stringify({ ...usuario, moedasFavoritas: novaLista }));
        setIsFavorita(true);
      }
    } catch {
      alert('Erro ao atualizar favoritos.');
    } finally {
      setLoadingFav(false);
    }
  }

  async function simularCompra() {
    if (!usuario) { alert('Faça login para simular!'); return; }
    if (valorSimulacao <= 0) { alert('Digite um valor para simular.'); return; }
    setLoadingSim(true);
    setQuerSalvar(null);
    try {
      const res = await api.get(`/carteira/simulacao`, {
        params: { moeda: id, valorCompra: valorSimulacao, usuarioId: usuario.id, precoAtual }
      });
      setResultadoSimulacao(res.data);
    } catch {
      alert('Erro ao simular compra.');
    } finally {
      setLoadingSim(false);
    }
  }


async function salvarSimulacao() {
  setLoadingHistorico(true);
  try {
    await api.post(`/carteira/historico`, {
      usuarioId: usuario.id,
      moeda: id,
      valorCompra: valorSimulacao,
      precoAtual
    });

    // atualiza a lista local sem precisar buscar de novo
    const nova = {
  nomeMoeda: id,
  valorDigitado: valorSimulacao,        // ← era valorInvestido
  QuantidadeObtida: resultadoSimulacao.quantidadeObtida, // ← Q maiúsculo
  valorAtual: precoAtual,
  dataSimulacao: new Date().toISOString()
};
    setHistoricoSimulacoes(prev => [nova, ...prev]);
    setQuerSalvar(false);
  } catch (e: any) {
    const msg = e?.response?.data?.message || '';
    if (msg.toLowerCase().includes('limite')) {
      alert('Você atingiu o limite de 3 simulações salvas. Aguarde a limpeza automática.');
    } else {
      alert('Erro ao salvar simulação.');
    }
  } finally {
    setLoadingHistorico(false);
  }
}



  return (
    <div className="dm-root">

      {/* Botão Voltar */}
      <button
        onClick={talkClick("voltar", "Voltar para a página anterior. Toque novamente para confirmar.", () => navigate(-1))}
        style={estiloTalkBack("voltar", {})}
        className={`dm-btn-voltar ${isModoIdoso ? 'idoso' : ''}`}
      >
        ⬅️ Voltar
      </button>

      {/* Cabeçalho com favorito */}
      <div className="dm-header">
        <h1 className={`dm-title ${isModoIdoso ? 'idoso' : ''}`}>{id?.toUpperCase()}</h1>

        {usuario && (
          <button
            onClick={toggleFavorito}
            disabled={loadingFav}
            className={`dm-btn-fav ${isFavorita ? 'ativo' : ''} ${isModoIdoso ? 'idoso' : ''}`}
          >
            {loadingFav ? '⏳' : isFavorita ? '💔 Remover dos favoritos' : '⭐ Adicionar aos favoritos'}
          </button>
        )}
      </div>

      {/* Gráfico */}
      <div className="dm-section">
        <h2 className={`dm-section-title ${isModoIdoso ? 'idoso' : ''}`}>Evolução do Valor</h2>
        {historico.length > 0 ? <GraficoMoeda dados={historico} /> : <p>Carregando gráfico...</p>}
      </div>

      {/* Seção Educativa */}
      <div className={`dm-edu-card ${isModoIdoso ? 'idoso' : ''}`}>
        <h2 className={`dm-edu-title ${isModoIdoso ? 'idoso' : ''}`}>
          {infoEducativa?.titulo || "Aprendendo sobre esta moeda"}
        </h2>
        <p className={`dm-edu-desc ${isModoIdoso ? 'idoso' : ''}`}>
          {infoEducativa?.descricao || "Esta é uma moeda digital protegida por criptografia."}
        </p>
        {isModoIdoso && infoEducativa && (
          <div className="dm-edu-dica">
            <p className="dm-edu-dica-text">
              <strong>👵 Explicação Simples:</strong> {infoEducativa.dicaIdoso}
            </p>
          </div>
        )}
      </div>

      {/* Simulador */}
      {isFavorita && usuario ? (
        <div className={`dm-simulator ${isModoIdoso ? 'idoso' : ''}`}>
          <h3 className={`dm-sim-title ${isModoIdoso ? 'idoso' : ''}`}>💰 Simulador de Compra</h3>
          <p className={`dm-sim-price ${isModoIdoso ? 'idoso' : ''}`}>
            Preço atual: R$ {precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>

          <input
            type="number"
            placeholder="R$ Quanto quer investir?"
            aria-label="Valor para investir"
            className={`dm-sim-input ${isModoIdoso ? 'idoso' : ''}`}
            onChange={(e) => setValorSimulacao(Number(e.target.value))}
          />

          <div style={{ marginTop: '16px' }}>
            <button
              onClick={talkClick("simular", "Simular compra desta moeda. Toque novamente para confirmar.", () => simularCompra())}
              disabled={loadingSim}
              style={estiloTalkBack("simular", {})}
              className={`dm-btn-sim ${isModoIdoso ? 'idoso' : ''}`}
            >
              {loadingSim ? '⏳ Calculando...' : '📊 Simular compra'}
            </button>
          </div>

          {resultadoSimulacao && (
  <div className={`dm-sim-result ${isModoIdoso ? 'idoso' : ''}`}>
    <p className={`dm-sim-result-label ${isModoIdoso ? 'idoso' : ''}`}>
      Com R$ {Number(resultadoSimulacao.valorInvestido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} você teria:
    </p>
    <p className={`dm-sim-result-qty ${isModoIdoso ? 'idoso' : ''}`}>
      {Number(resultadoSimulacao.quantidadeObtida).toFixed(6)} {id?.toUpperCase()}
    </p>
    <p className={`dm-sim-result-sub ${isModoIdoso ? 'idoso' : ''}`}>
      Preço usado: R$ {Number(resultadoSimulacao.valorAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
    </p>

    {/* Pergunta se quer salvar */}
    {querSalvar === null && (
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
        <button
          onClick={() => { setQuerSalvar(true); salvarSimulacao(); }}
          disabled={loadingHistorico}
          className={`dm-btn-sim ${isModoIdoso ? 'idoso' : ''}`}
          style={{ background: '#28a745', fontSize: isModoIdoso ? undefined : '14px', padding: '10px 20px' }}
        >
          💾 Salvar simulação
        </button>
        <button
          onClick={() => setQuerSalvar(false)}
          className={`dm-btn-sim ${isModoIdoso ? 'idoso' : ''}`}
          style={{ background: '#444', fontSize: isModoIdoso ? undefined : '14px', padding: '10px 20px' }}
        >
          Não salvar
        </button>
      </div>
    )}

    {querSalvar === true && loadingHistorico && (
      <p style={{ color: '#aaa', marginTop: '12px', fontSize: '14px' }}>⏳ Salvando...</p>
    )}
    {querSalvar !== null && !loadingHistorico && (
      <p style={{ color: '#4caf50', marginTop: '12px', fontSize: '13px' }}>
        {querSalvar ? '✅ Simulação salva!' : ''}
      </p>
    )}
  </div>
)}

{/* Histórico de simulações */}
{historicoSimulacoes.length > 0 && (
  <div style={{ marginTop: '24px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '14px', padding: '20px' }}>
    <p style={{ color: '#FFD700', fontWeight: 'bold', margin: '0 0 14px', fontSize: isModoIdoso ? '22px' : '15px' }}>
      📋 Histórico de simulações
    </p>
    <div style={{ display: 'grid', gap: '10px' }}>
      {historicoSimulacoes.map((h, i) => (
        <div key={i} style={{ background: '#1e1e1e', border: '1px solid #2a2a2a', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          
          <p>{new Date(h.dataSimulacao).toLocaleString('pt-BR')}</p>
    <p>{h.nomeMoeda?.toUpperCase()}</p>

    <p>Investido: R$ {Number(h.valorDigitado ?? h.valorInvestido)
      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>

    <p>{Number(h.QuantidadeObtida ?? h.quantidadeObtida).toFixed(6)} {h.nomeMoeda?.toUpperCase()}</p>

    <p>@ R$ {Number(h.valorAtual ?? h.precoAtualDaMoeda)
      .toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      ))}
    </div>
  </div>
)}
        </div>
      ) : (
        <div className={`dm-sim-preview ${isModoIdoso ? 'idoso' : ''}`}>
          <p className={`dm-sim-preview-text ${isModoIdoso ? 'idoso' : ''}`}>
            ⭐ Adicione esta moeda aos favoritos para usar o simulador de compra
          </p>
        </div>
      )}

      {/* FAB modo leitura */}
      <button
        onClick={toggleModoLeituraHandler}
        aria-pressed={modoLeitura}
        aria-label={modoLeitura ? 'Desativar modo leitura TalkBack' : 'Ativar modo leitura TalkBack'}
        className={`dm-fab ${modoLeitura ? 'ativo' : ''} ${isModoIdoso ? 'idoso' : ''}`}
      >
        🔊
      </button>

      {modoLeitura && (
        <div className={`dm-fab-legend ${isModoIdoso ? 'idoso' : ''}`}>
          1º toque = ouvir<br />2º toque = confirmar
        </div>
      )}

      <style>{`
        .dm-root {
          padding: clamp(12px, 4vw, 20px);
          color: white;
          background-color: #121212;
          min-height: 100vh;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        /* Voltar */
        .dm-btn-voltar {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: clamp(8px, 2.5vw, 10px) clamp(14px, 4vw, 20px);
          margin-bottom: clamp(16px, 4vw, 30px);
          font-size: clamp(14px, 3.5vw, 16px);
          cursor: pointer;
          background-color: #333;
          color: white;
          border: 1px solid #555;
          border-radius: 8px;
        }
        .dm-btn-voltar.idoso { font-size: clamp(18px, 4vw, 24px); padding: 16px 32px; }

        /* Header */
        .dm-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: clamp(16px, 4vw, 20px);
          flex-wrap: wrap;
        }

        .dm-title { font-size: clamp(26px, 6vw, 32px); margin: 0; }
        .dm-title.idoso { font-size: clamp(36px, 8vw, 50px); }

        .dm-btn-fav {
          padding: clamp(10px, 3vw, 12px) clamp(18px, 5vw, 24px);
          font-size: clamp(14px, 3.5vw, 16px);
          font-weight: bold;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          background-color: #f59e0b;
          color: white;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .dm-btn-fav.ativo { background-color: #ff4444; }
        .dm-btn-fav.idoso { font-size: clamp(18px, 4vw, 22px); padding: 18px 32px; }
        .dm-btn-fav:disabled { cursor: not-allowed; opacity: 0.7; }

        /* Section */
        .dm-section { margin-bottom: clamp(24px, 5vw, 40px); }
        .dm-section-title { font-size: clamp(18px, 4.5vw, 22px); margin-bottom: 10px; }
        .dm-section-title.idoso { font-size: clamp(24px, 5vw, 30px); }

        /* Edu card */
        .dm-edu-card {
          background-color: #1e1e1e;
          padding: clamp(20px, 5vw, 25px);
          border-radius: 20px;
          border: 1px solid #444;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .dm-edu-card.idoso {
          padding: clamp(28px, 6vw, 40px);
          border: 5px solid #FFD700;
        }

        .dm-edu-title { color: #FFD700; font-size: clamp(20px, 5vw, 26px); margin-bottom: 12px; }
        .dm-edu-title.idoso { font-size: clamp(28px, 6vw, 40px); }

        .dm-edu-desc { font-size: clamp(15px, 3.5vw, 18px); line-height: 1.6; color: #ccc; margin: 0; }
        .dm-edu-desc.idoso { font-size: clamp(20px, 4.5vw, 28px); }

        .dm-edu-dica {
          margin-top: 20px;
          padding: 16px;
          background-color: #2a2a2a;
          border-radius: 15px;
          border-left: 8px solid #FFD700;
        }
        .dm-edu-dica-text { font-size: clamp(18px, 4vw, 26px); color: #FFD700; margin: 0; }

        /* Simulator */
        .dm-simulator {
          margin-top: clamp(24px, 5vw, 40px);
          background-color: #1e1e1e;
          padding: clamp(20px, 5vw, 28px);
          border-radius: 20px;
          border: 1px solid #2a2a2a;
          text-align: center;
        }
        .dm-simulator.idoso { padding: clamp(28px, 6vw, 40px); }

        .dm-sim-title { font-size: clamp(18px, 4.5vw, 22px); margin-bottom: 6px; }
        .dm-sim-title.idoso { font-size: clamp(24px, 5vw, 30px); }

        .dm-sim-price { color: #aaa; font-size: clamp(13px, 3vw, 14px); margin-bottom: 18px; }
        .dm-sim-price.idoso { font-size: clamp(17px, 3.5vw, 22px); }

        .dm-sim-input {
          padding: clamp(12px, 3.5vw, 15px);
          font-size: clamp(16px, 4vw, 20px);
          border-radius: 10px;
          width: 100%;
          max-width: 400px;
          background-color: #121212;
          color: white;
          border: 1px solid #444;
          box-sizing: border-box;
        }
        .dm-sim-input.idoso { font-size: clamp(18px, 4vw, 22px); }

        .dm-btn-sim {
          padding: clamp(10px, 3vw, 12px) clamp(20px, 5vw, 28px);
          font-size: clamp(14px, 3.5vw, 16px);
          background-color: #007bff;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: bold;
        }
        .dm-btn-sim.idoso { font-size: clamp(18px, 4vw, 22px); padding: 18px 36px; }
        .dm-btn-sim:disabled { opacity: 0.7; cursor: not-allowed; }

        .dm-sim-result {
          margin-top: 20px;
          background-color: #0f2e1a;
          border: 1px solid #28a745;
          border-radius: 14px;
          padding: clamp(16px, 4vw, 24px);
        }

        .dm-sim-result-label { font-size: clamp(15px, 3.5vw, 18px); color: #4caf50; font-weight: bold; margin: 0 0 6px; }
        .dm-sim-result-label.idoso { font-size: clamp(18px, 4vw, 26px); }

        .dm-sim-result-qty { font-size: clamp(22px, 5.5vw, 28px); color: white; font-weight: 900; margin: 0; }
        .dm-sim-result-qty.idoso { font-size: clamp(28px, 7vw, 40px); }

        .dm-sim-result-sub { font-size: clamp(12px, 3vw, 14px); color: #aaa; margin-top: 6px; }
        .dm-sim-result-sub.idoso { font-size: clamp(15px, 3.5vw, 20px); }

        .dm-sim-preview {
          margin-top: clamp(24px, 5vw, 40px);
          background-color: #1a1a1a;
          padding: clamp(20px, 5vw, 28px);
          border-radius: 20px;
          border: 1px dashed #444;
          text-align: center;
        }
        .dm-sim-preview-text { color: #aaa; font-size: clamp(14px, 3.5vw, 16px); margin: 0; }
        .dm-sim-preview-text.idoso { font-size: clamp(18px, 4vw, 22px); }

        /* FAB */
        .dm-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 62px;
          height: 62px;
          border-radius: 50%;
          background-color: #1e3a5f;
          color: white;
          border: 2px solid #3b82f6;
          cursor: pointer;
          font-size: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          transition: all 0.2s;
          z-index: 1000;
        }
        .dm-fab.ativo {
          background-color: #4caf50;
          border-color: #4caf50;
          box-shadow: 0 0 0 6px rgba(76,175,80,0.25), 0 4px 20px rgba(0,0,0,0.5);
          animation: dm-fab-pulse 1.6s ease-in-out infinite;
        }
        .dm-fab.idoso { width: 80px; height: 80px; font-size: 30px; bottom: 32px; right: 32px; }
        .dm-fab:hover { transform: scale(1.1); }

        .dm-fab-legend {
          position: fixed;
          bottom: 96px;
          right: 12px;
          background-color: #1e1e1e;
          border: 1px solid #4caf50;
          border-radius: 10px;
          padding: 8px 12px;
          font-size: 12px;
          color: #4caf50;
          z-index: 999;
          max-width: 180px;
          text-align: center;
          line-height: 1.5;
          pointer-events: none;
        }
        .dm-fab-legend.idoso { bottom: 122px; right: 16px; }

        @keyframes dm-fab-pulse {
          0%, 100% { box-shadow: 0 0 0 6px rgba(76,175,80,0.25), 0 4px 20px rgba(0,0,0,0.5); }
          50%       { box-shadow: 0 0 0 14px rgba(76,175,80,0.06), 0 4px 20px rgba(0,0,0,0.5); }
        }

        *:focus-visible { outline: 3px solid #007bff; outline-offset: 3px; }

        @media (max-width: 480px) {
          .dm-header { flex-direction: column; align-items: flex-start; }
          .dm-btn-fav { width: 100%; text-align: center; }
          .dm-sim-input { max-width: 100%; }
        }
      `}</style>
    </div>
  );
}