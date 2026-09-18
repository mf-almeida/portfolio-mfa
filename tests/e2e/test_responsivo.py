#!/usr/bin/env python3
"""
Suite de testes E2E (Playwright, navegador real) para o layout responsivo:
navegacao mobile de tela unica (lista OU chat OU status, nunca duas ao
mesmo tempo) com a barra de icones lateral virando um menu hamburguer
(drawer), mantendo o layout desktop de 3 colunas intacto.

Complementa tests/e2e/test_fluxos_principais.py (que cobre os fluxos
gerais em viewport desktop) - roda de forma independente:
    python3 tests/e2e/test_responsivo.py

Reaproveita os helpers de setup/teardown/registro de resultados de
test_fluxos_principais.py (mesmo servidor Flask numa porta dedicada, mesmo
contorno do i18next via unpkg bloqueado neste sandbox, mesma limpeza via
`git checkout` + remocao do arquivo local ao final).
"""

import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from test_fluxos_principais import (  # noqa: E402
    BASE_URL,
    CHROMIUM_PATH,
    REPO_ROOT,
    I18NEXT_LOCAL,
    check,
    print_summary,
    record,
    results,
    start_flask_server,
    stop_flask_server,
    wait_for_i18n_ready,
)

from playwright.sync_api import sync_playwright

MOBILE_VIEWPORT = {"width": 375, "height": 812}
DESKTOP_VIEWPORT = {"width": 1280, "height": 900}


def abrir_menu(page):
    page.click("#mobile-menu-toggle")
    page.wait_for_timeout(350)


def open_chat(page, chat_id):
    page.click(f"button[onclick=\"abrirChat('{chat_id}')\"]")


def display_de(page, seletor):
    return page.eval_on_selector(seletor, "el => getComputedStyle(el).display")


def fluxo_mobile_tela_unica(page):
    flow = "mobile-tela-unica"

    def _sidebar_comeca_fora_da_tela():
        transform = page.eval_on_selector(".barra-lateral-de-icones", "el => getComputedStyle(el).transform")
        assert "matrix" in transform, f"esperava transform aplicado, veio {transform!r}"

    def _lista_visivel_chat_escondido_no_load():
        assert display_de(page, ".lista-de-conversas") == "flex"
        assert display_de(page, ".conversa-aberta") == "none"

    def _hamburguer_visivel():
        assert display_de(page, "#mobile-menu-toggle") == "flex"

    check(flow, "sidebar comeca fora da tela (off-canvas)", _sidebar_comeca_fora_da_tela)
    check(flow, "lista visivel e chat escondido no carregamento", _lista_visivel_chat_escondido_no_load)
    check(flow, "botao hamburguer visivel", _hamburguer_visivel)


def fluxo_mobile_drawer(page):
    flow = "mobile-drawer"

    def _abre_ao_clicar():
        abrir_menu(page)
        aberto = page.eval_on_selector(".app", "el => el.classList.contains('menu-aberto')")
        assert aberto, "menu nao abriu"

    def _fecha_ao_clicar_item():
        page.click("#status-shortcut")
        page.wait_for_timeout(400)
        aberto = page.eval_on_selector(".app", "el => el.classList.contains('menu-aberto')")
        assert not aberto, "menu deveria fechar sozinho ao navegar"
        assert display_de(page, "#status-view") == "flex"

    def _fecha_ao_clicar_no_backdrop():
        abrir_menu(page)
        page.click("#mobile-menu-backdrop", force=True)
        page.wait_for_timeout(350)
        aberto = page.eval_on_selector(".app", "el => el.classList.contains('menu-aberto')")
        assert not aberto, "menu nao fechou ao clicar no backdrop"

    check(flow, "abre ao clicar no hamburguer", _abre_ao_clicar)
    check(flow, "fecha sozinho ao clicar num item (e navega)", _fecha_ao_clicar_item)
    check(flow, "fecha ao clicar no backdrop", _fecha_ao_clicar_no_backdrop)

    # volta pro estado inicial (lista) pros proximos fluxos
    abrir_menu(page)
    page.click("#chat-shortcut")
    page.wait_for_timeout(300)


def fluxo_mobile_chat_tela_cheia(page):
    flow = "mobile-chat"

    def _abrir_chat_esconde_lista_e_mostra_chat():
        open_chat(page, "pdz")
        page.wait_for_timeout(400)
        assert display_de(page, ".lista-de-conversas") == "none"
        assert display_de(page, ".conversa-aberta") == "flex"

    def _botao_voltar_visivel_e_hamburguer_some():
        assert display_de(page, "#chat-voltar") == "flex"
        assert display_de(page, "#mobile-menu-toggle") == "none", "hamburguer nao deveria sobrepor o cabecalho do chat"

    def _voltar_retorna_pra_lista():
        page.click("#chat-voltar")
        page.wait_for_timeout(300)
        assert display_de(page, ".lista-de-conversas") == "flex"
        assert display_de(page, ".conversa-aberta") == "none"
        assert display_de(page, "#mobile-menu-toggle") == "flex", "hamburguer deveria reaparecer fora do chat"

    def _sem_chat_aberto_menu_chat_mostra_lista():
        # Dentro do chat o hamburguer fica escondido de proposito (o botao
        # de voltar ja cobre a navegacao) - so da pra alcancar o Status a
        # partir da lista, nunca de dentro de um chat aberto. Depois de
        # voltar, o menu "Chat" deve levar pra lista (chatAtivo foi limpo
        # pelo botao de voltar).
        abrir_menu(page)
        page.click("#status-shortcut")
        page.wait_for_timeout(400)
        abrir_menu(page)
        page.click("#chat-shortcut")
        page.wait_for_timeout(400)
        assert display_de(page, ".lista-de-conversas") == "flex"
        assert display_de(page, ".conversa-aberta") == "none"

    check(flow, "abrir chat esconde a lista e ocupa a tela", _abrir_chat_esconde_lista_e_mostra_chat)
    check(flow, "botao voltar visivel / hamburguer some dentro do chat", _botao_voltar_visivel_e_hamburguer_some)
    check(flow, "botao voltar retorna pra lista e hamburguer reaparece", _voltar_retorna_pra_lista)
    check(flow, "sem chat aberto, menu 'Chat' leva pra lista", _sem_chat_aberto_menu_chat_mostra_lista)


