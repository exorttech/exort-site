const root = document.documentElement;
const header = document.querySelector("[data-header]");
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeLabel = document.querySelector("[data-theme-label]");
const stopToggle = document.querySelector("[data-stop-toggle]");
const stopRow = document.querySelector("[data-stop-row]");
const stopLabel = document.querySelector("[data-stop-label]");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const themeStorageKey = "exort-arctic-theme";

function getSavedTheme() {
  try {
    const savedTheme = localStorage.getItem(themeStorageKey);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch (error) {
    // localStorage may be blocked. Light Arctic remains the default.
  }

  return "light";
}

function applyTheme(theme, shouldPersist = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  const isDark = nextTheme === "dark";

  root.dataset.theme = nextTheme;
  themeToggle?.setAttribute("aria-pressed", String(isDark));

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Dark" : "Light";
  }

  document.querySelector('meta[name="theme-color"]')?.setAttribute(
    "content",
    isDark ? "#07111F" : "#EAF2FF"
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

function toggleStopState() {
  if (!stopToggle || !stopRow || !stopLabel) {
    return;
  }

  const isActive = stopToggle.classList.toggle("is-on");
  stopRow.classList.toggle("is-stop", !isActive);
  stopRow.classList.toggle("is-live", isActive);
  stopLabel.textContent = isActive ? "active" : "stop";
}

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

stopToggle?.addEventListener("click", toggleStopState);
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
    element.style.setProperty("--delay", `${Math.min(index % 6, 5) * 70}ms`);
    revealObserver.observe(element);
  });
}

applyTheme(getSavedTheme(), false);
updateHeader();
