import { isReady } from "./i18n.js";

export function faqKeyPara(idProjeto) {
    return `faq_${idProjeto.replace(/-/g, "_")}`;
}

function obterPerguntasProntas(idProjeto) {
    if (!window.i18next || !isReady()) {
        return [];
    }

    const itens = window.i18next.t(faqKeyPara(idProjeto), { returnObjects: true, defaultValue: [] });
    return Array.isArray(itens) ? itens : [];
}

// `aoSelecionarPergunta(item)` é chamado quando o visitante clica numa das
// perguntas prontas; quem chama (chat.js) decide o que fazer com a resposta,
// então este módulo não precisa conhecer nada sobre o estado do chat.
export function renderizarPerguntasProntas(idProjeto, aoSelecionarPergunta) {
    const container = document.getElementById("perguntas-rapidas");
    if (!container) {
        return;
    }

    container.innerHTML = "";
    const itens = obterPerguntasProntas(idProjeto);

    if (!itens.length) {
        container.setAttribute("aria-hidden", "true");
        return;
    }

    container.setAttribute("aria-hidden", "false");
    itens.forEach((item) => {
        const botao = document.createElement("button");
        botao.type = "button";
        botao.className = "pergunta-rapida";
        botao.textContent = item.q;
        botao.addEventListener("click", () => aoSelecionarPergunta(item));
        container.appendChild(botao);
    });
}
