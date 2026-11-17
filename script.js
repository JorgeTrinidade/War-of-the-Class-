const menuLateralClasses = document.getElementById("menuLateralClasses");
const menuLateralClicker = document.getElementById("menuLateralClicker");
const menuBotaoDireito = document.getElementById("Direito");
const menuBotaoEsquerdo = document.getElementById("Esquerdo");
const combateUI = document.getElementById("combateUI");
const dinheiroUI = document.getElementById("dinheiro");
let ondaAtual = 1;
let faseAtual = 1;
let inimigosRestantes = 0;
let spawnAgendado = false;
const FASES_POR_ONDA = 15;
mundoAtual = 1;
const vidaDaBase = {};
let tempoPIE = document.getElementById("PainelInfEst");
tempoPIE._Atualizar = Date.now();
tempoPIE._Total = Date.now();
totalClicksEl = document.getElementById('totalclicks');
totalClicksEl._click = 0;
tempoJogadorEl = document.getElementById('tempoJogador');
totalRecAcumuladosEl = document.getElementById('totalRecAcumulados');
totalRecAcumuladosEl._Total = 0;
inimigMortEl = document.getElementById('inimigMort');
inimigMortEl._Total = 0;
upgradeFeitosEl = document.getElementById('upgradeFeitos');
upgradeFeitosEl._Total = 0;
totalGastEl = document.getElementById('totalGast');
totalGastEl._Total = 0;
taxaPassiva = document.getElementById('taxaPassiva');
taxaPassiva._Tempo = Date.now();
taxaPassiva._Dinheiro = 0;

function atualizarPIE() {
    totalClicksEl.innerHTML = "total clicks: " + totalClicksEl._click;
    tempoJogadorEl.innerHTML = "tempo de jogo: " + (Math.round((Date.now() - tempoPIE._Total) / 10) / 100);
    inimigMortEl.innerHTML = "inimigos mortos: " + inimigMortEl._Total;
    totalGastEl.innerHTML = "total de dinheiro gastos: " + totalGastEl._Total;
    upgradeFeitosEl.innerHTML = "personagens melhorados: " + upgradeFeitosEl._Total
    totalRecAcumuladosEl.innerHTML = "total de recursos acumulados: " + totalRecAcumuladosEl._Total;
}

function gameOver() {
    const telagameOver = document.getElementById("gameOver");
    telagameOver.style.display = "block";
    dinheiro = 0;
    dinheiroAtualizar(0);

    setTimeout(() => {
        telagameOver.style.display = "none";
        switch (mundoAtual) {
            case 1:
                objetos.Personagens["Inimigos"].forEach(i => i.remove());
                objetos.Personagens["Inimigos"] = [];
                objetos.Personagens["Aliados"].forEach(i => i.remove());
                objetos.Personagens["Aliados"] = [];
                objetos.Ataques.forEach(a => a.remove());
                objetos.Ataques = [];
                faseAtual = 1;
                inimigosRestantes = 0;
                spawnAgendado = false;
                vidaDaBase._vidaAtual = vidaDaBase._vidaMax;
                criarPersonagem("Aliados", "Lanceiro");
                iniciarFase();
                break;
            case 2:
                break;
        }
    }, 1000);
}

vidaDaBase._vida = document.getElementById("vidaDaBaseBarra");
vidaDaBase._vidaMax = 1;
vidaDaBase._vidaAtual = 1;
vidaDaBase._DanoRecebido = function (dano) {
    const pctAntes = 100 - (this._vidaAtual / this._vidaMax * 100);
    this._vidaAtual = Math.max(0, this._vidaAtual + dano);
    const pctDepois = 100 - (this._vidaAtual / this._vidaMax * 100);

    this._vida.style.backgroundPositionX = pctAntes + "%";

    const animacao = this._vida.animate(
        [
            { backgroundPositionX: pctAntes + "%" },
            { backgroundPositionX: pctDepois + "%" }
        ],
        { duration: 200, fill: "forwards", easing: "ease-out" }
    );

    animacao.onfinish = () => {
        if (this._vidaAtual <= 0) {
            this._vidaAtual = 1;
            animacao.cancel();
            this._vida.style.backgroundPositionX = "0%";
            gameOver();
        }
    };
};

