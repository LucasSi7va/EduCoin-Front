import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { useAcessibilidade } from '../contexts/AcessibilidadeContext';

interface Props {
  dados: { data: string; preco_brl: number }[];
}

export function GraficoMoeda({ dados }: Props) {
  const { isModoIdoso } = useAcessibilidade();

  const primeiroPreco = dados[0]?.preco_brl;
  const ultimoPreco = dados[dados.length - 1]?.preco_brl;
  const corLinha = ultimoPreco >= primeiroPreco ? '#4caf50' : '#ff5252';

  return (
    <div style={{ 
      width: '100%', 
      height: isModoIdoso ? 300 : 200, 
      backgroundColor: '#1a1a1a', 
      padding: '10px', 
      borderRadius: '10px' 
    }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados}>
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }}
            itemStyle={{ color: corLinha }}
            // Mostra a data no tooltip ao invés de nada
            labelFormatter={(_, payload) => payload?.[0]?.payload?.data ?? ""}
            formatter={(val) =>
              [`R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Preço']
            }
          />
          {/* dataKey corrigido para "preco_brl" */}
          <Line 
            type="monotone" 
            dataKey="preco_brl"
            stroke={corLinha} 
            strokeWidth={isModoIdoso ? 5 : 3}
            dot={false} 
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}