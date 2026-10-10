# Lá Số Tử Vi – App Android (Capacitor + AdMob)

App đóng gói nguyên bộ `index.html` (an sao), `SaoTuVi.html`, `KinhDich.html` từ repo `nguyenvanhoa1912-lasotuvi/lasotuvi`, chạy **offline trên máy**, thêm lớp app: thanh điều hướng, Banner, Rewarded mở khóa vận hạn, đồng ý quyền riêng tư, nút Back.

## 1. Cấu trúc

| Thư mục / file | Vai trò |
|---|---|
| `web/` | 4 trang HTML gốc (+ `gioi-thieu.html` = giới thiệu & chính sách quyền riêng tư) |
| `app/app.js`, `app/app.css` | Lớp app: điều hướng, AdMob, khóa Đại vận/Tiểu vận, nút Back |
| `app/ad-config.js` | Chế độ mở khóa: `session` (1 QC/phiên) hoặc `chart` (1 QC/lá số) |
| `scripts/build-web.mjs` | Gộp `web/` + lớp app → `www/` (không sửa logic an sao) |
| `android/` | Project Android (package `io.github.nguyenvanhoa1912.lasotuvi`) |
| `resources/` | Icon, splash, ảnh cho trang Google Play (icon 512, feature 1024×500) |
| `.github/workflows/android.yml` | Build APK/AAB trên GitHub, không cần Android Studio |

**Lưu ý trước lần upload đầu:** package name là vĩnh viễn trên Google Play. Muốn đổi, sửa `appId` trong `capacitor.config.json` + `namespace/applicationId` trong `android/app/build.gradle` + `android/app/src/main/res/values/strings.xml`.

## 2. Mô hình kiếm tiền (đã cài)

- **Banner thích ứng** neo đáy, nằm dưới thanh điều hướng.
- **Rewarded**: mục *Đại vận* + *Tiểu vận* bị làm mờ; người dùng xem 1 QC để mở. Lá số, Tứ cú, Luận cung luôn miễn phí.
- **Không chặn người dùng**: không tải được QC / người dùng từ chối đồng ý → tự mở khóa miễn phí (tránh đánh giá 1★ và vi phạm chính sách).
- Mặc định dùng **ID thử nghiệm của Google**; ID thật chỉ được nạp khi build bản phát hành qua GitHub Secrets.

## 3. Lộ trình phát hành

### Bước 1 – Đưa code lên GitHub (≈10 phút)
- Tạo repo mới, ví dụ `lasotuvi-app` (để Private cũng được).
- Upload toàn bộ thư mục này (trừ `node_modules/`, `www/` – đã có `.gitignore`).
- Mỗi lần push lên `main` → tab **Actions** tự build **APK debug** (QC thử nghiệm) → tải về cài lên điện thoại để test.
- Workflow tự lấy bản `index.html / SaoTuVi.html / KinhDich.html` mới nhất từ repo web → sửa web là app cập nhật theo.

### Bước 2 – Đăng ký tài khoản
| Việc | Ghi chú |
|---|---|
| Google Play Console (cá nhân) | Phí đăng ký một lần; xác minh danh tính (CCCD/hộ chiếu) và thiết bị Android |
| AdMob | Đăng nhập cùng Gmail; khai báo thanh toán/thuế để nhận tiền |
| Tạo app trong AdMob | Android → nhập tên “Lá Số Tử Vi” → lấy **App ID** (`ca-app-pub-…~…`) |
| Tạo 2 ad unit | **Banner** + **Rewarded** → lấy 2 **Ad unit ID** (`ca-app-pub-…/…`) |
| AdMob → Privacy & messaging | Tạo thông báo **GDPR** (bắt buộc nếu phát hành ra EEA/UK) |

### Bước 3 – Tạo khóa ký app (làm 1 lần, cất giữ cẩn thận)
```bash
keytool -genkeypair -v -keystore upload.jks -alias lasotuvi -keyalg RSA -keysize 2048 -validity 10000
base64 -w0 upload.jks > upload.jks.b64      # macOS: base64 -i upload.jks -o upload.jks.b64
```
- Mất file `upload.jks` + mật khẩu = phải liên hệ Google để reset khóa upload. Lưu 2 nơi.

