// Lógica de fluxo de votação, captura de teclas e manipulação de eventos da Urna Eletrônica

// === BÔNUS 2: Efeito sonoro da urna (via Web Audio API, sem depender de arquivo .mp3) ===
// Um "contexto de áudio" é o objeto que o navegador usa pra gerar som por código.
// Criamos ele só uma vez e reaproveitamos em cada bipe.
const contextoAudio = new (window.AudioContext || window.webkitAudioContext)();

function tocarBipConfirmacao() {
    // Um oscilador gera uma onda sonora pura (tipo um apito eletrônico)
    const oscilador = contextoAudio.createOscillator();
    const volume = contextoAudio.createGain();

    oscilador.type = "square";            // timbre mais "eletrônico", parecido com o bipe real da urna
    oscilador.frequency.value = 1200;      // altura do som (Hz) — agudo, estilo "piiii"

    oscilador.connect(volume);
    volume.connect(contextoAudio.destination);

    volume.gain.setValueAtTime(0.2, contextoAudio.currentTime); // volume baixo, pra não assustar
    oscilador.start();

    // Desliga o som sozinho depois de 150 milissegundos (um bipe curto)
    oscilador.stop(contextoAudio.currentTime + 0.15);
}

// Ordem oficial dos cargos para a eleição de 2026:
const cargos2026 = [
    { nome: "Deputado Federal", digitos: 4 },
    { nome: "Deputado Estadual", digitos: 5 },
    { nome: "Senador (1ª Vaga)", digitos: 3 },
    { nome: "Senador (2ª Vaga)", digitos: 3 },
    { nome: "Governador", digitos: 2 },
    { nome: "Presidente", digitos: 2 }
];

// Os nomes de cargo usados no fluxo da urna (acima) não são idênticos aos nomes
// gravados nos JSONs dos partidos (gerados na Etapa 1). Este mapa traduz um para o outro.
const mapaCargoUrnaParaJson = {
    "Deputado Federal": "Deputado(a) Federal",
    "Deputado Estadual": "Deputado(a) Estadual",
    "Senador (1ª Vaga)": "Senador(a)",
    "Senador (2ª Vaga)": "Senador(a)",
    "Governador": "Governador(a)",
    "Presidente": "Presidente"
};

// Estado do fluxo da urna
let etapaAtual = 0;
let numeroDigitado = "";
let votoEmBranco = false;
let votacaoBloqueada = false;

// Guarda o candidato encontrado na última verificação, para ser usado no momento da confirmação
let candidatoEncontradoAtual = null;

// Memória da Urna (Acumulador com os votos de todos os eleitores)
const memoriaVotosEleitores = [];
let votoEleitorAtual = {};

window.onload = async () => {
    // Carrega e unifica os candidatos de todos os partidos do grupo antes de liberar a votação
    await carregarTodosCandidatos();
    iniciarNovoEleitor();
};

function iniciarNovoEleitor() {
    etapaAtual = 0;
    votoEleitorAtual = {};
    votacaoBloqueada = false;
    iniciarEtapa();
}

function iniciarEtapa() {
    numeroDigitado = "";
    votoEmBranco = false;
    candidatoEncontradoAtual = null;

    const cargo = cargos2026[etapaAtual];
    document.getElementById('lblCargo').innerText = cargo.nome;
    document.getElementById('dadosCandidato').innerHTML = "";
    document.getElementById('imgCandidato').style.display = "none";
    document.getElementById('imgCandidato').src = "";

    renderizarQuadradosDigitos(cargo.digitos);
}

function renderizarQuadradosDigitos(qtd) {
    const container = document.getElementById('containerDigitos');
    container.style.display = "flex";
    container.innerHTML = "";

    for (let i = 0; i < qtd; i++) {
        const div = document.createElement('div');
        div.className = i === 0 ? 'digito pisca' : 'digito';
        div.id = `digito-${i}`;
        container.appendChild(div);
    }
}

function digitar(n) {
    if (votacaoBloqueada || votoEmBranco) return;

    const cargo = cargos2026[etapaAtual];
    if (numeroDigitado.length < cargo.digitos) {
        numeroDigitado += n;

        // Atualiza o quadrado correspondente
        const digitoElem = document.getElementById(`digito-${numeroDigitado.length - 1}`);
        if (digitoElem) {
            digitoElem.innerText = n;
            digitoElem.classList.remove('pisca');
        }

        // Coloca o cursor piscante no próximo quadrado
        if (numeroDigitado.length < cargo.digitos) {
            const proximoElem = document.getElementById(`digito-${numeroDigitado.length}`);
            if (proximoElem) proximoElem.classList.add('pisca');
        }

        // Se completou todos os dígitos, valida o número do candidato
        if (numeroDigitado.length === cargo.digitos) {
            verificarCandidatoDigitado(numeroDigitado, cargo.nome);
        }
    }
}

