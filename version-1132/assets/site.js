(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function initMenu() {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  function initHero() {
    var carousel = document.querySelector("[data-hero-carousel]");
    if (!carousel) {
      return;
    }
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(carousel.querySelectorAll("[data-hero-dot]"));
    if (slides.length < 2) {
      return;
    }
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === index);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, dotIndex) {
      dot.addEventListener("click", function () {
        show(dotIndex);
        start();
      });
    });

    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    show(0);
    start();
  }

  function normalize(value) {
    return String(value || "").toLowerCase().replace(/\s+/g, "");
  }

  function initFilters() {
    var panel = document.querySelector("[data-filter-panel]");
    if (!panel) {
      return;
    }
    var input = panel.querySelector("[data-filter-input]");
    var yearSelect = panel.querySelector("[data-filter-year]");
    var sortSelect = panel.querySelector("[data-filter-sort]");
    var grid = document.querySelector("[data-filter-grid]");
    if (!grid) {
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll("[data-filter-card]"));

    function apply() {
      var keyword = normalize(input ? input.value : "");
      var year = yearSelect ? yearSelect.value : "all";
      cards.forEach(function (card) {
        var text = normalize(card.getAttribute("data-search"));
        var cardYear = card.getAttribute("data-year") || "";
        var matched = (!keyword || text.indexOf(keyword) !== -1) && (year === "all" || cardYear === year);
        card.classList.toggle("is-hidden", !matched);
      });
      if (sortSelect) {
        var sorted = cards.slice().sort(function (a, b) {
          var ay = parseInt(a.getAttribute("data-year"), 10) || 0;
          var by = parseInt(b.getAttribute("data-year"), 10) || 0;
          if (sortSelect.value === "old") {
            return ay - by;
          }
          return by - ay;
        });
        sorted.forEach(function (card) {
          grid.appendChild(card);
        });
      }
    }

    if (input) {
      input.addEventListener("input", apply);
    }
    if (yearSelect) {
      yearSelect.addEventListener("change", apply);
    }
    if (sortSelect) {
      sortSelect.addEventListener("change", apply);
    }
    apply();
  }

  function initSearchPage() {
    var root = document.querySelector("[data-search-page]");
    if (!root || !window.MOVIE_SEARCH_INDEX) {
      return;
    }
    var form = root.querySelector("[data-search-form]");
    var input = root.querySelector("[data-search-input]");
    var grid = root.querySelector("[data-search-results]");
    var empty = root.querySelector("[data-search-empty]");
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q") || "";
    if (input) {
      input.value = initial;
    }

    function render() {
      var keyword = normalize(input ? input.value : "");
      var list = window.MOVIE_SEARCH_INDEX.filter(function (movie) {
        var text = normalize([
          movie.title,
          movie.year,
          movie.region,
          movie.type,
          movie.genre,
          movie.category,
          (movie.tags || []).join(" "),
          movie.oneLine
        ].join(" "));
        return !keyword || text.indexOf(keyword) !== -1;
      }).slice(0, 80);
      grid.innerHTML = list.map(function (movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
          return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");
        return [
          "<article class=\"movie-card search-result-card\">",
          "<a class=\"movie-thumb\" href=\"" + escapeAttr(movie.url) + "\">",
          "<img src=\"" + escapeAttr(movie.cover) + "\" alt=\"" + escapeAttr(movie.title) + "\" loading=\"lazy\">",
          "<span class=\"play-mark\" aria-hidden=\"true\">▶</span>",
          "<span class=\"movie-chip chip-right\">" + escapeHtml(movie.category) + "</span>",
          "<span class=\"movie-chip chip-left\">" + escapeHtml(movie.year) + "</span>",
          "</a>",
          "<div class=\"movie-card-body\">",
          "<h3><a href=\"" + escapeAttr(movie.url) + "\">" + escapeHtml(movie.title) + "</a></h3>",
          "<p>" + escapeHtml(movie.oneLine) + "</p>",
          "<div class=\"movie-meta-row\"><span>" + escapeHtml(movie.region) + "</span><span>" + escapeHtml(movie.type) + "</span></div>",
          "<div class=\"tag-list\">" + tags + "</div>",
          "</div>",
          "</article>"
        ].join("");
      }).join("");
      if (empty) {
        empty.classList.toggle("is-visible", list.length === 0);
      }
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var q = input ? input.value : "";
        var url = q ? "./search.html?q=" + encodeURIComponent(q) : "./search.html";
        window.history.replaceState(null, "", url);
        render();
      });
    }
    if (input) {
      input.addEventListener("input", render);
    }
    render();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, function (ch) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[ch];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function initPlayer() {
    var wrap = document.querySelector("[data-player]");
    if (!wrap) {
      return;
    }
    var video = wrap.querySelector("video");
    var button = wrap.querySelector("[data-play]");
    var stream = wrap.getAttribute("data-stream");
    var started = false;
    var hlsInstance = null;

    function load() {
      if (!video || !stream || started) {
        return;
      }
      started = true;
      wrap.classList.add("is-playing");
      function playVideo() {
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      }
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = stream;
        playVideo();
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(stream);
        hlsInstance.attachMedia(video);
        if (window.Hls.Events && window.Hls.Events.MANIFEST_PARSED) {
          hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, playVideo);
        }
        playVideo();
      } else {
        video.src = stream;
        playVideo();
      }
    }

    if (button) {
      button.addEventListener("click", load);
    }
    if (video) {
      video.addEventListener("click", function () {
        if (!started) {
          load();
        }
      });
    }
    window.addEventListener("beforeunload", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  }

  ready(function () {
    initMenu();
    initHero();
    initFilters();
    initSearchPage();
    initPlayer();
  });
})();