regrasMovimentacao = {
    "Aliados": {},
    "Inimigos": {},
    "ataque": {},
    adicionar: function (lado, nome, funcao) {
        this[lado][nome] = funcao;
    },
    remover: function (lado, nome) {
        delete this[lado][nome];
    },
    verificar(personagem) {
        for (const nome in this[personagem._tipo]) {
            if (!this[personagem._tipo][nome](personagem)) return false;
        }
        return true;
    }
}

// ============================================================
// ALTERAÇÃO: multiplicadorDano já não tem UI nem animação.
// Mantém-se apenas como variável interna (não usada no ecrã).
// ============================================================
let multiplicadorDano = 10;

function dinheiroAtualizar(dinheiroGanho = 0) {
    if (dinheiroGanho < 0) { totalGastEl._Total -= dinheiroGanho }
    if (dinheiroGanho > 0) { totalRecAcumuladosEl._Total += dinheiroGanho }

    dinheiro += dinheiroGanho;
    dinheiroUI.innerHTML = "Dinheiro: " + dinheiro;
}

// ============================================================
// ALTERAÇÃO: preços balanceados (mais acessíveis).
// ============================================================
const classesReferencias = {
    "Aliados": {
        "Lanceiro": {
            nivel: 0, valor: 10, valorinicial: 10, comprado: false, cor: "#0c00f5",
            dano: 8, danoInicial: 8, velAtaque: 1, distAtaque: 2,
            vidaMax: 100, vidaAtual: 100, vidaInicial: 100,
            velMovimento: 1.2, velMovimentoAtaque: 1.5,
            perfil: "Dano alto por golpe"
        },
        "Arqueiro": {
            nivel: 0, valor: 50, valorinicial: 50, comprado: false, cor: "#00f58f",
            dano: 22, danoInicial: 22, velAtaque: 2, distAtaque: 6,
            vidaMax: 150, vidaAtual: 15, vidaInicial: 15,
            velMovimento: 1.0, velMovimentoAtaque: 1.3,
            perfil: "Rápido, seguro à distância"
        },
        "Mago": {
            nivel: 0, valor: 250, valorinicial: 250, comprado: false, cor: "#f5f500",
            dano: 100, danoInicial: 100, velAtaque: 0.5, distAtaque: 4,
            vidaMax: 600, vidaAtual: 600, vidaInicial: 600,
            velMovimento: 0.8, velMovimentoAtaque: 1.1,
            perfil: "Lento, alcance médio, porém forte"
        },
        "Arrombador": {
            nivel: 0, valor: 1000, valorinicial: 1000, comprado: false, cor: "#f50000",
            dano: 700, danoInicial: 700, velAtaque: 8, distAtaque: 3,
            vidaMax: 4000, vidaAtual: 4000, vidaInicial: 4000,
            velMovimento: 1.5, velMovimentoAtaque: 1.8,
            perfil: "Metralhadora viva"
        },
        "Bombardeiro": {
            nivel: 0, valor: 5000, valorinicial: 5000, comprado: false, cor: "#f500f5",
            dano: 1200, danoInicial: 1200, velAtaque: 0.33, distAtaque: 5,
            vidaMax: 500000, vidaAtual: 500000, vidaInicial: 500000,
            velMovimento: 0.6, velMovimentoAtaque: 0.9,
            perfil: "Artilharia, DPS alto, muito lento"
        },
        "Guerreiro": {
            nivel: 0, valor: 25000, valorinicial: 25000, comprado: false, cor: "#00f5f5",
            dano: 5000, danoInicial: 5000, velAtaque: 1.2, distAtaque: 1,
            vidaMax: 5000000, vidaAtual: 5000000, vidaInicial: 5000000,
            velMovimento: 1.4, velMovimentoAtaque: 1.7,
            perfil: "Bruiser melee, DPS alto e sustentado"
        }
    },
    "Inimigos": {
        "Lanceiro": {
            nivel: 0, valor: 10, comprado: false, cor: "#0c00f5",
            dano: 8, danoInicial: 8, velAtaque: 1, distAtaque: 2,
            vidaMax: 10, vidaAtual: 10,
            velMovimento: 1.2, velMovimentoAtaque: 1.5,
            perfil: "Dano alto por golpe"
        },
        "Arqueiro": {
            nivel: 0, valor: 100, comprado: false, cor: "#00f58f",
            dano: 22, danoInicial: 22, velAtaque: 2, distAtaque: 6,
            vidaMax: 15, vidaAtual: 15,
            velMovimento: 1.0, velMovimentoAtaque: 1.3,
            perfil: "Rápido, seguro à distância"
        },
        "Mago": {
            nivel: 0, valor: 500, comprado: false, cor: "#f5f500",
            dano: 100, danoInicial: 100, velAtaque: 0.5, distAtaque: 4,
            vidaMax: 6, vidaAtual: 6,
            velMovimento: 0.8, velMovimentoAtaque: 1.1,
            perfil: "Lento, alcance médio, porém forte"
        },
        "Arrombador": {
            nivel: 0, valor: 4000, comprado: false, cor: "#f50000",
            dano: 700, danoInicial: 700, velAtaque: 8, distAtaque: 3,
            vidaMax: 4, vidaAtual: 4,
            velMovimento: 1.5, velMovimentoAtaque: 1.8,
            perfil: "Metralhadora viva"
        },
        "Bombardeiro": {
            nivel: 0, valor: 20000, comprado: false, cor: "#f500f5",
            dano: 1200, danoInicial: 1200, velAtaque: 0.33, distAtaque: 5,
            vidaMax: 5, vidaAtual: 5,
            velMovimento: 0.6, velMovimentoAtaque: 0.9,
            perfil: "Artilharia, DPS alto, muito lento"
        },
        "Guerreiro": {
            nivel: 0, valor: 5000000, comprado: false, cor: "#00f5f5",
            dano: 5000, danoInicial: 5000, velAtaque: 1.2, distAtaque: 1,
            vidaMax: 20, vidaAtual: 20,
            velMovimento: 1.4, velMovimentoAtaque: 1.7,
            perfil: "Bruiser melee, DPS alto e sustentado"
        }
    }
};

