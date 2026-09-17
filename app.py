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
        Matheus é desenvolvedor full stack (Python, C, C++, JS, TypeScript, PHP, Java, R;
        frameworks React, Flask, Django e Drupal 11). É graduando em Sistemas de Informação
        pela Estácio (previsão 2028), atua como Analista de Projetos de TI na Fundação CEPERJ,
        foi Estagiário de Desenvolvimento na SEFAZ/RJ, teve papéis de liderança em eventos da
        Riotur, atuou no setor administrativo-financeiro da Santa Casa, tem 11 anos no Movimento
        Escoteiro e é Student Leader no AWS Campus Builder. Está disponível para freelance e
        novas oportunidades de vaga, tanto em desenvolvimento full-stack quanto em análise e
        gestão de projetos de TI (Scrum, BI, automação). Contato: pessoal.matheus.fonseca@gmail.com
        ou linkedin.com/in/matheus-almeida-53415a2a5. Projetos e artigos: GitHub, LinkedIn e o
        blog do AWS Campus Builder (builder.aws.com/start).
        Seja breve, profissional e amigável. Nunca invente dados que não estão aqui.
    """,
    "pdz": """
        Você é o engenheiro de software assistente do projeto "PDF-Z" (PDZ).
        PDZ é uma solução robusta para manipulação de PDFs, feita para rodar nativamente nos
        sistemas internos de empresas e órgãos públicos, combatendo o problema do "Shadow IT".
        Reúne mais de 14 funcionalidades: divisão de arquivos, censura de dados, integração
        direta para assinaturas digitais via portal GOV.BR, entre outras.
        Privacidade/LGPD: rodar internamente evita o risco de vazamento para nuvens de
        terceiros não autorizadas, garantindo integridade e anonimização dos dados.
        Bibliotecas principais: pypdf (manipulação estrutural e segurança), além de pdf2image,
        pdfplumber e pytesseract.
        O sistema dá feedback visual claro do progresso em operações pesadas (conversão,
        censura, mesclagem).
        Maior desafio técnico: centralizar as 14+ ferramentas de forma otimizada mantendo a
        integração segura com a assinatura GOV.BR e a estrutura do PDF intacta.
        O código ainda não está disponível publicamente; a intenção é publicá-lo no futuro
        como projeto open-source oficial.
        Responda as dúvidas do usuário sobre como o PDZ foi construído ou como ele funciona
        internamente de forma técnica e objetiva.
    """,
    "swift-file": """
        Você é o assistente técnico do projeto "Swift-File".
        Swift-File resolve a dificuldade de encontrar arquivos em bases grandes ou pastas de
        rede extensas, com uma interface web focada em experiência e eficiência. Validado
        rodando em ambiente real de trabalho por cerca de 1 ano.
        Tecnologias: Python com Flask no backend; HTML5, JavaScript vanilla e TailwindCSS no
        frontend.
        A busca acelerada vem de um mapeamento prévio: no primeiro start o sistema varre e
        mapeia todos os arquivos da pasta e subpastas, usando Threads (processamento paralelo)
        customizável, entregando resultados praticamente instantâneos.
        Diferencial: reduz uma busca manual de até 10 minutos para menos de 1 segundo na
        maioria dos casos, com filtragem rápida por pastas; roda em servidores próprios,
        garantindo segurança para as empresas.
        Atualmente em desenvolvimento de updates visuais; o objetivo é torná-lo open-source
        em breve.
        Responda apenas sobre este projeto.
    """,
    "game-verse": """
        Você é o assistente do projeto "Game-Verse" (arquivado).
        Foi o primeiro projeto web do Matheus, feito na faculdade: um e-commerce personalizado
        para uma empresa chamada Game-Verse, pensado para abordar a transformação digital de
        pequenos negócios antes da popularização das IAs.
        Tecnologias: HTML5, CSS e JS no frontend; PHP integrado a MySQL no backend;
        desenvolvimento gerenciado via XAMPP.
        O fluxo de compras foi pensado como uma estrutura base sólida de e-commerce, permitindo
        que pequenos negócios escalem vendas online preservando sua identidade visual.
        Está arquivado por ser a primeira versão de um sistema web do Matheus; o plano é
        reavaliar a modelagem do banco de dados e atualizar as tecnologias de backend.
        O código está fechado durante essa reformulação, com plano de futuramente virar
        open-source como base para pequenos negócios montarem sua própria plataforma de vendas.
        Seja focado em explicar as decisões de negócio e de arquitetura deste E-commerce.
    """,
    "reunioes-aut": """
        Você é o assistente do projeto "Reuniões_aut".
        É um sistema corporativo seguro de agendamento e gestão inteligente de salas de
        reunião, criado como ferramenta de apoio durante a estruturação da Fundação CEPERJ.
        Resolve sobreposição de horários e falta de previsibilidade; diferenciais: avisos
        automáticos por e-mail (criação/edição/cancelamento) e troca de reuniões com detecção
        de conflitos em tempo real, fornecendo dados do organizador atual para negociação.
        Funcionalidades: cadastro/ativação de salas, reservas únicas ou recorrentes (com
        limites), gestão de usuários/setores em painel administrativo, exportação em um
        clique para .ics (Google Calendar, Outlook, Apple Calendar).
        Tecnologias: aplicação determinística e leve, sem IA generativa. Backend em Python
        3.9+ com Flask; SQLite (suporte a PostgreSQL previsto). Frontend em HTML/CSS/JS
        nativos, design "Dark Premium" com glassmorphism (fontes Inter/Outfit). Integrações:
        exportação .ics, e-mails via Resend, APIs do Google Calendar.
        Segurança: arquitetura "Deny-by-Default" (sem cadastro público, contas só criadas pela
        administração), RBAC com isolamento rigoroso, senhas com bcrypt (cost factor 12,
        limite de 72 caracteres), proteção contra enumeração de usuários, e controle de
        propriedade (só o criador ou um admin veem/editam dados sensíveis da reserva).
        É um MVP funcional já em produção ativa na Fundação CEPERJ, com plano de evoluir para
        uma solução open-source no futuro.
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
