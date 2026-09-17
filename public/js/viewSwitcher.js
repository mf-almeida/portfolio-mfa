const VIEW_TRANSITION_MS = 340;
let viewTransitionTimer = null;

function clearViewTransitionTimer() {
    if (viewTransitionTimer) {
        window.clearTimeout(viewTransitionTimer);
        viewTransitionTimer = null;
    }
}

function getViewElements() {
    return {
        chatListView: document.querySelector(".lista-de-conversas"),
        chatOpenView: document.querySelector(".conversa-aberta"),
        statusView: document.getElementById("status-view"),
        appRoot: document.querySelector(".app")
    };
}

function finalizeStatusViewTransition() {
    const { chatListView, chatOpenView, statusView, appRoot } = getViewElements();
    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        return;
    }

    chatListView.style.display = "none";
    chatOpenView.style.display = "none";
    statusView.style.display = "flex";
    statusView.setAttribute("aria-hidden", "false");

    appRoot.classList.remove("is-switching-to-status", "is-switching-to-chat");
    appRoot.classList.add("status-active");
}

function finalizeChatViewTransition() {
    const { chatListView, chatOpenView, statusView, appRoot } = getViewElements();
    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        return;
    }

    chatListView.style.display = "flex";
    chatOpenView.style.display = "flex";
    statusView.style.display = "none";
    statusView.setAttribute("aria-hidden", "true");

    appRoot.classList.remove("status-active", "is-switching-to-chat", "is-switching-to-status");
}

export function showChatView() {
    const { chatListView, chatOpenView, statusView, appRoot } = getViewElements();

    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        if (chatListView) {
            chatListView.style.display = "flex";
        }
        if (chatOpenView) {
            chatOpenView.style.display = "flex";
        }
        if (statusView) {
            statusView.style.display = "none";
            statusView.setAttribute("aria-hidden", "true");
        }
        return;
    }

    clearViewTransitionTimer();

    const statusEstaAtivo = appRoot.classList.contains("status-active")
        || appRoot.classList.contains("is-switching-to-chat")
        || appRoot.classList.contains("is-switching-to-status");
    if (!statusEstaAtivo) {
        appRoot.classList.remove("is-switching-to-chat", "is-switching-to-status", "status-active");
        chatListView.style.display = "flex";
        chatOpenView.style.display = "flex";
        statusView.style.display = "none";
        statusView.setAttribute("aria-hidden", "true");
        return;
    }

    chatListView.style.display = "none";
    chatOpenView.style.display = "none";
    statusView.style.display = "flex";

    appRoot.classList.remove("is-switching-to-status", "status-active");
    appRoot.classList.add("is-switching-to-chat");

    viewTransitionTimer = window.setTimeout(() => {
        finalizeChatViewTransition();
    }, VIEW_TRANSITION_MS);
}

export function showStatusView() {
    const { chatListView, chatOpenView, statusView, appRoot } = getViewElements();

    if (!chatListView || !chatOpenView || !statusView || !appRoot) {
        if (chatListView) {
            chatListView.style.display = "none";
        }
        if (chatOpenView) {
            chatOpenView.style.display = "none";
        }
        if (statusView) {
            statusView.style.display = "flex";
            statusView.setAttribute("aria-hidden", "false");
        }
        return;
    }

    const statusJaAtivo = appRoot.classList.contains("status-active") || appRoot.classList.contains("is-switching-to-status");
    if (statusJaAtivo) {
        return;
    }

    clearViewTransitionTimer();

    chatListView.style.display = "flex";
    chatOpenView.style.display = "flex";
    statusView.style.display = "none";
    statusView.setAttribute("aria-hidden", "true");

    appRoot.classList.remove("is-switching-to-chat");
    appRoot.classList.add("is-switching-to-status");

    viewTransitionTimer = window.setTimeout(() => {
        finalizeStatusViewTransition();
    }, VIEW_TRANSITION_MS);
}

export function initViewSwitcher() {
    const chatShortcut = document.getElementById("chat-shortcut");
    const statusShortcut = document.getElementById("status-shortcut");

    if (chatShortcut) {
        chatShortcut.addEventListener("click", () => {
            showChatView();
        });
    }

    if (statusShortcut) {
        statusShortcut.addEventListener("click", () => {
            showStatusView();
        });
    }
}