let objetos = {
    Personagens: { "Aliados": [], "Inimigos": [] },
    Ataques: []
}
let dinheiro = 0;
let tempoCalculado = 0;


function escolherMenuLateral(eML) {
    const mLT = document.getElementById("menuLateralTitulo");
    if (eML == "Esquerdo") {
        mLT.textContent = "Classe";
        menuLateralClasses.style.display = "block";
        menuLateralClicker.style.display = "none";
        menuBotaoEsquerdo.classList.add("ativo");
        menuBotaoDireito.classList.remove("ativo");
    } else if (eML == "Direito") {
        mLT.textContent = "Clicker";
        menuLateralClasses.style.display = "none";
        menuLateralClicker.style.display = "block";
        menuBotaoEsquerdo.classList.remove("ativo");
        menuBotaoDireito.classList.add("ativo");
    }
}

document.addEventListener("mousemove", (evento) => {
    eventoclick = evento
})

function cliker() {
    tempoCalculado = Date.now() - cliker._tempoClick;
    cliker._tempoClick = Date.now();

    if (tempoCalculado > 150) {
        taxaPassiva._Dinheiro += 1;
        const dinheiroPorClique = 1 + upgradesCliker["Multiplicador de cliker"].nivel;
        dinheiroAtualizar(dinheiroPorClique);

        totalClicksEl._click += 1;
    }
}
cliker._tempoClick = Date.now();

