const STATUS_COLUMN_MAP = {
    finalizados: "kanban-finalizados",
    andamento: "kanban-andamento",
    arquivados: "kanban-arquivados",
    ideias: "kanban-ideias"
};

export function initKanban() {
    const cards = document.querySelectorAll(".status-card[id]");
    const columnEntries = Object.entries(STATUS_COLUMN_MAP);

    columnEntries.forEach(([, columnId]) => {
        const container = document.getElementById(columnId);
        if (container) {
            container.innerHTML = "";
        }
    });

    cards.forEach((card) => {
        const cardId = card.id || "";
        const [prefixo] = cardId.split("__");
        const targetId = STATUS_COLUMN_MAP[prefixo];
        const fallbackId = STATUS_COLUMN_MAP.ideias;
        const targetContainer = document.getElementById(targetId || fallbackId);

        if (targetContainer) {
            targetContainer.appendChild(card);
        }
    });

    Object.entries(STATUS_COLUMN_MAP).forEach(([key, columnId]) => {
        const countEl = document.getElementById(`count-${key}`);
        const container = document.getElementById(columnId);
        if (countEl && container) {
            countEl.textContent = String(container.querySelectorAll(".status-card").length);
        }
    });
}
