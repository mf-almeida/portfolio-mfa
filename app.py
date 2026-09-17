import os

import requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# 1. Flask
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# 2. Prompts por projeto (usados apenas se a IA estiver configurada)
PROMPTS_DOS_PROJETOS = {
    "matheus": """
        Você é o assistente virtual pessoal do Matheus Fonseca Almeida.
        Seu papel é agir como um assistente muito educado.
        Responda perguntas sobre a formação do Matheus, experiência profissional e tecnologias que ele domina (Python, Flask, JavaScript, HTML, CSS).
        Seja breve, profissional e amigável. Nunca invente dados que não estão aqui.
    """,
    "pdz": """
        Você é o engenheiro de software assistente do projeto "PDF-Z".
        PDF-Z é uma aplicação Flask para manipular PDFs (juntar, dividir, converter de/para Word e Imagem).
        A arquitetura tem foco na LGPD (processamento quase 100% em memória RAM usando BytesIO, sem gravar em disco, exceto para a conversão de Word que usa tempfile).
        Bibliotecas principais: Flask, PyMuPDF, pikepdf, pdf2docx.
        O sistema de progresso usa SSE (Server-Sent Events).
        Responda as dúvidas do usuário sobre como o PDF-Z foi construído ou como ele funciona internamente de forma técnica e objetiva.
    """,
    "swift-file": """
        Você é o assistente técnico do projeto "Swift-File".
        Swift-File é um explorador de arquivos otimizado focado em busca acelerada e performance extrema.
        (Adicione aqui o resumo técnico do Swift File depois).
        Responda apenas sobre este projeto.
    """,
    "game-verse": """
        Você é o assistente do projeto "Game-Verse".
        Game-Verse é uma plataforma de E-commerce.
        (Adicione aqui as tecnologias de Frontend, Banco de Dados, etc. do Game-Verse).
        Seja focado em explicar as decisões de negócio e de arquitetura deste E-commerce.
    """,
    "reunioes-aut": """
        Você é o assistente do projeto "Reuniões_aut".
        (Adicione aqui o resumo técnico do Reuniões_aut depois).
        Responda apenas sobre este projeto.
    """,
    "portfolio-interativo": """
        Você é o assistente do próprio Portfólio Interativo (este site).
        O portfólio é um front-end em HTML, CSS e JavaScript puro (sem framework, página única),
        com back-end em Flask, tema claro/escuro e tradução em pt/en/es via i18next.
        Por padrão o chat responde com perguntas prontas, sem custo; existe um gancho opcional
        para IA via Hugging Face, ativado apenas se um token for configurado no servidor — nunca
        um serviço pago ou cartão de crédito.
        A interface é inspirada no layout do WhatsApp Web, escolhida por trazer um padrão visual
        já familiar ao usuário e reduzir o atrito de quem navega pela primeira vez.
        O maior desafio técnico foi montar uma navegação parecida com uma SPA (como React) sem
        usar nenhum framework, preservando o histórico das conversas no localStorage do navegador.
        O código já existe; ainda não foi decidido torná-lo público, mas a ideia é evoluir essa
        arquitetura (perguntas prontas + IA opcional) para uma versão open-source de chat interno
        de dúvidas para colaboradores.
        Responda apenas sobre como este portfólio foi construído.
    """
}

# 3. IA opcional via Hugging Face (Inference API gratuito)
#
# Nada aqui é chamado por padrão. A IA só entra em ação se a variável de
# ambiente HF_API_TOKEN estiver definida (token gratuito, sem cartão de
# credito, gerado em https://huggingface.co/settings/tokens). Sem o token,
# o /chat responde com a mensagem estática abaixo e as perguntas prontas do
# front-end continuam funcionando normalmente, sem nenhuma chamada externa.
HF_API_TOKEN = os.environ.get("HF_API_TOKEN", "").strip()
HF_MODEL = os.environ.get("HF_MODEL", "HuggingFaceH4/zephyr-7b-beta").strip()
HF_API_URL = f"https://api-inference.huggingface.co/models/{HF_MODEL}"
HF_TIMEOUT_SEGUNDOS = 20


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


# 4. Rotas
@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/.well-known/appspecific/com.chrome.devtools.json")
def chrome_devtools_well_known():
    return ("", 204)


@app.route("/chat", methods=["POST"])
def chat():
    dados = request.get_json(silent=True) or {}

    id_projeto = dados.get("projeto")
    mensagem_usuario = dados.get("mensagem")

    if not id_projeto or not mensagem_usuario:
        return jsonify({"erro": "Projeto ou mensagem ausente"}), 400

    prompt_sistema = PROMPTS_DOS_PROJETOS.get(id_projeto)

    if not HF_API_TOKEN or not prompt_sistema:
        return jsonify({
            "resposta": "No momento estou respondendo com perguntas prontas. "
                        "Escolha uma das perguntas sugeridas ou reformule sua mensagem."
        })

    try:
        texto_resposta = perguntar_para_hugging_face(prompt_sistema, mensagem_usuario)
        return jsonify({"resposta": texto_resposta})
    except Exception as e:
        print(f"Erro ao consultar a Hugging Face: {str(e)}")
        return jsonify({
            "resposta": "Não consegui falar com a IA agora. Tente uma das perguntas sugeridas."
        })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
