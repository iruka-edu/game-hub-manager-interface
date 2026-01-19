# Integration Test Report Generator

Tài liệu này hướng dẫn cách chạy bộ test tích hợp và tạo báo cáo kết quả.

## 1. Chuẩn bị

Đảm bảo bạn đã cập nhật `GITHUB_TOKEN` và chạy `npm install`.

Bộ test sử dụng biến môi trường từ file `.env` của bạn:

- `NEXT_PUBLIC_BASE_API_URL`: Đã được cấu hình trong `.env`.
- `TEST_USER_EMAIL`: Cần cấu hình trong `.env` hoặc `.env.local`.
- `TEST_USER_PASSWORD`: Cần cấu hình trong `.env` hoặc `.env.local`.

## 2. Chạy Tests (Sử dụng Vitest)

Dự án của bạn sử dụng Vitest. Chạy lệnh sau để thực hiện bộ test tích hợp:

```bash
npx vitest run src/features/__tests__
```

## 3. Tạo Báo Cáo

Để tạo dữ liệu báo cáo JSON, chạy:

```bash
npx vitest run src/features/__tests__ --reporter=json --outputFile=test-results.json
```

## 4. Các File Test Chính

- `api-integration.test.ts`: Kiểm tra các hàm API (Auth, Games, Users).
- `auth-flow.test.ts`: Kiểm tra luồng đăng nhập, lưu token và đăng xuất.
- `hooks-integration.test.tsx`: Kiểm tra các React Query hooks với dữ liệu thật.
