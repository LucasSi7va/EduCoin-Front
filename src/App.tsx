import { Route, Routes } from "react-router-dom";
import { DetalhesMoeda } from "./page/DetalhesMoeda";
import ListaMoedas from "./page/ListaMoedas";


function App() {
  return (
    <Routes>
      <Route path="/" element={<ListaMoedas />} />
      <Route path="/moeda/:id" element={<DetalhesMoeda />} />
    </Routes>
  );
}

export default App;