/**
 * Học liệu Constants - Dữ liệu từ docs/hoc_lieu
 * 
 * Các trường này đi kèm với game upload:
 * - Một số hiển thị cho user (skills, themes, levels)
 * - Một số không hiển thị nhưng vẫn phải upload đầy đủ (mã kỹ năng, mã sở thích)
 */

// ============================================
// LEVELS - Từ docs/hoc_lieu/level_cac_bai_hoc.md
// ============================================
export type LevelCode = 'lam_quen' | 'tien_bo' | 'thu_thach';

export interface LevelDefinition {
  code: LevelCode;
  name: string;
  description: string;
  definition: string;
}

export const LEVELS: LevelDefinition[] = [
  {
    code: 'lam_quen',
    name: 'Làm quen',
    description: 'Trình độ bằng sách giáo khoa',
    definition: 'Bé làm quen với đúng nội dung bài học trong sách giáo khoa, bài tập trực quan – có gợi ý – một bước, mục tiêu là hiểu và nhận biết kỹ năng chính của lesson.',
  },
  {
    code: 'tien_bo',
    name: 'Tiến bộ',
    description: 'Trình độ bằng sách bài tập',
    definition: 'Bé vẫn sử dụng đúng kỹ năng của lesson, nhưng đổi hình ảnh, đổi ngữ cảnh, đổi cách hỏi, nhằm giúp bé làm chắc kỹ năng, tránh học thuộc dạng bài.',
  },
  {
    code: 'thu_thach',
    name: 'Thử thách',
    description: 'Trình độ bằng sách nâng cao',
    definition: 'Bé vận dụng kỹ năng đã học trong lesson để hoàn thành một nhiệm vụ có luật hoặc ràng buộc rõ ràng, thường gồm 2–3 bước ngắn, ít gợi ý, làm sai thì làm lại ngay, không hướng dẫn lại từng bước.',
  },
];

export const LEVEL_OPTIONS = LEVELS.map(l => ({
  value: l.code,
  label: l.name,
  description: l.description,
}));


// ============================================
// KỸ NĂNG TOÁN TRẺ 3-4 TUỔI - Từ docs/hoc_lieu/ky_nang_toan_tre_3-4.md
// ============================================
export type SkillGroup = 
  | 'so_dem'           // Số & đếm
  | 'ghep_tuong_ung'   // Ghép & tương ứng
  | 'so_sanh'          // So sánh
  | 'phan_loai'        // Phân loại & tập hợp
  | 'hinh_hoc'         // Hình học cơ bản
  | 'khong_gian'       // Không gian & định hướng
  | 'quy_luat'         // Quy luật & logic
  | 'sap_xep';         // Sắp xếp & trình tự

export interface MathSkill {
  code: string;
  group: SkillGroup;
  groupName: string;
  name: string;
  order: number;
}

