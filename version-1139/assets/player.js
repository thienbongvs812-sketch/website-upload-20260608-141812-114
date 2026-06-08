(function () {
  function setup(box) {
    var video = box.querySelector('video');
    var overlay = box.querySelector('.player-overlay');
    var errorBox = box.parentElement.querySelector('.player-error');
    var src = box.getAttribute('data-video');
    var ready = false;
    var hls = null;

    function showError() {
      if (errorBox) {
        errorBox.textContent = '视频加载失败，请稍后重试';
        errorBox.classList.add('is-visible');
      }
    }

    function bind() {
      if (ready || !video || !src) {
        return;
      }
      ready = true;

      if (window.Hls && window.Hls.isSupported()) {
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(window.Hls.Events.ERROR, function (event, data) {
          if (data && data.fatal) {
            showError();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        showError();
      }
    }

    function play() {
      bind();
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      var result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(function () {
          if (overlay) {
            overlay.classList.remove('is-hidden');
          }
        });
      }
    }

    if (video && overlay) {
      overlay.addEventListener('click', play);
      video.addEventListener('click', function () {
        if (video.paused) {
          play();
        }
      });
      video.addEventListener('play', function () {
        overlay.classList.add('is-hidden');
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          overlay.classList.remove('is-hidden');
        }
      });
      window.addEventListener('pagehide', function () {
        if (hls) {
          hls.destroy();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.slice.call(document.querySelectorAll('.watch-player')).forEach(setup);
  });
})();
