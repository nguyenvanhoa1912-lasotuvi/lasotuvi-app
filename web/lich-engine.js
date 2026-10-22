/* =====================================================================
 * LỊCH VẠN NIÊN – lõi tính toán
 * 1) Âm lịch: thuật toán thiên văn của Hồ Ngọc Đức (múi giờ UTC+7;
 *    trước năm 1968 dùng UTC+8 – thống nhất với trang Lá số).
 * 2) Can Chi ngày/tháng/năm, Nạp âm 60 Hoa giáp.
 * 3) 24 tiết khí theo kinh độ Mặt Trời; tháng tiết lệnh (Dần = Lập xuân).
 * 4) 12 Trực (Kiến trừ): Trực Kiến rơi vào ngày có Chi trùng Chi tháng tiết lệnh.
 * 5) 12 thần Hoàng đạo / Hắc đạo cho NGÀY (theo Chi tháng âm lịch) và
 *    cho GIỜ (theo Chi ngày) – cùng một vòng 12 thần.
 * 6) Nhị thập bát tú: chu kỳ 28 ngày (mốc: 22/10/2026 = sao Đẩu).
 * 7) Ngày kỵ dân gian: Tam nương, Nguyệt kỵ, Dương công kỵ nhật.
 * 8) Hướng Hỷ thần theo Can ngày (Giáp Kỷ Cấn, Ất Canh Càn, Bính Tân Khôn,
 *    Đinh Nhâm Ly, Mậu Quý Tốn).
 * ===================================================================== */