### Bước 4 – Khai báo GitHub Secrets (Settings → Secrets and variables → Actions)
| Secret | Giá trị |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | Nội dung file `upload.jks.b64` |
| `ANDROID_KEYSTORE_PASSWORD` | Mật khẩu keystore |
| `ANDROID_KEY_ALIAS` | `lasotuvi` |
| `ANDROID_KEY_PASSWORD` | Mật khẩu key |
| `ADMOB_APP_ID` | `ca-app-pub-xxxxxxxx~yyyyyyyy` |
| `ADMOB_BANNER_ID` | `ca-app-pub-xxxxxxxx/zzzzzzzz` |
| `ADMOB_REWARDED_ID` | `ca-app-pub-xxxxxxxx/wwwwwwww` |

### Bước 5 – Build bản phát hành
- **Actions → Build Android → Run workflow → tick “release”** → tải file `.aab` trong mục Artifacts.
- Chưa nhập đủ 3 secrets `ADMOB_*` → bản AAB tự dùng **quảng cáo thử nghiệm** (đủ để chạy kiểm thử kín). Có AdMob rồi thì nhập secrets và build lại trước khi lên Production.
- `versionCode` tự tăng theo số lần chạy workflow → mỗi lần upload không bị trùng.

### Bước 6 – Google Play Console
- **Chính sách quyền riêng tư (URL bắt buộc vì có quảng cáo)**: đưa `web/gioi-thieu.html` lên repo GitHub Pages, dùng link `…/gioi-thieu.html#privacy`. Sửa email hỗ trợ `EMAIL_HO_TRO@example.com` trước khi đăng.
- **App content**: Có quảng cáo = Có · Advertising ID = Có (dùng cho quảng cáo) · Data safety: dữ liệu ngày sinh xử lý trên máy, không thu thập; khai báo dữ liệu do AdMob SDK thu thập · Đối tượng: 18+ (tránh chính sách Gia đình).
- **Kiểm thử kín (tài khoản cá nhân mới)**: theo tài liệu chính thức, cần **≥ 12 tester tham gia liên tục ≥ 14 ngày** trước khi xin quyền phát hành Production → mời người thân/đồng nghiệp ngay từ đầu.
- Ảnh trang cửa hàng: `resources/play-icon-512.png`, `resources/play-feature-1024x500.png` + 2–8 ảnh chụp màn hình điện thoại từ APK.

### Bước 7 – Sau khi lên Store
- Đặt file **app-ads.txt** (AdMob cung cấp nội dung) ở **thư mục gốc tên miền** khai báo trong mục “Website” của Play Console → tăng tỷ lệ lấp đầy QC.
- Không tự bấm QC thật; thêm điện thoại của mình vào **Test devices** trong AdMob.

## 4. Chạy thử nhanh trên máy tính
```bash
npm install
npm run build:web
cd www && python3 -m http.server 8080
# mở http://localhost:8080/index.html?appdemo=1  (giả lập QC + khóa vận hạn)
```

## 5. Tư duy tăng trưởng & doanh thu (gợi ý vận hành)
- **Chỉ số theo dõi (AdMob + Play Console)**: DAU, số lá số lập/người, tỷ lệ bấm mở khóa (Rewarded opt-in), eCPM Banner/Rewarded, đánh giá trung bình, tỷ lệ crash.
- **Đòn bẩy doanh thu theo thứ tự ưu tiên**: (1) tăng lượt lập lá số qua ASO (từ khóa: “lá số tử vi”, “xem tử vi”, “tử vi trọn đời”); (2) chuyển `unlockScope` sang `chart` khi lượng dùng ổn định; (3) thêm Rewarded cho *Lưu niên năm sau*; (4) gói “Xóa quảng cáo” (In-app purchase) ở phiên bản 2.
- **Không** dùng Interstitial chen giữa thao tác lập lá số – rủi ro đánh giá thấp và vi phạm chính sách vị trí QC.
