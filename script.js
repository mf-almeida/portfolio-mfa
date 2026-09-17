const THEME_STORAGE_KEY = "theme";
const LANGUAGE_STORAGE_KEY = "site_lang";
const CHATS_STORAGE_KEY = "meus_chats";
const SUPPORTED_LANGUAGES = ["pt", "en", "es"];

const projetosData = {
    matheus: {
        tituloKey: "project_matheus_title",
        defaultTitle: "Matheus Fonseca Almeida",
        avatar: "img/ft-perfil.jpeg"
    },
    pdz: {
        tituloKey: "project_pdz_title",
        defaultTitle: "PDZ: Manipulacao de arquivos",
        avatar: "img/pdzTxt.svg"
    },
    "swift-file": {
        tituloKey: "project_swift_title",
        defaultTitle: "Swift-File: Busca acelerada",
        avatar: "img/swift-file.webp"
    },
    "game-verse": {
        tituloKey: "project_game_title",
        defaultTitle: "Game-Verse: E-commerce",
        avatar: "img/game-verse.webp"
    },
    "reunioes-aut": {
        tituloKey: "project_reunioes_title",
        defaultTitle: "Reuniões_aut",
        avatar: "img/icon_reunioes_aut.jpg"
    },
    "portfolio-interativo": {
        tituloKey: "project_portfolio_title",
        defaultTitle: "Portfólio Interativo",
        avatar: "img/icon_icon.svg"
    }
};

const themeToggle = document.getElementById("theme-toggle");
const searchBar = document.getElementById("search-bar");
const filterButtons = document.querySelectorAll(".filtros button[data-filter]");
const listaConversas = document.querySelectorAll(".conversas-fechadas > .chat-fechado-container");
const botaoArquivada = document.getElementById("toggle-arquivados");
const listaArquivados = document.getElementById("lista-arquivados");
const btnLimparHistorico = document.getElementById("btn-limpar-historico");
const languageShortcut = document.getElementById("language-shortcut");
const languageMenu = document.getElementById("language-menu");
const languageOptions = document.querySelectorAll(".language-option");
const modal = document.getElementById("modal");
const serviceModal = document.getElementById("service-modal");
const portfolioFormModal = document.getElementById("portfolio-form-modal");
const modalTrigger = document.getElementById("modal-trigger");
const openServiceModalButton = document.getElementById("open-service-modal");
const modalCloseButtons = document.querySelectorAll(".modal-close-icon, .contact-close-cta");
const serviceModalCloseButtons = document.querySelectorAll(".service-close-icon, .service-close-cta");
const portfolioFormCloseButtons = document.querySelectorAll(".portfolio-form-close-icon, .portfolio-form-close-cta");
const feedbackShortcut = document.getElementById("feedback-shortcut");
const chatShortcut = document.getElementById("chat-shortcut");
const statusShortcut = document.getElementById("status-shortcut");
const chatListView = document.querySelector(".lista-de-conversas");
const chatOpenView = document.querySelector(".conversa-aberta");
const statusView = document.getElementById("status-view");
const appRoot = document.querySelector(".app");

let chatAtivo = null;
let chatStatusState = "online";
let currentLanguage = "pt";
let i18nReady = false;
let currentConversationFilter = "all";
let currentConversationSearch = "";
let viewTransitionTimer = null;

const VIEW_TRANSITION_MS = 340;

const avatarCache = new Map();

const statusColumnMap = {
    finalizados: "kanban-finalizados",
    andamento: "kanban-andamento",
    arquivados: "kanban-arquivados",
    ideias: "kanban-ideias"
};

function normalizeLanguage(raw) {
    const value = (raw || "").toLowerCase();
    if (value.startsWith("pt")) return "pt";
    if (value.startsWith("es")) return "es";
    return "en";
}

function clearViewTransitionTimer() {
    if (viewTransitionTimer) {
        window.clearTimeout(viewTransitionTimer);
        viewTransitionTimer = null;
    }
}

function finalizeStatusViewTransition() {
    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        return;
    }

    chatListView.style.display = "none";
    chatOpenView.style.display = "none";
    statusView.style.display = "flex";
    statusView.setAttribute("aria-hidden", "false");

    appRoot.classList.remove("is-switching-to-status", "is-switching-to-chat");
    appRoot.classList.add("status-active");
}

function finalizeChatViewTransition() {
    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        return;
    }

    chatListView.style.display = "flex";
    chatOpenView.style.display = "flex";
    statusView.style.display = "none";
    statusView.setAttribute("aria-hidden", "true");

    appRoot.classList.remove("status-active", "is-switching-to-chat", "is-switching-to-status");
}

