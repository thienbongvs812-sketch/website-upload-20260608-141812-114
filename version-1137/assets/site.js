(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.querySelector(".nav-menu");

    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        var open = menu.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }

    document.querySelectorAll(".hero-carousel").forEach(function (carousel) {
      var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
      var dots = Array.prototype.slice.call(carousel.querySelectorAll(".hero-dot"));
      var prev = carousel.querySelector(".hero-prev");
      var next = carousel.querySelector(".hero-next");
      var current = 0;
      var timer = null;

      function show(index) {
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

      function start() {
        stop();
        timer = window.setInterval(function () {
          show(current + 1);
        }, 5200);
      }

      function stop() {
        if (timer) {
          window.clearInterval(timer);
        }
      }

      if (prev) {
        prev.addEventListener("click", function () {
          show(current - 1);
          start();
        });
      }

      if (next) {
        next.addEventListener("click", function () {
          show(current + 1);
          start();
        });
      }

      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          show(parseInt(dot.getAttribute("data-slide"), 10) || 0);
          start();
        });
      });

      carousel.addEventListener("mouseenter", stop);
      carousel.addEventListener("mouseleave", start);
      show(0);
      start();
    });

    document.querySelectorAll(".rail-wrap").forEach(function (wrap) {
      var rail = wrap.querySelector(".movie-rail");
      var left = wrap.querySelector(".rail-left");
      var right = wrap.querySelector(".rail-right");

      function move(amount) {
        if (rail) {
          rail.scrollBy({ left: amount, behavior: "smooth" });
        }
      }

      if (left) {
        left.addEventListener("click", function () {
          move(-320);
        });
      }

      if (right) {
        right.addEventListener("click", function () {
          move(320);
        });
      }
    });

    document.querySelectorAll(".search-panel").forEach(function (panel) {
      var container = panel.parentElement || document;
      var input = panel.querySelector(".site-search");
      var selects = Array.prototype.slice.call(panel.querySelectorAll(".filter-select"));
      var empty = panel.querySelector(".empty-state");
      var cards = Array.prototype.slice.call(container.querySelectorAll(".movie-card"));

      function normalize(value) {
        return (value || "").toString().trim().toLowerCase();
      }

      function apply() {
        var query = normalize(input ? input.value : "");
        var filters = {};
        selects.forEach(function (select) {
          filters[select.getAttribute("data-filter")] = normalize(select.value);
        });
        var visible = 0;

        cards.forEach(function (card) {
          var text = normalize([
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-category"),
            card.getAttribute("data-tags")
          ].join(" "));
          var matched = !query || text.indexOf(query) !== -1;

          Object.keys(filters).forEach(function (name) {
            var selected = filters[name];
            if (!selected) {
              return;
            }
            var value = normalize(card.getAttribute("data-" + name));
            if (name === "tags") {
              matched = matched && text.indexOf(selected) !== -1;
            } else {
              matched = matched && value.indexOf(selected) !== -1;
            }
          });

          card.classList.toggle("is-hidden-by-filter", !matched);
          if (matched) {
            visible += 1;
          }
        });

        if (empty) {
          empty.hidden = visible !== 0;
        }
      }

      if (input) {
        input.addEventListener("input", apply);
      }

      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });

      apply();
    });
  });
})();
