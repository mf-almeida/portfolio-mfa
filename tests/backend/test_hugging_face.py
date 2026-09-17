"""Testes de services/hugging_face.py: cliente HTTP da IA opcional. A
chamada de rede real (requests.post) é sempre simulada."""
import pytest

import services.hugging_face as hugging_face


class _RespostaFalsa:
    def __init__(self, dados_json):
        self._dados_json = dados_json

    def raise_for_status(self):
        pass

    def json(self):
        return self._dados_json


def test_perguntar_para_hugging_face_retorna_texto_gerado(monkeypatch):
    def post_falso(url, headers=None, json=None, timeout=None):
        return _RespostaFalsa([{"generated_text": "resposta simulada"}])

    monkeypatch.setattr(hugging_face.requests, "post", post_falso)

    resultado = hugging_face.perguntar_para_hugging_face("prompt de sistema", "pergunta do usuário")

    assert resultado == "resposta simulada"


def test_perguntar_para_hugging_face_faz_strip_no_texto_retornado(monkeypatch):
    def post_falso(url, headers=None, json=None, timeout=None):
        return _RespostaFalsa([{"generated_text": "  resposta com espaços  \n"}])

    monkeypatch.setattr(hugging_face.requests, "post", post_falso)

    resultado = hugging_face.perguntar_para_hugging_face("prompt", "pergunta")

    assert resultado == "resposta com espaços"


def test_perguntar_para_hugging_face_formato_inesperado_lanca_value_error(monkeypatch):
    def post_falso(url, headers=None, json=None, timeout=None):
        return _RespostaFalsa({})

    monkeypatch.setattr(hugging_face.requests, "post", post_falso)

    with pytest.raises(ValueError):
        hugging_face.perguntar_para_hugging_face("prompt", "pergunta")


def test_ia_esta_configurada_reflete_hf_api_token(monkeypatch):
    monkeypatch.setattr(hugging_face, "HF_API_TOKEN", "")
    assert hugging_face.ia_esta_configurada() is False

    monkeypatch.setattr(hugging_face, "HF_API_TOKEN", "algum-token-falso")
    assert hugging_face.ia_esta_configurada() is True
