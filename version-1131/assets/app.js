const ready = (callback) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback);
  } else {
    callback();
  }
};

let hlsLoader = null;

const loadHls = () => {
  if (window.Hls) {
    return Promise.resolve(window.Hls);
  }
  if (hlsLoader) {
    return hlsLoader;
  }
  hlsLoader = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js";
    script.async = true;
    script.onload = () => resolve(window.Hls);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return hlsLoader;
};

const setupMenu = () => {
  const toggle = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".mobile-nav");
  if (!toggle || !nav) {
    return;
  }
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
};

const setupHero = () => {
  const carousel = document.querySelector("[data-hero-carousel]");
  if (!carousel) {
    return;
  }
  const slides = Array.from(carousel.querySelectorAll(".hero-slide"));
  const dots = Array.from(carousel.querySelectorAll(".hero-dot"));
  if (slides.length < 2) {
    return;
  }
  let index = 0;
  const show = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, itemIndex) => slide.classList.toggle("is-active", itemIndex === index));
    dots.forEach((dot, itemIndex) => dot.classList.toggle("is-active", itemIndex === index));
  };
  dots.forEach((dot) => {
    dot.addEventListener("click", () => show(Number(dot.dataset.slide || 0)));
  });
  setInterval(() => show(index + 1), 5200);
};

const uniqueSorted = (items) => {
  return Array.from(new Set(items.filter(Boolean))).sort((a, b) => a.localeCompare(b, "zh-Hans-CN"));
};

const setupFilters = () => {
  const area = document.querySelector(".filter-area");
  if (!area) {
    return;
  }
  const cards = Array.from(area.querySelectorAll(".filter-card"));
  const input = area.querySelector(".filter-input");
  const selects = Array.from(area.querySelectorAll(".filter-select"));
  const count = area.querySelector(".filter-count");
  const parameters = new URLSearchParams(window.location.search);
  selects.forEach((select) => {
    if (select.options.length <= 1) {
      const key = select.dataset.filter;
      const values = uniqueSorted(cards.map((card) => card.dataset[key] || ""));
      values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }
    const preset = parameters.get(select.dataset.filter || "");
    if (preset) {
      select.value = preset;
    }
  });
  const query = parameters.get("q");
  if (input && query) {
    input.value = query;
  }
  const apply = () => {
    const term = (input ? input.value : "").trim().toLowerCase();
    const chosen = Object.fromEntries(selects.map((select) => [select.dataset.filter, select.value]));
    let visible = 0;
    cards.forEach((card) => {
      const haystack = [
        card.dataset.title,
        card.dataset.region,
        card.dataset.type,
        card.dataset.year,
        card.dataset.genre,
        card.dataset.tags
      ].join(" ").toLowerCase();
      const matchedText = !term || haystack.includes(term);
      const matchedSelects = Object.entries(chosen).every(([key, value]) => !value || (card.dataset[key] || "") === value);
      const matched = matchedText && matchedSelects;
      card.classList.toggle("is-hidden", !matched);
      if (matched) {
        visible += 1;
      }
    });
    if (count) {
      count.textContent = String(visible);
    }
  };
  if (input) {
    input.addEventListener("input", apply);
  }
  selects.forEach((select) => select.addEventListener("change", apply));
  apply();
};

const setupPlayers = () => {
  const players = Array.from(document.querySelectorAll(".movie-player"));
  if (!players.length) {
    return;
  }
  players.forEach((player) => {
    const video = player.querySelector("video");
    const overlay = player.querySelector(".player-overlay");
    const fullscreen = player.querySelector(".player-fullscreen");
    const message = player.querySelector(".player-message");
    if (!video) {
      return;
    }
    const stream = video.dataset.video || "";
    let attached = false;
    let requested = false;
    const showMessage = (text) => {
      if (message) {
        message.textContent = text;
      }
    };
    const start = () => {
      requested = true;
      if (!attached) {
        showMessage("正在打开影片");
        return;
      }
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      video.controls = true;
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => showMessage("点击视频画面继续播放"));
      }
    };
    const attachNative = () => {
      video.src = stream;
      attached = true;
      showMessage("");
      if (requested) {
        start();
      }
    };
    const attachHls = (Hls) => {
      if (!Hls || !Hls.isSupported()) {
        attachNative();
        return;
      }
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hls.loadSource(stream);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        attached = true;
        showMessage("");
        if (requested) {
          start();
        }
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data && data.fatal) {
          showMessage("播放暂时不可用，请刷新页面重试");
        }
      });
    };
    if (stream) {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        attachNative();
      } else {
        loadHls().then(attachHls).catch(() => showMessage("播放暂时不可用，请刷新页面重试"));
      }
    }
    if (overlay) {
      overlay.addEventListener("click", start);
    }
    video.addEventListener("click", () => {
      if (video.paused) {
        start();
      } else {
        video.pause();
      }
    });
    video.addEventListener("play", () => {
      if (overlay) {
        overlay.classList.add("is-hidden");
      }
      showMessage("");
    });
    if (fullscreen) {
      fullscreen.addEventListener("click", () => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else if (player.requestFullscreen) {
          player.requestFullscreen();
        }
      });
    }
  });
};

ready(() => {
  setupMenu();
  setupHero();
  setupFilters();
  setupPlayers();
});
