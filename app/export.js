/* =====================================================================
 * Lá Số Tử Vi – Lưu ảnh lá số & Xuất PDF (bản App)
 * - window.print() không chạy trong WebView Android → tự dựng ảnh/PDF
 * - html2canvas + jsPDF nạp lười (chỉ khi bấm nút), file nằm trong app/vendor
 * - App: ghi file vào bộ nhớ đệm → mở bảng Chia sẻ của Android
 *   (Lưu vào Drive, gửi Zalo/Messenger, mở bằng trình xem PDF để In…)
 * - Trình duyệt (?appdemo=1): tải file trực tiếp
 * ===================================================================== */
(function () {
  'use strict';
  var CAP = window.Capacitor;
  var NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
  var DEMO = !NATIVE && /[?&]appdemo=1/.test(location.search);
  if (!NATIVE && !DEMO) return;
  if (!document.getElementById('s-laso')) return;          // chỉ trang lá số

  var busy = false;

  /* ---------- tiện ích ---------- */
  function $(id) { return document.getElementById(id); }
  function toast(msg, ms) {
    var t = document.querySelector('.lstv-toast');
    if (!t) { t = document.createElement('div'); t.className = 'lstv-toast'; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, ms || 3000);
  }
  function loadScript(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { fail(new Error('Không nạp được ' + src)); };
      document.head.appendChild(s);
    });
  }
  var libs;
  function ensureLibs() {
    if (!libs) libs = Promise.all([
      window.html2canvas ? 0 : loadScript('app/vendor/html2canvas.min.js'),
      (window.jspdf && window.jspdf.jsPDF) ? 0 : loadScript('app/vendor/jspdf.umd.min.js')
    ]);
    return libs;
  }
  function slug() {
    var n = (($('iName') && $('iName').value) || 'la-so').trim() || 'la-so';
    n = n.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd')
      .replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    var d = new Date(), p = function (x) { return (x < 10 ? '0' : '') + x; };
    return 'LaSoTuVi_' + (n || 'la-so') + '_' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }
  function bgColor() {
    var c = getComputedStyle(document.body).backgroundColor;
    return (!c || c === 'rgba(0, 0, 0, 0)' || c === 'transparent') ? '#efe2c2' : c;
  }

  /* ---------- chụp 1 phần tử ở khổ rộng (lá số không bị cắt) ---------- */
  var SKIP = ['lstv-nav', 'lstv-adbg', 'lstv-export', 'lstv-gate', 'lstv-toast', 'tabs'];
  function capture(el, scale) {
    var h2c = window.html2canvas;
    if (typeof h2c !== 'function') h2c = h2c && (h2c.default || h2c.html2canvas);
    return h2c(el, {
      scale: scale, backgroundColor: bgColor(), useCORS: true, logging: false,
      windowWidth: 960, scrollX: 0, scrollY: 0,
      ignoreElements: function (n) {
        if (!n.classList) return false;
        for (var i = 0; i < SKIP.length; i++) if (n.classList.contains(SKIP[i])) return true;
        return false;
      },
      onclone: function (doc) {
        doc.documentElement.classList.remove('lstv-app');           // bỏ khoảng đệm của app
        doc.querySelectorAll('.chart-scroll').forEach(function (s) { s.style.overflow = 'visible'; });
      }
    });
  }

  /* ---------- ghi file & chia sẻ ---------- */
  function deliver(fileName, base64, mime) {
    if (NATIVE) {
      var FS = CAP.Plugins.Filesystem, SH = CAP.Plugins.Share;
      return FS.writeFile({ path: fileName, data: base64, directory: 'CACHE' })
        .then(function (r) {
          return SH.share({ title: 'Lá số Tử Vi', text: 'Lá số Tử Vi – ' + fileName, files: [r.uri], dialogTitle: 'Lưu hoặc chia sẻ lá số' });
        })
        .catch(function (e) {
          // Người dùng đóng bảng chia sẻ cũng trả về lỗi → không báo lỗi trong trường hợp đó
          if (!/cancel/i.test(String(e && (e.message || e)))) throw e;
        });
    }
    var a = document.createElement('a');
    a.href = 'data:' + mime + ';base64,' + base64; a.download = fileName;
    document.body.appendChild(a); a.click(); a.remove();
    return Promise.resolve();
  }

  /* ---------- 1) Lưu ảnh lá số ---------- */
  function saveImage() {
    if (busy) return; busy = true; setBusy(true);
    toast('Đang tạo ảnh lá số…', 8000);
    ensureLibs()
      .then(function () { return capture($('s-laso'), 2); })
      .then(function (cv) {
        var b64 = cv.toDataURL('image/png').split(',')[1];
        return deliver(slug() + '.png', b64, 'image/png');
      })
      .then(function () { toast('Đã tạo ảnh lá số.'); })
      .catch(function (e) { console.error(e); toast('Không tạo được ảnh: ' + (e.message || e)); })
      .then(function () { busy = false; setBusy(false); });
  }

  /* ---------- 2) Xuất PDF (A4, nhiều trang) ---------- */
  function savePdf() {
    if (busy) return; busy = true; setBusy(true);
    var ids = ['s-laso', 's-tho', 's-cung', 's-daivan', 's-tieuvan'];
    var skipped = 0;
    var parts = ids.map($).filter(function (s) {
      if (!s) return false;
      if (s.classList.contains('lstv-locked')) { skipped++; return false; }
      return true;
    });
    toast('Đang tạo PDF (' + parts.length + ' phần)…', 15000);
    ensureLibs().then(function () {
      var pdf = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
      var PW = 210, PH = 297, M = 10, W = PW - 2 * M, H = PH - 2 * M;
      var first = true;
      // chụp tuần tự để tiết kiệm bộ nhớ điện thoại
      return parts.reduce(function (chain, el, idx) {
        return chain.then(function () {
          toast('Đang tạo PDF… ' + (idx + 1) + '/' + parts.length, 15000);
          return capture(el, 1.4).then(function (cv) {
            var pxPerMm = cv.width / W, sliceH = Math.floor(H * pxPerMm), y = 0;
            while (y < cv.height) {
              var h = Math.min(sliceH, cv.height - y);
              var piece = document.createElement('canvas'); piece.width = cv.width; piece.height = h;
              var ctx = piece.getContext('2d'); ctx.fillStyle = bgColor(); ctx.fillRect(0, 0, piece.width, h);
              ctx.drawImage(cv, 0, y, cv.width, h, 0, 0, cv.width, h);
              if (!first) pdf.addPage(); first = false;
              pdf.addImage(piece.toDataURL('image/jpeg', 0.86), 'JPEG', M, M, W, h / pxPerMm);
              y += h;
            }
            cv.width = cv.height = 0;                                 // giải phóng bộ nhớ
          });
        });
      }, Promise.resolve()).then(function () {
        var n = pdf.getNumberOfPages();
        for (var i = 1; i <= n; i++) {
          pdf.setPage(i); pdf.setFontSize(8); pdf.setTextColor(134, 112, 79);
          pdf.text('La So Tu Vi  -  trang ' + i + '/' + n, PW / 2, PH - 4, { align: 'center' });
        }
        var b64 = pdf.output('datauristring').split(',')[1];
        return deliver(slug() + '.pdf', b64, 'application/pdf');
      });
    })
      .then(function () {
        toast(skipped ? 'Đã tạo PDF. Mở khóa Đại vận/Tiểu vận để đưa thêm vào PDF.' : 'Đã tạo PDF. Mở bằng trình xem PDF để in.', 4500);
      })
      .catch(function (e) { console.error(e); toast('Không tạo được PDF: ' + (e.message || e)); })
      .then(function () { busy = false; setBusy(false); });
  }

  /* ---------- Thanh nút ---------- */
  function setBusy(b) {
    document.querySelectorAll('.lstv-export button').forEach(function (x) { x.disabled = b; });
  }
  function buildBar() {
    var s = $('s-laso'); if (!s || s.querySelector('.lstv-export')) return;
    var bar = document.createElement('div'); bar.className = 'lstv-export';
    bar.innerHTML =
      '<button type="button" data-a="img"><span class="i">圖</span>Lưu ảnh lá số</button>' +
      '<button type="button" data-a="pdf"><span class="i">印</span>Xuất PDF / In</button>';
    bar.querySelector('[data-a=img]').addEventListener('click', saveImage);
    bar.querySelector('[data-a=pdf]').addEventListener('click', savePdf);
    s.insertBefore(bar, s.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildBar); else buildBar();
  window.lstvExport = { image: saveImage, pdf: savePdf };   // để kiểm thử
})();