function criarLateral() {
    for (const classes in classesReferencias["Aliados"]) {

        menuBotaoEsquerdo.classList.add("ativo");

        const menuSecundarioClasses = document.createElement('div');
        menuSecundarioClasses.className = 'menuSecundarioClasses';

        const imagemMenu = document.createElement('img');
        imagemMenu.className = 'imagemMenu';
        imagemMenu.src = 'imagemref.jpg';

        const nome = document.createElement('p');
        nome.textContent = "Nome: " + classes;

        const descricao = document.createElement('p');
        descricao.textContent = "descricao: " + classesReferencias["Aliados"][classes].perfil;

        const dps = document.createElement('p');
        dps.textContent = "dps: " + (classesReferencias["Aliados"][classes].dano * classesReferencias["Aliados"][classes].velAtaque).toFixed(2);

        const botaoMenuLateral = document.createElement('div');
        botaoMenuLateral.className = 'botaoMenuLateral';
        atualizarbutao(botaoMenuLateral, classes);


        botaoMenuLateral.addEventListener('click', function () {
            if (dinheiro < classesReferencias["Aliados"][classes].valor) return;

            dinheiroAtualizar(-classesReferencias["Aliados"][classes].valor);
            if (!classesReferencias["Aliados"][classes].comprado) {
                // PRIMEIRA COMPRA
                classesReferencias["Aliados"][classes].comprado = true;
                classesReferencias["Aliados"][classes].nivel = 1;
                // calcula logo o preço do próximo upgrade
                classesReferencias["Aliados"][classes].valor = Math.floor(classesReferencias["Aliados"][classes].valorinicial * (1.07 ** classesReferencias["Aliados"][classes].nivel));
                criarPersonagem("Aliados", classes);
            } else {
                upgradeFeitosEl._Total += 1;

                // UPGRADES SEGUINTES
                classesReferencias["Aliados"][classes].nivel++;
                // valor do upgrade = valor inicial * 1.07 elevado ao nível atual (sobe 7% por nível)
                classesReferencias["Aliados"][classes].valor = Math.floor(classesReferencias["Aliados"][classes].valorinicial * (1.07 ** classesReferencias["Aliados"][classes].nivel));
                // dano do upgrade = (dano inicial * nível atual) + (dano atual * 1.05)
                classesReferencias["Aliados"][classes].dano = (classesReferencias["Aliados"][classes].danoInicial * classesReferencias["Aliados"][classes].nivel) + (classesReferencias["Aliados"][classes].dano * 1.05);
                //vida
                classesReferencias["Aliados"][classes].vidaMax = (classesReferencias["Aliados"][classes].vidaInicial * classesReferencias["Aliados"][classes].nivel) + (classesReferencias["Aliados"][classes].vidaMax * 1.05);
                classesReferencias["Aliados"][classes].vidaAtual = classesReferencias["Aliados"][classes].vidaMax;
            }


            dps.textContent = "dps: " + (classesReferencias["Aliados"][classes].dano * classesReferencias["Aliados"][classes].velAtaque).toFixed(2);
            atualizarbutao(botaoMenuLateral, classes);
        });

        menuSecundarioClasses.appendChild(imagemMenu);
        menuSecundarioClasses.appendChild(nome);
        menuSecundarioClasses.appendChild(descricao);
        menuSecundarioClasses.appendChild(dps);
        menuSecundarioClasses.appendChild(botaoMenuLateral);
        menuLateralClasses.appendChild(menuSecundarioClasses);
    }
}


