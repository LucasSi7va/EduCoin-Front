import { useNavigate, useParams } from "react-router-dom";
import { GraficoMoeda } from "../components/GraficoMoeda";
import { useAcessibilidade } from "../contexts/AcessibilidadeContext";
import { useEffect, useState } from "react";
import api from "../services/api";

export function DetalhesMoeda() {
  const { id } = useParams();
  const { isModoIdoso } = useAcessibilidade();
  const [historico, setHistorico] = useState<any[]>([]);
  const [valorSimulacao, setValorSimulacao] = useState<number>(0);
  const [precoAtual, setPrecoAtual] = useState<number>(1);
  const navigate = useNavigate();

  const conteudosEducativos = [
    { id: "bitcoin", titulo: "O que é Bitcoin?", descricao: "É um tipo de dinheiro totalmente digital, que não depende de bancos ou governos.", dicaIdoso: "Pense no Bitcoin como um 'ouro digital' que você guarda no seu celular." },
    { id: "volatilidade", titulo: "Por que o preço muda?", descricao: "O preço muda conforme muitas pessoas querem comprar ou vender ao mesmo tempo.", dicaIdoso: "Não se preocupe com mudanças rápidas; o mercado de moedas é como uma maré." }
  ];

  const infoEducativa = conteudosEducativos.find(c => c.id === id);

  useEffect(() => {
    api.get(`/coin/${id}/historico/lista?dias=7`)
      .then(res => {
         console.log("Dados brutos do backend:", res.data);
  console.log("Primeiro item:", res.data[0]);
        const lista: any[] = res.data;

       
        setPrecoAtual(lista[0]?.preco_brl ?? 1);


        setHistorico([...lista].reverse());
      })
      .catch(err => console.error("Erro ao carregar histórico", err));
  }, [id]);

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#121212', minHeight: '100vh' }}>
      
      <button 
        onClick={() => navigate('/')} 
        style={{
          padding: isModoIdoso ? '20px' : '10px 20px', 
          marginBottom: '30px', 
          fontSize: isModoIdoso ? '24px' : '16px',
          cursor: 'pointer',
          backgroundColor: '#333',
          color: 'white',
          border: '1px solid #555',
          borderRadius: '8px'
        }}
      >
        ⬅️ Voltar para a lista de moedas
      </button>

      <h1 style={{ fontSize: isModoIdoso ? '50px' : '32px', marginBottom: '20px' }}>
        {id?.toUpperCase()}
      </h1>

    
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: isModoIdoso ? '30px' : '22px', marginBottom: '10px' }}>Evolução do Valor</h2>
        {historico.length > 0 ? (
      
          <GraficoMoeda dados={historico} />
        ) : (
          <p>Carregando gráfico...</p>
        )}
      </div>

      {/* Seção Educativa */}
      <div style={{ 
        backgroundColor: '#1e1e1e', 
        padding: isModoIdoso ? '40px' : '25px', 
        borderRadius: '20px', 
        border: isModoIdoso ? '5px solid #FFD700' : '1px solid #444',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ color: '#FFD700', fontSize: isModoIdoso ? '40px' : '26px', marginBottom: '15px' }}>
          {infoEducativa?.titulo || "Aprendendo sobre esta moeda"}
        </h2>
        <p style={{ fontSize: isModoIdoso ? '28px' : '18px', lineHeight: '1.6', color: '#ccc' }}>
          {infoEducativa?.descricao || "Esta é uma moeda digital protegida por criptografia."}
        </p>
        
        {isModoIdoso && (
          <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '15px', borderLeft: '8px solid #FFD700' }}>
            <p style={{ fontSize: '26px', color: '#FFD700', margin: 0 }}>
              <strong>👵 Explicação Simples:</strong> {infoEducativa?.dicaIdoso}
            </p>
          </div>
        )}
      </div>

      {/* Calculadora */}
      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <h3 style={{ fontSize: isModoIdoso ? '30px' : '20px' }}>Simulador de Compra</h3>
        <p style={{ color: '#aaa', fontSize: isModoIdoso ? '22px' : '14px' }}>
          Preço atual: R$ {precoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
        <input 
          type="number" 
          placeholder="R$ Quanto quer investir?" 
          style={{ padding: '15px', fontSize: '20px', borderRadius: '10px', width: '80%', maxWidth: '400px' }}
          onChange={(e) => setValorSimulacao(Number(e.target.value))}
        />
        <div style={{ marginTop: '20px', fontSize: isModoIdoso ? '32px' : '22px', color: '#4caf50', fontWeight: 'bold' }}>
          Você teria: {valorSimulacao > 0
            ? (valorSimulacao / precoAtual).toFixed(6)
            : "0.000000"} {id?.toUpperCase()}
        </div>
      </div>

    </div>
  );
}