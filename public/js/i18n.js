const LANGUAGE_STORAGE_KEY = "site_lang";
export const SUPPORTED_LANGUAGES = ["pt", "en", "es"];

let currentLanguage = "pt";
let i18nReady = false;
const languageChangeListeners = [];

function normalizeLanguage(raw) {
    const value = (raw || "").toLowerCase();
    if (value.startsWith("pt")) return "pt";
    if (value.startsWith("es")) return "es";
    return "en";
}

function loadLocale(lang) {
    return fetch(`locales/${lang}/translation.json`).then((response) => {
        if (!response.ok) {
            throw new Error(`Failed to load locale ${lang}`);
        }
        return response.json();
    });
}

export function formatText(template, values) {
    return template.replace(/\{(\w+)\}/g, (_, token) => {
        return Object.prototype.hasOwnProperty.call(values, token) ? String(values[token]) : "";
    });
}

export function t(key, fallback = "") {
    if (window.i18next && i18nReady) {
        return window.i18next.t(key, { defaultValue: fallback || key });
    }
    return fallback || key;
}

export function isReady() {
    return i18nReady;
}

export function getCurrentLanguage() {
    return currentLanguage;
}

// Permite que outros módulos re-renderizem seu próprio conteúdo quando o
// idioma muda, sem que este módulo precise conhecê-los (evita import ciclico).
export function onLanguageChange(callback) {
    if (typeof callback === "function") {
        languageChangeListeners.push(callback);
    }
}

function updateLanguageMenuState() {
    document.querySelectorAll(".language-option").forEach((option) => {
        const isActive = option.dataset.language === currentLanguage;
        option.classList.toggle("ativo", isActive);
        option.setAttribute("aria-checked", isActive ? "true" : "false");
    });
}

function applyTranslations() {
    document.documentElement.lang = currentLanguage === "pt" ? "pt-BR" : currentLanguage;
    document.title = t("page_title", "Portfólio Interativo");

    document.querySelectorAll("[data-i18n]").forEach((el) => {
        const key = el.getAttribute("data-i18n");
        el.textContent = t(key);
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
        const key = el.getAttribute("data-i18n-placeholder");
        el.setAttribute("placeholder", t(key));
    });

    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
        const key = el.getAttribute("data-i18n-title");
        const translated = t(key);
        el.setAttribute("title", translated);
        el.setAttribute("aria-label", translated);
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
        const key = el.getAttribute("data-i18n-alt");
        el.setAttribute("alt", t(key));
    });

    updateLanguageMenuState();

    languageChangeListeners.forEach((callback) => callback());
}

export async function setLanguage(lang, persist = true) {
    const normalized = SUPPORTED_LANGUAGES.includes(normalizeLanguage(lang)) ? normalizeLanguage(lang) : "pt";
    currentLanguage = normalized;

    if (persist) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    }

    if (window.i18next && i18nReady) {
        await window.i18next.changeLanguage(currentLanguage);
    }

    applyTranslations();
}

export async function initI18n() {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const preferredLanguage = savedLanguage ? normalizeLanguage(savedLanguage) : normalizeLanguage(navigator.language);
    const resources = {};

    await Promise.all(
        SUPPORTED_LANGUAGES.map(async (lang) => {
            const translations = await loadLocale(lang);
            resources[lang] = { translation: translations };
        })
    );

    await window.i18next.init({
        lng: preferredLanguage,
        fallbackLng: "pt",
        resources,
        interpolation: {
            escapeValue: false
        },
        returnEmptyString: false,
        returnNull: false
    });

    i18nReady = true;
    currentLanguage = normalizeLanguage(window.i18next.language || preferredLanguage);

    window.i18next.on("languageChanged", (lng) => {
        currentLanguage = normalizeLanguage(lng);
        applyTranslations();
    });

    applyTranslations();
}

export function initLanguageControls() {
    const languageShortcut = document.getElementById("language-shortcut");
    const languageMenu = document.getElementById("language-menu");
    const languageOptions = document.querySelectorAll(".language-option");

    function abrirMenu() {
        if (!languageMenu) return;
        languageMenu.classList.add("aberto");
        languageMenu.setAttribute("aria-hidden", "false");
    }

    function fecharMenu() {
        if (!languageMenu) return;
        languageMenu.classList.remove("aberto");
        languageMenu.setAttribute("aria-hidden", "true");
    }

    function alternarMenu() {
        if (!languageMenu) return;
        if (languageMenu.classList.contains("aberto")) {
            fecharMenu();
        } else {
            abrirMenu();
        }
    }

    if (languageShortcut) {
        languageShortcut.addEventListener("click", (event) => {
            event.stopPropagation();
            alternarMenu();
        });
    }

    languageOptions.forEach((option) => {
        option.addEventListener("click", async (event) => {
            event.stopPropagation();
            await setLanguage(option.dataset.language);
            fecharMenu();
        });
    });

    document.addEventListener("click", (event) => {
        if (!languageMenu || !languageShortcut) {
            return;
        }

        const clicouNoAtalho = languageShortcut.contains(event.target);
        const clicouNoMenu = languageMenu.contains(event.target);

        if (!clicouNoAtalho && !clicouNoMenu) {
            fecharMenu();
        }
    });
}
