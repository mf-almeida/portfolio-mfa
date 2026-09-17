"""Fonte única da verdade para o conteúdo de cada projeto do portfólio.

O prompt da IA opcional (usado só se a Hugging Face estiver configurada) é
montado dinamicamente a partir das perguntas e respostas em português que já
existem em public/locales/pt/translation.json — as mesmas exibidas como
"perguntas prontas" no chat. Isso evita ter que editar o mesmo fato em dois
lugares (locale + prompt) toda vez que um projeto muda.
"""
import json
import os

_DIR_ATUAL = os.path.dirname(os.path.abspath(__file__))
_CAMINHO_LOCALE_PT = os.path.join(_DIR_ATUAL, "..", "public", "locales", "pt", "translation.json")

_INSTRUCOES_GERAIS = """
Você é o assistente virtual do portfólio interativo de Matheus Fonseca Almeida.
Responda de forma breve, profissional e amigável, sempre em português do Brasil.
Baseie-se exclusivamente nas perguntas e respostas de referência abaixo sobre
este tópico. Nunca invente dados que não estejam nesta referência.

Perguntas e respostas de referência:
""".strip()


def _chave_faq(id_projeto):
    return f"faq_{id_projeto.replace('-', '_')}"


def _carregar_traducoes_pt(caminho=_CAMINHO_LOCALE_PT):
    with open(caminho, encoding="utf-8") as arquivo:
        return json.load(arquivo)


_traducoes_pt = _carregar_traducoes_pt()


def projeto_existe(id_projeto):
    return _chave_faq(id_projeto) in _traducoes_pt


def montar_prompt_sistema(id_projeto):
    """Retorna o prompt de sistema para `id_projeto`, ou None se ele não existir."""
    perguntas_e_respostas = _traducoes_pt.get(_chave_faq(id_projeto))
    if not perguntas_e_respostas:
        return None

    referencia = "\n".join(
        f"P: {item['q']}\nR: {item['a']}" for item in perguntas_e_respostas
    )
    return f"{_INSTRUCOES_GERAIS}\n{referencia}"
