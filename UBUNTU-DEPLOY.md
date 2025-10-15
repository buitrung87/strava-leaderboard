# 🐧 Ubuntu Deployment Guide

Hướng dẫn deploy Strava Leaderboard lên Ubuntu server sử dụng Docker image từ GitHub Container Registry.

## Yêu cầu

- Ubuntu 20.04+ (hoặc Debian-based Linux)
- Quyền sudo
- Domain hoặc IP public (khuyến nghị)

## Bước 1: Cài đặt Docker & Docker Compose

```bash
# Cập nhật system
sudo apt update && sudo apt upgrade -y

# Cài đặt dependencies
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common

# Thêm Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Thêm Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Thêm user vào docker group (không cần sudo)
sudo usermod -aG docker $USER

# Khởi động Docker
sudo systemctl enable docker
sudo systemctl start docker

# Kiểm tra
docker --version
docker compose version
```

**Lưu ý**: Đăng xuất và đăng nhập lại để áp dụng docker group.

## Bước 2: Clone Repository

```bash
# Clone repo
git clone https://github.com/YOUR_GITHUB_USERNAME/strava-leaderboard.git
cd strava-leaderboard
```

## Bước 3: Cấu hình môi trường

### 3.1. Tạo file .env

```bash
# Copy template
cp .env.prod.example .env

# Chỉnh sửa file .env
nano .env
```

### 3.2. Điền thông tin vào .env

```env
# Lấy từ https://www.strava.com/settings/api
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_client_secret
STRAVA_REDIRECT_URI=http://your-server-ip:3000/auth/callback

# Tạo session secret ngẫu nhiên
SESSION_SECRET=$(openssl rand -hex 32)

NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb://mongodb:27017/strava-leaderboard
```

**Tạo SESSION_SECRET ngẫu nhiên:**
```bash
openssl rand -hex 32
```

### 3.3. Cập nhật GitHub username trong docker-compose.prod.yml

```bash
nano docker-compose.prod.yml
```

Sửa dòng image thành GitHub username của bạn:
```yaml
image: ghcr.io/YOUR_GITHUB_USERNAME/strava-leaderboard:latest
```

## Bước 4: Login vào GitHub Container Registry

Nếu repository là **private**, bạn cần login:

```bash
# Tạo GitHub Personal Access Token với quyền read:packages
# Tại: https://github.com/settings/tokens/new

# Login
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Nếu repository là **public**, bỏ qua bước này.

## Bước 5: Pull và chạy ứng dụng

```bash
# Pull image mới nhất
docker compose -f docker-compose.prod.yml pull

# Khởi động services
docker compose -f docker-compose.prod.yml up -d

# Xem logs
docker compose -f docker-compose.prod.yml logs -f
```

## Bước 6: Kiểm tra

```bash
# Kiểm tra containers đang chạy
docker compose -f docker-compose.prod.yml ps

# Test ứng dụng
curl http://localhost:3000
```

Mở trình duyệt: `http://your-server-ip:3000`

## Bước 7: Cấu hình Nginx Reverse Proxy (Khuyến nghị)

### 7.1. Cài đặt Nginx

```bash
sudo apt install -y nginx
```

### 7.2. Tạo cấu hình site

```bash
sudo nano /etc/nginx/sites-available/strava-leaderboard
```

Thêm nội dung:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Thay bằng domain của bạn

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.3. Enable site và restart Nginx

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/strava-leaderboard /etc/nginx/sites-enabled/

# Test cấu hình
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7.4. Cấu hình SSL với Certbot (HTTPS)

```bash
# Cài đặt Certbot
sudo apt install -y certbot python3-certbot-nginx

# Lấy SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal đã được setup tự động
```

**Cập nhật STRAVA_REDIRECT_URI trong .env:**
```env
STRAVA_REDIRECT_URI=https://your-domain.com/auth/callback
```

Restart app:
```bash
docker compose -f docker-compose.prod.yml restart app
```

## Các lệnh hữu ích

### Xem logs

