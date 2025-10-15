// Global state
let currentUser = null;
let currentPeriod = 'month';

// DOM Elements
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const syncBtn = document.getElementById('syncBtn');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const userAvatar = document.getElementById('userAvatar');
const userStats = document.getElementById('userStats');
const periodBtns = document.querySelectorAll('.period-btn');
const loadingSpinner = document.getElementById('loadingSpinner');
const leaderboardTable = document.getElementById('leaderboardTable');
const leaderboardBody = document.getElementById('leaderboardBody');
const emptyState = document.getElementById('emptyState');
const periodText = document.getElementById('periodText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
    loadLeaderboard(currentPeriod);
    checkUrlParams();
});

// Check authentication status
async function checkAuth() {
    try {
        const response = await fetch('/auth/me');
        const data = await response.json();
        
        if (data.user) {
            currentUser = data.user;
            showUserInfo(data.user);
            loadUserStats(data.user._id);
        } else {
            showLoginButton();
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        showLoginButton();
    }
}

// Show user info
function showUserInfo(user) {
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    
    userName.textContent = user.firstname && user.lastname 
        ? `${user.firstname} ${user.lastname}`
        : user.username;
    
    if (user.profileMedium || user.profile) {
        userAvatar.src = user.profileMedium || user.profile;
        userAvatar.style.display = 'block';
    }
    
    userStats.style.display = 'block';
}

// Show login button
function showLoginButton() {
    loginBtn.style.display = 'flex';
    userInfo.style.display = 'none';
    userStats.style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', () => {
        window.location.href = '/auth/strava';
    });
    
    logoutBtn.addEventListener('click', () => {
        window.location.href = '/auth/logout';
    });
    
    syncBtn.addEventListener('click', syncActivities);
    
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            loadLeaderboard(currentPeriod);
        });
    });
}

// Load leaderboard
async function loadLeaderboard(period) {
    showLoading();
    
    try {
        const response = await fetch(`/api/leaderboard/${period}`);
        const data = await response.json();
        
        if (data.leaderboard && data.leaderboard.length > 0) {
            displayLeaderboard(data.leaderboard);
            updatePeriodText(period);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showEmptyState();
    }
}

// Display leaderboard
function displayLeaderboard(leaderboard) {
    leaderboardBody.innerHTML = '';
    
    leaderboard.forEach((entry) => {
        const row = document.createElement('div');
        row.className = 'leaderboard-row';
        
        const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
        const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : '';
        
        const fullName = entry.firstname && entry.lastname 
            ? `${entry.firstname} ${entry.lastname}`
            : '';
        
        const avatarUrl = entry.profileMedium || entry.profile || 'https://via.placeholder.com/50';
        
        const avgSpeed = entry.averageSpeed ? (entry.averageSpeed * 3.6).toFixed(2) : '0.00';
        
        row.innerHTML = `
            <div class="rank-col ${rankClass}">
                ${medal || `#${entry.rank}`}
            </div>
            <div class="user-info-col">
                <img src="${avatarUrl}" alt="${entry.username}">
                <div>
                    <div class="user-name">${entry.username}</div>
                    ${fullName ? `<div class="full-name">${fullName}</div>` : ''}
                </div>
            </div>
            <div class="distance-col">${entry.totalKm.toFixed(2)} km</div>
            <div class="runs-col">${entry.activityCount} lần</div>
            <div class="speed-col">${avgSpeed} km/h</div>
        `;
        
        leaderboardBody.appendChild(row);
    });
    
    hideLoading();
    leaderboardTable.style.display = 'block';
    emptyState.style.display = 'none';
}

// Load user statistics
async function loadUserStats(userId) {
    try {
        const response = await fetch(`/api/stats/${userId}`);
        const data = await response.json();
        
        if (data) {
            updateStats('today', data.today);
            updateStats('week', data.week);
            updateStats('month', data.month);
        }
    } catch (error) {
        console.error('Error loading user stats:', error);
    }
}

// Update statistics display
function updateStats(period, stats) {
    const km = (stats.totalDistance / 1000).toFixed(2);
    const runs = stats.activityCount;
    
    document.getElementById(`${period}Km`).textContent = `${km} km`;
    document.getElementById(`${period}Runs`).textContent = `${runs} lần chạy`;
}

// Sync activities
async function syncActivities() {
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đồng bộ...';
    
    try {
        const response = await fetch('/api/sync', { method: 'POST' });
        const data = await response.json();
        
        if (data.success) {
            alert(`Đồng bộ thành công! ${data.newActivities} hoạt động mới.`);
            
            // Reload data
            if (currentUser) {
                loadUserStats(currentUser._id);
            }
            loadLeaderboard(currentPeriod);
        }
    } catch (error) {
        console.error('Error syncing:', error);
        alert('Có lỗi xảy ra khi đồng bộ dữ liệu.');
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Đồng bộ';
    }
}

// Update period text
function updatePeriodText(period) {
    const texts = {
        day: 'Hôm nay',
        week: 'Tuần này',
        month: 'Tháng này'
    };
    periodText.textContent = texts[period] || '';
}

// Show loading state
function showLoading() {
    loadingSpinner.style.display = 'block';
    leaderboardTable.style.display = 'none';
    emptyState.style.display = 'none';
}

// Hide loading state
function hideLoading() {
    loadingSpinner.style.display = 'none';
}

// Show empty state
function showEmptyState() {
    hideLoading();
    leaderboardTable.style.display = 'none';
    emptyState.style.display = 'block';
}

// Check URL parameters
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const error = urlParams.get('error');
    
    if (auth === 'success') {
        setTimeout(() => {
            alert('Kết nối với Strava thành công! Dữ liệu của bạn đang được đồng bộ...');
            window.history.replaceState({}, document.title, '/');
        }, 500);
    }
    
    if (error) {
        alert('Có lỗi xảy ra: ' + error);
        window.history.replaceState({}, document.title, '/');
    }
}

// Auto-refresh leaderboard every 5 minutes
setInterval(() => {
    loadLeaderboard(currentPeriod);
    if (currentUser) {
        loadUserStats(currentUser._id);
    }
}, 5 * 60 * 1000);
