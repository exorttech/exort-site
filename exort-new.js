const header = document.querySelector("[data-header]");
const reveals = document.querySelectorAll(".reveal");
const iframe = document.querySelector(".iphone iframe");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 16);
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  },
  {
    rootMargin: "0px 0px -8% 0px",
    threshold: 0.12,
  },
);

reveals.forEach((element) => revealObserver.observe(element));

window.addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

iframe?.addEventListener("load", () => {
  iframe.closest(".iphone")?.classList.add("is-loaded");
});
