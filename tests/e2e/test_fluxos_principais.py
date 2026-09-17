#!/usr/bin/env python3
"""
Suite de testes E2E (Playwright, navegador real) para os fluxos principais
visiveis pro usuario do portfolio, apos a refatoracao do backend
(app.py + services/) e do front-end (public/js/*.js modulos ES).

Roda de forma independente de pytest:
    python3 tests/e2e/test_fluxos_principais.py

Nao altera nada em public/, app.py ou services/ de forma permanente: o
unico arquivo tocado (public/index.html, pra trocar o <script> do i18next
por uma copia local, ja que o sandbox bloqueia unpkg.com) e restaurado ao
final via `git checkout`, e o arquivo local copiado (public/i18next.local.js)
e apagado.
"""

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

REPO_ROOT = "/home/user/portfolio-mfa"
PUBLIC_DIR = os.path.join(REPO_ROOT, "public")
INDEX_HTML = os.path.join(PUBLIC_DIR, "index.html")
I18NEXT_LOCAL = os.path.join(PUBLIC_DIR, "i18next.local.js")
CHROMIUM_PATH = "/opt/pw-browsers/chromium"
PORT = 5057
BASE_URL = f"http://127.0.0.1:{PORT}/"

CHAT_IDS = ["matheus", "pdz", "swift-file", "reunioes-aut", "portfolio-interativo"]
ARCHIVED_CHAT_ID = "game-verse"

# ---------------------------------------------------------------------------
# Registro de resultados
# ---------------------------------------------------------------------------

results = []  # lista de dicts: {"flow": str, "name": str, "ok": bool, "detail": str}


def record(flow, name, ok, detail=""):
    results.append({"flow": flow, "name": name, "ok": ok, "detail": detail})
    status = "PASS" if ok else "FAIL"
    print(f"[{status}] ({flow}) {name}" + (f" -- {detail}" if detail else ""))


def check(flow, name, fn):
    """Executa fn() (que deve fazer asserts) e registra PASS/FAIL sem abortar."""
    try:
        fn()
        record(flow, name, True)
    except AssertionError as e:
        record(flow, name, False, str(e))
    except Exception as e:  # erros inesperados (timeouts do Playwright etc.)
        record(flow, name, False, f"{type(e).__name__}: {e}")


# ---------------------------------------------------------------------------
# Helpers de dominio
# ---------------------------------------------------------------------------

