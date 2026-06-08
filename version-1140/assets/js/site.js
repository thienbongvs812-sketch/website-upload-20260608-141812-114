(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function normalize(value) {
        return String(value || "").trim().toLowerCase();
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function initNavigation() {
        var button = document.querySelector("[data-menu-toggle]");
        var menu = document.querySelector("[data-mobile-nav]");

        if (!button || !menu) {
            return;
        }

        button.addEventListener("click", function () {
            menu.classList.toggle("is-open");
        });
    }

    function initSearchForms() {
        document.querySelectorAll("[data-site-search]").forEach(function (form) {
            form.addEventListener("submit", function (event) {
                var input = form.querySelector("input[name='q']");
                var action = form.getAttribute("action") || "search.html";
                var query = input ? input.value.trim() : "";

                if (!query) {
                    return;
                }

                event.preventDefault();
                window.location.href = action + "?q=" + encodeURIComponent(query);
            });
        });
    }

    function initHeroSlider() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var index = 0;
        var timer = null;

        function show(nextIndex) {
            if (!slides.length) {
                return;
            }

            index = (nextIndex + slides.length) % slides.length;
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

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initImageFallback() {
        document.querySelectorAll("img[data-cover-fallback]").forEach(function (image) {
            image.addEventListener("error", function () {
                var label = image.getAttribute("data-cover-fallback") || "影";
                var svg = "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='640' viewBox='0 0 480 640'>" +
                    "<defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop stop-color='%23059669'/><stop offset='1' stop-color='%230891b2'/></linearGradient></defs>" +
                    "<rect width='480' height='640' fill='url(%23g)'/>" +
                    "<circle cx='410' cy='80' r='120' fill='%23ffffff' opacity='0.12'/>" +
                    "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='112' font-family='Arial, sans-serif' fill='%23ffffff' font-weight='700'>" +
                    escapeHtml(label).slice(0, 1) +
                    "</text></svg>";
                image.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
            }, { once: true });
        });
    }

    function initLocalFilters() {
        document.querySelectorAll("[data-local-filter]").forEach(function (form) {
            var keywordInput = form.querySelector("[data-filter-keyword]");
            var yearSelect = form.querySelector("[data-filter-year]");
            var typeSelect = form.querySelector("[data-filter-type]");
            var summary = document.querySelector("[data-filter-summary]");
            var cards = Array.prototype.slice.call(document.querySelectorAll("[data-filter-card]"));

            function applyFilter() {
                var keyword = normalize(keywordInput && keywordInput.value);
                var year = normalize(yearSelect && yearSelect.value);
                var type = normalize(typeSelect && typeSelect.value);
                var visibleCount = 0;

                cards.forEach(function (card) {
                    var text = normalize([
                        card.getAttribute("data-title"),
                        card.getAttribute("data-region"),
                        card.getAttribute("data-type"),
                        card.getAttribute("data-category")
                    ].join(" "));
                    var matchKeyword = !keyword || text.indexOf(keyword) !== -1;
                    var matchYear = !year || normalize(card.getAttribute("data-year")) === year;
                    var matchType = !type || normalize(card.getAttribute("data-type")) === type;
                    var isVisible = matchKeyword && matchYear && matchType;

                    card.hidden = !isVisible;
                    if (isVisible) {
                        visibleCount += 1;
                    }
                });

                if (summary) {
                    summary.textContent = "当前显示 " + visibleCount + " 部影片";
                }
            }

            form.addEventListener("input", applyFilter);
            form.addEventListener("change", applyFilter);
            form.addEventListener("reset", function () {
                window.setTimeout(applyFilter, 0);
            });
            applyFilter();
        });
    }

    function buildSearchCard(movie) {
        var tags = (movie.tags || []).slice(0, 3).map(function (tag) {
            return "<span>" + escapeHtml(tag) + "</span>";
        }).join("");

        return "<a class='movie-card movie-card--compact' href='detail/" + encodeURIComponent(movie.id) + ".html'>" +
            "<figure class='movie-poster'>" +
                "<img src='" + escapeHtml(movie.cover) + "' alt='" + escapeHtml(movie.title) + "' loading='lazy' data-cover-fallback='" + escapeHtml(String(movie.title || "影").slice(0, 1)) + "'>" +
            "</figure>" +
            "<div class='movie-card-body'>" +
                "<h3>" + escapeHtml(movie.title) + "</h3>" +
                "<p class='movie-one-line'>" + escapeHtml(movie.oneLine || "") + "</p>" +
                "<div class='movie-meta'>" +
                    "<span>" + escapeHtml(movie.region) + "</span>" +
                    "<span>" + escapeHtml(movie.type) + "</span>" +
                    "<span>" + escapeHtml(movie.year) + "</span>" +
                "</div>" +
                "<div class='tag-row'>" + tags + "</div>" +
            "</div>" +
        "</a>";
    }

    function initSearchPage() {
        var results = document.querySelector("[data-search-results]");
        var summary = document.querySelector("[data-search-summary]");
        var fallback = document.querySelector("[data-search-fallback]");
        var form = document.querySelector("[data-search-filter]");

        if (!results || !summary || !form || !window.MOVIE_DATA) {
            return;
        }

        var keywordInput = form.querySelector("[data-search-keyword]");
        var categorySelect = form.querySelector("[data-search-category]");
        var typeSelect = form.querySelector("[data-search-type]");
        var yearInput = form.querySelector("[data-search-year]");
        var heroInput = document.querySelector("[data-search-input]");
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get("q") || "";

        if (keywordInput) {
            keywordInput.value = initialQuery;
        }
        if (heroInput) {
            heroInput.value = initialQuery;
        }

        function matches(movie, keyword, category, type, year) {
            var haystack = normalize([
                movie.title,
                movie.region,
                movie.type,
                movie.year,
                movie.genre,
                movie.category,
                movie.oneLine,
                (movie.tags || []).join(" ")
            ].join(" "));
            return (!keyword || haystack.indexOf(keyword) !== -1) &&
                (!category || normalize(movie.category) === category) &&
                (!type || normalize(movie.type).indexOf(type) !== -1) &&
                (!year || normalize(movie.year).indexOf(year) !== -1);
        }

        function applySearch() {
            var keyword = normalize(keywordInput && keywordInput.value);
            var category = normalize(categorySelect && categorySelect.value);
            var type = normalize(typeSelect && typeSelect.value);
            var year = normalize(yearInput && yearInput.value);
            var hasCondition = keyword || category || type || year;

            if (!hasCondition) {
                results.innerHTML = "";
                summary.textContent = "输入关键词或筛选条件后显示结果";
                if (fallback) {
                    fallback.hidden = false;
                }
                return;
            }

            var matched = window.MOVIE_DATA.filter(function (movie) {
                return matches(movie, keyword, category, type, year);
            }).slice(0, 200);

            results.innerHTML = matched.map(buildSearchCard).join("");
            summary.textContent = "共找到 " + matched.length + " 条结果" + (matched.length === 200 ? "（最多显示前 200 条）" : "");
            if (fallback) {
                fallback.hidden = true;
            }
            initImageFallback();
        }

        form.addEventListener("input", applySearch);
        form.addEventListener("change", applySearch);
        applySearch();
    }

    ready(function () {
        initNavigation();
        initSearchForms();
        initHeroSlider();
        initImageFallback();
        initLocalFilters();
        initSearchPage();
    });
}());
