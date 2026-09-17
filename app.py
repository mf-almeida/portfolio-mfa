from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from services.hugging_face import ia_esta_configurada, perguntar_para_hugging_face
from services.projetos import montar_prompt_sistema

# Só os arquivos client-facing (HTML/CSS/JS/imagens/locales) ficam sob
# static_folder — código-fonte do servidor (app.py, services/, tests/) nunca
# fica acessível por HTTP.
app = Flask(__name__, static_folder="public", static_url_path="")
CORS(app)


@app.route("/")
def home():
    return send_from_directory(app.static_folder, "index.html")


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

    prompt_sistema = montar_prompt_sistema(id_projeto)

    if not ia_esta_configurada() or not prompt_sistema:
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
