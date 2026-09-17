"""IA opcional via Hugging Face (Inference API gratuito).

Nada aqui é chamado por padrão. A IA só entra em ação se a variável de
ambiente HF_API_TOKEN estiver definida (token gratuito, sem cartão de
crédito, gerado em https://huggingface.co/settings/tokens). Sem o token,
o /chat responde com a mensagem estática e as perguntas prontas do
front-end continuam funcionando normalmente, sem nenhuma chamada externa.
"""
import os

import requests

HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "").strip()
HF_MODEL = os.environ.get("HF_MODEL", "HuggingFaceH4/zephyr-7b-beta").strip()
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HF_TIMEOUT_SEGUNDOS = 20


def ia_esta_configurada():
    return bool(HF_API_TOKEN)


def perguntar_para_hugging_face(prompt_sistema, pergunta_usuario):
    payload = {
        "inputs": f"{prompt_sistema.strip()}\n\nPergunta do visitante: {pergunta_usuario}\nResposta:",
        "parameters": {"max_new_tokens": 200, "return_full_text": False},
    }
    headers = {"Authorization": f"Bearer {HF_API_TOKEN}"}

    resposta = requests.post(HF_API_URL, headers=headers, json=payload, timeout=HF_TIMEOUT_SEGUNDOS)
    resposta.raise_for_status()
    dados = resposta.json()

    if isinstance(dados, list) and dados and "generated_text" in dados[0]:
        return dados[0]["generated_text"].strip()

    raise ValueError(f"Formato de resposta inesperado da Hugging Face: {dados}")
