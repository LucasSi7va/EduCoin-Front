import { useEffect } from "react";
import { conectarAlertas } from "../services/sse";

export function useAlertas() {

    useEffect(() => {

        const conexao = conectarAlertas((alerta) => {

            console.log("Novo alerta:", alerta);

            alert(
                `${alerta.moedaId} variou ${alerta.variacaoPercent}%`
            );
        });

        return () => {
            conexao.close();
        };

    }, []);
}