function criarPersonagem(lado, classes) {
    const objeto = document.createElement("div");
    const vidaBarra = document.createElement("div");
    const vidaBarraVida = document.createElement("div");
    objeto.classList.add(lado);
    vidaBarra.classList.add("BarraVida");
    vidaBarraVida.classList.add("BarraVidaCor");
    objeto._alvo = lado == "Aliados" ? "Inimigos" : "Aliados";
    objeto._tipo = lado;
    const POSTX_BASE = 20;
    const POSTX_INIMIGO = 101;
    const ESPACO_Y = 4;
    const ESPACO_X = 4;
    const POR_COLUNA = 3;
    const Y_INICIAL = 10;

    if (lado == "Aliados") {
        const qtd = objetos.Personagens["Aliados"].length;
        const coluna = Math.floor(qtd / POR_COLUNA);
        const linha = qtd % POR_COLUNA;

        objeto._postX = POSTX_BASE - coluna * ESPACO_X;
        objeto._postY = Y_INICIAL + linha * ESPACO_Y;
    } else {
        const qtd = objetos.Personagens["Inimigos"].length;
        const coluna = Math.floor(qtd / POR_COLUNA);
        const linha = qtd % POR_COLUNA;

        objeto._postX = POSTX_INIMIGO + coluna * ESPACO_X;
        objeto._postY = Y_INICIAL + linha * ESPACO_Y;
    }

    objeto.style.left = objeto._postX + "%";
    objeto.style.top = objeto._postY + "%";
    objeto._distAtaque = classesReferencias[lado][classes].distAtaque;
    objeto._distPostX = classesReferencias[lado][classes].distPostX;
    objeto._vidaMax = classesReferencias[lado][classes].vidaMax;
    objeto._vidaAtual = classesReferencias[lado][classes].vidaAtual;
    objeto._dano = classesReferencias[lado][classes].dano;
    objeto._velAtaque = classesReferencias[lado][classes].velAtaque;
    objeto._velMovimento = lado == "Aliados" ? classesReferencias[lado][classes].velMovimento : -classesReferencias[lado][classes].velMovimento;
    objeto._velMovimentoAtaque = lado == "Aliados" ? classesReferencias[lado][classes].velMovimentoAtaque : -classesReferencias[lado][classes].velMovimentoAtaque;
    objeto._tempoUltimoAtaque = Date.now();
    vidaBarra.appendChild(vidaBarraVida);
    objeto._barraVida = vidaBarraVida;
    objeto.appendChild(vidaBarra);
    objeto._move = function () {
        if (!regrasMovimentacao.verificar(this)) { return }
        this._postX += this._velMovimento;
        this._distPostX = (this._postX - this._velMovimento) / 12.5 + 1;
        this.style.left = this._postX + "%";
        this.style.top = this._postY + "%";
    };


    if (lado == "Aliados") {
        objeto._ataque = function () {
            if ((Date.now() - this._tempoUltimoAtaque) / 1000 > this._velAtaque) {
                this._tempoUltimoAtaque = Date.now();
                criarAtaque(this);
            }
        }
    } else {
        objeto._ataque = function () {
            if ((Date.now() - this._tempoUltimoAtaque) / 1000 > this._velAtaque) {
                this._tempoUltimoAtaque = Date.now();
                criarAtaque(this);
            }
        }
    }

    objeto._danoRecebido = function (dano) {
        const vidaAtual = 100 - (this._vidaAtual / this._vidaMax * 100);
        this._vidaAtual += dano;
        const vidaNova = (100 - (this._vidaAtual / this._vidaMax * 100)) >= 100 ? 100 : 100 - (this._vidaAtual / this._vidaMax * 100);
        this.style.backgroundPositionX = vidaAtual + "%";
        const animacao = this._barraVida.animate([
            { backgroundPositionX: vidaAtual + "%" },
            { backgroundPositionX: vidaNova + "%" }],
            { duration: 200, fill: "forwards", easing: "ease-out" });

        animacao.onfinish = () => {
            if (this._vidaAtual <= 0) {
                const index = objetos.Personagens[this._tipo].indexOf(this);
                if (index > -1) objetos.Personagens[this._tipo].splice(index, 1);
                this.remove();
                if (this._tipo == "Inimigos") {
                    // ALTERAÇÃO: já NÃO dá dinheiro ao morrer
                    inimigMortEl._Total += 1;
                }
            }
        }
    }
    objetos.Personagens[objeto._tipo].push(objeto);
    combateUI.appendChild(objeto);
};

