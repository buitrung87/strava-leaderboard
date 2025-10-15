# PowerShell script to start Docker containers

Write-Host "🚀 Starting Strava Leaderboard with Docker..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "📝 Creating .env from .env.docker template..." -ForegroundColor Cyan
    Copy-Item .env.docker .env
    Write-Host ""
    Write-Host "⚠️  Please edit .env file with your Strava API credentials before running again!" -ForegroundColor Yellow
    Write-Host "   - STRAVA_CLIENT_ID" -ForegroundColor White
    Write-Host "   - STRAVA_CLIENT_SECRET" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check if required env vars are set
$envContent = Get-Content .env -Raw
if ($envContent -match "your_client_id_here" -or $envContent -match "your_client_secret_here") {
    Write-Host "⚠️  Please configure your Strava API credentials in .env file!" -ForegroundColor Yellow
    Write-Host "   Get them from: https://www.strava.com/settings/api" -ForegroundColor Cyan
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Start Docker containers
Write-Host "🐳 Starting Docker containers..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "✅ Containers started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Application: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🗄️  MongoDB: mongodb://localhost:27017" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 View logs: docker-compose logs -f" -ForegroundColor White
Write-Host "🛑 Stop containers: docker-compose down" -ForegroundColor White
Write-Host ""
