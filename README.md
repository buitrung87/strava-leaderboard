# Bảng Xếp Hạng Chạy Bộ Strava

Ứng dụng web tích hợp với Strava API để theo dõi và xếp hạng người dùng dựa trên số km chạy được hàng ngày, tuần và tháng.

## Tính năng

- ✅ Đăng nhập với tài khoản Strava
- ✅ Đồng bộ tự động hoạt động chạy bộ từ Strava
- ✅ Thống kê cá nhân: km chạy trong ngày, tuần, tháng
- ✅ Bảng xếp hạng theo ngày/tuần/tháng
- ✅ Giao diện đẹp, hiện đại và responsive
- ✅ Tự động làm mới dữ liệu mỗi giờ
- ✅ Hiển thị avatar, tên và thông tin người dùng

## Công nghệ sử dụng

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Strava API v3
- OAuth 2.0

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome icons
- Modern gradient design

## 📚 Tài liệu

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Tổng quan các phương thức deployment
- **[DOCKER-QUICKSTART.md](./DOCKER-QUICKSTART.md)** - Hướng dẫn chạy local với Docker
- **[UBUNTU-DEPLOY.md](./UBUNTU-DEPLOY.md)** - Deploy lên Ubuntu/Linux server
- **[GITHUB-SETUP.md](./GITHUB-SETUP.md)** - Setup GitHub repository và Actions

## Cài đặt

### Lựa chọn 1: Chạy với Docker (Khuyến nghị) 🐳

Docker sẽ tự động cài đặt và cấu hình tất cả các dependencies.

#### Yêu cầu
- Docker Desktop
- Tài khoản Strava Developer

#### Các bước

1. **Lấy Strava API credentials**
   - Truy cập https://www.strava.com/settings/api
   - Tạo ứng dụng mới
   - Lưu lại Client ID và Client Secret
   - Thêm Authorization Callback Domain: `localhost`

2. **Cấu hình môi trường**
   ```bash
   # Copy file cấu hình
   cp .env.docker .env
   
   # Sửa file .env với thông tin Strava API của bạn
   ```

3. **Khởi động ứng dụng**
   ```bash
   # Windows PowerShell
   .\docker-start.ps1
   
   # Hoặc dùng docker-compose trực tiếp
   docker-compose up -d
   ```

4. **Truy cập ứng dụng**
   - Web: http://localhost:3000
   - MongoDB: mongodb://localhost:27017

#### Các lệnh Docker hữu ích

```bash
# Xem logs
docker-compose logs -f

# Dừng containers
docker-compose down

# Dừng và xóa dữ liệu
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Chế độ development (với hot reload)
docker-compose -f docker-compose.dev.yml up
```

**📖 Hướng dẫn chi tiết:** [DOCKER-QUICKSTART.md](./DOCKER-QUICKSTART.md)

---

### Lựa chọn 2: Deploy lên Ubuntu/Linux với Docker Image từ GitHub 🚀

Phù hợp cho production deployment trên VPS/Cloud server.

#### Yêu cầu
- Ubuntu 20.04+ hoặc Debian-based Linux
- Docker & Docker Compose
- Domain hoặc IP public

#### Các bước nhanh

1. **Clone repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/strava-leaderboard.git
   cd strava-leaderboard
   ```

2. **Cấu hình môi trường**
   ```bash
   cp .env.prod.example .env
   nano .env  # Điền thông tin Strava API và SESSION_SECRET
   ```

3. **Chạy script deploy**
   ```bash
   chmod +x deploy-ubuntu.sh
   ./deploy-ubuntu.sh
   ```

Script sẽ tự động:
- Kiểm tra và cài Docker (nếu chưa có)
- Pull image mới nhất từ GitHub Container Registry
- Khởi động ứng dụng với docker-compose

**📖 Hướng dẫn chi tiết:** [UBUNTU-DEPLOY.md](./UBUNTU-DEPLOY.md)

#### Docker Image
Images được tự động build và publish lên GitHub Container Registry qua GitHub Actions:
- `ghcr.io/YOUR_USERNAME/strava-leaderboard:latest` - Latest build
- `ghcr.io/YOUR_USERNAME/strava-leaderboard:v1.0.0` - Tagged releases

---

### Lựa chọn 3: Chạy trực tiếp với Node.js

#### 1. Yêu cầu

- Node.js (v14 trở lên)
- MongoDB (v4.4 trở lên)
- Tài khoản Strava Developer

#### 2. Lấy Strava API credentials

1. Truy cập https://www.strava.com/settings/api
2. Tạo ứng dụng mới
3. Lưu lại:
   - Client ID
   - Client Secret
4. Thêm Authorization Callback Domain: `localhost`

#### 3. Cài đặt dependencies

```bash
npm install
```

#### 4. Cấu hình môi trường

Tạo file `.env` từ file `.env.example`:

```bash
cp .env.example .env
```

Sửa file `.env` với thông tin của bạn:

```env
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/auth/callback