function criarAtaque(objeto) {
    const ataque = document.createElement("div");
    ataque.classList.add("ataque");
    ataque._postX = objeto._postX;
    ataque._velMovimento = objeto._velMovimentoAtaque;
    ataque._alvo = objeto._alvo;
    ataque._tipo = "ataque";
    ataque._dano = objeto._dano;
    ataque.style.transform = objeto._alvo == "Aliados" ? "scaleX(-1)" : "scaleX(1)";
    ataque._move = function () {
        this._postX += this._velMovimento;
        this.style.left = this._postX + "%";
        if (this._postX <= 0) {
            vidaDaBase._DanoRecebido(-this._dano)
        }
        if (this._postX <= 0 || this._postX >= 100) {
            const index = objetos.Ataques.indexOf(this);
            if (index > -1) objetos.Ataques.splice(index, 1);
            this.remove();
            return;
        }
        for (const objeto of objetos.Personagens[this._alvo]) {
            if ((this._alvo == "Inimigos" && this._postX >= objeto._postX) || (this._alvo == "Aliados" && this._postX <= objeto._postX)) {
                objeto._danoRecebido(-this._dano);
                const index = objetos.Ataques.indexOf(this);
                if (index > -1) objetos.Ataques.splice(index, 1);
                this.remove();
                break;
            }
        }
    }

    objetos.Ataques.push(ataque);
    combateUI.appendChild(ataque);
}

//comprar / upgrade
function atualizarbutao(botao, nomeClasse) {
    if (!classesReferencias["Aliados"][nomeClasse].comprado) {
        botao.textContent = "Comprar: " + classesReferencias["Aliados"][nomeClasse].valor;
    } else {
        botao.textContent = `Upgrade (Nv.${classesReferencias["Aliados"][nomeClasse].nivel}): ${classesReferencias["Aliados"][nomeClasse].valor}`;
    }
}

function moverObjetos() {
    for (const lado in objetos.Personagens) {
        for (const personagem of objetos.Personagens[lado]) {
            personagem._move();
        }

    }

    for (const ataque of objetos.Ataques) {
        ataque._move();
    }

    for (const lado in objetos.Personagens) {
        for (const personagem of objetos.Personagens[lado]) {
            personagem._ataque();
        }
    }
}

function iniciarFase() {
    const quantidade = Math.ceil(faseAtual / 3) + (ondaAtual - 1);
    const classesDisponiveis = Object.keys(classesReferencias["Inimigos"]);
    const indiceClasse = Math.min(
        Math.floor((faseAtual - 1) / 4) + (ondaAtual - 1),
        classesDisponiveis.length - 1
    );
    const classe = classesDisponiveis[indiceClasse];

    inimigosRestantes = quantidade;
    spawnAgendado = true;
    for (let i = 0; i < quantidade; i++) {
        setTimeout(() => {
            criarPersonagem("Inimigos", classe);
            if (i === quantidade - 1) spawnAgendado = false;
        }, i * 600);
    }
}


// ---------- UPGRADES DO cliker ----------
const upgradesCliker = {
    "Multiplicador de cliker": {
        valor: 10, valorinicial: 10, nivel: 0,
        descricao: "Aumenta a quantidade de pontos de multiplicação ganhos a cada cliker.",
        funcao: function () {
            return (this.valor + 500) + (this.nivel + this.valorinicial);

        }
    },
    "Limite de cliker Máximo": {
        valor: 10, valorinicial: 10, nivel: 0,
        descricao: "Aumenta a quantidade máxima do limite de pontos de multiplicação.",
        funcao: function () {
            return (this.valor + 500) + (this.nivel + this.valorinicial) ** this.nivel;

        }
    }
};

