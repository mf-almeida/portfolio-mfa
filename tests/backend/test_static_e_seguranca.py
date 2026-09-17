"""Testes de arquivos estáticos servidos a partir de public/ e da regressão
de segurança: código-fonte do servidor (app.py, services/) não pode ser
acessível via HTTP, já que o static_folder é "public" e não "." (raiz).
"""


def test_home_retorna_index_html(client):
    resposta = client.get("/")
    assert resposta.status_code == 200
    assert "text/html" in resposta.content_type


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