def fluxo_mobile_modal_acima_de_tudo(page):
    flow = "mobile-modal"

    def _modal_abre_por_cima_do_menu():
        abrir_menu(page)
        page.click("#modal-trigger")
        page.wait_for_timeout(300)
        aberto = page.eval_on_selector(".app", "el => el.classList.contains('menu-aberto')")
        assert not aberto, "abrir um item do drawer deveria fechar o drawer"
        assert page.eval_on_selector("#modal", "el => el.style.display") == "block"
        z_modal = int(page.eval_on_selector("#modal", "el => getComputedStyle(el).zIndex"))
        z_hamburguer = int(page.eval_on_selector("#mobile-menu-toggle", "el => getComputedStyle(el).zIndex"))
        assert z_modal > z_hamburguer, f"modal (z={z_modal}) deveria ficar acima do hamburguer (z={z_hamburguer})"
        page.click(".modal-close-icon")
        page.wait_for_timeout(200)

    check(flow, "modal de contato abre por cima do menu mobile", _modal_abre_por_cima_do_menu)


def fluxo_breakpoint(browser):
    flow = "breakpoint"

    def _checar_largura(largura, espera_mobile):
        page = browser.new_page(viewport={"width": largura, "height": 800}, locale="pt-BR")
        page.goto(BASE_URL, wait_until="load")
        wait_for_i18n_ready(page)
        hamburguer_visivel = display_de(page, "#mobile-menu-toggle") == "flex"
        page.close()
        assert hamburguer_visivel == espera_mobile, (
            f"em {largura}px esperava hamburguer {'visivel' if espera_mobile else 'escondido'}"
        )

    check(flow, "768px (limite) usa layout mobile", lambda: _checar_largura(768, True))
    check(flow, "769px ja usa layout desktop", lambda: _checar_largura(769, False))


def fluxo_desktop_nao_regrediu(browser):
    flow = "desktop-regressao"
    page = browser.new_page(viewport=DESKTOP_VIEWPORT, locale="pt-BR")
    page.goto(BASE_URL, wait_until="load")
    wait_for_i18n_ready(page)

    def _hamburguer_e_voltar_escondidos():
        assert display_de(page, "#mobile-menu-toggle") == "none"
        assert display_de(page, "#chat-voltar") == "none"

    def _lista_e_chat_juntos():
        open_chat(page, "pdz")
        page.wait_for_timeout(300)
        assert display_de(page, ".lista-de-conversas") == "flex"
        assert display_de(page, ".conversa-aberta") == "flex"

    check(flow, "hamburguer e botao voltar ficam escondidos", _hamburguer_e_voltar_escondidos)
    check(flow, "lista e chat continuam visiveis juntos (2 colunas)", _lista_e_chat_juntos)
    page.close()


def main():
    flask_proc = None
    exit_code = 1

    try:
        flask_proc = start_flask_server()
        print(f"Servidor Flask no ar em {BASE_URL}")

        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROMIUM_PATH)

            page = browser.new_page(viewport=MOBILE_VIEWPORT, locale="pt-BR")
            page.goto(BASE_URL, wait_until="load")
            wait_for_i18n_ready(page)

            fluxo_mobile_tela_unica(page)
            fluxo_mobile_drawer(page)
            fluxo_mobile_chat_tela_cheia(page)
            fluxo_mobile_modal_acima_de_tudo(page)
            page.close()

            fluxo_breakpoint(browser)
            fluxo_desktop_nao_regrediu(browser)

            browser.close()

        failed = print_summary()
        exit_code = 1 if failed else 0

    finally:
        stop_flask_server(flask_proc)

        try:
            subprocess.run(["git", "checkout", "--", "public/index.html"], cwd=REPO_ROOT, check=True)
        except Exception as e:
            print(f"AVISO: falha ao restaurar public/index.html via git checkout: {e}")

        if os.path.exists(I18NEXT_LOCAL):
            try:
                os.remove(I18NEXT_LOCAL)
            except Exception as e:
                print(f"AVISO: falha ao remover {I18NEXT_LOCAL}: {e}")

        status_proc = subprocess.run(
            ["git", "status", "--short"], cwd=REPO_ROOT, capture_output=True, text=True
        )
        print("\ngit status --short (apos limpeza):")
        print(status_proc.stdout or "(vazio)")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