(function (root) {
  'use strict';
  var PI = Math.PI, INT = Math.floor;

  /* ---------- Ngày Julius ---------- */
  function jdFromDate(dd, mm, yy) {
    var a = INT((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
    var jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
    if (jd < 2299161) jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
    return jd;
  }
  function jdToDate(jd) {
    var a, b, c;
    if (jd > 2299160) { a = jd + 32044; b = INT((4 * a + 3) / 146097); c = a - INT((b * 146097) / 4); }
    else { b = 0; c = jd + 32082; }
    var d = INT((4 * c + 3) / 1461), e = c - INT((1461 * d) / 4), m = INT((5 * e + 2) / 153);
    return [e - INT((153 * m + 2) / 5) + 1, m + 3 - 12 * INT(m / 10), b * 100 + d - 4800 + INT(m / 10)];
  }

  /* ---------- Sóc (trăng mới) & kinh độ Mặt Trời ---------- */
  function newMoon(k) {
    var T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
    var Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
    Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
    var M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
    var Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
    var F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
    var C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
    C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
    C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
    C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
    C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
    C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
    C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
    var deltat = T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
    return Jd1 + C1 - deltat;
  }
  function sunLongitudeRad(jdn) {            // jdn: ngày Julius tính theo UT
    var T = (jdn - 2451545.0) / 36525, T2 = T * T, dr = PI / 180;
    var M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    var L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    var DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
    var L = (L0 + DL) * dr;
    return L - PI * 2 * INT(L / (PI * 2));
  }
  function tzOf(yy) { return yy < 1968 ? 8 : 7; }
  function getNewMoonDay(k, tz) { return INT(newMoon(k) + 0.5 + tz / 24); }
  function getSunLongitude(dayNumber, tz) { return INT(sunLongitudeRad(dayNumber - 0.5 - tz / 24) / PI * 6); }
  function getLunarMonth11(yy, tz) {
    var off = jdFromDate(31, 12, yy) - 2415021, k = INT(off / 29.530588853);
    var nm = getNewMoonDay(k, tz);
    if (getSunLongitude(nm, tz) >= 9) nm = getNewMoonDay(k - 1, tz);
    return nm;
  }
  function getLeapMonthOffset(a11, tz) {
    var k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5), last, i = 1;
    var arc = getSunLongitude(getNewMoonDay(k + i, tz), tz);
    do { last = arc; i++; arc = getSunLongitude(getNewMoonDay(k + i, tz), tz); } while (arc !== last && i < 14);
    return i - 1;
  }

  /* ---------- Dương ↔ Âm ---------- */
  function solar2lunar(dd, mm, yy) {
    var tz = tzOf(yy), dayNumber = jdFromDate(dd, mm, yy);
    var k = INT((dayNumber - 2415021.076998695) / 29.530588853);
    var monthStart = getNewMoonDay(k + 1, tz);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, tz);
    var a11 = getLunarMonth11(yy, tz), b11 = a11, lunarYear;
    if (a11 >= monthStart) { lunarYear = yy; a11 = getLunarMonth11(yy - 1, tz); }
    else { lunarYear = yy + 1; b11 = getLunarMonth11(yy + 1, tz); }
    var lunarDay = dayNumber - monthStart + 1, diff = INT((monthStart - a11) / 29);
    var lunarLeap = 0, lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      var leapMonthDiff = getLeapMonthOffset(a11, tz);
      if (diff >= leapMonthDiff) { lunarMonth = diff + 10; if (diff === leapMonthDiff) lunarLeap = 1; }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    // độ dài tháng âm
    var nextStart = getNewMoonDay(INT((monthStart - 2415021.076998695) / 29.530588853 + 0.5) + 1, tz);
    return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap, jd: dayNumber, monthLen: nextStart - monthStart };
  }
  function lunar2solar(lunarDay, lunarMonth, lunarYear, lunarLeap) {
    var tz = tzOf(lunarYear), a11, b11;
    if (lunarMonth < 11) { a11 = getLunarMonth11(lunarYear - 1, tz); b11 = getLunarMonth11(lunarYear, tz); }
    else { a11 = getLunarMonth11(lunarYear, tz); b11 = getLunarMonth11(lunarYear + 1, tz); }
    var k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853), off = lunarMonth - 11;
    if (off < 0) off += 12;
    if (b11 - a11 > 365) {
      var leapOff = getLeapMonthOffset(a11, tz), leapMonth = leapOff - 2;
      if (leapMonth < 0) leapMonth += 12;
      if (lunarLeap && lunarMonth !== leapMonth) return null;
      if (lunarLeap || off >= leapOff) off += 1;
    } else if (lunarLeap) return null;
    var monthStart = getNewMoonDay(k + off, tz);
    return jdToDate(monthStart + lunarDay - 1);
  }

  /* ---------- Danh mục ---------- */
  var CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
  var CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  var CHI_HAN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  var CAN_HAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  // Nạp âm 30 cặp Hoa giáp (Giáp Tý, Ất Sửu = Hải Trung Kim ...)
  var NAP_AM = ['Hải Trung Kim', 'Lư Trung Hỏa', 'Đại Lâm Mộc', 'Lộ Bàng Thổ', 'Kiếm Phong Kim', 'Sơn Đầu Hỏa',
    'Giản Hạ Thủy', 'Thành Đầu Thổ', 'Bạch Lạp Kim', 'Dương Liễu Mộc', 'Tuyền Trung Thủy', 'Ốc Thượng Thổ',
    'Tích Lịch Hỏa', 'Tùng Bách Mộc', 'Trường Lưu Thủy', 'Sa Trung Kim', 'Sơn Hạ Hỏa', 'Bình Địa Mộc',
    'Bích Thượng Thổ', 'Kim Bạch Kim', 'Phú Đăng Hỏa', 'Thiên Hà Thủy', 'Đại Trạch Thổ', 'Thoa Xuyến Kim',
    'Tang Đố Mộc', 'Đại Khê Thủy', 'Sa Trung Thổ', 'Thiên Thượng Hỏa', 'Thạch Lựu Mộc', 'Đại Hải Thủy'];
  // 24 tiết khí, bắt đầu từ Xuân phân (kinh độ 0°), mỗi tiết 15°
  var TIET_KHI = ['Xuân phân', 'Thanh minh', 'Cốc vũ', 'Lập hạ', 'Tiểu mãn', 'Mang chủng', 'Hạ chí', 'Tiểu thử',
    'Đại thử', 'Lập thu', 'Xử thử', 'Bạch lộ', 'Thu phân', 'Hàn lộ', 'Sương giáng', 'Lập đông', 'Tiểu tuyết',
    'Đại tuyết', 'Đông chí', 'Tiểu hàn', 'Đại hàn', 'Lập xuân', 'Vũ thủy', 'Kinh trập'];
  var TRUC = ['Kiến', 'Trừ', 'Mãn', 'Bình', 'Định', 'Chấp', 'Phá', 'Nguy', 'Thành', 'Thu', 'Khai', 'Bế'];
  // Phân loại tham khảo phổ biến trong lịch dân gian
  var TRUC_LOAI = { 'Trừ': 'tốt', 'Định': 'tốt', 'Thành': 'tốt', 'Khai': 'tốt', 'Phá': 'xấu', 'Nguy': 'xấu', 'Bế': 'xấu' };
  // 12 thần: hoàng đạo = 1, hắc đạo = 0
  var THAN12 = [['Thanh Long', 1], ['Minh Đường', 1], ['Thiên Hình', 0], ['Chu Tước', 0], ['Kim Quỹ', 1], ['Kim Đường', 1],
    ['Bạch Hổ', 0], ['Ngọc Đường', 1], ['Thiên Lao', 0], ['Huyền Vũ', 0], ['Tư Mệnh', 1], ['Câu Trận', 0]];
  // Thanh Long khởi tại: Chi (tháng/ngày) Tý,Ngọ→Thân; Sửu,Mùi→Tuất; Dần,Thân→Tý; Mão,Dậu→Dần; Thìn,Tuất→Thìn; Tỵ,Hợi→Ngọ
  var TL_START = [8, 10, 0, 2, 4, 6, 8, 10, 0, 2, 4, 6];
  var TU28 = [['Giác', 'Mộc Giao', 1], ['Cang', 'Kim Long', 0], ['Đê', 'Thổ Lạc', 0], ['Phòng', 'Nhật Thố', 1],
    ['Tâm', 'Nguyệt Hồ', 0], ['Vĩ', 'Hỏa Hổ', 1], ['Cơ', 'Thủy Báo', 1], ['Đẩu', 'Mộc Giải', 1], ['Ngưu', 'Kim Ngưu', 0],
    ['Nữ', 'Thổ Bức', 0], ['Hư', 'Nhật Thử', 0], ['Nguy', 'Nguyệt Yến', 0], ['Thất', 'Hỏa Trư', 1], ['Bích', 'Thủy Du', 1],
    ['Khuê', 'Mộc Lang', 0], ['Lâu', 'Kim Cẩu', 1], ['Vị', 'Thổ Trĩ', 1], ['Mão', 'Nhật Kê', 0], ['Tất', 'Nguyệt Ô', 1],
    ['Chủy', 'Hỏa Hầu', 0], ['Sâm', 'Thủy Viên', 1], ['Tỉnh', 'Mộc Hãn', 1], ['Quỷ', 'Kim Dương', 0], ['Liễu', 'Thổ Chương', 0],
    ['Tinh', 'Nhật Mã', 0], ['Trương', 'Nguyệt Lộc', 1], ['Dực', 'Hỏa Xà', 0], ['Chẩn', 'Thủy Dẫn', 1]];
  var TU28_OFFSET = (((7 - jdFromDate(22, 10, 2026)) % 28) + 28) % 28;   // 22/10/2026 = Đẩu (chỉ số 7)
  var HY_THAN = ['Đông Bắc', 'Tây Bắc', 'Tây Nam', 'Chính Nam', 'Đông Nam', 'Đông Bắc', 'Tây Bắc', 'Tây Nam', 'Chính Nam', 'Đông Nam'];
  var TAM_NUONG = [3, 7, 13, 18, 22, 27], NGUYET_KY = [5, 14, 23];
  var DUONG_CONG = { '1-13': 1, '2-11': 1, '3-9': 1, '4-7': 1, '5-5': 1, '6-3': 1, '7-8': 1, '7-29': 1, '8-27': 1, '9-25': 1, '10-23': 1, '11-21': 1, '12-19': 1 };
  var TAM_HOP = [[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]];
  var LUC_HOP = [1, 0, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
  var GIO = ['23–1h', '1–3h', '3–5h', '5–7h', '7–9h', '9–11h', '11–13h', '13–15h', '15–17h', '17–19h', '19–21h', '21–23h'];

  function mod(a, n) { return ((a % n) + n) % n; }
  function canChiName(c, ch) { return CAN[c] + ' ' + CHI[ch]; }
  function napAm(c, ch) { var idx = mod(6 * c - 5 * ch, 60); return NAP_AM[INT(idx / 2)]; }
  function sunLongDeg(jd, tz, endOfDay) {               // kinh độ Mặt Trời (độ) cuối ngày địa phương
    return sunLongitudeRad(jd + (endOfDay ? 0.5 : -0.5) - tz / 24) * 180 / PI;
  }

  /* ---------- Thông tin đầy đủ một ngày dương lịch ---------- */
  function dayInfo(dd, mm, yy) {
    var L = solar2lunar(dd, mm, yy), jd = L.jd, tz = tzOf(yy);
    var dCan = mod(jd + 9, 10), dChi = mod(jd + 1, 12);
    var mChi = mod(L.month + 1, 12), mCan = mod(L.year * 12 + L.month + 3, 10);
    var yCan = mod(L.year + 6, 10), yChi = mod(L.year + 8, 12);
    // tiết khí (theo kinh độ cuối ngày – ngày giao tiết mang tên tiết mới)
    var lonEnd = sunLongDeg(jd, tz, true), lonStart = sunLongDeg(jd, tz, false);
    var tietIdx = INT(lonEnd / 15) % 24, giaoTiet = INT(lonStart / 15) % 24 !== tietIdx;
    var tietMonthChi = mod(INT(mod(lonEnd - 315, 360) / 30) + 2, 12);
    var truc = TRUC[mod(dChi - tietMonthChi, 12)];
    // ngày hoàng đạo/hắc đạo: theo Chi tháng âm lịch
    var dThan = THAN12[mod(dChi - TL_START[mChi], 12)];
    // giờ hoàng đạo: theo Chi ngày; Can giờ Tý = (Can ngày % 5) * 2
    var gioTyCan = (dCan % 5) * 2, hours = [];
    for (var h = 0; h < 12; h++) {
      var th = THAN12[mod(h - TL_START[dChi], 12)];
      hours.push({ chi: CHI[h], can: CAN[(gioTyCan + h) % 10], range: GIO[h], than: th[0], good: !!th[1] });
    }
    var tu = TU28[mod(jd + TU28_OFFSET, 28)];
    var ky = [];
    if (TAM_NUONG.indexOf(L.day) >= 0) ky.push('Tam nương');
    if (NGUYET_KY.indexOf(L.day) >= 0) ky.push('Nguyệt kỵ');
    if (!L.leap && DUONG_CONG[L.month + '-' + L.day]) ky.push('Dương công kỵ nhật');
    var tamHop = TAM_HOP[dChi % 4].filter(function (x) { return x !== dChi; }).map(function (x) { return CHI[x]; });
    var trucLoai = TRUC_LOAI[truc] || 'bình thường';
    // đánh giá tổng hợp đơn giản để lọc "ngày tốt"
    var score = (dThan[1] ? 2 : -1) + (trucLoai === 'tốt' ? 1 : trucLoai === 'xấu' ? -1 : 0) + (tu[2] ? 1 : -1) - ky.length * 2;
    return {
      solar: { d: dd, m: mm, y: yy, thu: THU[mod(jd + 1, 7)] },
      lunar: L,
      canChi: { day: canChiName(dCan, dChi), month: canChiName(mCan, mChi), year: canChiName(yCan, yChi),
        dayHan: CAN_HAN[dCan] + CHI_HAN[dChi], dCan: dCan, dChi: dChi },
      napAm: napAm(dCan, dChi),
      tietKhi: TIET_KHI[tietIdx], giaoTiet: giaoTiet,
      truc: truc, trucLoai: trucLoai,
      hoangDao: { name: dThan[0], good: !!dThan[1] },
      hours: hours,
      tu28: { name: tu[0], full: tu[0] + ' ' + tu[1], good: !!tu[2] },
      ky: ky,
      xung: CHI[mod(dChi + 6, 12)], tamHop: tamHop, lucHop: CHI[LUC_HOP[dChi]],
      hyThan: HY_THAN[dCan],
      score: score
    };
  }

  root.LichVN = {
    dayInfo: dayInfo, solar2lunar: solar2lunar, lunar2solar: lunar2solar, jdFromDate: jdFromDate, jdToDate: jdToDate,
    CAN: CAN, CHI: CHI, THU: THU, TRUC: TRUC
  };
})(typeof window !== 'undefined' ? window : globalThis);
