const pageBase = document.documentElement.dataset.base || '';
let searchIndexPromise = null;

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function getSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch(`${pageBase}assets/data/search-index.json`)
      .then((response) => response.json())
      .catch(() => []);
  }
  return searchIndexPromise;
}

function renderSearchResults(panel, keyword, items) {
  const query = normalizeText(keyword);
  if (!query) {
    panel.classList.remove('is-open');
    panel.innerHTML = '';
    return;
  }

  const results = items
    .filter((item) => normalizeText(item.search).includes(query))
    .slice(0, 12);

  if (!results.length) {
    panel.innerHTML = '<div class="search-result"><div></div><div><h3>未找到匹配影片</h3><p>请尝试片名、年份、地区或类型关键词。</p></div></div>';
    panel.classList.add('is-open');
    return;
  }

  panel.innerHTML = results
    .map((item) => `
      <a class="search-result" href="${pageBase}${item.url}">
        <span class="search-result-cover">
          <img src="${pageBase}${item.cover}" alt="${item.title}" loading="lazy" onerror="this.style.display='none';">
        </span>
        <span>
          <h3>${item.title}</h3>
          <p>${item.year} · ${item.region} · ${item.type}</p>
        </span>
      </a>
    `)
    .join('');
  panel.classList.add('is-open');
}

function setupGlobalSearch() {
  const inputs = [$('.global-search-input'), $('.hero-search-input')].filter(Boolean);
  const panels = [ $('[data-search-panel]'), $('[data-hero-search-panel]') ];

  inputs.forEach((input, index) => {
    const panel = panels[index] || panels[0];
    if (!panel) return;

    input.addEventListener('input', async () => {
      const items = await getSearchIndex();
      renderSearchResults(panel, input.value, items);
    });

    input.addEventListener('focus', async () => {
      if (input.value.trim()) {
        const items = await getSearchIndex();
        renderSearchResults(panel, input.value, items);
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.global-search') && !event.target.closest('.hero-search-card')) {
      $all('.search-panel').forEach((panel) => panel.classList.remove('is-open'));
    }
  });
}

function setupMobileNav() {
  const toggle = $('[data-nav-toggle]');
  const nav = $('[data-mobile-nav]');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    nav.classList.toggle('is-open');
  });
}

function setupHeroSlider() {
  const slider = $('[data-hero-slider]');
  if (!slider) return;

  const slides = $all('[data-hero-slide]', slider);
  const dots = $all('[data-hero-dot]', slider);
  const prev = $('[data-hero-prev]', slider);
  const next = $('[data-hero-next]', slider);
  let current = 0;
  let timer = null;

  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => slide.classList.toggle('is-active', slideIndex === current));
    dots.forEach((dot, dotIndex) => dot.classList.toggle('is-active', dotIndex === current));
  }

  function start() {
    stop();
    timer = window.setInterval(() => show(current + 1), 5200);
  }

  function stop() {
    if (timer) window.clearInterval(timer);
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      show(index);
      start();
    });
  });

  if (prev) {
    prev.addEventListener('click', () => {
      show(current - 1);
      start();
    });
  }

  if (next) {
    next.addEventListener('click', () => {
      show(current + 1);
      start();
    });
  }

  slider.addEventListener('mouseenter', stop);
  slider.addEventListener('mouseleave', start);
  start();
}

function setupFilters() {
  const panel = $('[data-filter-panel]');
  const grid = $('[data-filter-grid]');
  if (!panel || !grid) return;

  const keywordInput = $('[data-filter-keyword]', panel);
  const yearSelect = $('[data-filter-year]', panel);
  const typeSelect = $('[data-filter-type]', panel);
  const regionSelect = $('[data-filter-region]', panel);
  const resetButton = $('[data-reset-filters]', panel);
  const counter = $('[data-filter-count]', panel);
  const cards = $all('[data-movie-card]', grid);

  function applyFilters() {
    const keyword = normalizeText(keywordInput ? keywordInput.value : '');
    const year = yearSelect ? yearSelect.value : '';
    const type = typeSelect ? typeSelect.value : '';
    const region = regionSelect ? regionSelect.value : '';
    let visible = 0;

    cards.forEach((card) => {
      const text = normalizeText(`${card.dataset.title} ${card.dataset.genre} ${card.dataset.region} ${card.dataset.type} ${card.dataset.year}`);
      const matchesKeyword = !keyword || text.includes(keyword);
      const matchesYear = !year || card.dataset.year === year;
      const matchesType = !type || card.dataset.type === type;
      const matchesRegion = !region || card.dataset.region === region;
      const show = matchesKeyword && matchesYear && matchesType && matchesRegion;
      card.style.display = show ? '' : 'none';
      if (show) visible += 1;
    });

    if (counter) counter.textContent = `显示 ${visible} 部`;
  }

  [keywordInput, yearSelect, typeSelect, regionSelect].forEach((input) => {
    if (input) input.addEventListener('input', applyFilters);
  });

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (keywordInput) keywordInput.value = '';
      if (yearSelect) yearSelect.value = '';
      if (typeSelect) typeSelect.value = '';
      if (regionSelect) regionSelect.value = '';
      applyFilters();
    });
  }

  applyFilters();
}

async function loadHls(video, source, message) {
  if (!source) {
    throw new Error('当前影片没有可用播放源');
  }

  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = source;
    await video.play();
    return;
  }

  const module = await import('./hls-vendor-dru42stk.js');
  const Hls = module.H || module.default || window.Hls;

  if (!Hls || !Hls.isSupported()) {
    throw new Error('当前浏览器不支持 HLS 播放');
  }

  const hls = new Hls({
    enableWorker: true,
    lowLatencyMode: true,
    backBufferLength: 90
  });

  hls.loadSource(source);
  hls.attachMedia(video);

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play().catch(() => {
      if (message) {
        message.textContent = '浏览器阻止了自动播放，请再次点击播放按钮。';
        message.classList.add('is-visible');
      }
    });
  });

  hls.on(Hls.Events.ERROR, (_event, data) => {
    if (!data || !data.fatal) return;
    if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
      hls.startLoad();
    } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
      hls.recoverMediaError();
    } else {
      hls.destroy();
      throw new Error('播放器初始化失败');
    }
  });

  video._hlsInstance = hls;
}

function setupPlayer() {
  const player = $('.movie-player');
  const gate = $('[data-play-gate]');
  if (!player || !gate) return;

  const shell = player.closest('.player-shell');
  const message = $('[data-player-message]', shell || document);
  const source = player.dataset.m3u8;

  gate.addEventListener('click', async () => {
    try {
      if (message) {
        message.textContent = '正在加载播放源...';
        message.classList.add('is-visible');
      }
      await loadHls(player, source, message);
      if (shell) shell.classList.add('is-playing');
      if (message) message.classList.remove('is-visible');
    } catch (error) {
      if (message) {
        message.textContent = error.message || '播放失败，请稍后重试';
        message.classList.add('is-visible');
      }
    }
  });
}

setupMobileNav();
setupGlobalSearch();
setupHeroSlider();
setupFilters();
setupPlayer();