def load_locale(lang):
    path = os.path.join(PUBLIC_DIR, "locales", lang, "translation.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def wait_for_i18n_ready(page, timeout=15000):
    page.wait_for_function(
        "() => window.i18next && window.i18next.isInitialized === true",
        timeout=timeout,
    )


def open_chat(page, chat_id):
    page.click(f"button[onclick=\"abrirChat('{chat_id}')\"]")


def perguntas_rapidas_locator(page):
    return page.locator("#perguntas-rapidas .pergunta-rapida")


def baloes_locator(page):
    return page.locator("#chat-mensagens .balao-mensagem")


# ---------------------------------------------------------------------------
# Fluxos
# ---------------------------------------------------------------------------

def fluxo_1_carregamento(page):
    flow = "1-carregamento"

    def _titulo_ou_elemento_chave():
        title = page.title()
        modal_trigger = page.locator("#modal-trigger")
        assert (
            "Portfolio" in title or "Mfalmeida" in title or "Portfólio" in title
        ) or modal_trigger.count() == 1, (
            f"titulo inesperado ({title!r}) e #modal-trigger nao encontrado"
        )
        assert modal_trigger.count() == 1, "#modal-trigger nao encontrado na pagina"
        assert page.locator(".app").count() == 1, "container .app nao encontrado"

    check(flow, "pagina carrega com titulo/elemento chave presente", _titulo_ou_elemento_chave)
    # A verificacao "sem pageerror" e feita ao final do script (fluxo_1_sem_pageerrors),
    # depois que todos os outros fluxos ja rodaram, pois cobre a execucao inteira.


def fluxo_1_sem_pageerrors(pageerrors):
    flow = "1-carregamento"

    def _sem_pageerrors():
        assert not pageerrors, (
            f"{len(pageerrors)} pageerror(s) capturado(s) durante a execucao: {pageerrors}"
        )

    check(flow, "nenhum pageerror (excecao JS nao tratada) durante toda a execucao", _sem_pageerrors)


def fluxo_2_chats(page):
    flow = "2-chats"

    for chat_id in CHAT_IDS:
        def _abrir_e_conversar(chat_id=chat_id):
            open_chat(page, chat_id)
            perguntas = perguntas_rapidas_locator(page)
            perguntas.first.wait_for(state="visible", timeout=5000)
            assert perguntas.count() >= 1, f"nenhuma .pergunta-rapida encontrada para '{chat_id}'"

            baloes_antes = baloes_locator(page).count()
            perguntas.first.click()
            # a resposta do bot chega depois de um setTimeout(350ms) em chat.js
            page.wait_for_timeout(700)
            baloes_depois = baloes_locator(page).count()
            assert baloes_depois - baloes_antes >= 2, (
                f"esperava pelo menos +2 .balao-mensagem apos clicar na pergunta pronta de "
                f"'{chat_id}', mas foi de {baloes_antes} para {baloes_depois}"
            )

        check(flow, f"chat '{chat_id}' abre, mostra pergunta pronta e responde", _abrir_e_conversar)

    # game-verse fica dentro da secao de arquivados: precisa abrir o toggle antes.
    def _abrir_game_verse():
        lista_arquivados = page.locator("#lista-arquivados")
        if lista_arquivados.is_hidden():
            page.click("#toggle-arquivados")
            lista_arquivados.wait_for(state="visible", timeout=3000)

        open_chat(page, ARCHIVED_CHAT_ID)
        perguntas = perguntas_rapidas_locator(page)
        perguntas.first.wait_for(state="visible", timeout=5000)
        assert perguntas.count() >= 1, "nenhuma .pergunta-rapida encontrada para 'game-verse'"

        baloes_antes = baloes_locator(page).count()
        perguntas.first.click()
        page.wait_for_timeout(700)
        baloes_depois = baloes_locator(page).count()
        assert baloes_depois - baloes_antes >= 2, (
            f"esperava pelo menos +2 .balao-mensagem apos clicar na pergunta pronta de "
            f"'game-verse', mas foi de {baloes_antes} para {baloes_depois}"
        )

    check(flow, "chat arquivado 'game-verse' abre (via toggle) e responde", _abrir_game_verse)


def fluxo_3_toggle_arquivados(page):
    flow = "3-toggle-arquivados"

    def _alterna_hidden():
        toggle = page.locator("#toggle-arquivados")
        lista = page.locator("#lista-arquivados")

        # garante estado inicial conhecido: fechado (hidden=True)
        if not lista.is_hidden():
            toggle.click()
            lista.wait_for(state="hidden", timeout=3000)

        estado_inicial_hidden = lista.evaluate("el => el.hidden")
        assert estado_inicial_hidden is True, "estado inicial esperado: #lista-arquivados hidden"

        toggle.click()
        page.wait_for_timeout(150)
        estado_aberto_hidden = lista.evaluate("el => el.hidden")
        assert estado_aberto_hidden is False, "apos 1o clique, #lista-arquivados deveria ficar visivel (hidden=False)"

        toggle.click()
        page.wait_for_timeout(150)
        estado_fechado_hidden = lista.evaluate("el => el.hidden")
        assert estado_fechado_hidden is True, "apos 2o clique, #lista-arquivados deveria voltar a ficar oculto (hidden=True)"

    check(flow, "#toggle-arquivados alterna o atributo hidden de #lista-arquivados", _alterna_hidden)


def fluxo_4_busca(page):
    flow = "4-busca"

    def _busca_filtra_pdz():
        search_bar = page.locator("#search-bar")
        search_bar.fill("")
        search_bar.fill("pdz")
        page.wait_for_timeout(150)

        cards = page.locator(".conversas-fechadas > .chat-fechado-container")
        count = cards.count()
        assert count > 0, "nenhum card de conversa encontrado"

        visiveis = []
        ocultos = []
        for i in range(count):
            card = cards.nth(i)
            onclick = card.get_attribute("onclick") or ""
            display = card.evaluate("el => el.style.display")
            if "pdz" in onclick:
                visiveis.append((onclick, display))
            else:
                ocultos.append((onclick, display))

        assert visiveis, "card do PDZ nao encontrado entre as conversas nao-arquivadas"
        for onclick, display in visiveis:
            assert display != "none", f"card do PDZ ({onclick}) deveria estar visivel, mas display={display!r}"

        for onclick, display in ocultos:
            assert display == "none", (
                f"card '{onclick}' deveria estar oculto durante busca por 'pdz', mas display={display!r}"
            )

    check(flow, "buscar 'pdz' mostra so o card do PDZ (demais com display:none)", _busca_filtra_pdz)

    def _limpar_busca_mostra_todos():
        search_bar = page.locator("#search-bar")
        search_bar.fill("")
        page.wait_for_timeout(150)

        cards = page.locator(".conversas-fechadas > .chat-fechado-container")
        count = cards.count()
        for i in range(count):
            card = cards.nth(i)
            display = card.evaluate("el => el.style.display")
            onclick = card.get_attribute("onclick") or ""
            assert display != "none", f"card '{onclick}' deveria voltar a ficar visivel apos limpar a busca, mas display={display!r}"

    check(flow, "limpar a busca mostra todas as conversas de novo", _limpar_busca_mostra_todos)


def fluxo_5_tema(page):
    flow = "5-tema"

    def _toggle_e_persistencia():
        body_tem_light_antes = page.eval_on_selector("body", "el => el.classList.contains('light')")

        page.click("#theme-toggle")
        page.wait_for_timeout(100)
        body_tem_light_depois = page.eval_on_selector("body", "el => el.classList.contains('light')")
        assert body_tem_light_depois != body_tem_light_antes, (
            "classe 'light' do <body> nao alternou apos clicar em #theme-toggle"
        )

        page.reload()
        wait_for_i18n_ready(page)
        body_tem_light_pos_reload = page.eval_on_selector("body", "el => el.classList.contains('light')")
        assert body_tem_light_pos_reload == body_tem_light_depois, (
            f"escolha de tema nao persistiu apos reload: esperava light={body_tem_light_depois}, "
            f"obteve light={body_tem_light_pos_reload}"
        )

    check(flow, "#theme-toggle alterna classe 'light' e persiste apos reload", _toggle_e_persistencia)


def fluxo_6_idioma(page, locale_pt, locale_en):
    flow = "6-idioma"

    def _troca_idioma_e_html_lang():
        page.click("#language-shortcut")
        page.click(".language-option[data-language=\"en\"]")
        page.wait_for_timeout(200)

        html_lang = page.eval_on_selector("html", "el => el.lang")
        assert html_lang == "en", f"esperava <html lang=\"en\">, obteve lang={html_lang!r}"

    check(flow, "trocar idioma para 'en' muda o atributo lang do <html>", _troca_idioma_e_html_lang)

    def _chat_reaberto_fica_em_ingles():
        chat_id = "reunioes-aut"
        faq_key = "faq_reunioes_aut"

        texto_pt_esperado = locale_pt[faq_key][0]["q"]
        texto_en_esperado = locale_en[faq_key][0]["q"]
        assert texto_pt_esperado != texto_en_esperado, (
            "fixture de teste invalida: textos pt/en da pergunta pronta sao iguais"
        )

        open_chat(page, chat_id)
        perguntas = perguntas_rapidas_locator(page)
        perguntas.first.wait_for(state="visible", timeout=5000)

        texto_renderizado = perguntas.first.inner_text()
        assert texto_renderizado == texto_en_esperado, (
            f"pergunta pronta renderizada ({texto_renderizado!r}) nao bate com o texto em ingles "
            f"esperado ({texto_en_esperado!r}) -- possivel falha na comunicacao i18n <-> chat"
        )
        assert texto_renderizado != texto_pt_esperado, (
            "pergunta pronta ainda esta em portugues apos trocar o idioma para ingles"
        )

    check(
        flow,
        "reabrir um chat depois de trocar o idioma mostra pergunta pronta traduzida (i18n <-> chat)",
        _chat_reaberto_fica_em_ingles,
    )


def fluxo_7_modal_contato(page):
    flow = "7-modal-contato"

    def _abre_e_fecha_pelo_icone():
        modal = page.locator("#modal")
        page.click("#modal-trigger")
        page.wait_for_timeout(100)
        display_aberto = modal.evaluate("el => getComputedStyle(el).display")
        assert display_aberto != "none", f"#modal deveria estar visivel apos clicar em #modal-trigger, display={display_aberto!r}"

        page.click(".modal-close-icon")
        page.wait_for_timeout(100)
        display_fechado = modal.evaluate("el => getComputedStyle(el).display")
        assert display_fechado == "none", f"#modal deveria fechar ao clicar em .modal-close-icon, display={display_fechado!r}"

    check(flow, "modal de contato abre pelo icone e fecha pelo X", _abre_e_fecha_pelo_icone)

    def _fecha_clicando_fora():
        modal = page.locator("#modal")
        page.click("#modal-trigger")
        page.wait_for_timeout(100)
        display_aberto = modal.evaluate("el => getComputedStyle(el).display")
        assert display_aberto != "none", "#modal deveria estar visivel apos reabrir pelo icone"

        # clica num ponto do proprio #modal (o backdrop), longe do .modal-content
        # centralizado (que tem margin-top de 8vh) -- garante que o clique
        # atinja o backdrop e nao o conteudo do modal.
        box = modal.bounding_box()
        assert box is not None, "nao foi possivel obter bounding box de #modal"
        page.mouse.click(box["x"] + 5, box["y"] + 5)
        page.wait_for_timeout(100)

        display_fechado = modal.evaluate("el => getComputedStyle(el).display")
        assert display_fechado == "none", (
            f"#modal deveria fechar ao clicar fora (no backdrop), display={display_fechado!r}"
        )

    check(flow, "modal de contato fecha ao clicar fora dele (backdrop)", _fecha_clicando_fora)


# ---------------------------------------------------------------------------
# Infra: servidor Flask + navegador
# ---------------------------------------------------------------------------

def start_flask_server():
    env = os.environ.copy()
    proc = subprocess.Popen(
        [sys.executable, "-c", f"import app; app.app.run(port={PORT})"],
        cwd=REPO_ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )

    deadline = time.time() + 20
    last_error = None
    while time.time() < deadline:
        if proc.poll() is not None:
            output = proc.stdout.read() if proc.stdout else ""
            raise RuntimeError(f"servidor Flask encerrou prematuramente:\n{output}")
        try:
            with urllib.request.urlopen(BASE_URL, timeout=1) as resp:
                if resp.status == 200:
                    return proc
        except (urllib.error.URLError, ConnectionError) as e:
            last_error = e
        time.sleep(0.3)

    proc.terminate()
    raise RuntimeError(f"servidor Flask nao respondeu em {BASE_URL} a tempo: {last_error}")


def stop_flask_server(proc):
    if proc is None:
        return
    try:
        proc.terminate()
        proc.wait(timeout=5)
    except Exception:
        try:
            proc.kill()
            proc.wait(timeout=5)
        except Exception:
            pass


def print_summary():
    total = len(results)
    passed = sum(1 for r in results if r["ok"])
    failed = total - passed

    print("\n" + "=" * 78)
    print("RESUMO DOS TESTES E2E")
    print("=" * 78)
    print(f"{'FLUXO':<22} {'STATUS':<6} NOME")
    print("-" * 78)
    for r in results:
        status = "PASS" if r["ok"] else "FAIL"
        print(f"{r['flow']:<22} {status:<6} {r['name']}")
    print("-" * 78)
    print(f"Total: {total}  |  Passou: {passed}  |  Falhou: {failed}")

    if failed:
        print("\nDetalhes das falhas:")
        for r in results:
            if not r["ok"]:
                print(f"  - [{r['flow']}] {r['name']}")
                print(f"      {r['detail']}")
    print("=" * 78)

    return failed


def main():
    flask_proc = None
    exit_code = 1

    try:
        flask_proc = start_flask_server()
        print(f"Servidor Flask no ar em {BASE_URL}")

        locale_pt = load_locale("pt")
        locale_en = load_locale("en")

        with sync_playwright() as p:
            browser = p.chromium.launch(executable_path=CHROMIUM_PATH)
            context = browser.new_context()
            page = context.new_page()

            pageerrors = []
            page.on("pageerror", lambda exc: pageerrors.append(str(exc)))

            page.goto(BASE_URL, wait_until="load")
            wait_for_i18n_ready(page)

            fluxo_1_carregamento(page)
            fluxo_2_chats(page)
            fluxo_3_toggle_arquivados(page)
            fluxo_4_busca(page)
            fluxo_5_tema(page)
            fluxo_6_idioma(page, locale_pt, locale_en)
            fluxo_7_modal_contato(page)

            # feito por ultimo: cobre pageerrors acumulados durante toda a execucao acima
            fluxo_1_sem_pageerrors(pageerrors)

            context.close()
            browser.close()

        failed = print_summary()
        exit_code = 1 if failed else 0

    finally:
        stop_flask_server(flask_proc)

        # limpeza obrigatoria do contorno do i18next (unpkg bloqueado no sandbox)
        try:
            subprocess.run(
                ["git", "checkout", "--", "public/index.html"],
                cwd=REPO_ROOT,
                check=True,
            )
        except Exception as e:
            print(f"AVISO: falha ao restaurar public/index.html via git checkout: {e}")

        if os.path.exists(I18NEXT_LOCAL):
            try:
                os.remove(I18NEXT_LOCAL)
            except Exception as e:
                print(f"AVISO: falha ao remover {I18NEXT_LOCAL}: {e}")

        status_proc = subprocess.run(
            ["git", "status", "--short"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
        )
        print("\ngit status --short (apos limpeza):")
        print(status_proc.stdout or "(vazio)")

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