PORT=3000
NODE_ENV=development

MONGODB_URI=mongodb://localhost:27017/strava-leaderboard

SESSION_SECRET=your_random_secret_key_here
```

#### 5. Khởi động MongoDB

Đảm bảo MongoDB đang chạy:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### 6. Chạy ứng dụng

Chế độ development:
```bash
npm run dev
```

Chế độ production:
```bash
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

---

## Cách sử dụng

### 1. Đăng nhập
- Nhấn nút "Kết nối với Strava"
- Đăng nhập và cho phép ứng dụng truy cập dữ liệu Strava của bạn

### 2. Đồng bộ dữ liệu
- Sau khi đăng nhập, dữ liệu sẽ tự động được đồng bộ
- Bạn có thể nhấn nút "Đồng bộ" để cập nhật thủ công

### 3. Xem bảng xếp hạng
- Chọn khoảng thời gian: Hôm nay / Tuần này / Tháng này
- Xem thứ hạng của bạn và các vận động viên khác

## Cấu trúc thư mục

```
strava-leaderboard/
├── models/
│   ├── User.js           # Schema người dùng
│   └── Activity.js       # Schema hoạt động
├── routes/
│   ├── auth.js           # Routes xác thực
│   └── api.js            # API endpoints
├── services/
│   └── stravaService.js  # Tích hợp Strava API
├── public/
│   ├── index.html        # Frontend
│   ├── styles.css        # CSS
│   └── app.js            # JavaScript
├── server.js             # Server chính
├── package.json          # Dependencies
└── .env.example          # Mẫu cấu hình
```

## API Endpoints

### Authentication
- `GET /auth/strava` - Redirect đến Strava OAuth
- `GET /auth/callback` - OAuth callback
- `GET /auth/logout` - Đăng xuất
- `GET /auth/me` - Lấy thông tin user hiện tại

### Leaderboard
- `GET /api/leaderboard/:period` - Lấy bảng xếp hạng (day/week/month)
- `GET /api/stats/:userId` - Lấy thống kê người dùng
- `POST /api/sync` - Đồng bộ hoạt động thủ công
- `GET /api/activities/recent` - Lấy hoạt động gần đây

## Tính năng tự động

- **Auto-sync**: Đồng bộ hoạt động của tất cả người dùng mỗi giờ
- **Token refresh**: Tự động làm mới access token khi hết hạn
- **Data caching**: Lưu trữ dữ liệu trong MongoDB để truy vấn nhanh

## Bảo mật

- Access tokens được mã hóa trong database
- Session-based authentication
- HTTPS khuyến nghị cho production
- API rate limiting (sẽ thêm trong tương lai)

## Tùy chỉnh

### Thay đổi màu sắc
Sửa file `public/styles.css`, thay đổi các biến CSS trong `:root`:

```css
:root {
    --primary: #FC4C02;        /* Màu chính Strava */
    --secondary: #1a1a1a;      /* Màu phụ */
    --accent: #00d4ff;         /* Màu nhấn */
}
```

### Thay đổi thời gian đồng bộ
Sửa file `server.js`, dòng cron schedule:

```javascript
// Mỗi giờ (mặc định)
cron.schedule('0 * * * *', async () => { ... });

// Mỗi 30 phút
cron.schedule('*/30 * * * *', async () => { ... });
```

## Xử lý sự cố

### MongoDB không kết nối được
```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Hoặc kiểm tra service
sudo systemctl status mongod
```

### Strava API lỗi
- Kiểm tra Client ID và Secret đúng chưa
- Xác nhận Redirect URI khớp với cài đặt trên Strava
- Kiểm tra scope permissions

### Activities không đồng bộ
- Kiểm tra access token còn hạn không
- Xem logs trong console
- Thử đồng bộ thủ công bằng nút "Đồng bộ"

## Phát triển thêm

- [ ] Thêm biểu đồ thống kê
- [ ] Export dữ liệu ra CSV/Excel
- [ ] Notifications khi có người vượt qua
- [ ] Thêm challenges hàng tháng
- [ ] Tích hợp với webhook Strava
- [ ] Mobile app

## License

MIT License

## Tác giả

Bui Trung - 2025

## Liên hệ

Nếu có vấn đề hoặc đóng góp ý tưởng, vui lòng tạo issue trên GitHub.

---

**Powered by Strava API** 🏃‍♂️
