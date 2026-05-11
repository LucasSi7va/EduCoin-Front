import { Route, Routes } from "react-router-dom";
import { DetalhesMoeda } from "./page/DetalhesMoeda";
import { Perfil } from "./page/Perfil";
import ListaMoedas from "./page/ListaMoedas";
import { PerfilUsuario } from './page/PerfilUsuario';

import { Login } from "./page/Login";
import { Cadastro } from "./page/Cadastro";

function App() {
  return (
    <Routes>
  
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/perfil" element={<Perfil />} /> 
      <Route path="/PerfilUsuario" element={<PerfilUsuario />} />

      <Route path="/" element={<ListaMoedas />} />
      <Route path="/moeda/:id" element={<DetalhesMoeda />} />
    </Routes>
  );
}

export default App;