function showChatView() {
    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        if (chatListView) {
            chatListView.style.display = "flex";
        }

        if (chatOpenView) {
            chatOpenView.style.display = "flex";
        }

        if (statusView) {
            statusView.style.display = "none";
            statusView.setAttribute("aria-hidden", "true");
        }
        return;
    }

    clearViewTransitionTimer();

    const statusEstaAtivo = appRoot.classList.contains("status-active")
        || appRoot.classList.contains("is-switching-to-chat")
        || appRoot.classList.contains("is-switching-to-status");
    if (!statusEstaAtivo) {
        appRoot.classList.remove("is-switching-to-chat", "is-switching-to-status", "status-active");
        chatListView.style.display = "flex";
        chatOpenView.style.display = "flex";
        statusView.style.display = "none";
        statusView.setAttribute("aria-hidden", "true");
        return;
    }

    chatListView.style.display = "none";
    chatOpenView.style.display = "none";
    statusView.style.display = "flex";

    appRoot.classList.remove("is-switching-to-status", "status-active");
    appRoot.classList.add("is-switching-to-chat");

    viewTransitionTimer = window.setTimeout(() => {
        finalizeChatViewTransition();
    }, VIEW_TRANSITION_MS);
}

function showStatusView() {
    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        if (chatListView) {
            chatListView.style.display = "none";
        }

        if (chatOpenView) {
            chatOpenView.style.display = "none";
        }

        if (statusView) {
            statusView.style.display = "flex";
            statusView.setAttribute("aria-hidden", "false");
        }
        return;
    }

    const statusJaAtivo = appRoot.classList.contains("status-active") || appRoot.classList.contains("is-switching-to-status");
    if (statusJaAtivo) {
        return;
    }

    clearViewTransitionTimer();

    chatListView.style.display = "flex";
    chatOpenView.style.display = "flex";
    statusView.style.display = "none";
    statusView.setAttribute("aria-hidden", "true");

    appRoot.classList.remove("is-switching-to-chat");
    appRoot.classList.add("is-switching-to-status");

    viewTransitionTimer = window.setTimeout(() => {
        finalizeStatusViewTransition();
    }, VIEW_TRANSITION_MS);
}

function distribuirCardsStatusPorId() {
    const cards = document.querySelectorAll(".status-card[id]");
    const columnEntries = Object.entries(statusColumnMap);

    columnEntries.forEach(([, columnId]) => {
        const container = document.getElementById(columnId);
        if (container) {
            container.innerHTML = "";
        }
    });

    cards.forEach((card) => {
        const cardId = card.id || "";
        const [prefixo] = cardId.split("__");
        const targetId = statusColumnMap[prefixo];
        const fallbackId = statusColumnMap.ideias;
        const targetContainer = document.getElementById(targetId || fallbackId);

        if (targetContainer) {
            targetContainer.appendChild(card);
        }
    });

    Object.entries(statusColumnMap).forEach(([key, columnId]) => {
        const countEl = document.getElementById(`count-${key}`);
        const container = document.getElementById(columnId);
        if (countEl && container) {
            countEl.textContent = String(container.querySelectorAll(".status-card").length);
        }
    });
}

function loadLocale(lang) {
    return fetch(`locales/${lang}/translation.json`).then((response) => {
        if (!response.ok) {
            throw new Error(`Failed to load locale ${lang}`);
        }
        return response.json();
    });
}

function formatText(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, token) => {
        return Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : "";
    });
}

function t(key, fallback = "") {
    if (window.i18next && i18nReady) {
        return window.i18next.t(key, { defaultValue: fallback || key });
    }
    return fallback || key;
}

function getProjectTitle(projectId) {
    const info = projetosData[projectId];
    if (!info) {
        return "";
    }

    return t(info.tituloKey, info.defaultTitle || projectId);
}

function updateLanguageMenuState() {
    languageOptions.forEach((option) => {
        const isActive = option.dataset.language === currentLanguage;
        option.classList.toggle("ativo", isActive);
        option.setAttribute("aria-checked", isActive ? "true" : "false");
    });
}

