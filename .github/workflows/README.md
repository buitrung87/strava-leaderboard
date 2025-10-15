# GitHub Actions Workflows

## Docker Publish Workflow

File: `docker-publish.yml`

### Chức năng

Workflow này tự động build và push Docker image lên GitHub Container Registry (ghcr.io) khi:
- Push code lên branch `main` hoặc `master`
- Tạo tag mới (ví dụ: `v1.0.0`)
- Merge pull request
- Chạy thủ công (workflow_dispatch)

### Image Tags

Workflow tự động tạo các tags sau:

1. **Branch tags**: `main`, `master`
2. **Version tags**: `v1.0.0`, `v1.0`, `v1`
3. **SHA tags**: `main-abc123` (commit SHA)
4. **Latest tag**: `latest` (chỉ cho default branch)

### Cách sử dụng

#### 1. Đẩy code lên GitHub

```bash
git add .
git commit -m "Update application"
git push origin main
```

Workflow sẽ tự động chạy và build Docker image.

#### 2. Tạo release tag

```bash
# Tạo tag
git tag v1.0.0

# Push tag lên GitHub
git push origin v1.0.0
```

Workflow sẽ build và tạo image với tag `v1.0.0`, `v1.0`, `v1`, và `latest`.

#### 3. Chạy thủ công

1. Vào tab **Actions** trên GitHub repository
2. Chọn workflow **Build and Push Docker Image**
3. Click **Run workflow**
4. Chọn branch và click **Run workflow**

### Kiểm tra build status

1. Vào tab **Actions** trên GitHub repository
2. Xem danh sách workflow runs
3. Click vào run để xem chi tiết logs

### Xem Docker Images

1. Vào trang repository trên GitHub
2. Click **Packages** ở sidebar bên phải
3. Xem các images đã được publish

Hoặc truy cập: `https://github.com/users/YOUR_USERNAME/packages/container/package/strava-leaderboard`

### Pull Docker Image

#### Public repository
```bash
docker pull ghcr.io/YOUR_USERNAME/strava-leaderboard:latest
```

#### Private repository
```bash
# Login trước
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin

# Pull image
docker pull ghcr.io/YOUR_USERNAME/strava-leaderboard:latest
```

### Cấu hình

Workflow sử dụng `GITHUB_TOKEN` tự động, không cần setup thêm secrets.

Workflow build cho cả 2 platforms:
- `linux/amd64` - Cho PC, server x86_64
- `linux/arm64` - Cho Raspberry Pi, Apple Silicon

### Multi-platform Support

Workflow build Docker images cho nhiều platforms:
- **linux/amd64**: Cho Intel/AMD processors (hầu hết servers)
- **linux/arm64**: Cho ARM processors (Raspberry Pi, AWS Graviton, Apple Silicon)

Khi pull image, Docker sẽ tự động chọn platform phù hợp với máy của bạn.

### Troubleshooting

#### Build failed
1. Xem logs trong Actions tab
2. Kiểm tra Dockerfile syntax
3. Đảm bảo tất cả dependencies được cài đặt đúng

#### Cannot push image
1. Kiểm tra repository settings
2. Đảm bảo GitHub Actions có quyền write packages
3. Vào **Settings** → **Actions** → **General** → **Workflow permissions** → Chọn **Read and write permissions**

#### Package visibility
Mặc định, packages là private. Để public:
1. Vào package settings
2. Scroll xuống **Danger Zone**
3. Click **Change visibility** → **Public**

### Best Practices

1. **Semantic Versioning**: Sử dụng tags theo chuẩn `v1.0.0`
2. **Changelog**: Ghi chú thay đổi trong release notes
3. **Testing**: Test local trước khi push lên GitHub
4. **Clean up**: Xóa các old images không dùng để tiết kiệm storage

### Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Docker Build Action](https://github.com/docker/build-push-action)