export const MATH_SKILLS_3_4: MathSkill[] = [
  // Số & đếm
  { code: 'M34.COUNT_OBJECTS', group: 'so_dem', groupName: 'Số & đếm', name: 'Đếm số lượng đồ vật (1–5), đếm trong tranh, đếm trực tiếp', order: 1 },
  { code: 'M34.COUNT_SELECT', group: 'so_dem', groupName: 'Số & đếm', name: 'Đếm rồi chọn/khoanh nhóm có X đồ vật', order: 2 },
  { code: 'M34.COUNT_COLOR', group: 'so_dem', groupName: 'Số & đếm', name: 'Đếm và tô màu đúng số lượng yêu cầu', order: 3 },
  { code: 'M34.COUNT_GROUPS', group: 'so_dem', groupName: 'Số & đếm', name: 'Đếm từng nhóm riêng lẻ/ đếm tổng nhóm', order: 4 },
  { code: 'M34.MATCH_NUM_QTY', group: 'so_dem', groupName: 'Số & đếm', name: 'Ghép số lượng ↔ ký hiệu/số (ở mức làm quen)', order: 5 },
  
  // Ghép & tương ứng
  { code: 'M34.MATCH_1TO1', group: 'ghep_tuong_ung', groupName: 'Ghép & tương ứng', name: 'Nối tương ứng 1–1 (mỗi vật ↔ 1 vị trí/đối tượng)', order: 6 },
  { code: 'M34.MATCH_PAIR', group: 'ghep_tuong_ung', groupName: 'Ghép & tương ứng', name: 'Ghép cặp giống nhau / ghép theo thuộc tính', order: 7 },
  
  // So sánh
  { code: 'M34.COMPARE_QTY', group: 'so_sanh', groupName: 'So sánh', name: 'Nhiều hơn / ít hơn / bằng nhau', order: 8 },
  { code: 'M34.COMPARE_SIZE', group: 'so_sanh', groupName: 'So sánh', name: 'To–nhỏ, dài–ngắn, cao–thấp (so sánh trực quan)', order: 9 },
  { code: 'M34.COMPARE_COLOR', group: 'so_sanh', groupName: 'So sánh', name: 'Chọn / tô màu đối tượng theo kết quả so sánh', order: 10 },
  
  // Phân loại & tập hợp
  { code: 'M34.SORT_BY_ONE_RULE', group: 'phan_loai', groupName: 'Phân loại & tập hợp', name: 'Phân loại theo 1 tiêu chí (màu / hình / loại)', order: 11 },
  { code: 'M34.FIND_ODD_ONE', group: 'phan_loai', groupName: 'Phân loại & tập hợp', name: 'Tìm vật khác loại trong nhóm', order: 12 },
  { code: 'M34.GROUP_SEPARATE', group: 'phan_loai', groupName: 'Phân loại & tập hợp', name: 'Khoanh tách đồ vật thành nhóm theo yêu cầu', order: 13 },
  { code: 'M34.GROUP_MERGE', group: 'phan_loai', groupName: 'Phân loại & tập hợp', name: 'Gộp nhóm và xác định số lượng', order: 14 },
  { code: 'M34.GROUP_VERIFY', group: 'phan_loai', groupName: 'Phân loại & tập hợp', name: 'Nhận biết nhóm đúng – sai theo tiêu chí cho trước', order: 15 },
  
  // Hình học cơ bản
  { code: 'M34.SHAPE_RECOG', group: 'hinh_hoc', groupName: 'Hình học cơ bản', name: 'Nhận biết hình tròn / vuông / tam giác / chữ nhật', order: 16 },
  { code: 'M34.SHAPE_COMPOSE', group: 'hinh_hoc', groupName: 'Hình học cơ bản', name: 'Chắp ghép hình để tạo tranh / đồ vật', order: 17 },
  { code: 'M34.SHAPE_MATCH', group: 'hinh_hoc', groupName: 'Hình học cơ bản', name: 'Nối đồ vật có cùng hình dạng', order: 18 },
  { code: 'M34.SHAPE_FIND', group: 'hinh_hoc', groupName: 'Hình học cơ bản', name: 'Tìm hình học trong đồ vật quen thuộc', order: 19 },
  { code: 'M34.SHAPE_COUNT', group: 'hinh_hoc', groupName: 'Hình học cơ bản', name: 'Đếm số hình học trong một vật', order: 20 },
  
  // Không gian & định hướng
  { code: 'M34.SPATIAL_POSITION', group: 'khong_gian', groupName: 'Không gian & định hướng', name: 'Trong–ngoài / trên–dưới / trước–sau / trái–phải', order: 21 },
  { code: 'M34.FOLLOW_PATH', group: 'khong_gian', groupName: 'Không gian & định hướng', name: 'Đi theo đường / mê cung / dẫn đường', order: 22 },
  { code: 'M34.SPATIAL_COLOR', group: 'khong_gian', groupName: 'Không gian & định hướng', name: 'Chọn / tô màu đối tượng theo vị trí', order: 23 },
  
  // Quy luật & logic
  { code: 'M34.PATTERN_REPEAT', group: 'quy_luat', groupName: 'Quy luật & logic', name: 'Quy luật lặp (A–B–A–B… màu / hình / đồ vật)', order: 24 },
  { code: 'M34.PATTERN_MISSING', group: 'quy_luat', groupName: 'Quy luật & logic', name: 'Tìm phần còn thiếu trong chuỗi', order: 25 },
  
  // Sắp xếp & trình tự
  { code: 'M34.ORDER_BY_SIZE', group: 'sap_xep', groupName: 'Sắp xếp & trình tự', name: 'Sắp xếp to→nhỏ / nhỏ→to', order: 26 },
  { code: 'M34.ORDER_BY_QTY', group: 'sap_xep', groupName: 'Sắp xếp & trình tự', name: 'Sắp xếp ít→nhiều / nhiều→ít', order: 27 },
  { code: 'M34.ORDER_BY_LENGTH', group: 'sap_xep', groupName: 'Sắp xếp & trình tự', name: 'Sắp xếp dài → ngắn / thấp → cao', order: 28 },
];

