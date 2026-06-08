(function () {
  var mobileToggle = document.querySelector('[data-mobile-toggle]');
  var siteNav = document.querySelector('[data-site-nav]');

  if (mobileToggle && siteNav) {
    mobileToggle.addEventListener('click', function () {
      siteNav.classList.toggle('is-open');
    });
  }

  var hero = document.querySelector('[data-hero]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var activeIndex = 0;
    var timer = null;

    function showSlide(index) {
      activeIndex = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === activeIndex);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === activeIndex);
      });
    }

    function startHero() {
      if (timer || slides.length < 2) {
        return;
      }
      timer = window.setInterval(function () {
        showSlide(activeIndex + 1);
      }, 5200);
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener('click', function () {
        showSlide(index);
        if (timer) {
          window.clearInterval(timer);
          timer = null;
        }
        startHero();
      });
    });

    startHero();
  }

  function normalize(value) {
    return (value || '').toString().toLowerCase().trim();
  }

  function applyFilters(panel) {
    var wrapper = panel.closest('.section') || document;
    var cards = Array.prototype.slice.call(wrapper.querySelectorAll('[data-card]'));
    var searchInput = panel.querySelector('[data-local-search]');
    var keyword = normalize(searchInput ? searchInput.value : '');
    var filters = {};

    Array.prototype.slice.call(panel.querySelectorAll('[data-filter-group]')).forEach(function (group) {
      var name = group.getAttribute('data-filter-group');
      var active = group.querySelector('button.is-active');
      filters[name] = active ? active.getAttribute('data-filter-value') : 'all';
    });

    cards.forEach(function (card) {
      var matched = true;
      if (keyword && normalize(card.getAttribute('data-search')).indexOf(keyword) === -1) {
        matched = false;
      }
      Object.keys(filters).forEach(function (name) {
        var value = filters[name];
        if (!value || value === 'all') {
          return;
        }
        var cardValue = card.getAttribute('data-' + name) || '';
        if (name === 'type') {
          if (cardValue.indexOf(value) === -1) {
            matched = false;
          }
        } else if (cardValue !== value) {
          matched = false;
        }
      });
      card.classList.toggle('is-hidden', !matched);
    });
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-filter-panel]')).forEach(function (panel) {
    Array.prototype.slice.call(panel.querySelectorAll('[data-filter-group] button')).forEach(function (button) {
      button.addEventListener('click', function () {
        var group = button.closest('[data-filter-group]');
        Array.prototype.slice.call(group.querySelectorAll('button')).forEach(function (item) {
          item.classList.remove('is-active');
        });
        button.classList.add('is-active');
        applyFilters(panel);
      });
    });

    var searchInput = panel.querySelector('[data-local-search]');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        applyFilters(panel);
      });
    }

    var urlParams = new URLSearchParams(window.location.search);
    var query = urlParams.get('q');
    if (query && searchInput) {
      searchInput.value = query;
      applyFilters(panel);
    }
  });

  var bigSearchInput = document.getElementById('siteSearchInput');
  if (bigSearchInput) {
    var params = new URLSearchParams(window.location.search);
    var q = params.get('q');
    if (q) {
      bigSearchInput.value = q;
    }
  }
})();

function initializePlayer(streamUrl) {
  var video = document.getElementById('videoPlayer');
  var overlay = document.getElementById('playOverlay');

  if (!video || !streamUrl) {
    return;
  }

  function attachStream() {
    if (video.getAttribute('data-ready') === '1') {
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      video.hlsController = hls;
      video.setAttribute('data-ready', '1');
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.setAttribute('data-ready', '1');
    } else {
      video.src = streamUrl;
      video.setAttribute('data-ready', '1');
    }
  }

  function startPlayback() {
    attachStream();
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(function () {});
    }
  }

  if (overlay) {
    overlay.addEventListener('click', startPlayback);
  }

  video.addEventListener('play', function () {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  });

  video.addEventListener('click', function () {
    if (video.paused) {
      startPlayback();
    }
  });
}
