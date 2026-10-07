/*
 * Cấu hình quảng cáo AdMob.
 * - Mặc định dùng ID THỬ NGHIỆM của Google (an toàn khi dev, không bị khóa tài khoản).
 * - Khi build bản phát hành trên GitHub Actions, scripts/build-web.mjs sẽ thay
 *   2 giá trị __BANNER_ID__/__REWARDED_ID__ bằng secrets ADMOB_BANNER_ID / ADMOB_REWARDED_ID.
 * - TUYỆT ĐỐI không bấm vào quảng cáo thật của chính mình khi test.
 */
window.LSTV_ADS = {
  bannerId: '__BANNER_ID__',
  rewardedId: '__REWARDED_ID__',
  // Mở khóa luận giải Đại vận/Tiểu vận: 'session' = 1 quảng cáo cho cả phiên dùng app,
  // 'chart' = mỗi lá số mới phải xem lại 1 quảng cáo.
  unlockScope: 'session'
};