export const SKILL_OPTIONS = MATH_SKILLS_3_4.map(s => ({
  value: s.code,
  label: s.name,
  group: s.groupName,
}));

export const SKILL_GROUPS = [
  { code: 'so_dem', name: 'Số & đếm' },
  { code: 'ghep_tuong_ung', name: 'Ghép & tương ứng' },
  { code: 'so_sanh', name: 'So sánh' },
  { code: 'phan_loai', name: 'Phân loại & tập hợp' },
  { code: 'hinh_hoc', name: 'Hình học cơ bản' },
  { code: 'khong_gian', name: 'Không gian & định hướng' },
  { code: 'quy_luat', name: 'Quy luật & logic' },
  { code: 'sap_xep', name: 'Sắp xếp & trình tự' },
];


// ============================================
// SỞ THÍCH THEO CHỦ ĐỀ - Từ docs/hoc_lieu/so_thich_theo_chu_de.md
// ============================================
export type ThemeGroup = 
  | 'animals'      // Động vật
  | 'vehicles'     // Xe cộ
  | 'toys'         // Đồ chơi
  | 'music'        // Âm nhạc
  | 'fruits'       // Trái cây
  | 'vegetables'   // Rau củ
  | 'plants'       // Thiên nhiên – hoa lá
  | 'context';     // Ngữ cảnh đời sống gần gũi

export interface ThemeDefinition {
  code: string;
  group: ThemeGroup;
  groupName: string;
  name: string;
  order: number;
}

