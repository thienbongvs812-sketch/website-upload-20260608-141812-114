(function () {
    function ready(fn) {
        if (document.readyState !== "loading") {
            fn();
            return;
        }
        document.addEventListener("DOMContentLoaded", fn);
    }

    function setupMenu() {
        var toggle = document.querySelector(".menu-toggle");
        var nav = document.querySelector(".site-nav");
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener("click", function () {
            nav.classList.toggle("is-open");
        });
        nav.addEventListener("click", function (event) {
            if (event.target.tagName === "A") {
                nav.classList.remove("is-open");
            }
        });
    }

    function textOf(card) {
        return [
            card.getAttribute("data-title"),
            card.getAttribute("data-region"),
            card.getAttribute("data-type"),
            card.getAttribute("data-year"),
            card.getAttribute("data-genre"),
            card.getAttribute("data-tags"),
            card.textContent
        ].join(" ").toLowerCase();
    }

    function setupSearch() {
        var forms = document.querySelectorAll("[data-search-form]");
        forms.forEach(function (form) {
            var scope = form.closest("main") || document;
            var input = form.querySelector("[data-search-input]");
            var type = form.querySelector("[data-filter-type]");
            var year = form.querySelector("[data-filter-year]");
            var cards = scope.querySelectorAll(".movie-card, .ranking-item");
            function apply() {
                var term = (input && input.value ? input.value : "").trim().toLowerCase();
                var typeValue = type && type.value ? type.value.toLowerCase() : "";
                var yearValue = year && year.value ? year.value.toLowerCase() : "";
                cards.forEach(function (card) {
                    var text = textOf(card);
                    var cardType = (card.getAttribute("data-type") || "").toLowerCase();
                    var cardYear = (card.getAttribute("data-year") || "").toLowerCase();
                    var ok = true;
                    if (term && text.indexOf(term) === -1) {
                        ok = false;
                    }
                    if (typeValue && cardType.indexOf(typeValue) === -1) {
                        ok = false;
                    }
                    if (yearValue && cardYear.indexOf(yearValue) === -1) {
                        ok = false;
                    }
                    card.classList.toggle("is-hidden", !ok);
                });
            }
            if (input) {
                input.addEventListener("input", apply);
            }
            if (type) {
                type.addEventListener("change", apply);
            }
            if (year) {
                year.addEventListener("change", apply);
            }
            form.addEventListener("submit", function (event) {
                event.preventDefault();
                apply();
            });
        });
    }

    function setupHero() {
        var carousel = document.querySelector("[data-hero-carousel]");
        if (!carousel) {
            return;
        }
        var slides = carousel.querySelectorAll(".hero-slide");
        var dots = carousel.querySelectorAll("[data-hero-dot]");
        if (!slides.length) {
            return;
        }
        var current = 0;
        var timer;
        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("is-active", i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("is-active", i === current);
            });
        }
        function start() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }
        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });
        carousel.addEventListener("mouseenter", function () {
            window.clearInterval(timer);
        });
        carousel.addEventListener("mouseleave", start);
        start();
    }

    function initPlayer(videoId, buttonId, url) {
        var video = document.getElementById(videoId);
        var button = document.getElementById(buttonId);
        if (!video || !button || !url) {
            return;
        }
        function attach() {
            if (video.getAttribute("data-ready") === "1") {
                return Promise.resolve();
            }
            video.setAttribute("data-ready", "1");
            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
                return Promise.resolve();
            }
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
                hls.loadSource(url);
                hls.attachMedia(video);
                video.hlsPlayer = hls;
                return new Promise(function (resolve) {
                    hls.on(window.Hls.Events.MANIFEST_PARSED, resolve);
                    window.setTimeout(resolve, 1200);
                });
            }
            video.src = url;
            return Promise.resolve();
        }
        function play() {
            button.classList.add("is-hidden");
            attach().then(function () {
                var playTask = video.play();
                if (playTask && typeof playTask.catch === "function") {
                    playTask.catch(function () {});
                }
            });
        }
        button.addEventListener("click", play);
        video.addEventListener("click", function () {
            if (video.getAttribute("data-ready") !== "1") {
                play();
            }
        });
    }

    window.MovieSite = {
        initPlayer: initPlayer
    };

    ready(function () {
        setupMenu();
        setupSearch();
        setupHero();
    });
})();
