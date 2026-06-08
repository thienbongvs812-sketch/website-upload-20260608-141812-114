(function () {
  window.initMoviePlayer = function (src, videoId, coverId) {
    const video = document.getElementById(videoId);
    const cover = document.getElementById(coverId);
    const triggers = Array.from(document.querySelectorAll("[data-play-trigger]"));
    let ready = false;
    let hls = null;

    if (!video || !src) {
      return;
    }

    function reveal() {
      if (cover) {
        cover.classList.add("is-hidden");
      }
      video.controls = true;
    }

    function tryPlay() {
      reveal();
      const result = video.play();
      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    }

    function loadMedia() {
      if (ready) {
        return;
      }
      ready = true;

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = src;
        video.load();
        return;
      }

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          maxBufferLength: 30,
          enableWorker: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
          tryPlay();
        });
        return;
      }

      video.src = src;
      video.load();
    }

    function start() {
      loadMedia();
      tryPlay();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", start);
    });

    if (cover) {
      cover.addEventListener("click", start);
    }

    video.addEventListener("play", reveal);
    video.addEventListener("click", function () {
      if (video.paused) {
        start();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hls) {
        hls.destroy();
        hls = null;
      }
    });
  };
})();