function applyTranslations() {
    document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : currentLanguage;
    document.title = t("page_title", "Portfólio Interativo");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", t(key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        const translated = t(key);
        el.setAttribute("title", translated);
        el.setAttribute("aria-label", translated);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
        const key = el.getAttribute("data-i18n-alt");
        el.setAttribute("alt", t(key));
    });

    updateLanguageMenuState();

    if (chatAtivo) {
        const chatTitulo = document.getElementById("chat-titulo");
        if (chatTitulo) {
            chatTitulo.textContent = getProjectTitle(chatAtivo);
        }

        renderizarHistoricoDoContato(chatAtivo);
        renderizarPerguntasProntas(chatAtivo);

        const avatarEl = document.getElementById("chat-avatar");
        if (avatarEl && projetosData[chatAtivo]) {
            avatarEl.alt = `${t("chat_avatar", "Avatar")} ${getProjectTitle(chatAtivo)}`;
        }
    }

    setChatStatus(chatStatusState);
}

async function setLanguage(lang, persist = true) {
    const normalized = SUPPORTED_LANGUAGES.includes(normalizeLanguage(lang)) ? normalizeLanguage(lang) : "pt";
    currentLanguage = normalized;

    if (persist) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    }

    if (window.i18next && i18nReady) {
        await window.i18next.changeLanguage(currentLanguage);
    }

    applyTranslations();
}

function abrirMenuIdioma() {
    if (!languageMenu) {
        return;
    }

    languageMenu.classList.add("aberto");
    languageMenu.setAttribute("aria-hidden", "false");
}

function fecharMenuIdioma() {
    if (!languageMenu) {
        return;
    }

    languageMenu.classList.remove("aberto");
    languageMenu.setAttribute("aria-hidden", "true");
}

function alternarMenuIdioma() {
    if (!languageMenu) {
        return;
    }

    if (languageMenu.classList.contains("aberto")) {
        fecharMenuIdioma();
        return;
    }

    abrirMenuIdioma();
}

function initializeTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light") {
        document.body.classList.add("light");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light");
            localStorage.setItem(
                THEME_STORAGE_KEY,
                document.body.classList.contains("light") ? "light" : "dark"
            );
        });
    }
}

function filtrarListaDeConversas(termo) {
    const termoNormalizado = (termo ?? "").trim().toLowerCase();
    currentConversationSearch = termoNormalizado;

    listaConversas.forEach((conversa) => {
        const nomeConversaEl = conversa.querySelector(".nome-conversa");
        const nomeConversa = nomeConversaEl ? nomeConversaEl.innerText.toLowerCase() : "";
        const correspondeAoTermo = !termoNormalizado || nomeConversa.includes(termoNormalizado);
        const conversaEhFixada = Boolean(conversa.querySelector(".pin-fix-icon"));
        const conversaEhProjeto = conversa.dataset.chatType === "project";

        let correspondeAoFiltro = true;
        if (currentConversationFilter === "projects") {
            correspondeAoFiltro = conversaEhProjeto;
        } else if (currentConversationFilter === "pinned") {
            correspondeAoFiltro = conversaEhFixada;
        }

        conversa.style.display = correspondeAoTermo && correspondeAoFiltro ? "grid" : "none";
    });

    if (botaoArquivada) {
        const mostrarArquivada = currentConversationFilter === "all" && !termoNormalizado;
        botaoArquivada.style.display = mostrarArquivada ? "flex" : "none";
    }
}

function setConversationFilter(filterValue) {
    const filtrosPermitidos = ["all", "projects", "pinned"];
    currentConversationFilter = filtrosPermitidos.includes(filterValue) ? filterValue : "all";

    filterButtons.forEach((button) => {
        const isActive = button.dataset.filter === currentConversationFilter;
        button.classList.toggle("ativo", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    filtrarListaDeConversas(currentConversationSearch);
}

function initializeFilters() {
    if (!filterButtons.length) {
        return;
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setConversationFilter(button.dataset.filter);
        });
    });

    setConversationFilter(currentConversationFilter);
}

function initializeArquivados() {
    if (!botaoArquivada || !listaArquivados) {
        return;
    }

    botaoArquivada.addEventListener("click", () => {
        const estaAberta = !listaArquivados.hidden;

        listaArquivados.hidden = estaAberta;
        botaoArquivada.setAttribute("aria-expanded", estaAberta ? "false" : "true");
        botaoArquivada.classList.toggle("aberta", !estaAberta);
    });
}

function initializeSearch() {
    if (!searchBar) {
        return;
    }

    searchBar.addEventListener("input", (event) => {
        filtrarListaDeConversas(event.target.value);
    });

    searchBar.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            searchBar.value = "";
            filtrarListaDeConversas("");
        }
    });
}

