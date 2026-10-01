// Arquivo de configuração e processamento do Partido ____

const candidatos = [];

async function carregarCandidatos() {
    const resposta = await fetch("candidatos.json");
    const dados = await resposta.json();
    const filiados = dados.PMauricio;

    filiados.forEach(function(candidato) {
        candidatos.push({
            nome: candidato.nome,
            foto: candidato.foto,
            cargo: null,
            numero: null
        });
    });
}

function validarNumeroCandidato(numero, cargo) {
    const numeroStr = String(numero);
    const prefixo = "94";

    if (!numeroStr.startsWith(prefixo)) {
        return false;
    }

    const digitosExtras = numeroStr.length - prefixo.length;

    if (cargo === "Presidente" || cargo === "Governador(a)") {
        return digitosExtras === 0;
    } else if (cargo === "Senador(a)") {
        return digitosExtras === 1;
    } else if (cargo === "Deputado(a) Federal") {
        return digitosExtras === 2;
    } else if (cargo === "Deputado(a) Estadual") {
        return digitosExtras === 3;
    } else {
        return false;
    }
}
