const THEME_STORAGE_KEY = "theme";

export function initTheme() {
    const themeToggle = document.getElementById("theme-toggle");
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "light") {
        document.body.classList.add("light");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.body.classList.toggle("light");
            localStorage.setItem(
                THEME_STORAGE_KEY,
                document.body.classList.contains("light") ? "light" : "dark"
            );
        });
    }
}