function verificarCandidatoDigitado(numero, cargoNome) {
    // Traduz o nome do cargo da urna para o nome usado nos JSONs dos partidos
    const cargoEsperadoNoJson = mapaCargoUrnaParaJson[cargoNome];

    // Busca, entre todos os candidatos de todos os partidos do grupo, alguém
    // com esse número E candidato a esse cargo
    const candidato = todosCandidatos.find(
        c => c.numero === numero && c.cargo === cargoEsperadoNoJson
    );

    candidatoEncontradoAtual = candidato || null;

    if (candidato) {
        document.getElementById('dadosCandidato').innerHTML = `
            <strong>Nome:</strong> ${candidato.nome}<br>
            <strong>Partido:</strong> ${candidato.partido}
        `;
        document.getElementById('imgCandidato').src = candidato.foto;
        document.getElementById('imgCandidato').style.display = "block";
    } else {
        // Caso não encontre, indica Voto Nulo na tela
        document.getElementById('dadosCandidato').innerHTML = `
            <div style="font-size: 1.4rem; font-weight: bold; margin-top: 10px;">VOTO NULO</div>
            <span style="font-size: 0.8rem;">Número não correspondente a nenhum candidato</span>
        `;
    }
}

function votarBranco() {
    if (votacaoBloqueada) return;

    if (numeroDigitado === "") {
        votoEmBranco = true;
        document.getElementById('containerDigitos').style.display = "none";
        document.getElementById('dadosCandidato').innerHTML = `
            <div style="font-size: 1.5rem; font-weight: bold; text-align: center; margin-top: 15px;">VOTO EM BRANCO</div>
        `;
    } else {
        alert("Para votar em BRANCO, o campo de número deve estar vazio. Aperte CORRIGE primeiro.");
    }
}

function corrigir() {
    if (votacaoBloqueada) return;
    iniciarEtapa();
}

function confirmar() {
    if (votacaoBloqueada) return;

    const cargo = cargos2026[etapaAtual];
    let votoValidoParaRegistrar = false;

    // Valida se a etapa está apta a ser confirmada
    if (votoEmBranco) {
        votoValidoParaRegistrar = true;
        votoEleitorAtual[cargo.nome] = { numero: "BRANCO", tipo: "BRANCO" };
    } else if (numeroDigitado.length === cargo.digitos) {
        votoValidoParaRegistrar = true;

        if (candidatoEncontradoAtual) {
            // Voto válido: registra nome e partido do candidato encontrado
            votoEleitorAtual[cargo.nome] = {
                numero: numeroDigitado,
                tipo: "REGULAR",
                nome: candidatoEncontradoAtual.nome,
                partido: candidatoEncontradoAtual.partido
            };
        } else {
            // Número não correspondeu a nenhum candidato cadastrado: voto nulo
            votoEleitorAtual[cargo.nome] = {
                numero: numeroDigitado,
                tipo: "NULO"
            };
        }
    } else {
        alert(`Por favor, insira os ${cargo.digitos} dígitos do cargo de ${cargo.nome} ou vote em BRANCO.`);
        return;
    }

    if (votoValidoParaRegistrar) {
        tocarBipConfirmacao();

        etapaAtual++;

        // Se ainda existirem cargos no fluxo da eleição de 2026
        if (etapaAtual < cargos2026.length) {
            iniciarEtapa();
        } else {
            // Chegou ao fim do fluxo (Presidente confirmado)
            finalizarVotoEleitor();
        }
    }
}

function finalizarVotoEleitor() {
    votacaoBloqueada = true;

    // Armazena a cédula completa do eleitor na memória da Urna
    memoriaVotosEleitores.push(votoEleitorAtual);

    // Exibe a tela de FIM da Urna Eletrônica
    const tela = document.getElementById('tela');
    tela.innerHTML = `
        <div class="mensagem-fim">F I M</div>
    `;

    // Aguarda 3 segundos e reinicia a tela para o próximo eleitor
    setTimeout(() => {
        restaurarEstruturaTela();
        iniciarNovoEleitor();
    }, 3000);
}

function restaurarEstruturaTela() {
    const tela = document.getElementById('tela');
    tela.innerHTML = `
        <div id="conteudo-voto" style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
            <div class="tela-topo">
                <div>
                    <span>SEU VOTO PARA</span>
                    <div class="cargo-titulo" id="lblCargo">---</div>
                </div>
                <img id="imgCandidato" class="foto-candidato" src="" alt="" style="display: none;">
            </div>

            <div class="quadrados-numero" id="containerDigitos"></div>

            <div class="dados-candidato" id="dadosCandidato"></div>

            <div class="tela-instrucoes" id="instrucoes">
                Aperte a tecla:<br>
                <strong>VERDE</strong> para CONFIRMAR<br>
                <strong>LARANJA</strong> para CORRIGIR
            </div>
        </div>
    `;
}

function encerrarVotacaoEEnviarTSE() {
    if (memoriaVotosEleitores.length === 0) {
        alert("Nenhum voto foi registrado nesta urna ainda!");
        return;
    }

    if (confirm(`Deseja encerrar a eleição? Total de eleitores que votaram: ${memoriaVotosEleitores.length}`)) {
        votacaoBloqueada = true;

        // Serializa o registro detalhado voto a voto de todos os eleitores
        const payloadFinal = JSON.stringify(memoriaVotosEleitores, null, 2);
        console.log("Votos enviados ao TSE:", payloadFinal);

        // Gera e baixa automaticamente o arquivo votos.json
        const blob = new Blob([payloadFinal], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "votos.json";
        link.click();
        URL.revokeObjectURL(url);

        document.getElementById('tela').innerHTML = `
            <div class="mensagem-centro">
                VOTAÇÃO ENCERRADA<br>
                <span style="font-size: 1rem; margin-top: 10px; font-weight: normal;">Arquivo votos.json enviado ao TSE com sucesso.</span>
            </div>
        `;
    }
}
