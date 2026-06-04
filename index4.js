const header = document.querySelector(".topbar");
const modal = document.querySelector("[data-request-modal]");
const form = document.querySelector("[data-request-form]");
const statusText = document.querySelector("[data-form-status]");
const openButtons = document.querySelectorAll("[data-open-request]");
const closeButtons = document.querySelectorAll("[data-close-request]");
const screen = document.querySelector(".phone-screen");
const themeSwitch = document.querySelector(".theme-switch");
const tabs = document.querySelectorAll("[data-preview-dish]");
const previewImage = document.querySelector("[data-preview-image]");
const previewTitle = document.querySelector("[data-preview-title]");
const previewText = document.querySelector("[data-preview-text]");
const previewPrice = document.querySelector("[data-preview-price]");

const dishes = {
  pizza: {
    title: "Маргарита",
    text: "Томаты, моцарелла, базилик",
    price: "3 200 ₸",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=84",
  },
  breakfast: {
    title: "Сырники",
    text: "Сметанный крем, ягоды",
    price: "2 600 ₸",
    image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=500&q=84",
  },
  drink: {
    title: "Лимонад",
    text: "Маракуйя, цитрус, мята",
    price: "1 800 ₸",
    image: "https://images.unsplash.com/photo-1621263764928-df1444c5e859?auto=format&fit=crop&w=500&q=84",
  },
};

function openModal() {
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-locked");
  modal.querySelector("input")?.focus();
}

function closeModal() {
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-locked");
}

openButtons.forEach((button) => button.addEventListener("click", openModal));
closeButtons.forEach((button) => button.addEventListener("click", closeModal));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

window.addEventListener("scroll", () => {
  header.classList.toggle("is-solid", window.scrollY > 24);
});

themeSwitch.addEventListener("click", () => {
  screen.classList.toggle("is-dark");
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const dish = dishes[tab.dataset.previewDish];

    tabs.forEach((item) => item.classList.remove("is-active"));
    tab.classList.add("is-active");

    previewImage.src = dish.image;
    previewImage.alt = dish.title;
    previewTitle.textContent = dish.title;
    previewText.textContent = dish.text;
    previewPrice.textContent = dish.price;
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const restaurant = new FormData(form).get("restaurant")?.toString().trim();
  statusText.textContent = restaurant
    ? `Заявка для ${restaurant} принята. Подготовим демо-сценарий.`
    : "Заявка принята. Подготовим демо-сценарий.";

  window.setTimeout(() => {
    form.reset();
    statusText.textContent = "";
    closeModal();
  }, 1800);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  { threshold: 0.14 },
);

document.querySelectorAll(".hero-phone, .split, .benefits article, .process li, .final-cta").forEach((element) => {
  element.classList.add("reveal");
  revealObserver.observe(element);
});
