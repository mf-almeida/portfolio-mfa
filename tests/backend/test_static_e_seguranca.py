"""Testes de arquivos estáticos servidos a partir de public/ e da regressão
de segurança: código-fonte do servidor (app.py, services/) não pode ser
acessível via HTTP, já que o static_folder é "public" e não "." (raiz).
"""


def test_home_retorna_index_html(client):
    resposta = client.get("/")
    assert resposta.status_code == 200
    assert "text/html" in resposta.content_type


def test_home_carrega_o_entrypoint_js_como_modulo(client):
    """Regressão: um restore de backup mal feito durante testes manuais já
    fez essa tag reverter para o script.js monolítico antigo (removido do
    repo), deixando o site sem nenhum JavaScript funcionando em produção
    mesmo com todos os outros testes automatizados passando.
    """
    html = client.get("/").get_data(as_text=True)
    assert '<script type="module" src="js/main.js"></script>' in html
    assert "script.js" not in html.replace("js/main.js", "")


def test_style_css_e_servido(client):
    resposta = client.get("/style.css")
    assert resposta.status_code == 200


def test_main_js_e_servido(client):
    resposta = client.get("/js/main.js")
    assert resposta.status_code == 200


def test_locale_pt_e_servido(client):
    resposta = client.get("/locales/pt/translation.json")
    assert resposta.status_code == 200


def test_app_py_nao_e_acessivel_via_http(client):
    resposta = client.get("/app.py")
    assert resposta.status_code == 404


def test_services_projetos_py_nao_e_acessivel_via_http(client):
    resposta = client.get("/services/projetos.py")
    assert resposta.status_code == 404


def test_chrome_devtools_well_known_retorna_204(client):
    resposta = client.get("/.well-known/appspecific/com.chrome.devtools.json")
    assert resposta.status_code == 204
