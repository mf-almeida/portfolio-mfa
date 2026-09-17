const CHATS_STORAGE_KEY = "meus_chats";

export function lerChatsDoStorage() {
    try {
        const bruto = localStorage.getItem(CHATS_STORAGE_KEY);
        if (!bruto) {
            return {};
        }

        const parsed = JSON.parse(bruto);
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

export function salvarChatsNoStorage(chats) {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
}

export function carregarMensagensDoContato(idContato) {
    const chats = lerChatsDoStorage();
    const mensagens = chats[idContato];
    return Array.isArray(mensagens) ? mensagens : [];
}

export function salvarMensagemNoContato(idContato, texto, souEu, meta = {}) {
    const chats = lerChatsDoStorage();
    if (!Array.isArray(chats[idContato])) {
        chats[idContato] = [];
    }

    const mensagem = {
        texto,
        souEu,
        data: new Date().toISOString()
    };

    if (meta && typeof meta === "object") {
        if (meta.translationKey) {
            mensagem.translationKey = meta.translationKey;
        }

        if (meta.translationValues && typeof meta.translationValues === "object") {
            mensagem.translationValues = meta.translationValues;
        }
    }

    chats[idContato].push(mensagem);
    salvarChatsNoStorage(chats);
    return mensagem;
}

// Retorna true se havia histórico e ele foi removido. Não mexe em DOM nem
// em qual conversa está aberta — isso é responsabilidade de chat.js.
export function limparHistoricoDoContato(idContato) {
    const chats = lerChatsDoStorage();
    if (!Object.prototype.hasOwnProperty.call(chats, idContato)) {
        return false;
    }

    delete chats[idContato];
    salvarChatsNoStorage(chats);
    return true;
}
