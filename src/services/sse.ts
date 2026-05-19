
export function conectarAlertas(onMensagem: (dados: any) => void) {

    const token = localStorage.getItem("token");

    const eventSource = new EventSource(
        `http://localhost:8080/alertas/stream?token=${token}`
    );

    eventSource.addEventListener("conectado", (event) => {
        console.log("✅ SSE conectado:", event.data);
    });

    eventSource.addEventListener("alerta", (event) => {
        const dados = JSON.parse(event.data);
        onMensagem(dados);
    });

    eventSource.onerror = (err) => {
        console.warn("⚠️ SSE erro, reconectando...", err);
    };

    return eventSource;
}