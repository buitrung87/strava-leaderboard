# 🔧 GitHub Repository Setup

Hướng dẫn setup GitHub repository để sử dụng GitHub Container Registry và Actions.

## Bước 1: Tạo GitHub Repository

### 1.1. Tạo repository mới

1. Vào https://github.com/new
2. Điền thông tin:
   - **Repository name**: `strava-leaderboard`
   - **Description**: `Strava running leaderboard with Docker`
   - **Visibility**: Public hoặc Private (tùy bạn)
3. **Không** chọn Initialize with README (vì đã có local)
4. Click **Create repository**

### 1.2. Push code lên GitHub

```bash
cd /path/to/strava-leaderboard

# Initialize git (nếu chưa có)
git init

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/strava-leaderboard.git

# Add files
git add .

# Commit
git commit -m "Initial commit with Docker and GitHub Actions"

# Push
git branch -M main
git push -u origin main
```

---

## Bước 2: Cấu hình GitHub Actions Permissions

GitHub Actions cần quyền để push Docker images lên Container Registry.

### 2.1. Enable Actions permissions

1. Vào repository settings: `https://github.com/YOUR_USERNAME/strava-leaderboard/settings`
2. Sidebar → **Actions** → **General**
3. Scroll xuống **Workflow permissions**
4. Chọn: **Read and write permissions** ✅
5. Check: **Allow GitHub Actions to create and approve pull requests** ✅
6. Click **Save**

![Workflow Permissions](https://docs.github.com/assets/cb-45937/mw-1440/images/help/repository/actions-workflow-permissions.webp)

---

## Bước 3: Cấu hình Package (Container Registry)

### 3.1. Đợi first build

1. Vào tab **Actions**: `https://github.com/YOUR_USERNAME/strava-leaderboard/actions`
2. Xem workflow **Build and Push Docker Image** đang chạy
3. Đợi hoàn tất (khoảng 2-5 phút)

### 3.2. Xem package

1. Vào repository homepage
2. Sidebar phải → **Packages**
3. Click vào package `strava-leaderboard`

Package URL: `https://github.com/users/YOUR_USERNAME/packages/container/package/strava-leaderboard`

### 3.3. Public package (Optional)

Nếu muốn package public (không cần login để pull):

1. Vào package settings
2. Scroll xuống **Danger Zone**
3. **Change visibility** → **Public**
4. Confirm

---

## Bước 4: Update docker-compose.prod.yml

Sau khi push lên GitHub, cập nhật file `docker-compose.prod.yml`:

```bash
# Local (trên máy Windows của bạn)
cd /path/to/strava-leaderboard

# Sửa file
nano docker-compose.prod.yml  # hoặc code editor

# Thay YOUR_GITHUB_USERNAME bằng username thật
# Ví dụ: ghcr.io/buitrung/strava-leaderboard:latest
```

Hoặc dùng find-replace:
```bash
# Thay YOUR_GITHUB_USERNAME bằng username thật
sed -i 's/YOUR_GITHUB_USERNAME/buitrung/g' docker-compose.prod.yml
```

Commit và push:
```bash
git add docker-compose.prod.yml
git commit -m "Update GitHub username in docker-compose.prod.yml"
git push
```

---

## Bước 5: Trigger Build

### 5.1. Automatic trigger (Recommended)

GitHub Actions tự động build khi:
- Push code lên `main` branch
- Tạo tag mới (e.g., `v1.0.0`)
- Merge pull request

### 5.2. Manual trigger

1. Vào **Actions** tab
2. Click workflow: **Build and Push Docker Image**
3. Click **Run workflow** (nút xanh bên phải)
4. Chọn branch `main`
5. Click **Run workflow**

### 5.3. Tag release (Best for production)

```bash
# Tạo version tag
git tag v1.0.0

# Push tag lên GitHub
git push origin v1.0.0
```

GitHub Actions sẽ build và tạo image với tags:
- `latest`
- `v1.0.0`
- `v1.0`
- `v1`

---

## Bước 6: Verify Build

### 6.1. Check Actions

1. Vào **Actions** tab
2. Click vào workflow run mới nhất
3. Expand các steps để xem logs
4. Đảm bảo tất cả steps ✅ xanh

### 6.2. Check Package

1. Vào **Packages**
2. Click vào `strava-leaderboard`
3. Xem các tags đã được tạo:
   - `latest`
   - `main` (hoặc `master`)
   - Version tags (nếu có)

### 6.3. Test Pull Image

**Public package**:
```bash
docker pull ghcr.io/YOUR_USERNAME/strava-leaderboard:latest
```

**Private package**:
```bash
# Tạo Personal Access Token tại: https://github.com/settings/tokens/new
# Scopes cần: read:packages

# Login
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull
docker pull ghcr.io/YOUR_USERNAME/strava-leaderboard:latest
```

---

## Bước 7: Clone lên Ubuntu Server

Giờ bạn có thể clone và deploy lên Ubuntu server:

```bash
# SSH vào Ubuntu server
ssh user@your-server-ip

# Clone repository
git clone https://github.com/YOUR_USERNAME/strava-leaderboard.git
cd strava-leaderboard

# Setup và deploy
cp .env.prod.example .env
nano .env  # Điền config

chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

---

## GitHub Secrets (Optional)

Nếu cần thêm secrets cho CI/CD:

### 7.1. Add secrets

1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Thêm secrets:
   - `DOCKER_USERNAME` (nếu dùng Docker Hub)
   - `DOCKER_PASSWORD`
   - `SERVER_SSH_KEY` (để auto-deploy)

### 7.2. Use in workflow

```yaml
- name: Login to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKER_USERNAME }}
    password: ${{ secrets.DOCKER_PASSWORD }}