function lerChatsDoStorage() {
    try {
        const bruto = localStorage.getItem(CHATS_STORAGE_KEY);
        if (!bruto) {
            return {};
        }

        const parsed = JSON.parse(bruto);
        return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
        return {};
    }
}

function salvarChatsNoStorage(chats) {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
}

function carregarMensagensDoContato(idContato) {
    const chats = lerChatsDoStorage();
    const mensagens = chats[idContato];
    return Array.isArray(mensagens) ? mensagens : [];
}

function salvarMensagemNoContato(idContato, texto, souEu, meta = {}) {
    const chats = lerChatsDoStorage();
    if (!Array.isArray(chats[idContato])) {
        chats[idContato] = [];
    }

    const mensagem = {
        texto,
        souEu,
        data: new Date().toISOString()
    };

    if (meta && typeof meta === "object") {
        if (meta.translationKey) {
            mensagem.translationKey = meta.translationKey;
        }

        if (meta.translationValues && typeof meta.translationValues === "object") {
            mensagem.translationValues = meta.translationValues;
        }
    }

    chats[idContato].push(mensagem);
    salvarChatsNoStorage(chats);
    return mensagem;
}

function limparHistoricoDoContato(idContato) {
    const chats = lerChatsDoStorage();
    if (!Object.prototype.hasOwnProperty.call(chats, idContato)) {
        return;
    }

    delete chats[idContato];
    salvarChatsNoStorage(chats);

    if (chatAtivo === idContato) {
        const chatMensagens = document.getElementById("chat-mensagens");
        if (chatMensagens) {
            chatMensagens.innerHTML = "";
        }
    }
}

window.limparHistoricoContato = limparHistoricoDoContato;

function preloadAvatares() {
    Object.values(projetosData).forEach((projeto) => {
        const imagem = new Image();
        imagem.decoding = "async";
        imagem.src = projeto.avatar;
        avatarCache.set(projeto.avatar, imagem);
    });
}

function aguardarImagem(imagem) {
    if (imagem.complete) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        imagem.onload = () => resolve();
        imagem.onerror = () => resolve();
    });
}

async function atualizarAvatarDoChat(srcAvatar, tituloProjeto) {
    const avatarEl = document.getElementById("chat-avatar");
    if (!avatarEl) {
        return;
    }

    if (avatarEl.dataset.avatarAtual === srcAvatar) {
        avatarEl.alt = `${t("chat_avatar", "Avatar")} ${tituloProjeto}`;
        return;
    }

    avatarEl.classList.add("carregando");

    let imagem = avatarCache.get(srcAvatar);
    if (!imagem) {
        imagem = new Image();
        imagem.decoding = "async";
        imagem.src = srcAvatar;
        avatarCache.set(srcAvatar, imagem);
    }

    await aguardarImagem(imagem);

    if (chatAtivo && projetosData[chatAtivo]?.avatar === srcAvatar) {
        avatarEl.src = srcAvatar;
        avatarEl.alt = `${t("chat_avatar", "Avatar")} ${tituloProjeto}`;
        avatarEl.dataset.avatarAtual = srcAvatar;
    }

    avatarEl.classList.remove("carregando");
}

function faqKeyPara(idProjeto) {
    return `faq_${idProjeto.replace(/-/g, "_")}`;
}

function obterPerguntasProntas(idProjeto) {
    if (!window.i18next || !i18nReady) {
        return [];
    }

    const itens = window.i18next.t(faqKeyPara(idProjeto), { returnObjects: true, defaultValue: [] });
    return Array.isArray(itens) ? itens : [];
}

function responderComPerguntaPronta(idProjeto, item) {
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

function renderizarPerguntasProntas(idProjeto) {
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
        botao.addEventListener("click", () => responderComPerguntaPronta(idProjeto, item));
        container.appendChild(botao);
    });
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

