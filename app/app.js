/* =====================================================================
 * Lá Số Tử Vi – lớp App (Capacitor + AdMob)
 * Được build-web.mjs chèn vào cuối mỗi trang HTML. Không sửa logic an sao.
 *  - Thanh điều hướng đáy: Lá số / Chư tinh / Kinh Dịch / Giới thiệu
 *  - Banner AdMob neo đáy màn hình
 *  - Rewarded: mở khóa "Đại vận" và "Tiểu vận"
 *  - Đồng ý quyền riêng tư (UMP – bắt buộc với người dùng EEA/UK)
 *  - Nút Back Android
 * Chạy thử trên trình duyệt: thêm ?appdemo=1 vào URL (giả lập quảng cáo).
 * ===================================================================== */
(function () {
  'use strict';

  var CAP = window.Capacitor;
  var NATIVE = !!(CAP && CAP.isNativePlatform && CAP.isNativePlatform());
  var DEMO = !NATIVE && /[?&]appdemo=1/.test(location.search);
  if (!NATIVE && !DEMO) return;               // bản web thường: không làm gì

  var CFG = window.LSTV_ADS || {};
  var TEST_BANNER = 'ca-app-pub-3940256099942544/9214589741';
  var TEST_REWARDED = 'ca-app-pub-3940256099942544/5224354917';
  var bannerId = /^ca-app-pub-\d+\/\d+$/.test(CFG.bannerId || '') ? CFG.bannerId : TEST_BANNER;
  var rewardedId = /^ca-app-pub-\d+\/\d+$/.test(CFG.rewardedId || '') ? CFG.rewardedId : TEST_REWARDED;
  var IS_TEST = bannerId === TEST_BANNER || rewardedId === TEST_REWARDED;

  var AdMob = NATIVE ? CAP.Plugins.AdMob : null;
  var App = NATIVE ? CAP.Plugins.App : null;
  var root = document.documentElement;
  root.classList.add('lstv-app');

  function ss(k, v) {                           // sessionStorage an toàn
    try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch (e) { return null; }
  }
  function $(id) { return document.getElementById(id); }

  /* ---------- Toast ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'lstv-toast'; document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 3200);
  }

  /* ---------- Thanh điều hướng đáy ---------- */
  var PAGES = [
    { href: 'index.html', han: '命', vi: 'Lá số' },
    { href: 'SaoTuVi.html', han: '星', vi: 'Chư tinh' },
    { href: 'KinhDich.html', han: '易', vi: 'Kinh Dịch' },
    { href: 'gioi-thieu.html', han: '序', vi: 'Giới thiệu' }
  ];
  function buildNav() {
    var cur = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    var nav = document.createElement('nav');
    nav.className = 'lstv-nav'; nav.setAttribute('aria-label', 'Điều hướng ứng dụng');
    PAGES.forEach(function (p) {
      var a = document.createElement('a');
      a.href = p.href + (DEMO ? '?appdemo=1' : '');
      if (p.href.toLowerCase() === cur) { a.className = 'on'; a.setAttribute('aria-current', 'page'); }
      a.innerHTML = '<span class="h">' + p.han + '</span><span>' + p.vi + '</span>';
      nav.appendChild(a);
    });
    var bg = document.createElement('div'); bg.className = 'lstv-adbg';
    document.body.appendChild(bg); document.body.appendChild(nav);
  }
  function setAdHeight(h) {
    h = Math.max(0, Math.round(h || 0));
    root.style.setProperty('--lstv-ad-h', h + 'px'); ss('lstv-ad-h', String(h));
  }

  /* ---------- Khóa Đại vận / Tiểu vận ---------- */
  var LOCK_IDS = ['s-daivan', 's-tieuvan'];
  function isUnlocked() { return ss('lstv-unlocked') === '1'; }
  function setLocked(locked) {
    LOCK_IDS.forEach(function (id) { var s = $(id); if (s) s.classList.toggle('lstv-locked', locked); });
  }
  function buildGates() {
    LOCK_IDS.forEach(function (id) {
      var s = $(id); if (!s || s.querySelector('.lstv-gate')) return;
      var g = document.createElement('div'); g.className = 'lstv-gate';
      g.innerHTML = '<div class="seal">運</div>' +
        '<p>Xem một quảng cáo ngắn để mở khóa luận giải <b>Đại vận</b> và <b>Tiểu vận</b>.</p>' +
        '<button type="button">▶ Xem quảng cáo để mở khóa</button>' +
        '<small>' + (CFG.unlockScope === 'chart' ? 'Áp dụng cho lá số hiện tại.' : 'Mở khóa cho cả phiên sử dụng.') + '</small>';
      var h2 = s.querySelector('h2');
      if (h2 && h2.nextSibling) s.insertBefore(g, h2.nextSibling); else s.insertBefore(g, s.firstChild);
      g.querySelector('button').addEventListener('click', onUnlockTap);
    });
    setLocked(!isUnlocked());
    // Mỗi lần "Lập Lá Số" mới: nếu chế độ 'chart' thì khóa lại
    var f = $('f');
    if (f) f.addEventListener('submit', function () {
      if (CFG.unlockScope === 'chart') { ss('lstv-unlocked', '0'); setLocked(true); }
    });
  }
  function unlock(msg) {
    ss('lstv-unlocked', '1'); setLocked(false);
    if (msg) toast(msg);
  }

  /* ---------- Rewarded ---------- */
  var rwState = 'idle';      // idle | loading | ready | failed | showing
  var rewarded = false;
  var adsAllowed = true;     // theo kết quả consent

  function prepareRewarded() {
    if (!NATIVE || !adsAllowed || rwState === 'loading' || rwState === 'ready') return;
    rwState = 'loading';
    AdMob.prepareRewardVideoAd({ adId: rewardedId, isTesting: IS_TEST })
      .then(function () { rwState = 'ready'; })
      .catch(function () { rwState = 'failed'; });
  }
  function setBtns(disabled, label) {
    document.querySelectorAll('.lstv-gate button').forEach(function (b) {
      b.disabled = disabled; if (label) b.textContent = label;
    });
  }
  function onUnlockTap() {
    if (DEMO) {
      setBtns(true, 'Đang phát quảng cáo (giả lập)…');
      setTimeout(function () { setBtns(false, '▶ Xem quảng cáo để mở khóa'); unlock('Đã mở khóa luận giải vận hạn.'); }, 1200);
      return;
    }
    // Không làm khó người dùng: không có quảng cáo thì mở khóa luôn
    if (!adsAllowed) { unlock('Đã mở khóa luận giải vận hạn.'); return; }
    if (rwState === 'ready') { showRewarded(); return; }
    setBtns(true, 'Đang tải quảng cáo…');
    if (rwState !== 'loading') { rwState = 'idle'; prepareRewarded(); }
    var waited = 0;
    var t = setInterval(function () {
      waited += 300;
      if (rwState === 'ready') { clearInterval(t); setBtns(false, '▶ Xem quảng cáo để mở khóa'); showRewarded(); }
      else if (rwState === 'failed' || waited >= 8000) {
        clearInterval(t); setBtns(false, '▶ Xem quảng cáo để mở khóa');
        unlock('Hiện chưa có quảng cáo phù hợp – đã mở khóa miễn phí.');
        rwState = 'idle';
      }
    }, 300);
  }
  function showRewarded() {
    rwState = 'showing'; rewarded = false;
    AdMob.showRewardVideoAd().catch(function () {
      rwState = 'idle'; unlock('Không phát được quảng cáo – đã mở khóa miễn phí.'); prepareRewarded();
    });
  }

  /* ---------- Khởi tạo AdMob ---------- */
  function initAds() {
    if (DEMO) { setAdHeight(50); return; }
    var saved = parseInt(ss('lstv-ad-h') || '0', 10); if (saved) setAdHeight(saved);

    AdMob.addListener('bannerAdSizeChanged', function (info) { setAdHeight(info && info.height); });
    AdMob.addListener('bannerAdFailedToLoad', function () { setAdHeight(0); });
    AdMob.addListener('onRewardedVideoAdReward', function () { rewarded = true; });
    AdMob.addListener('onRewardedVideoAdDismissed', function () {
      rwState = 'idle';
      if (rewarded) unlock('Đã mở khóa luận giải vận hạn. Cảm ơn bạn!');
      else toast('Cần xem hết quảng cáo để mở khóa.');
      prepareRewarded();
    });
    AdMob.addListener('onRewardedVideoAdFailedToLoad', function () { rwState = 'failed'; });
    AdMob.addListener('onRewardedVideoAdFailedToShow', function () {
      rwState = 'idle'; unlock('Không phát được quảng cáo – đã mở khóa miễn phí.');
    });

    AdMob.initialize({ initializeForTesting: IS_TEST })
      .then(function () { return AdMob.requestConsentInfo(); })
      .then(function (info) {
        if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') return AdMob.showConsentForm();
        return info;
      })
      .then(function (info) {
        adsAllowed = !info || info.canRequestAds !== false;
        if (info && info.privacyOptionsRequirementStatus === 'REQUIRED') ss('lstv-privacy-opt', '1');
        if (!adsAllowed) { setAdHeight(0); return; }
        AdMob.showBanner({
          adId: bannerId, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: 0, isTesting: IS_TEST
        }).catch(function () { setAdHeight(0); });
        if ($('s-daivan')) prepareRewarded();
      })
      .catch(function () { adsAllowed = true; prepareRewarded(); });
  }

  /* ---------- Nút Back Android ---------- */
  function initBack() {
    if (!App) return;
    App.addListener('backButton', function () {
      var cur = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      if (cur !== 'index.html') { location.href = 'index.html'; return; }
      if (location.hash) { history.replaceState(null, '', location.pathname); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      if (window.scrollY > 300) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      App.exitApp();
    });
  }

  /* ---------- Tùy chọn quyền riêng tư (dùng ở trang Giới thiệu) ---------- */
  window.lstvPrivacyOptions = function () {
    if (DEMO) { toast('Giả lập: mở bảng tùy chọn quyền riêng tư.'); return; }
    AdMob.showPrivacyOptionsForm().catch(function () { toast('Khu vực của bạn không yêu cầu tùy chọn này.'); });
  };
  window.lstvShowPrivacyBtn = function () { return DEMO || ss('lstv-privacy-opt') === '1'; };

  function start() {
    buildNav(); buildGates(); initAds(); initBack();
    var pb = $('lstvPrivacyBtn'); if (pb && window.lstvShowPrivacyBtn()) pb.hidden = false;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
