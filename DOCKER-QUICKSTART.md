# 🐳 Docker Quick Start Guide

Hướng dẫn nhanh để chạy ứng dụng Strava Leaderboard với Docker.

## Bước 1: Cài đặt Docker Desktop

### Windows
1. Tải Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Chạy installer
3. Khởi động lại máy tính
4. Mở Docker Desktop và đợi nó khởi động

### Kiểm tra Docker đã hoạt động
```powershell
docker --version
docker-compose --version
```

## Bước 2: Lấy Strava API Credentials

1. Truy cập: https://www.strava.com/settings/api
2. Nhấn "Create an App" (nếu chưa có)
3. Điền thông tin:
   - **Application Name**: Strava Leaderboard
   - **Category**: Training
   - **Website**: http://localhost:3000
   - **Authorization Callback Domain**: `localhost`
4. Lưu lại:
   - **Client ID** (số)
   - **Client Secret** (chuỗi ký tự dài)

## Bước 3: Cấu hình môi trường

1. Tạo file `.env`:
```powershell
# Windows PowerShell
Copy-Item .env.docker .env

# Hoặc
cp .env.docker .env
```

2. Mở file `.env` và sửa:
```env
STRAVA_CLIENT_ID=12345          # Thay bằng Client ID của bạn
STRAVA_CLIENT_SECRET=abc123xyz  # Thay bằng Client Secret của bạn
STRAVA_REDIRECT_URI=http://localhost:3000/auth/callback
SESSION_SECRET=random_string_here_change_in_production
```

## Bước 4: Khởi động ứng dụng

### Cách 1: Dùng script tự động (Windows)
```powershell
.\docker-start.ps1
```

### Cách 2: Dùng Docker Compose trực tiếp
```powershell
docker-compose up -d
```

**Lưu ý**: Lần đầu chạy sẽ mất 2-5 phút để tải images và build.

## Bước 5: Truy cập ứng dụng

1. Mở trình duyệt
2. Truy cập: **http://localhost:3000**
3. Nhấn "Kết nối với Strava"
4. Đăng nhập và cho phép truy cập
5. Xem bảng xếp hạng!

## Các lệnh hữu ích

### Xem logs
```powershell
docker-compose logs -f
```

### Xem logs của một service cụ thể
```powershell
docker-compose logs -f app
docker-compose logs -f mongodb
```

### Dừng ứng dụng
```powershell
docker-compose down
```

### Khởi động lại
```powershell
docker-compose restart
```

### Dừng và xóa dữ liệu
```powershell
docker-compose down -v
```

### Rebuild sau khi thay đổi code
```powershell
docker-compose up -d --build
```

### Kiểm tra trạng thái containers
```powershell
docker-compose ps
```

## Chế độ Development (Hot Reload)

Nếu muốn code và tự động reload:

```powershell
docker-compose -f docker-compose.dev.yml up
```

## Xử lý sự cố

### Lỗi: "Docker is not running"
- Mở Docker Desktop và đợi nó khởi động hoàn toàn

### Lỗi: "port 3000 is already in use"
```powershell
# Dừng ứng dụng đang chạy trên port 3000
# Hoặc thay đổi port trong docker-compose.yml
```

### Lỗi: "Cannot connect to MongoDB"
```powershell
# Xem logs của MongoDB
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Lỗi Strava OAuth
- Kiểm tra Client ID và Secret trong file `.env`
- Đảm bảo Authorization Callback Domain là `localhost` (không có http://)
- Kiểm tra Redirect URI đúng: `http://localhost:3000/auth/callback`

### Reset hoàn toàn
```powershell
# Dừng và xóa tất cả
docker-compose down -v

# Xóa images cũ
docker rmi strava-leaderboard-app

# Khởi động lại
docker-compose up -d --build
```

## Cấu trúc Containers

Ứng dụng sử dụng 2 containers:

1. **strava-app**: Node.js application (port 3000)
2. **strava-mongodb**: MongoDB database (port 27017)

Cả hai containers kết nối qua network `strava-network`.

## Dữ liệu

Dữ liệu MongoDB được lưu trong Docker volume `mongodb_data`, nên:
- ✅ Dữ liệu không bị mất khi restart containers
- ✅ Chỉ bị xóa khi chạy `docker-compose down -v`

## Tips

- Đồng bộ dữ liệu Strava định kỳ bằng nút "Đồng bộ" trên website
- Ứng dụng tự động đồng bộ mỗi giờ
- Xem logs để debug: `docker-compose logs -f app`
- Dữ liệu được lưu trong MongoDB volume, an toàn khi restart

## Tài nguyên

- Docker Documentation: https://docs.docker.com/
- Docker Compose: https://docs.docker.com/compose/
- Strava API: https://developers.strava.com/

---

**Chúc bạn chạy vui vẻ!** 🏃‍♂️💨
