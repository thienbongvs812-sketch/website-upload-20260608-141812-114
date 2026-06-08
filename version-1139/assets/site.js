(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

  var menuButton = $('[data-menu-toggle]');
  var mobilePanel = $('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('is-open');
    });
  }

  $$('[data-hero]').forEach(function (hero) {
    var slides = $$('[data-hero-slide]', hero);
    var dots = $$('[data-hero-dot]', hero);
    var index = 0;
    var timer = null;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
      });
    }

    function start() {
      if (timer || slides.length < 2) {
        return;
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5200);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        stop();
        start();
      });
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    show(0);
    start();
  });

  $$('[data-filter-panel]').forEach(function (panel) {
    var search = $('[data-filter-search]', panel);
    var genre = $('[data-filter-genre]', panel);
    var year = $('[data-filter-year]', panel);
    var cards = $$('.movie-card, .rank-row');
    var empty = $('[data-filter-empty]');
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (search && initialQuery) {
      search.value = initialQuery;
    }

    function matches(card, query, genreValue, yearValue) {
      var haystack = normalize([
        card.getAttribute('data-title'),
        card.getAttribute('data-region'),
        card.getAttribute('data-type'),
        card.getAttribute('data-genre'),
        card.getAttribute('data-tags'),
        card.getAttribute('data-category'),
        card.getAttribute('data-year')
      ].join(' '));
      var queryOk = !query || haystack.indexOf(query) !== -1;
      var genreOk = !genreValue || normalize(card.getAttribute('data-genre')).indexOf(genreValue) !== -1 || normalize(card.getAttribute('data-tags')).indexOf(genreValue) !== -1;
      var yearOk = !yearValue || normalize(card.getAttribute('data-year')) === yearValue;
      return queryOk && genreOk && yearOk;
    }

    function apply() {
      var query = normalize(search && search.value);
      var genreValue = normalize(genre && genre.value);
      var yearValue = normalize(year && year.value);
      var visible = 0;

      cards.forEach(function (card) {
        var ok = matches(card, query, genreValue, yearValue);
        card.style.display = ok ? '' : 'none';
        if (ok) {
          visible += 1;
        }
      });

      if (empty) {
        empty.classList.toggle('is-visible', visible === 0);
      }
    }

    [search, genre, year].forEach(function (item) {
      if (item) {
        item.addEventListener('input', apply);
        item.addEventListener('change', apply);
      }
    });

    apply();
  });
})();
