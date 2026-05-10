export interface Moeda {
  id: string;
  nome: string;
  simbolo: string; 
  imagem: string;
  precoAtual: number;
  variacao24h: number;
  rank: number;
  marketCap: number;
}