(function () {
    "use strict";

    function ready(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback);
        } else {
            callback();
        }
    }

    function setStatus(statusElement, message) {
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    function initPlayer(container) {
        var video = container.querySelector("[data-video-element]");
        var button = container.querySelector("[data-play-trigger]");
        var status = container.querySelector("[data-player-status]");
        var source = container.getAttribute("data-video-src");
        var hlsInstance = null;
        var started = false;

        if (!video || !button || !source) {
            setStatus(status, "播放器初始化失败：未找到播放源");
            return;
        }

        function playVideo() {
            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {
                    setStatus(status, "浏览器阻止了自动播放，请再次点击视频播放");
                });
            }
        }

        function start() {
            if (started) {
                playVideo();
                return;
            }

            started = true;
            container.classList.add("is-playing");
            setStatus(status, "正在加载高清播放源...");

            if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });
                hlsInstance.loadSource(source);
                hlsInstance.attachMedia(video);
                hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    setStatus(status, "播放源加载完成");
                    playVideo();
                });
                hlsInstance.on(window.Hls.Events.ERROR, function (eventName, data) {
                    if (!data || !data.fatal) {
                        return;
                    }

                    if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                        setStatus(status, "网络波动，正在重新加载...");
                        hlsInstance.startLoad();
                    } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                        setStatus(status, "媒体解码异常，正在恢复...");
                        hlsInstance.recoverMediaError();
                    } else {
                        setStatus(status, "播放源暂时无法恢复，请刷新页面重试");
                        hlsInstance.destroy();
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = source;
                video.addEventListener("loadedmetadata", function () {
                    setStatus(status, "播放源加载完成");
                    playVideo();
                }, { once: true });
                video.load();
            } else {
                setStatus(status, "当前浏览器不支持 HLS 播放，请使用最新版浏览器访问");
                video.src = source;
            }
        }

        button.addEventListener("click", start);
        video.addEventListener("play", function () {
            container.classList.add("is-playing");
        });
        window.addEventListener("beforeunload", function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }

    ready(function () {
        document.querySelectorAll("[data-player]").forEach(initPlayer);
    });
}());
