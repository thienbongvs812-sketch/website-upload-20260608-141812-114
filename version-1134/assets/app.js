(function () {
  const menuButton = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");

  if (menuButton && mobileMenu) {
    menuButton.addEventListener("click", function () {
      mobileMenu.classList.toggle("is-open");
    });
  }

  document.querySelectorAll("[data-search-form]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      const input = form.querySelector("input[name='q']");
      if (!input) {
        return;
      }
      const value = input.value.trim();
      if (!value) {
        event.preventDefault();
        window.location.href = "./search.html";
      }
    });
  });

  const slider = document.querySelector("[data-hero-slider]");
  if (slider) {
    const slides = Array.from(slider.querySelectorAll("[data-hero-slide]"));
    const dots = Array.from(slider.querySelectorAll("[data-slide-to]"));
    let current = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        const next = Number(dot.getAttribute("data-slide-to") || "0");
        showSlide(next);
      });
    });

    window.setInterval(function () {
      showSlide(current + 1);
    }, 5200);
  }

  const filterPage = document.querySelector("[data-filter-page]");
  if (filterPage) {
    const cards = Array.from(filterPage.querySelectorAll("[data-card]"));
    const input = filterPage.querySelector("[data-filter-input]");
    const typeSelect = filterPage.querySelector("[data-filter-type]");
    const yearSelect = filterPage.querySelector("[data-filter-year]");
    const emptyState = filterPage.querySelector("[data-empty-state]");
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q") || "";

    if (input && q) {
      input.value = q;
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function applyFilters() {
      const keyword = normalize(input ? input.value : "");
      const type = normalize(typeSelect ? typeSelect.value : "");
      const year = normalize(yearSelect ? yearSelect.value : "");
      let visible = 0;

      cards.forEach(function (card) {
        const text = normalize([
          card.getAttribute("data-title"),
          card.getAttribute("data-region"),
          card.getAttribute("data-type"),
          card.getAttribute("data-year"),
          card.getAttribute("data-tags"),
          card.textContent
        ].join(" "));
        const cardType = normalize(card.getAttribute("data-type"));
        const cardYear = normalize(card.getAttribute("data-year"));
        const matched = (!keyword || text.indexOf(keyword) !== -1) && (!type || cardType === type) && (!year || cardYear === year);

        card.hidden = !matched;
        if (matched) {
          visible += 1;
        }
      });

      if (emptyState) {
        emptyState.hidden = visible !== 0;
      }
    }

    [input, typeSelect, yearSelect].forEach(function (item) {
      if (item) {
        item.addEventListener("input", applyFilters);
        item.addEventListener("change", applyFilters);
      }
    });

    applyFilters();
  }
})();