function atualizarBotaocliker(botao, nomeUpgrade) {
    botao.textContent = `Upgrade (Nv.${upgradesCliker[nomeUpgrade].nivel}): ${upgradesCliker[nomeUpgrade].valor}`;
}

function criarLateralcliker() {
    menuLateralClicker.style.display = "none";

    for (const nomeUpgrade in upgradesCliker) {
        const cartao = document.createElement("div");
        cartao.className = "menuSecundarioClasses";

        const nome = document.createElement("p");
        nome.textContent = "Nome: " + nomeUpgrade;

        const descricao = document.createElement("p");
        descricao.textContent = "Descrição: " + upgradesCliker[nomeUpgrade].descricao;

        const nivelAtual = document.createElement("p");
        nivelAtual.textContent = "Nível: " + upgradesCliker[nomeUpgrade].nivel;

        const botaoUpgrade = document.createElement("div");
        botaoUpgrade.className = "botaoMenuLateral";
        atualizarBotaocliker(botaoUpgrade, nomeUpgrade);

        botaoUpgrade.addEventListener("click", function () {
            if (dinheiro < upgradesCliker[nomeUpgrade].valor) return;

            dinheiroAtualizar(-upgradesCliker[nomeUpgrade].valor);

            upgradesCliker[nomeUpgrade].nivel++;
            upgradesCliker[nomeUpgrade].valor = Math.floor(upgradesCliker[nomeUpgrade].funcao());

            nivelAtual.textContent = "Nível: " + upgradesCliker[nomeUpgrade].nivel;
            atualizarBotaocliker(botaoUpgrade, nomeUpgrade);
        });

        cartao.appendChild(nome);
        cartao.appendChild(descricao);
        cartao.appendChild(nivelAtual);
        cartao.appendChild(botaoUpgrade);
        menuLateralClicker.appendChild(cartao);
    }
}

function abrirFormPerfil() {
    document.getElementById("fundoForm").classList.add("aberto");
}

function fecharFormPerfil(evento) {
    if (evento && evento.target.id !== "fundoForm") return;
    document.getElementById("fundoForm").classList.remove("aberto");
}

function guardarPerfil(e) {
    e.preventDefault();
    const nome = document.getElementById("inputNome").value;
    document.getElementById("nomeJogador").textContent = "Nome: " + nome;
    const corSelecionada = document.querySelector('input[name="cor"]:checked').value;
    document.documentElement.style.setProperty("--perfil", corSelecionada);
    fecharFormPerfil();
}

function resetJogo() {
    if (confirm("Tens a certeza que queres reiniciar?")) {
        location.reload();
    }
}

criarLateralcliker()
criarLateral();
iniciarFase();


regrasMovimentacao.adicionar("Inimigos", "Limites", function (personagem) { return personagem._postX > 30 });
regrasMovimentacao.adicionar("Aliados", "Limites", function (personagem) { return false });
criarPersonagem("Aliados", "Lanceiro");


function gameLoop() {
    moverObjetos();
    if (!spawnAgendado && objetos.Personagens["Inimigos"].length === 0) {
        if (inimigosRestantes > 0 || faseAtual > 1) {
            if (faseAtual >= FASES_POR_ONDA) {
                ondaAtual++;
                faseAtual = 1;
            } else {
                faseAtual++;
            }
            inimigosRestantes = 0;
            iniciarFase();
        }
    }

    if (Date.now() - tempoPIE._Atualizar > 50) {
        tempoPIE._Atualizar = Date.now();
        atualizarPIE();
    }

    if (Date.now() - taxaPassiva._Tempo > 1000) {
        const segundosPassados = (Date.now() - taxaPassiva._Tempo) / 1000;
        const ganhoPorSegundo = taxaPassiva._Dinheiro / segundosPassados;
        taxaPassiva.textContent = "+" + ganhoPorSegundo.toFixed(2) + " / seg";

        taxaPassiva._Dinheiro = 0;
        taxaPassiva._Tempo = Date.now();
    }


}
setInterval(gameLoop, 14);