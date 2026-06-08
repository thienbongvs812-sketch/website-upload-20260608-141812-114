(function () {
    var navToggle = document.querySelector('[data-nav-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (navToggle && mobilePanel) {
        navToggle.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-hero]').forEach(function (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var prev = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle('active', i === current);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle('active', i === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        show(0);
        start();
    });

    document.querySelectorAll('[data-scroll-left]').forEach(function (button) {
        button.addEventListener('click', function () {
            var target = document.getElementById(button.getAttribute('data-scroll-left'));
            if (target) {
                target.scrollBy({ left: -320, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('[data-scroll-right]').forEach(function (button) {
        button.addEventListener('click', function () {
            var target = document.getElementById(button.getAttribute('data-scroll-right'));
            if (target) {
                target.scrollBy({ left: 320, behavior: 'smooth' });
            }
        });
    });

    document.querySelectorAll('.filter-area').forEach(function (area) {
        var input = area.querySelector('[data-filter-input]');
        var selects = Array.prototype.slice.call(area.querySelectorAll('[data-filter-select]'));
        var cards = Array.prototype.slice.call(area.querySelectorAll('.movie-card'));
        var params = new URLSearchParams(window.location.search);
        var initialQuery = params.get('q');

        if (input && initialQuery) {
            input.value = initialQuery;
        }

        function matchCard(card) {
            var query = input ? input.value.trim().toLowerCase() : '';
            var text = (card.getAttribute('data-search') || '').toLowerCase();
            var ok = !query || text.indexOf(query) !== -1;

            selects.forEach(function (select) {
                var key = select.getAttribute('data-filter-select');
                var value = select.value;
                if (value && card.getAttribute('data-' + key) !== value) {
                    ok = false;
                }
            });

            return ok;
        }

        function apply() {
            cards.forEach(function (card) {
                card.classList.toggle('is-hidden', !matchCard(card));
            });
        }

        if (input) {
            input.addEventListener('input', apply);
        }

        selects.forEach(function (select) {
            select.addEventListener('change', apply);
        });

        apply();
    });
})();