function inferirTraducaoLegadaDaMensagem(mensagem, idContato) {
    if (!window.i18next || !i18nReady || !mensagem || mensagem.souEu) {
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

    limparHistoricoDoContato(idContato);

    if (chatAtivo === idContato) {
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

if (btnLimparHistorico) {
    btnLimparHistorico.addEventListener("click", limparHistoricoAtivoComConfirmacao);
}

function abrirChat(idProjeto) {
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

    atualizarAvatarDoChat(info.avatar, tituloProjeto);
    renderizarPerguntasProntas(idProjeto);

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

function enviarMensagem() {
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

function verificarEnter(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        enviarMensagem();
    }
}

function openLanguageMenu() {
    if (languageMenu) {
        languageMenu.classList.add("aberto");
        languageMenu.setAttribute("aria-hidden", "false");
    }
}

function closeLanguageMenu() {
    if (languageMenu) {
        languageMenu.classList.remove("aberto");
        languageMenu.setAttribute("aria-hidden", "true");
    }
}

function toggleLanguageMenu() {
    if (!languageMenu) {
        return;
    }

    if (languageMenu.classList.contains("aberto")) {
        closeLanguageMenu();
        return;
    }

    openLanguageMenu();
}

async function initializeI18n() {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const preferredLanguage = savedLanguage ? normalizeLanguage(savedLanguage) : normalizeLanguage(navigator.language);
    const resources = {};

    await Promise.all(
        SUPPORTED_LANGUAGES.map(async (lang) => {
            const translations = await loadLocale(lang);
            resources[lang] = { translation: translations };
        })
    );

    await window.i18next.init({
        lng: preferredLanguage,
        fallbackLng: "pt",
        resources,
        interpolation: {
            escapeValue: false
        },
        returnEmptyString: false,
        returnNull: false
    });

    i18nReady = true;
    currentLanguage = normalizeLanguage(window.i18next.language || preferredLanguage);

    window.i18next.on("languageChanged", (lng) => {
        currentLanguage = normalizeLanguage(lng);
        applyTranslations();
    });

    applyTranslations();
}

function initializeLanguageControls() {
    if (languageShortcut) {
        languageShortcut.addEventListener("click", (event) => {
            event.stopPropagation();
            toggleLanguageMenu();
        });
    }

    languageOptions.forEach((option) => {
        option.addEventListener("click", async (event) => {
            event.stopPropagation();
            await setLanguage(option.dataset.language);
            closeLanguageMenu();
        });
    });

    document.addEventListener("click", (event) => {
        if (!languageMenu || !languageShortcut) {
            return;
        }

        const clicouNoAtalho = languageShortcut.contains(event.target);
        const clicouNoMenu = languageMenu.contains(event.target);

        if (!clicouNoAtalho && !clicouNoMenu) {
            closeLanguageMenu();
        }
    });
}

if (modalTrigger && modal) {
    modalTrigger.onclick = function () {
        openContactModal();
    };
}

modalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        closeContactModal();
    });
});

serviceModalCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        closeServiceModal();
    });
});

portfolioFormCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        closePortfolioFormModal();
    });
});

if (openServiceModalButton) {
    openServiceModalButton.addEventListener("click", () => {
        closeContactModal();
        openServiceModal();
    });
}

if (feedbackShortcut) {
    feedbackShortcut.addEventListener("click", () => {
        openPortfolioFormModal();
    });
}

if (chatShortcut) {
    chatShortcut.addEventListener("click", () => {
        showChatView();
    });
}

if (statusShortcut) {
    statusShortcut.addEventListener("click", () => {
        showStatusView();
    });
}

window.onclick = function (event) {
    if (event.target === modal) {
        closeContactModal();
    }

    if (event.target === serviceModal) {
        closeServiceModal();
    }

    if (event.target === portfolioFormModal) {
        closePortfolioFormModal();
    }
};

function openContactModal() {
    if (!modal) {
        return;
    }

    modal.style.display = "block";
    modal.setAttribute("aria-hidden", "false");
}

function closeContactModal() {
    if (!modal) {
        return;
    }

    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");
}

function openServiceModal() {
    if (!serviceModal) {
        return;
    }

    serviceModal.style.display = "block";
    serviceModal.setAttribute("aria-hidden", "false");
}

function closeServiceModal() {
    if (!serviceModal) {
        return;
    }

    serviceModal.style.display = "none";
    serviceModal.setAttribute("aria-hidden", "true");
}

function openPortfolioFormModal() {
    if (!portfolioFormModal) {
        return;
    }

    portfolioFormModal.style.display = "block";
    portfolioFormModal.setAttribute("aria-hidden", "false");
}

function closePortfolioFormModal() {
    if (!portfolioFormModal) {
        return;
    }

    portfolioFormModal.style.display = "none";
    portfolioFormModal.setAttribute("aria-hidden", "true");
}

initializeTheme();
initializeArquivados();
initializeSearch();
initializeFilters();
preloadAvatares();
distribuirCardsStatusPorId();
initializeLanguageControls();
atualizarEstadoBotaoLimpar();
setChatStatus("online");

initializeI18n().catch((error) => {
    console.error("Erro ao carregar traducoes i18next:", error);
});

window.abrirChat = abrirChat;
window.enviarMensagem = enviarMensagem;
window.verificarEnter = verificarEnter;