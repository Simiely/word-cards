// ============================================================
// common.js — 公共模块（三页面共享）
// 提供：SW注册、语音朗读单例、离线下载通用逻辑
// 依赖：animal-data.js（提供全局 animals 数组）
// ============================================================

// ---- Service Worker 注册 ----
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/word-cards/sw.js').catch(function(){});
    }
}

// ---- 语音朗读单例 ----
var speechAudio = new Audio();

function speak(lang, animal) {
    try {
        var src;
        if (lang === 'zh') src = animal.speech_zh;
        else if (lang === 'en') src = animal.speech_en;
        else if (lang === 'fact') src = animal.speech_fact;
        if (!src) return;
        speechAudio.pause();
        speechAudio.src = src;
        speechAudio.volume = 1;
        speechAudio.play().catch(function(){});
    } catch(e) {}
}

// ---- 收集全部离线资源 URL ----
function collectOfflineUrls() {
    var urls = [
        '/word-cards/',
        '/word-cards/index.html',
        '/word-cards/animal-cards.html',
        '/word-cards/animal-select.html',
        '/word-cards/animal-data.js',
        '/word-cards/image-interaction.js',
        '/word-cards/common.js',
        '/word-cards/common.css',
        '/word-cards/manifest.json'
    ];
    for (var i = 0; i < animals.length; i++) {
        var a = animals[i];
        if (a.image) urls.push(a.image);
        if (a.speech_zh) urls.push(a.speech_zh);
        if (a.speech_en) urls.push(a.speech_en);
        if (a.speech_fact) urls.push(a.speech_fact);
    }
    return urls;
}

// ---- 离线运行按钮通用逻辑 ----
// opts: { defaultText, loadingText, doneText, doneDuration, hintEl, notReadyText }
function initOfflineButton(btn, opts) {
    opts = opts || {};
    var defaultText = opts.defaultText || '📡 离线运行';
    var doneDuration = opts.doneDuration || 4000;
    var active = false;

    btn.addEventListener('click', function() {
        if (active) return;

        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
            btn.textContent = opts.notReadyText || '⚠️ SW未就绪';
            btn.classList.add('done');
            if (opts.hintEl) opts.hintEl.textContent = '请刷新页面后再试';
            setTimeout(function() {
                btn.textContent = defaultText;
                btn.classList.remove('done');
                if (opts.hintEl) opts.hintEl.textContent = '';
            }, 3000);
            return;
        }

        var urls = collectOfflineUrls();
        active = true;
        btn.textContent = '⏳ 0/' + urls.length;
        btn.classList.add('loading');

        var channel = new MessageChannel();
        channel.port1.onmessage = function(e) {
            var data = e.data;
            if (data.complete) {
                active = false;
                btn.classList.remove('loading');
                var success = data.total - data.failed;
                btn.textContent = '✅ ' + success + '/' + data.total;
                btn.classList.add('done');
                if (opts.hintEl) opts.hintEl.textContent = '可以断网使用了！';
                setTimeout(function() {
                    btn.textContent = defaultText;
                    btn.classList.remove('done');
                    if (opts.hintEl) opts.hintEl.textContent = '';
                }, doneDuration);
            } else {
                btn.textContent = '⏳ ' + data.done + '/' + data.total;
            }
        };

        navigator.serviceWorker.controller.postMessage(
            { type: 'DOWNLOAD_ALL', urls: urls },
            [channel.port2]
        );
    });
}