```bash
# Tất cả services
docker compose -f docker-compose.prod.yml logs -f

# Chỉ app
docker compose -f docker-compose.prod.yml logs -f app

# Chỉ MongoDB
docker compose -f docker-compose.prod.yml logs -f mongodb
```

### Update ứng dụng

```bash
# Pull image mới
docker compose -f docker-compose.prod.yml pull app

# Restart với image mới
docker compose -f docker-compose.prod.yml up -d app
```

### Restart services

```bash
# Restart tất cả
docker compose -f docker-compose.prod.yml restart

# Restart chỉ app
docker compose -f docker-compose.prod.yml restart app
```

### Dừng ứng dụng

```bash
docker compose -f docker-compose.prod.yml down
```

### Backup MongoDB

```bash
# Tạo thư mục backup
mkdir -p ~/backups

# Backup database
docker exec strava-mongodb mongodump --db strava-leaderboard --out /data/db/backup
docker cp strava-mongodb:/data/db/backup ~/backups/mongo-backup-$(date +%Y%m%d-%H%M%S)
```

### Restore MongoDB

```bash
# Restore từ backup
docker cp ~/backups/mongo-backup-YYYYMMDD-HHMMSS strava-mongodb:/data/db/restore
docker exec strava-mongodb mongorestore --db strava-leaderboard /data/db/restore/strava-leaderboard
```

## Tự động update với cron

Tạo script auto-update:

```bash
nano ~/update-strava.sh
```

Nội dung:

```bash
#!/bin/bash
cd ~/strava-leaderboard
docker compose -f docker-compose.prod.yml pull app
docker compose -f docker-compose.prod.yml up -d app
docker image prune -f
```

Chmod và thêm vào cron:

```bash
chmod +x ~/update-strava.sh

# Mở crontab
crontab -e

# Thêm dòng này để tự động update mỗi ngày lúc 3 AM
0 3 * * * ~/update-strava.sh >> ~/strava-update.log 2>&1
```

## Monitoring & Logging

### Xem resource usage

```bash
docker stats
```

### Log rotation

Docker tự động rotate logs, nhưng bạn có thể cấu hình trong `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

## Troubleshooting

### Container không start

```bash
# Xem logs chi tiết
docker compose -f docker-compose.prod.yml logs app

# Xem trạng thái
docker compose -f docker-compose.prod.yml ps
```

### MongoDB connection error

```bash
# Kiểm tra MongoDB health
docker exec strava-mongodb mongosh --eval "db.runCommand('ping')"

# Restart MongoDB
docker compose -f docker-compose.prod.yml restart mongodb
```

### Port 3000 đã được sử dụng

```bash
# Kiểm tra process đang dùng port
sudo lsof -i :3000

# Hoặc
sudo netstat -tulpn | grep 3000
```

### Không pull được image từ GitHub

```bash
# Kiểm tra đã login chưa
docker login ghcr.io

# Pull thủ công
docker pull ghcr.io/YOUR_GITHUB_USERNAME/strava-leaderboard:latest
```

## Security Best Practices

1. **Firewall**: Chỉ mở port cần thiết
```bash
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

2. **Không expose MongoDB port ra ngoài**: Xóa port mapping trong docker-compose.prod.yml nếu không cần truy cập từ bên ngoài.

3. **Sử dụng strong SESSION_SECRET**: Ít nhất 32 ký tự ngẫu nhiên.

4. **Regular updates**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

5. **Backup thường xuyên**: Setup cron job để backup MongoDB.

## Performance Tips

1. **Tăng MongoDB memory** (nếu server có nhiều RAM):

Thêm vào `docker-compose.prod.yml`:
```yaml
mongodb:
  deploy:
    resources:
      limits:
        memory: 2G
```

2. **Enable MongoDB authentication** cho production.

3. **Sử dụng Docker volumes cho logs** thay vì bind mounts.

---

**Hoàn tất!** 🎉

Ứng dụng của bạn giờ đã chạy trên Ubuntu server với Docker image từ GitHub Container Registry.

Truy cập: `http://your-domain.com` hoặc `http://your-server-ip:3000`
