const root = document.documentElement;
const header = document.querySelector("[data-header]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const statusToggle = document.querySelector("[data-demo-toggle]");
const selectedRow = document.querySelector('[data-demo-row="steak"] strong');
const shareDemoButton = document.querySelector("[data-share-demo]");
const themeStorageKey = "exort-theme";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function getPreferredTheme() {
  try {
    const savedTheme = localStorage.getItem(themeStorageKey);

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch (error) {
    // Local storage can be unavailable in strict browser modes.
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme, shouldPersist = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const isDark = nextTheme === "dark";

  root.dataset.theme = nextTheme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Тёмная" : "Светлая";
  }

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    isDark ? "#0B1220" : "#F7F9FC"
  );

  if (shouldPersist) {
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch (error) {
      // Theme persistence is progressive enhancement.
    }
  }
}

function updateHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 12);
}

function toggleDemoStatus() {
  if (!statusToggle || !selectedRow) {
    return;
  }

  const isOn = statusToggle.classList.toggle("is-on");

  selectedRow.textContent = isOn ? "8 900 ₸" : "stop";
}

async function shareDemoPage() {
  if (!shareDemoButton) {
    return;
  }

  const demoUrl = new URL("./pages/menu-demo.html?restaurant=exort-demo", window.location.href).href;
  const originalText = shareDemoButton.textContent;

  try {
    if (navigator.share) {
      await navigator.share({
        title: "Демо QR-меню Exort",
        text: "Посмотрите демо-страницу меню Exort",
        url: demoUrl,
      });
    } else {
      await navigator.clipboard.writeText(demoUrl);
      shareDemoButton.textContent = "Ссылка скопирована";
      window.setTimeout(() => {
        shareDemoButton.textContent = originalText;
      }, 1600);
    }
  } catch (error) {
    shareDemoButton.textContent = "Не удалось";
    window.setTimeout(() => {
      shareDemoButton.textContent = originalText;
    }, 1600);
  }
}

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

statusToggle?.addEventListener("click", toggleDemoStatus);
shareDemoButton?.addEventListener("click", shareDemoPage);
window.addEventListener("scroll", updateHeader, { passive: true });

if (reducedMotion) {
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("is-visible");
  });
} else {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.16,
      rootMargin: "0px 0px -60px",
    }
  );

  document.querySelectorAll(".reveal").forEach((element, index) => {
    element.style.setProperty("--delay", `${Math.min(index % 5, 4) * 70}ms`);
    revealObserver.observe(element);
  });
}

applyTheme(getPreferredTheme(), false);
updateHeader();
