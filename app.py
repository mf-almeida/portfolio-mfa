from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

# 1. Flask
app = Flask(__name__, static_folder=".", static_url_path="")
CORS(app)

# 2. Prompts por projeto
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
    """
}

# 3. Rotas
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

    try:
        texto_resposta = (
            "A integração com IA externa foi removida deste projeto. "
            "No momento, não há provedor configurado para responder automaticamente. "
            "Projeto selecionado: "
            f"{id_projeto}."
        )
        print(f"Chat recebido para o projeto: {id_projeto}")
        return jsonify({"resposta": texto_resposta})

    except Exception as e:
        print(f"Erro na IA: {str(e)}")
        return jsonify({
            "resposta": "Nao consegui processar a mensagem no momento."
        })


if __name__ == "__main__":
    app.run(debug=True, port=5000)