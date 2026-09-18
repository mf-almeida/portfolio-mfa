// Drawer mobile: reaproveita a própria .barra-lateral-de-icones como
// conteúdo do menu (nenhum botão é duplicado), só controla abrir/fechar.
export function initMobileMenu() {
    const appRoot = document.querySelector(".app");
    const toggle = document.getElementById("mobile-menu-toggle");
    const backdrop = document.getElementById("mobile-menu-backdrop");
    const sidebar = document.querySelector(".barra-lateral-de-icones");

    if (!appRoot || !toggle || !backdrop || !sidebar) {
        return;
    }

    function menuEstaAberto() {
        return appRoot.classList.contains("menu-aberto");
    }

    function abrirMenu() {
        appRoot.classList.add("menu-aberto");
        backdrop.hidden = false;
        toggle.setAttribute("aria-expanded", "true");
    }

    function fecharMenu() {
        appRoot.classList.remove("menu-aberto");
        backdrop.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
        if (menuEstaAberto()) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    });

    backdrop.addEventListener("click", fecharMenu);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuEstaAberto()) {
            fecharMenu();
        }
    });

    // Qualquer clique num item dentro do menu já executa a ação dele
    // (abrir chat, abrir modal, trocar tema...); só falta fechar o drawer.
    sidebar.addEventListener("click", () => {
        if (menuEstaAberto()) {
            fecharMenu();
        }
    });
}
