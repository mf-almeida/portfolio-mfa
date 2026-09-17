import { t, formatText, onLanguageChange, isReady, SUPPORTED_LANGUAGES } from "./i18n.js";
import { showChatView } from "./viewSwitcher.js";
import {
    carregarMensagensDoContato,
    salvarMensagemNoContato,
    limparHistoricoDoContato as removerHistoricoDoContatoNoStorage
} from "./chatStorage.js";
import { renderizarPerguntasProntas } from "./faq.js";
import { atualizarAvatarDoChat } from "./avatars.js";
import { projetosData } from "./projetos.js";

let chatAtivo = null;
let chatStatusState = "online";

export function getChatAtivo() {
    return chatAtivo;
}

function getProjectTitle(projectId) {
    const info = projetosData[projectId];
    if (!info) {
        return "";
    }

    return t(info.tituloKey, info.defaultTitle || projectId);
}

function gerarMensagemInicial(idProjeto) {
    if (idProjeto === "matheus") {
        return {
            text: t("initial_matheus"),
            translationKey: "initial_matheus",
            translationValues: {}
        };
    }

    const translationValues = {
        project: getProjectTitle(idProjeto)
    };

    return {
        text: formatText(t("initial_generic"), translationValues),
        translationKey: "initial_generic",
        translationValues
    };
}

// Mensagens salvas antes de existir o mecanismo de translationKey não têm
// como ser re-traduzidas diretamente; aqui a gente tenta reconhecer se o
// texto salvo bate com alguma mensagem estática conhecida em qualquer
// idioma, pra continuar funcionando com o histórico antigo do usuário.
function inferirTraducaoLegadaDaMensagem(mensagem, idContato) {
    if (!window.i18next || !isReady() || !mensagem || mensagem.souEu) {
        return null;
    }

    const texto = (mensagem.texto || "").trim();
    if (!texto) {
        return null;
    }

    const staticKeys = ["initial_matheus", "server_offline"];
    for (const key of staticKeys) {
        const corresponde = SUPPORTED_LANGUAGES.some((lang) => {
            const candidate = window.i18next.getResource(lang, "translation", key);
            return typeof candidate === "string" && candidate.trim() === texto;
        });

        if (corresponde) {
            return { translationKey: key, translationValues: {} };
        }
    }

    const projectTitleKey = projetosData[idContato]?.tituloKey;
    if (!projectTitleKey) {
        return null;
    }

    const correspondeGeneric = SUPPORTED_LANGUAGES.some((lang) => {
        const template = window.i18next.getResource(lang, "translation", "initial_generic");
        const projectTitle = window.i18next.getResource(lang, "translation", projectTitleKey);

        if (typeof template !== "string" || typeof projectTitle !== "string") {
            return false;
        }

        return formatText(template, { project: projectTitle }).trim() === texto;
    });

    if (correspondeGeneric) {
        return {
            translationKey: "initial_generic",
            translationValues: { project: getProjectTitle(idContato) }
        };
    }

    return null;
}

function resolverTextoDaMensagem(mensagem, idContato) {
    if (!mensagem || typeof mensagem !== "object") {
        return "";
    }

    const traduzivel = mensagem.translationKey
        ? {
            translationKey: mensagem.translationKey,
            translationValues: mensagem.translationValues
        }
        : inferirTraducaoLegadaDaMensagem(mensagem, idContato);

    if (traduzivel && traduzivel.translationKey) {
        const template = t(traduzivel.translationKey, mensagem.texto || "");
        const values = traduzivel.translationValues && typeof traduzivel.translationValues === "object"
            ? traduzivel.translationValues
            : {};
        return formatText(template, values);
    }

    return mensagem.texto || "";
}

function adicionarBalaoMensagem(texto, remetente) {
    const chatMensagens = document.getElementById("chat-mensagens");
    if (!chatMensagens) {
        return;
    }

    const divLinha = document.createElement("div");
    divLinha.classList.add("linha-mensagem", remetente);

    const divBalao = document.createElement("div");
    divBalao.classList.add("balao-mensagem");
    divBalao.innerText = texto;

    divLinha.appendChild(divBalao);
    chatMensagens.appendChild(divLinha);
    chatMensagens.scrollTop = chatMensagens.scrollHeight;
}

