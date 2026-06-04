const header = document.querySelector("[data-header]");
const phoneScreen = document.querySelector("[data-phone-screen]");
const demoFrame = document.querySelector("[data-demo-frame]");
const pageThemeButton = document.querySelector("[data-theme-toggle]");
const themeButton = document.querySelector("[data-phone-theme]");
const categoryButtons = document.querySelectorAll("[data-category]");
const searchInput = document.querySelector("[data-menu-search]");
const dishList = document.querySelector("[data-dish-list]");
const flowSteps = document.querySelectorAll(".flow-step");
const themeStorageKey = "exort-premium-theme";

const dishes = [
  {
    title: "Маргарита",
    description: "Томаты, моцарелла, базилик",
    price: "3 200 ₸",
    category: "popular",
    art: "pizza",
  },
  {
    title: "Боул с лососем",
    description: "Рис, авокадо, огурец, соус",
    price: "4 900 ₸",
    category: "popular",
    art: "bowl",
  },
  {
    title: "Сырники",
    description: "Сметана, ягоды, мед",
    price: "2 600 ₸",
    category: "breakfast",
    art: "breakfast",
  },
  {
    title: "Омлет с зеленью",
    description: "Яйца, шпинат, сыр, тост",
    price: "2 300 ₸",
    category: "breakfast",
    art: "omelet",
  },
  {
    title: "Фирменный лимонад",
    description: "Лайм, мята, маракуйя",
    price: "1 800 ₸",
    category: "drinks",
    art: "drink",
  },
  {
    title: "Капучино",
    description: "Эспрессо, молоко, какао",
    price: "1 400 ₸",
    category: "drinks",
    art: "coffee",
  },
];

let activeCategory = "popular";
let activeFlowIndex = 0;

function syncDemoFrameTheme(theme) {
  try {
    const frameBody = demoFrame?.contentDocument?.body;

    if (!frameBody) {
      return;
    }

    if (theme === "dark") {
      frameBody.dataset.theme = "dark";
    } else {
      frameBody.removeAttribute("data-theme");
    }
  } catch (error) {
    // Same-origin access is expected locally. If hosted differently, the iframe still works.
  }
}

function applyPageTheme(theme, shouldPersist = true) {
  const isDark = theme === "dark";

  if (isDark) {
    document.body.dataset.theme = "dark";
  } else {
    document.body.removeAttribute("data-theme");
  }

  pageThemeButton?.setAttribute("aria-pressed", String(isDark));
  pageThemeButton?.setAttribute(
    "aria-label",
    isDark ? "Включить светлую тему" : "Включить темную тему"
  );

  syncDemoFrameTheme(isDark ? "dark" : "light");

  if (shouldPersist) {
    try {
      window.localStorage.setItem(themeStorageKey, isDark ? "dark" : "light");
    } catch (error) {
      // Theme persistence is a progressive enhancement.
    }
  }
}

function renderDishes() {
  if (!dishList || !searchInput) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const visibleDishes = dishes.filter((dish) => {
    const matchesCategory = dish.category === activeCategory;
    const matchesSearch = [dish.title, dish.description]
      .join(" ")
      .toLowerCase()
      .includes(query);

    return matchesCategory && matchesSearch;
  });

  dishList.innerHTML = visibleDishes.length
    ? visibleDishes
        .map(
          (dish) => `
            <article class="dish-card-mini">
              <div class="dish-art ${dish.art}" aria-hidden="true"></div>
              <div>
                <h4>${dish.title}</h4>
                <p>${dish.description}</p>
                <strong>${dish.price}</strong>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-menu">Ничего не найдено</p>`;
}

function setActiveCategory(category) {
  activeCategory = category;

  categoryButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.category === category);
  });

  renderDishes();
}

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 18);
}

function activateFlowStep() {
  if (!flowSteps.length) {
    return;
  }

  flowSteps.forEach((step, index) => {
    step.classList.toggle("is-active", index === activeFlowIndex);
  });

  activeFlowIndex = (activeFlowIndex + 1) % flowSteps.length;
}

categoryButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveCategory(button.dataset.category));
});

searchInput?.addEventListener("input", renderDishes);

themeButton?.addEventListener("click", () => {
  phoneScreen.classList.toggle("is-dark");
});

pageThemeButton?.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
  applyPageTheme(nextTheme);
});

demoFrame?.addEventListener("load", () => {
  try {
    const frameDocument = demoFrame.contentDocument;
    const serviceModal = frameDocument?.querySelector("[data-service-modal]");
    const topbar = frameDocument?.querySelector(".topbar");
    const previewBrandLink = frameDocument?.querySelector(".topbar .brand");

    serviceModal?.setAttribute("aria-hidden", "true");
    topbar?.style.setProperty("position", "sticky");
    previewBrandLink?.removeAttribute("href");
    previewBrandLink?.setAttribute("aria-label", "Demo Restaurant");
    previewBrandLink?.style.setProperty("cursor", "default");
    frameDocument?.documentElement.style.setProperty("scroll-behavior", "auto");
    syncDemoFrameTheme(document.body.dataset.theme === "dark" ? "dark" : "light");

    if (frameDocument && !frameDocument.querySelector("#exort-phone-preview-style")) {
      const previewStyle = frameDocument.createElement("style");
      previewStyle.id = "exort-phone-preview-style";
      previewStyle.textContent = `
        html,
        body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar,
        *::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }
      `;
      frameDocument.head.appendChild(previewStyle);
    }
  } catch (error) {
    // Same-origin access is expected locally. If the page is served differently, the iframe still works.
  }
});

window.addEventListener("scroll", updateHeader, { passive: true });

document.addEventListener("pointermove", (event) => {
  const x = (event.clientX / window.innerWidth - 0.5).toFixed(3);
  const y = (event.clientY / window.innerHeight - 0.5).toFixed(3);

  document.documentElement.style.setProperty("--glow-x", `${x * 26}px`);
  document.documentElement.style.setProperty("--glow-y", `${y * 20}px`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
    rootMargin: "0px 0px -60px",
  }
);

document.querySelectorAll(".reveal").forEach((element) => {
  revealObserver.observe(element);
});

try {
  const savedTheme = window.localStorage.getItem(themeStorageKey);
  applyPageTheme(savedTheme === "dark" ? "dark" : "light", false);
} catch (error) {
  applyPageTheme("light", false);
}

renderDishes();
updateHeader();
activateFlowStep();
window.setInterval(activateFlowStep, 1800);