```

---

## Troubleshooting

### Error: "Resource not accessible by integration"

**Nguyên nhân**: GitHub Actions không có quyền write packages

**Giải pháp**:
1. Settings → Actions → General
2. Workflow permissions → **Read and write permissions**
3. Save và re-run workflow

### Error: "authentication required"

**Nguyên nhân**: Package là private và cần login

**Giải pháp**:
```bash
# Tạo PAT với scope read:packages
# Tại: https://github.com/settings/tokens/new

echo YOUR_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Error: "denied: permission_denied"

**Nguyên nhân**: GITHUB_TOKEN không có quyền

**Giải pháp**:
1. Check workflow permissions (Bước 2.1)
2. Re-run workflow
3. Nếu vẫn lỗi, tạo Personal Access Token và dùng thay GITHUB_TOKEN

### Build failed với "manifest unknown"

**Nguyên nhân**: Image chưa được push lên registry

**Giải pháp**:
1. Check Actions logs
2. Đảm bảo push step succeeded
3. Verify package tồn tại trên GitHub

---

## Best Practices

### 1. Protected Branches

Protect `main` branch:
1. Settings → Branches
2. Add rule for `main`
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks
   - ✅ Require branches to be up to date

### 2. Tag Releases

Sử dụng semantic versioning:
```bash
git tag v1.0.0  # Major release
git tag v1.0.1  # Patch
git tag v1.1.0  # Minor
```

### 3. Keep Secrets Safe

- ❌ Không commit `.env` files
- ❌ Không hardcode API keys
- ✅ Sử dụng GitHub Secrets
- ✅ Sử dụng `.gitignore`

### 4. Automate Everything

- ✅ Auto-build on push
- ✅ Auto-test before deploy
- ✅ Auto-tag releases
- ✅ Auto-deploy to staging

---

## Next Steps

Sau khi setup xong:

1. ✅ **Test locally**: Chạy với Docker trên máy local
2. ✅ **Push to GitHub**: Commit và push code
3. ✅ **Verify build**: Check GitHub Actions succeeded
4. ✅ **Deploy to Ubuntu**: Follow [UBUNTU-DEPLOY.md](./UBUNTU-DEPLOY.md)
5. ✅ **Setup domain & SSL**: Configure Nginx + Certbot
6. ✅ **Monitor**: Setup logging và monitoring

---

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

**Setup hoàn tất!** 🎉

Giờ bạn có thể deploy application lên Ubuntu server bằng cách pull image từ GitHub Container Registry.