function renderizarHistoricoDoContato(idContato) {
    const containerMensagens = document.getElementById("chat-mensagens");
    if (!containerMensagens) {
        return;
    }

    containerMensagens.innerHTML = "";

    const historico = carregarMensagensDoContato(idContato);
    historico.forEach((mensagem) => {
        const remetente = mensagem.souEu ? "usuario" : "bot";
        adicionarBalaoMensagem(resolverTextoDaMensagem(mensagem, idContato), remetente);
    });
}

function salvarERenderizarMensagem(idContato, texto, remetente, renderizarNaTela = true, meta = {}) {
    if (!idContato) {
        return;
    }

    if (renderizarNaTela && chatAtivo === idContato) {
        adicionarBalaoMensagem(texto, remetente);
    }

    salvarMensagemNoContato(idContato, texto, remetente === "usuario", meta);
}

function atualizarEstadoBotaoLimpar() {
    const btnLimparHistorico = document.getElementById("btn-limpar-historico");
    if (!btnLimparHistorico) {
        return;
    }

    btnLimparHistorico.disabled = !chatAtivo;
}

function limparHistoricoAtivoComConfirmacao() {
    if (!chatAtivo) {
        return;
    }

    const idContato = chatAtivo;
    const nomeContato = getProjectTitle(idContato) || t("chat_project_placeholder");
    const confirmou = window.confirm(formatText(t("confirm_clear_history"), { name: nomeContato }));

    if (!confirmou) {
        return;
    }

    removerHistoricoDoContatoNoStorage(idContato);

    if (chatAtivo === idContato) {
        const chatMensagens = document.getElementById("chat-mensagens");
        if (chatMensagens) {
            chatMensagens.innerHTML = "";
        }

        const mensagemInicial = gerarMensagemInicial(idContato);
        salvarERenderizarMensagem(idContato, mensagemInicial.text, "bot", true, {
            translationKey: mensagemInicial.translationKey,
            translationValues: mensagemInicial.translationValues
        });
    }
}

function setChatStatus(status) {
    chatStatusState = status;

    const statusEl = document.getElementById("chat-status");
    if (!statusEl) {
        return;
    }

    if (status === "typing") {
        statusEl.textContent = t("status_typing");
        statusEl.style.color = "#00a884";
        return;
    }

    if (status === "offline") {
        statusEl.textContent = t("status_offline");
        statusEl.style.color = "red";
        return;
    }

    statusEl.textContent = t("status_online");
    statusEl.style.color = "";
}

function aoSelecionarPerguntaPronta(idProjeto, item) {
    if (chatAtivo !== idProjeto || !item) {
        return;
    }

    salvarERenderizarMensagem(idProjeto, item.q, "usuario", true);
    setChatStatus("typing");

    window.setTimeout(() => {
        salvarERenderizarMensagem(idProjeto, item.a, "bot", true);
        if (chatAtivo === idProjeto) {
            setChatStatus("online");
        }
    }, 350);
}

export function abrirChat(idProjeto) {
    showChatView();

    chatAtivo = idProjeto;
    const info = projetosData[idProjeto];

    if (!info) {
        return;
    }

    const telaVazia = document.getElementById("tela-vazia");
    const telaChat = document.getElementById("tela-chat");

    if (telaVazia) {
        telaVazia.style.display = "none";
    }

    if (telaChat) {
        telaChat.style.display = "flex";
    }

    atualizarEstadoBotaoLimpar();

    const tituloProjeto = getProjectTitle(idProjeto);
    const chatTitulo = document.getElementById("chat-titulo");

    if (chatTitulo) {
        chatTitulo.innerText = tituloProjeto;
    }

    atualizarAvatarDoChat(
        info.avatar,
        tituloProjeto,
        () => chatAtivo === idProjeto && projetosData[idProjeto]?.avatar === info.avatar
    );
    renderizarPerguntasProntas(idProjeto, (item) => aoSelecionarPerguntaPronta(idProjeto, item));

    const historico = carregarMensagensDoContato(idProjeto);
    if (historico.length > 0) {
        renderizarHistoricoDoContato(idProjeto);
        setChatStatus("online");
        return;
    }

    const mensagemInicial = gerarMensagemInicial(idProjeto);
    salvarERenderizarMensagem(idProjeto, mensagemInicial.text, "bot", true, {
        translationKey: mensagemInicial.translationKey,
        translationValues: mensagemInicial.translationValues
    });
    setChatStatus("online");
}

