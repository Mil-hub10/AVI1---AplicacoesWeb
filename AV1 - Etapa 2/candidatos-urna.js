// Carregamento e unificação dos candidatos dos partidos do grupo
// Cada arquivo é o JSON gerado na Etapa 1 por um integrante do grupo

const arquivosPartidos = ["PDisney.json", "PMarvel.json", "PMauricio.json"];

// Array unificado: todos os candidatos de todos os partidos do grupo, juntos
const todosCandidatos = [];

async function carregarTodosCandidatos() {
    for (const arquivo of arquivosPartidos) {
        try {
            const response = await fetch(arquivo);
            const candidatosDoPartido = await response.json();
            const nomePartido = arquivo.replace(".json", "");

            // Marca cada candidato com o nome do partido de origem
            // (os JSONs da Etapa 1 não trazem esse campo, então adicionamos aqui)
            candidatosDoPartido.forEach(candidato => {
                candidato.partido = nomePartido;
                todosCandidatos.push(candidato);
            });
        } catch (error) {
            console.error(`Erro ao carregar o arquivo ${arquivo}:`, error);
        }
    }
}
