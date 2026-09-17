import { t } from "./i18n.js";

const avatarCache = new Map();

export function preloadAvatares(avatarPaths) {
    avatarPaths.forEach((avatarPath) => {
        if (avatarCache.has(avatarPath)) {
            return;
        }
        const imagem = new Image();
        imagem.decoding = "async";
        imagem.src = avatarPath;
        avatarCache.set(avatarPath, imagem);
    });
}

function aguardarImagem(imagem) {
    if (imagem.complete) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        imagem.onload = () => resolve();
        imagem.onerror = () => resolve();
    });
}

// `aindaEhAtual` é um predicado (sem argumentos) fornecido por quem chama,
// verificado só depois do carregamento assíncrono da imagem: evita aplicar
// o avatar errado se o usuário já tiver trocado de conversa nesse meio tempo.
export async function atualizarAvatarDoChat(srcAvatar, tituloProjeto, aindaEhAtual) {
    const avatarEl = document.getElementById("chat-avatar");
    if (!avatarEl) {
        return;
    }

    if (avatarEl.dataset.avatarAtual === srcAvatar) {
        avatarEl.alt = `${t("chat_avatar", "Avatar")} ${tituloProjeto}`;
        return;
    }

    avatarEl.classList.add("carregando");

    let imagem = avatarCache.get(srcAvatar);
    if (!imagem) {
        imagem = new Image();
        imagem.decoding = "async";
        imagem.src = srcAvatar;
        avatarCache.set(srcAvatar, imagem);
    }

    await aguardarImagem(imagem);

    if (typeof aindaEhAtual !== "function" || aindaEhAtual()) {
        avatarEl.src = srcAvatar;
        avatarEl.alt = `${t("chat_avatar", "Avatar")} ${tituloProjeto}`;
        avatarEl.dataset.avatarAtual = srcAvatar;
    }

    avatarEl.classList.remove("carregando");
}
