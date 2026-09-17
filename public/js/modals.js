function wireModal(modalEl, closeButtons) {
    function open() {
        if (!modalEl) return;
        modalEl.style.display = "block";
        modalEl.setAttribute("aria-hidden", "false");
    }

    function close() {
        if (!modalEl) return;
        modalEl.style.display = "none";
        modalEl.setAttribute("aria-hidden", "true");
    }

    closeButtons.forEach((button) => {
        button.addEventListener("click", close);
    });

    return { open, close };
}

export function initModals() {
    const modal = document.getElementById("modal");
    const serviceModal = document.getElementById("service-modal");
    const portfolioFormModal = document.getElementById("portfolio-form-modal");
    const aboutModal = document.getElementById("about-modal");
    const modalTrigger = document.getElementById("modal-trigger");
    const openServiceModalButton = document.getElementById("open-service-modal");
    const feedbackShortcut = document.getElementById("feedback-shortcut");
    const aboutShortcut = document.getElementById("about-shortcut");

    const modalCloseButtons = document.querySelectorAll(".modal-close-icon, .contact-close-cta");
    const serviceModalCloseButtons = document.querySelectorAll(".service-close-icon, .service-close-cta");
    const portfolioFormCloseButtons = document.querySelectorAll(".portfolio-form-close-icon, .portfolio-form-close-cta");
    const aboutModalCloseButtons = document.querySelectorAll(".about-close-icon, .about-close-cta");

    const contactModal = wireModal(modal, modalCloseButtons);
    const serviceModalControls = wireModal(serviceModal, serviceModalCloseButtons);
    const portfolioFormModalControls = wireModal(portfolioFormModal, portfolioFormCloseButtons);
    const aboutModalControls = wireModal(aboutModal, aboutModalCloseButtons);

    if (modalTrigger) {
        modalTrigger.addEventListener("click", contactModal.open);
    }

    if (openServiceModalButton) {
        openServiceModalButton.addEventListener("click", () => {
            contactModal.close();
            serviceModalControls.open();
        });
    }

    if (feedbackShortcut) {
        feedbackShortcut.addEventListener("click", portfolioFormModalControls.open);
    }

    if (aboutShortcut) {
        aboutShortcut.addEventListener("click", aboutModalControls.open);
    }

    window.addEventListener("click", (event) => {
        if (event.target === modal) {
            contactModal.close();
        }

        if (event.target === serviceModal) {
            serviceModalControls.close();
        }

        if (event.target === portfolioFormModal) {
            portfolioFormModalControls.close();
        }

        if (event.target === aboutModal) {
            aboutModalControls.close();
        }
    });
}
