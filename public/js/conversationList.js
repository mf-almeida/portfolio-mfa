let currentConversationFilter = "all";
let currentConversationSearch = "";

function filtrarListaDeConversas(termo, listaConversas, botaoArquivada) {
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

export function initConversationList() {
    const searchBar = document.getElementById("search-bar");
    const filterButtons = document.querySelectorAll(".filtros button[data-filter]");
    const listaConversas = document.querySelectorAll(".conversas-fechadas > .chat-fechado-container");
    const botaoArquivada = document.getElementById("toggle-arquivados");
    const listaArquivados = document.getElementById("lista-arquivados");

    function aplicarFiltro(filterValue) {
        const filtrosPermitidos = ["all", "projects", "pinned"];
        currentConversationFilter = filtrosPermitidos.includes(filterValue) ? filterValue : "all";

        filterButtons.forEach((button) => {
            const isActive = button.dataset.filter === currentConversationFilter;
            button.classList.toggle("ativo", isActive);
            button.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        filtrarListaDeConversas(currentConversationSearch, listaConversas, botaoArquivada);
    }

    if (filterButtons.length) {
        filterButtons.forEach((button) => {
            button.addEventListener("click", () => {
                aplicarFiltro(button.dataset.filter);
            });
        });

        aplicarFiltro(currentConversationFilter);
    }

    if (searchBar) {
        searchBar.addEventListener("input", (event) => {
            filtrarListaDeConversas(event.target.value, listaConversas, botaoArquivada);
        });

        searchBar.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                searchBar.value = "";
                filtrarListaDeConversas("", listaConversas, botaoArquivada);
            }
        });
    }

    if (botaoArquivada && listaArquivados) {
        botaoArquivada.addEventListener("click", () => {
            const estaAberta = !listaArquivados.hidden;

            listaArquivados.hidden = estaAberta;
            botaoArquivada.setAttribute("aria-expanded", estaAberta ? "false" : "true");
            botaoArquivada.classList.toggle("aberta", !estaAberta);
        });
    }
}
