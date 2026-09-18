import { initI18n, initLanguageControls } from "./i18n.js";
import { initTheme } from "./theme.js";
import { initViewSwitcher } from "./viewSwitcher.js";
import { initKanban } from "./kanban.js";
import { initConversationList } from "./conversationList.js";
import { preloadAvatares } from "./avatars.js";
import { projetosData } from "./projetos.js";
import { initModals } from "./modals.js";
import { initMobileMenu } from "./mobileMenu.js";
import { abrirChat, enviarMensagem, verificarEnter, initChat } from "./chat.js";

initTheme();
initConversationList();
initViewSwitcher();
initModals();
initMobileMenu();
preloadAvatares(Object.values(projetosData).map((projeto) => projeto.avatar));
initKanban();
initLanguageControls();
initChat();

initI18n().catch((error) => {
    console.error("Erro ao carregar traducoes i18next:", error);
});

// Expostas em `window` porque index.html ainda usa onclick/onkeypress inline.
window.abrirChat = abrirChat;
window.enviarMensagem = enviarMensagem;
window.verificarEnter = verificarEnter;