export const THEMES: ThemeDefinition[] = [
  // Động vật
  { code: 'animals_home', group: 'animals', groupName: 'Động vật', name: 'Con vật quanh nhà (gà, vịt, ngan, ngỗng, chim sẻ, bồ câu, cá ao/hồ)', order: 1 },
  { code: 'animals_pets', group: 'animals', groupName: 'Động vật', name: 'Động vật nuôi (chó, mèo, thỏ)', order: 2 },
  { code: 'animals_livestock', group: 'animals', groupName: 'Động vật', name: 'Gia súc (trâu, bò, dê)', order: 3 },
  { code: 'animals_wild', group: 'animals', groupName: 'Động vật', name: 'Động vật hoang dã (sư tử, voi, hổ, hươu, ngựa vằn)', order: 4 },
  { code: 'animals_forest', group: 'animals', groupName: 'Động vật', name: 'Rừng xanh (khỉ, gấu, hươu, sóc)', order: 5 },
  { code: 'animals_ocean', group: 'animals', groupName: 'Động vật', name: 'Đại dương (cá, cá heo, rùa biển, sao biển)', order: 6 },
  { code: 'animals_insects', group: 'animals', groupName: 'Động vật', name: 'Côn trùng (ong, bướm, kiến, bọ rùa)', order: 7 },
  { code: 'animals_dinosaur', group: 'animals', groupName: 'Động vật', name: 'Khủng long (T-Rex, cổ dài, bay lượn)', order: 8 },
  
  // Xe cộ
  { code: 'vehicles_daily', group: 'vehicles', groupName: 'Xe cộ', name: 'Xe hằng ngày (xe đạp, xe máy, ô tô, xe buýt)', order: 9 },
  { code: 'vehicles_car', group: 'vehicles', groupName: 'Xe cộ', name: 'Ô tô (xe con, taxi, xe cảnh sát)', order: 10 },
  { code: 'vehicles_construction', group: 'vehicles', groupName: 'Xe cộ', name: 'Xe công trình (xe xúc, xe cẩu, xe ben, xe lu)', order: 11 },
  { code: 'vehicles_train', group: 'vehicles', groupName: 'Xe cộ', name: 'Tàu hỏa (tàu khách, tàu hàng)', order: 12 },
  { code: 'vehicles_plane', group: 'vehicles', groupName: 'Xe cộ', name: 'Máy bay (máy bay dân dụng, trực thăng)', order: 13 },
  { code: 'vehicles_ship', group: 'vehicles', groupName: 'Xe cộ', name: 'Tàu thủy (thuyền, tàu biển, ca nô)', order: 14 },
  
  // Đồ chơi
  { code: 'toys_blocks', group: 'toys', groupName: 'Đồ chơi', name: 'Xếp khối, xếp hình', order: 15 },
  { code: 'toys_doll', group: 'toys', groupName: 'Đồ chơi', name: 'Búp bê, thú bông', order: 16 },
  { code: 'toys_puzzle', group: 'toys', groupName: 'Đồ chơi', name: 'Ghép hình, tìm đồ vật', order: 17 },
  { code: 'toys_ball', group: 'toys', groupName: 'Đồ chơi', name: 'Bóng, trò vận động nhẹ', order: 18 },
  { code: 'toys_vehicle_toys', group: 'toys', groupName: 'Đồ chơi', name: 'Đồ chơi xe (xe mô hình, đường đua)', order: 19 },
  { code: 'toys_roleplay', group: 'toys', groupName: 'Đồ chơi', name: 'Đồ chơi nhập vai (bác sĩ, nấu ăn, bán hàng)', order: 20 },
  
  // Âm nhạc
  { code: 'music_sing', group: 'music', groupName: 'Âm nhạc', name: 'Hát theo, hát đếm số', order: 21 },
  { code: 'music_rhythm', group: 'music', groupName: 'Âm nhạc', name: 'Vỗ tay theo nhịp, gõ nhịp', order: 22 },
  { code: 'music_instruments', group: 'music', groupName: 'Âm nhạc', name: 'Nhạc cụ (trống, đàn, kèn)', order: 23 },
  { code: 'music_call_response', group: 'music', groupName: 'Âm nhạc', name: 'Hỏi – đáp theo nhạc', order: 24 },
  { code: 'music_dance', group: 'music', groupName: 'Âm nhạc', name: 'Nhảy, múa theo nhạc', order: 25 },
  
  // Trái cây
  { code: 'fruits_count', group: 'fruits', groupName: 'Trái cây', name: 'Đếm trái cây (1–1, thêm bớt)', order: 26 },
  { code: 'fruits_color', group: 'fruits', groupName: 'Trái cây', name: 'Phân loại trái cây theo màu', order: 27 },
  { code: 'fruits_market', group: 'fruits', groupName: 'Trái cây', name: 'Đi chợ, siêu thị mua trái cây', order: 28 },
  { code: 'fruits_share', group: 'fruits', groupName: 'Trái cây', name: 'Chia phần (mỗi người 1 quả, chia đều)', order: 29 },
  { code: 'fruits_cut', group: 'fruits', groupName: 'Trái cây', name: 'Cắt miếng, ghép nửa quả', order: 30 },
  
  // Rau củ
  { code: 'vegetables_root', group: 'vegetables', groupName: 'Rau củ', name: 'Rau củ dạng củ (cà rốt, khoai tây, củ cải)', order: 31 },
  { code: 'vegetables_leafy', group: 'vegetables', groupName: 'Rau củ', name: 'Rau lá (rau muống, cải, xà lách)', order: 32 },
  { code: 'vegetables_market', group: 'vegetables', groupName: 'Rau củ', name: 'Đi chợ mua rau (cân, chọn, bỏ giỏ)', order: 33 },
  { code: 'vegetables_cook', group: 'vegetables', groupName: 'Rau củ', name: 'Sơ chế, nấu ăn (rửa, gọt, cắt)', order: 34 },
  
  // Thiên nhiên – hoa lá
  { code: 'plants_flowers', group: 'plants', groupName: 'Thiên nhiên – hoa lá', name: 'Hoa (hoa hồng, hoa hướng dương, bông cúc)', order: 35 },
  { code: 'plants_leaves', group: 'plants', groupName: 'Thiên nhiên – hoa lá', name: 'Lá cây (lá non, lá già, lá to, lá nhỏ)', order: 36 },
  { code: 'plants_garden', group: 'plants', groupName: 'Thiên nhiên – hoa lá', name: 'Vườn cây (tưới cây, nhặt lá, trồng cây)', order: 37 },
  { code: 'plants_seasons', group: 'plants', groupName: 'Thiên nhiên – hoa lá', name: 'Mùa & cây (lá rụng, nảy mầm)', order: 38 },
  
  // Ngữ cảnh đời sống gần gũi
  { code: 'context_family_people', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Gia đình & con người (bố mẹ, ông bà, bạn bè, thầy cô)', order: 39 },
  { code: 'context_home_objects', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Đồ vật trong nhà (bàn ghế, tivi, giường tủ, đồ chơi)', order: 40 },
  { code: 'context_meals', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Ăn uống & bữa cơm (trái cây, rau củ, món ăn, đồ uống)', order: 41 },
  { code: 'context_cooking', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Nấu ăn (bếp, nồi, chảo, rửa rau)', order: 42 },
  { code: 'context_school', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Trường học (lớp học, sân trường, thư viện, đồ dùng học tập)', order: 43 },
  { code: 'context_farm', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Nông trại (vườn cây, chuồng trại, thu hoạch)', order: 44 },
  { code: 'context_city', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Thành phố (đường phố, siêu thị, công viên, nhà ga)', order: 45 },
  { code: 'context_sports', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Thể thao (bóng đá, bóng rổ, chạy nhảy)', order: 46 },
  { code: 'context_selfcare', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Sinh hoạt cá nhân (tắm rửa, đánh răng, mặc đồ, dọn dẹp)', order: 47 },
  { code: 'context_weather_nature', group: 'context', groupName: 'Ngữ cảnh đời sống', name: 'Thời tiết & thiên nhiên gần nhà (nắng, mưa, cầu vồng, sông, ao, hồ)', order: 48 },
];

export const THEME_OPTIONS = THEMES.map(t => ({
  value: t.code,
  label: t.name,
  group: t.groupName,
}));

export const THEME_GROUPS = [
  { code: 'animals', name: 'Động vật' },
  { code: 'vehicles', name: 'Xe cộ' },
  { code: 'toys', name: 'Đồ chơi' },
  { code: 'music', name: 'Âm nhạc' },
  { code: 'fruits', name: 'Trái cây' },
  { code: 'vegetables', name: 'Rau củ' },
  { code: 'plants', name: 'Thiên nhiên – hoa lá' },
  { code: 'context', name: 'Ngữ cảnh đời sống' },
];


// ============================================
// BÀI HỌC TOÁN 3-4 TUỔI - Từ docs/hoc_lieu/Toán_3-4.md
// ============================================
export interface LessonDefinition {
  order: number;
  name: string;
  games: string[];
}

export const MATH_LESSONS_3_4: LessonDefinition[] = [
  { order: 1, name: 'Số lượng trong phạm vi 1', games: ['Đếm, tô lá sen', 'Khoanh nhóm số lượng 1'] },
  { order: 2, name: 'Số lượng trong phạm vi 2', games: ['Đếm, tô lá sen', 'Tô nhóm số lượng 2'] },
  { order: 3, name: 'Số lượng trong phạm vi 3', games: ['Đếm, tô lá sen', 'Khoanh nhóm số lượng 3'] },
  { order: 4, name: 'Số lượng trong phạm vi 4', games: ['Đếm, tô lá sen', 'Khoanh nhóm số lượng 4'] },
  { order: 5, name: 'Số lượng trong phạm vi 5', games: ['Đếm, tô lá sen', 'Khoanh nhóm số lượng 5'] },
  { order: 6, name: 'Ôn số lượng trong phạm vi 5', games: ['Tô đường & đếm số lượng'] },
  { order: 7, name: '1 và nhiều', games: ['So Sánh Một – Nhiều & Tô Màu'] },
  { order: 8, name: 'Bằng nhau, nhiều hơn, ít hơn', games: ['Nối số lượng & So sánh'] },
  { order: 9, name: 'Tách thành hai nhóm', games: ['Đếm – Chia Nhóm & Ghép Số Lượng'] },
  { order: 10, name: 'Gộp hai nhóm', games: ['Chia Nhóm – Đếm & Gộp số lượng'] },
  { order: 11, name: 'Giống nhau', games: ['Nối hình giống nhau'] },
  { order: 12, name: 'Khác nhau', games: ['Khoanh hình khác loại'] },
  { order: 13, name: 'Ghép tương ứng', games: ['Nối cặp tương ứng'] },
  { order: 14, name: 'Ghép đôi', games: ['Ghép Đôi Đồ Dùng'] },
  { order: 15, name: 'Cao - Thấp', games: ['So Sánh Cao – Thấp', 'Tô Màu'] },
  { order: 16, name: 'To - Nhỏ, Bằng nhau', games: ['So Sánh To – Nhỏ & Bằng Nhau', 'Tô màu'] },
  { order: 17, name: 'Dài - Ngắn', games: ['So Sánh Dài – Ngắn', 'Ghép nối'] },
  { order: 18, name: 'Rộng - Hẹp', games: ['So Sánh Rộng – Hẹp', 'Tô Màu'] },
  { order: 19, name: 'Sắp xếp theo quy tắc (Màu sắc)', games: ['Quan Sát Quy Luật Màu & Tô Màu'] },
  { order: 20, name: 'Hình vuông, hình tròn, hình tam giác, hình chữ nhật', games: ['Quan Sát Màu & Tô Hình'] },
  { order: 21, name: 'Phía trên - Phía dưới', games: ['Xác Định Trên – Dưới', 'Tô Màu'] },
  { order: 22, name: 'Phía trước - Phía sau', games: ['Xác Định Trước – Sau', 'Khoanh'] },
];

export const LESSON_OPTIONS = MATH_LESSONS_3_4.map(l => ({
  value: `lesson_${l.order}`,
  label: `${l.order}. ${l.name}`,
  games: l.games,
}));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get skill by code
 */
export function getSkillByCode(code: string): MathSkill | undefined {
  return MATH_SKILLS_3_4.find(s => s.code === code);
}

/**
 * Get theme by code
 */
export function getThemeByCode(code: string): ThemeDefinition | undefined {
  return THEMES.find(t => t.code === code);
}

/**
 * Get level by code
 */
export function getLevelByCode(code: LevelCode): LevelDefinition | undefined {
  return LEVELS.find(l => l.code === code);
}

/**
 * Get skills by group
 */
export function getSkillsByGroup(group: SkillGroup): MathSkill[] {
  return MATH_SKILLS_3_4.filter(s => s.group === group);
}

/**
 * Get themes by group
 */
export function getThemesByGroup(group: ThemeGroup): ThemeDefinition[] {
  return THEMES.filter(t => t.group === group);
}

/**
 * Validate skill codes
 */
export function validateSkillCodes(codes: string[]): { valid: boolean; invalid: string[] } {
  const validCodes = MATH_SKILLS_3_4.map(s => s.code);
  const invalid = codes.filter(c => !validCodes.includes(c));
  return { valid: invalid.length === 0, invalid };
}

/**
 * Validate theme codes
 */
export function validateThemeCodes(codes: string[]): { valid: boolean; invalid: string[] } {
  const validCodes = THEMES.map(t => t.code);
  const invalid = codes.filter(c => !validCodes.includes(c));
  return { valid: invalid.length === 0, invalid };
}

/**
 * Validate level code
 */
export function validateLevelCode(code: string): boolean {
  return LEVELS.some(l => l.code === code);
}