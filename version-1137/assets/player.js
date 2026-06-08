(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  ready(function () {
    var section = document.querySelector(".player-section");
    var video = document.getElementById("movie-video");

    if (!section || !video) {
      return;
    }

    var button = section.querySelector(".player-start");
    var state = section.querySelector(".player-state");
    var url = section.getAttribute("data-video-url");
    var hlsInstance = null;
    var started = false;

    function setState(message) {
      if (state) {
        state.textContent = message || "";
      }
    }

    function playVideo() {
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function") {
        attempt.catch(function () {
          setState("点击视频继续播放");
        });
      }
    }

    function start() {
      if (!url) {
        setState("播放暂不可用");
        return;
      }

      if (button) {
        button.classList.add("is-hidden");
      }

      if (started) {
        playVideo();
        return;
      }

      started = true;
      setState("加载中");

      if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
          setState("");
          playVideo();
        });
        hlsInstance.on(window.Hls.Events.ERROR, function (event, data) {
          if (!data || !data.fatal) {
            return;
          }
          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            setState("网络波动，正在重连");
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            setState("播放恢复中");
            hlsInstance.recoverMediaError();
          } else {
            setState("暂时无法播放");
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadedmetadata", function () {
          setState("");
          playVideo();
        }, { once: true });
      } else {
        setState("暂时无法播放");
      }
    }

    if (button) {
      button.addEventListener("click", start);
    }

    video.addEventListener("click", function () {
      if (!started) {
        start();
      }
    });

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
        hlsInstance = null;
      }
    });
  });
})();
