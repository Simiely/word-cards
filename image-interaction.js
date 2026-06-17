// ============================================================
// 图片交互模块 — 缩放、拖拽、双指缩放、边缘色提取
// 用法: var cleanup = initImageInteraction(config);
//       cleanup() 可解绑所有事件。
//
// config: {
//   container:   DOM 元素 — 图片容器（用于绑定事件和读取尺寸）
//   img:         DOM 元素 — <img> 元素
//   zoomBtn:     DOM 元素 — 缩放切换按钮
//   getAnimal:   function — 返回当前动物对象（用于提取边缘色）
// }
// ============================================================

function initImageInteraction(config) {
    var container = config.container;
    var zoomBtn  = config.zoomBtn;
    var getImg   = function() { return config.img; };

    // ---- 状态 ----
    var zoomEnabled = false;
    var zoomScale = 1;
    var baseScale = 1;
    var offsetX = 0, offsetY = 0;

    // ---- 内部函数 ----
    function cardImg() { return getImg(); }

    function getImgBaseSize() {
        var img = cardImg();
        if (!img || !img.naturalWidth) return { w: 0, h: 0 };
        var cw = container.clientWidth;
        var ch = container.clientHeight;
        var iw = img.naturalWidth;
        var ih = img.naturalHeight;
        baseScale = Math.max(cw / iw, ch / ih);
        return { w: iw * baseScale, h: ih * baseScale };
    }

    function applyImgSize() {
        var img = cardImg();
        if (!img) return;
        var size = getImgBaseSize();
        var sw = size.w * zoomScale;
        var sh = size.h * zoomScale;
        var cw = container.clientWidth;
        var ch = container.clientHeight;
        img.style.width = sw + 'px';
        img.style.height = sh + 'px';
        img.style.left = ((cw - sw) / 2) + 'px';
        img.style.top = ((ch - sh) / 2) + 'px';
    }

    function clampAllOffsets() {
        var img = cardImg();
        if (!img) return;
        var cw = container.clientWidth;
        var ch = container.clientHeight;
        var imgW = parseFloat(img.style.width) || cw;
        var imgH = parseFloat(img.style.height) || ch;
        var maxDX = Math.max(0, (imgW - cw) / 2);
        var maxDY = Math.max(0, (imgH - ch) / 2);
        offsetX = Math.max(-maxDX, Math.min(maxDX, offsetX));
        offsetY = Math.max(-maxDY, Math.min(maxDY, offsetY));
        applyOffset();
    }

    function applyOffset() {
        var img = cardImg();
        if (!img) return;
        img.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
    }

    function setZoomMode(on) {
        zoomEnabled = on;
        if (on) {
            container.classList.add('zoom-mode');
            zoomScale = 1;
            offsetX = 0; offsetY = 0;
            applyImgSize();
            var img = cardImg();
            if (img) { img.style.transition = 'transform 0.3s ease'; img.style.transform = ''; }
            updateZoomIcon();
        } else {
            container.classList.remove('zoom-mode', 'dragging');
            zoomScale = 1;
            offsetX = 0; offsetY = 0;
            var img2 = cardImg();
            if (img2) {
                img2.style.transition = 'transform 0.3s ease';
                img2.style.transform = '';
                img2.style.width = '100%';
                img2.style.height = '100%';
                img2.style.left = '0';
                img2.style.top = '0';
            }
            updateZoomIcon();
        }
    }

    function updateZoomIcon() {
        if (!zoomBtn) return;
        if (zoomEnabled) {
            zoomBtn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="22"/><line x1="2" y1="12" x2="8" y2="12"/><line x1="16" y1="12" x2="22" y2="12"/></svg>';
            zoomBtn.title = '缩小查看完整图片';
        } else {
            zoomBtn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><line x1="20" y1="20" x2="16" y2="16"/></svg>';
            zoomBtn.title = '放大填充';
        }
    }

    // ---- 拖拽 ----
    function onDragStart() {
        if (!zoomEnabled) return;
        var img = cardImg();
        if (img) img.style.transition = 'none';
    }

    function onDragMove(ex, ey, prevX, prevY) {
        if (!zoomEnabled) return;
        var dx = ex - prevX;
        var dy = ey - prevY;
        offsetX += dx;
        offsetY += dy;
        clampAllOffsets();
        return { x: ex, y: ey };
    }

    function onDragEnd() {
        if (!zoomEnabled) return;
        var img = cardImg();
        if (img) img.style.transition = 'transform 0.15s ease';
    }

    // ---- 双指缩放 ----
    var pinchStartDist = 0;
    var pinchStartScale = 1;
    var pinchStartOX = 0, pinchStartOY = 0;

    function onPinchStart(t1, t2) {
        if (!zoomEnabled) { setZoomMode(true); }
        pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        pinchStartScale = zoomScale;
        pinchStartOX = offsetX;
        pinchStartOY = offsetY;
        var img = cardImg();
        if (img) img.style.transition = 'none';
    }

    function onPinchMove(t1, t2) {
        if (pinchStartDist === 0) return;
        var newDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        var ratio = newDist / pinchStartDist;
        var newScale = Math.max(0.5, Math.min(4, pinchStartScale * ratio));
        var cx = (t1.clientX + t2.clientX) / 2;
        var cy = (t1.clientY + t2.clientY) / 2;
        var rect = container.getBoundingClientRect();
        var anchorX = cx - rect.left;
        var anchorY = cy - rect.top;
        var img = cardImg();
        var imgRect = img.getBoundingClientRect();
        var imgCX = imgRect.left + imgRect.width / 2;
        var imgCY = imgRect.top + imgRect.height / 2;
        var relX = anchorX - imgCX;
        var relY = anchorY - imgCY;
        var scaleChange = newScale / zoomScale;
        zoomScale = newScale;
        applyImgSize();
        offsetX = pinchStartOX - relX * (scaleChange - 1);
        offsetY = pinchStartOY - relY * (scaleChange - 1);
        clampAllOffsets();
    }

    function onPinchEnd() {
        pinchStartDist = 0;
        var img = cardImg();
        if (img) img.style.transition = 'transform 0.15s ease';
    }

    // ---- 滚轮缩放 ----
    function onWheel(e) {
        if (!cardImg()) return;
        e.preventDefault();
        if (!zoomEnabled) { setZoomMode(true); }
        var rect = container.getBoundingClientRect();
        var anchorX = e.clientX - rect.left;
        var anchorY = e.clientY - rect.top;
        var img = cardImg();
        var imgRect = img.getBoundingClientRect();
        var imgCX = imgRect.left + imgRect.width / 2;
        var imgCY = imgRect.top + imgRect.height / 2;
        var relX = anchorX - imgCX;
        var relY = anchorY - imgCY;
        var delta = e.deltaY > 0 ? -0.1 : 0.1;
        var newScale = Math.max(0.5, Math.min(4, zoomScale + delta));
        if (newScale === zoomScale) return;
        var scaleChange = newScale / zoomScale;
        zoomScale = newScale;
        applyImgSize();
        offsetX = offsetX - relX * (scaleChange - 1);
        offsetY = offsetY - relY * (scaleChange - 1);
        clampAllOffsets();
        if (img) img.style.transition = 'none';
        clearTimeout(container._wheelTimer);
        container._wheelTimer = setTimeout(function() {
            if (cardImg()) cardImg().style.transition = 'transform 0.15s ease';
        }, 150);
    }

    // ---- Zoom 按钮 ----
    zoomBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        setZoomMode(!zoomEnabled);
    });
    zoomBtn.addEventListener('pointerdown', function(e) {
        e.stopPropagation();
    });

    // ---- Pointer Events 拖拽 ----
    var pointerDown = false, lastPX = 0, lastPY = 0;
    var pointerId = null;

    function onPDown(e) {
        if (e.target === zoomBtn) return;
        // 跳过关闭按钮
        if (e.target.closest && e.target.closest('.btn-close')) return;
        pointerDown = true;
        pointerId = e.pointerId;
        lastPX = e.clientX; lastPY = e.clientY;
        container.setPointerCapture(e.pointerId);
        onDragStart();
        if (zoomEnabled) { container.classList.add('dragging'); }
    }

    function onPMove(e) {
        if (!pointerDown || e.pointerId !== pointerId) return;
        var result = onDragMove(e.clientX, e.clientY, lastPX, lastPY);
        if (result) { lastPX = result.x; lastPY = result.y; }
    }

    function onPUp(e) {
        if (!pointerDown || e.pointerId !== pointerId) return;
        pointerDown = false;
        pointerId = null;
        onDragEnd();
        container.classList.remove('dragging');
        try { container.releasePointerCapture(e.pointerId); } catch(ex) {}
    }

    container.addEventListener('pointerdown', onPDown);
    container.addEventListener('pointermove', onPMove);
    container.addEventListener('pointerup', onPUp);
    container.addEventListener('pointercancel', onPUp);

    // ---- 触摸双指缩放 ----
    var pinchActive = false;

    function onTStart(e) {
        if (e.target === zoomBtn) return;
        if (e.touches.length === 2) {
            pinchActive = true;
            onPinchStart(e.touches[0], e.touches[1]);
            return;
        }
        pinchActive = false;
        pinchStartDist = 0;
    }

    function onTMove(e) {
        if (e.touches.length === 2 && pinchActive) {
            onPinchMove(e.touches[0], e.touches[1]);
            e.preventDefault();
        }
    }

    function onTEnd(e) {
        if (pinchActive && e.touches.length < 2) {
            pinchActive = false;
            onPinchEnd();
        }
    }

    container.addEventListener('touchstart', onTStart, { passive: false });
    container.addEventListener('touchmove', onTMove, { passive: false });
    container.addEventListener('touchend', onTEnd);

    // ---- 边缘平均色提取 ----
    container.addEventListener('wheel', onWheel, { passive: false });

    function extractEdgeColor(imgEl) {
        if (!imgEl || !imgEl.naturalWidth) return;
        try {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            var iw = imgEl.naturalWidth, ih = imgEl.naturalHeight;
            canvas.width = iw; canvas.height = ih;
            ctx.drawImage(imgEl, 0, 0, iw, ih);
            var top = ctx.getImageData(0, 0, iw, 1).data;
            var bottom = ctx.getImageData(0, ih-1, iw, 1).data;
            var left = ctx.getImageData(0, 0, 1, ih).data;
            var right = ctx.getImageData(iw-1, 0, 1, ih).data;
            var r = 0, g = 0, b = 0, count = 0;
            function add(data) {
                for (var i = 0; i < data.length; i += 4) {
                    r += data[i]; g += data[i+1]; b += data[i+2]; count++;
                }
            }
            add(top); add(bottom); add(left); add(right);
            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            container.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
        } catch(e) {}
    }

    // 图片加载后自动提取边缘色
    var imgEl = cardImg();
    if (imgEl) {
        imgEl.addEventListener('load', function() { extractEdgeColor(imgEl); });
        if (imgEl.complete) extractEdgeColor(imgEl);
    }

    // ---- 返回清理函数 ----
    return function cleanup() {
        container.removeEventListener('pointerdown', onPDown);
        container.removeEventListener('pointermove', onPMove);
        container.removeEventListener('pointerup', onPUp);
        container.removeEventListener('pointercancel', onPUp);
        container.removeEventListener('touchstart', onTStart);
        container.removeEventListener('touchmove', onTMove);
        container.removeEventListener('touchend', onTEnd);
        container.removeEventListener('wheel', onWheel);
    };
}
