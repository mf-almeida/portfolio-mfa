"""Testes da rota POST /chat: validação de entrada e os três caminhos de
resposta (IA não configurada / projeto inexistente / IA configurada)."""
import services.hugging_face as hugging_face


MENSAGEM_PERGUNTAS_PRONTAS = "perguntas prontas"


def test_chat_sem_projeto_retorna_400(client):
    resposta = client.post("/chat", json={"mensagem": "oi"})
    assert resposta.status_code == 400
    corpo = resposta.get_json()
    assert "erro" in corpo


def test_chat_sem_mensagem_retorna_400(client):
    resposta = client.post("/chat", json={"projeto": "pdz"})
    assert resposta.status_code == 400
    corpo = resposta.get_json()
    assert "erro" in corpo


def test_chat_sem_projeto_e_sem_mensagem_retorna_400(client):
    resposta = client.post("/chat", json={})
    assert resposta.status_code == 400
    corpo = resposta.get_json()
    assert "erro" in corpo


def test_chat_projeto_valido_sem_ia_configurada_usa_perguntas_prontas(client, monkeypatch):
    monkeypatch.setattr(hugging_face, "HF_API_TOKEN", "")

    resposta = client.post("/chat", json={"projeto": "pdz", "mensagem": "O que é o PDZ?"})

    assert resposta.status_code == 200
    corpo = resposta.get_json()
    assert MENSAGEM_PERGUNTAS_PRONTAS in corpo["resposta"]


def test_chat_projeto_inexistente_usa_mensagem_estatica_mesmo_com_ia_configurada(client, monkeypatch):
    # Mesmo com a IA "configurada", como o projeto não existe,
    # montar_prompt_sistema retorna None e a rota deve cair no fallback.
    monkeypatch.setattr(hugging_face, "HF_API_TOKEN", "token-falso")

    resposta = client.post("/chat", json={"projeto": "projeto-que-nao-existe", "mensagem": "oi"})

    assert resposta.status_code == 200
    corpo = resposta.get_json()
    assert MENSAGEM_PERGUNTAS_PRONTAS in corpo["resposta"]


def test_chat_projeto_valido_com_ia_configurada_retorna_resposta_da_ia(client, monkeypatch):
    monkeypatch.setattr(hugging_face, "HF_API_TOKEN", "token-falso")

    texto_fixo = "Resposta fixa simulada da IA."

    def ia_falsa(prompt_sistema, mensagem_usuario):
        return texto_fixo

    # app.py faz `from services.hugging_face import perguntar_para_hugging_face`,
    # então o nome vinculado no módulo app é uma referência própria: para
    # interceptar a chamada feita dentro de app.chat() é preciso substituir
    # o nome em app, e não em services.hugging_face.
    monkeypatch.setattr("app.perguntar_para_hugging_face", ia_falsa)

    resposta = client.post("/chat", json={"projeto": "pdz", "mensagem": "O que é o PDZ?"})

    assert resposta.status_code == 200
    assert resposta.get_json() == {"resposta": texto_fixo}


def test_chat_com_ia_configurada_mas_que_lanca_excecao_cai_no_fallback(client, monkeypatch):
    monkeypatch.setattr(hugging_face, "HF_API_TOKEN", "token-falso")

    def ia_com_erro(prompt_sistema, mensagem_usuario):
        raise RuntimeError("falha simulada de rede")

    monkeypatch.setattr("app.perguntar_para_hugging_face", ia_com_erro)

    resposta = client.post("/chat", json={"projeto": "pdz", "mensagem": "O que é o PDZ?"})

    assert resposta.status_code == 200
    corpo = resposta.get_json()
    assert "Não consegui falar com a IA agora" in corpo["resposta"]