export function enviarMensagem() {
    if (!chatAtivo) {
        return;
    }

    const inputEl = document.getElementById("input-mensagem");
    if (!inputEl) {
        return;
    }

    const texto = inputEl.value.trim();
    if (texto === "") {
        return;
    }

    salvarERenderizarMensagem(chatAtivo, texto, "usuario", true);
    inputEl.value = "";

    setChatStatus("typing");

    const idContatoNoEnvio = chatAtivo;

    fetch("/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            projeto: idContatoNoEnvio,
            mensagem: texto
        })
    })
        .then((response) => response.json())
        .then((data) => {
            if (!idContatoNoEnvio || !projetosData[idContatoNoEnvio]) {
                return;
            }

            const respostaIA = data.resposta || data.erro || "";
            salvarERenderizarMensagem(idContatoNoEnvio, respostaIA, "bot", true);

            if (chatAtivo === idContatoNoEnvio) {
                setChatStatus("online");
            }
        })
        .catch((erro) => {
            console.error("Erro na comunicacao com a API:", erro);

            salvarERenderizarMensagem(idContatoNoEnvio, t("server_offline"), "bot", true, {
                translationKey: "server_offline",
                translationValues: {}
            });

            if (chatAtivo === idContatoNoEnvio) {
                setChatStatus("offline");
            }
        });
}

export function verificarEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        enviarMensagem();
    }
}

function reaplicarTraducoesNoChat() {
    if (!chatAtivo) {
        setChatStatus(chatStatusState);
        return;
    }

    const chatTitulo = document.getElementById("chat-titulo");
    if (chatTitulo) {
        chatTitulo.textContent = getProjectTitle(chatAtivo);
    }

    renderizarHistoricoDoContato(chatAtivo);
    renderizarPerguntasProntas(chatAtivo, (item) => aoSelecionarPerguntaPronta(chatAtivo, item));

    const avatarEl = document.getElementById("chat-avatar");
    if (avatarEl && projetosData[chatAtivo]) {
        avatarEl.alt = `${t("chat_avatar", "Avatar")} ${getProjectTitle(chatAtivo)}`;
    }

    setChatStatus(chatStatusState);
}

export function initChat() {
    const btnLimparHistorico = document.getElementById("btn-limpar-historico");
    if (btnLimparHistorico) {
        btnLimparHistorico.addEventListener("click", limparHistoricoAtivoComConfirmacao);
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Esc" || event.key === "Escape") {
            if (chatAtivo) {
                chatAtivo = null;
                const telaChat = document.getElementById("tela-chat");
                const telaVazia = document.getElementById("tela-vazia");

                if (telaChat) {
                    telaChat.style.display = "none";
                }

                if (telaVazia) {
                    telaVazia.style.display = "flex";
                }

                atualizarEstadoBotaoLimpar();
            }
        }
    });

    document.addEventListener("keydown", (event) => {
        const alvoEhInputMensagem = event.target && event.target.id === "input-mensagem";
        if ((event.key === "Enter" || event.key === "NumpadEnter") && chatAtivo && !alvoEhInputMensagem) {
            enviarMensagem();
        }
    });

    onLanguageChange(reaplicarTraducoesNoChat);

    atualizarEstadoBotaoLimpar();
    setChatStatus("online");
}
