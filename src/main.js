// Kilometree Professional Web Application
// Main JavaScript Module

class KilometreeApp {
  constructor() {
    this.isTracking = false;
    this.currentSteps = 0;
    this.totalSteps = parseInt(localStorage.getItem('totalSteps') || '0');
    this.totalSaplings = parseInt(localStorage.getItem('totalSaplings') || '0');
    this.streak = parseInt(localStorage.getItem('streak') || '0');
    this.lastActiveDate = localStorage.getItem('lastActiveDate');
    this.weeklyDistance = parseFloat(localStorage.getItem('weeklyDistance') || '0');
    this.dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
    this.achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
    
    this.stepInterval = null;
    this.chart = null;
    
    // Constants
    this.STEP_TO_KM = 0.0008;
    this.KM_TO_SAPLINGS = 1;
    this.CO2_PER_SAPLING = 22; // kg CO2 per year
    this.WEEKLY_CHALLENGE_TARGET = 10; // km
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    this.setupNavigation();
    this.updateUI();
    this.generateHeroTrees();
    this.generateForest();
    this.updateLeaderboard();
    this.initChart();
    this.checkWeeklyReset();
    this.updateAchievements();
  }
  
  setupEventListeners() {
    // Tracker controls
    document.getElementById('startBtn').addEventListener('click', () => this.startTracking());
    document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTracking());
    document.getElementById('saveBtn').addEventListener('click', () => this.saveSession());
    document.getElementById('startTrackingBtn').addEventListener('click', () => this.startTracking());
    
    // Achievement modal
    document.getElementById('closeAchievementModal').addEventListener('click', () => this.closeAchievementModal());
    
    // Leaderboard filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterLeaderboard(e.target.dataset.filter));
    });
  }
  
  setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = e.target.dataset.section;
        
        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        e.target.classList.add('active');
        
        // Show target section
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(targetSection).classList.add('active');
        
        // Close mobile menu
        navMenu.classList.remove('active');
      });
    });
    
    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
  
  startTracking() {
    if (this.isTracking) return;
    
    this.isTracking = true;
    this.updateTrackerStatus('Tracking active', 'tracking');
    
    // Enable/disable buttons
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    
    // Start step simulation
    this.stepInterval = setInterval(() => {
      this.simulateSteps();
    }, 1000);
    
    this.showNotification('Tracking started! Start moving to earn saplings.', 'success');
  }
  
  pauseTracking() {
    if (!this.isTracking) return;
    
    this.isTracking = false;
    this.updateTrackerStatus('Tracking paused', 'paused');
    
    // Enable/disable buttons
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    // Stop step simulation
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
    
    this.showNotification('Tracking paused. Click start to continue.', 'warning');
  }
  
  saveSession() {
    if (this.currentSteps === 0) {
      this.showNotification('No activity to save!', 'warning');
      return;
    }
    
    // Add to totals
    this.totalSteps += this.currentSteps;
    const sessionDistance = this.currentSteps * this.STEP_TO_KM;
    const sessionSaplings = Math.floor(sessionDistance);
    this.totalSaplings += sessionSaplings;
    this.weeklyDistance += sessionDistance;
    
    // Update daily data
    const today = new Date().toISOString().split('T')[0];
    if (!this.dailyData[today]) {
      this.dailyData[today] = { steps: 0, distance: 0, saplings: 0 };
    }
    this.dailyData[today].steps += this.currentSteps;
    this.dailyData[today].distance += sessionDistance;
    this.dailyData[today].saplings += sessionSaplings;
    
    // Update streak
    this.updateStreak();
    
    // Save to localStorage
    this.saveToStorage();
    
    // Reset current session
    this.currentSteps = 0;
    this.pauseTracking();
    
    // Update UI
    this.updateUI();
    this.generateForest();
    this.updateChart();
    this.checkAchievements();
    
    this.showNotification(`Session saved! You earned ${sessionSaplings} saplings.`, 'success');
    
    // Reset tracker status
    this.updateTrackerStatus('Ready to track', 'ready');
    document.getElementById('saveBtn').disabled = true;
  }
  
  simulateSteps() {
    // Simulate realistic step increments
    const increment = Math.floor(Math.random() * 8) + 1; // 1-8 steps per second
    this.currentSteps += increment;
    this.updateCurrentDisplay();
  }
  
  updateCurrentDisplay() {
    const distance = this.currentSteps * this.STEP_TO_KM;
    const saplings = Math.floor(distance);
    
    document.getElementById('currentSteps').textContent = this.currentSteps.toLocaleString();
    document.getElementById('currentDistance').textContent = distance.toFixed(2) + ' km';
    document.getElementById('currentSaplings').textContent = saplings.toString();
  }
  
  updateTrackerStatus(message, type) {
    const statusEl = document.getElementById('trackerStatus');
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('span');
    
    statusText.textContent = message;
    
    // Update dot color based on status
    statusDot.className = 'status-dot';
    if (type === 'tracking') {
      statusDot.style.backgroundColor = 'var(--success)';
    } else if (type === 'paused') {
      statusDot.style.backgroundColor = 'var(--warning)';
    } else {
      statusDot.style.backgroundColor = 'var(--gray-400)';
    }
  }
  
  updateUI() {
    // Update main stats
    document.getElementById('totalStepsDisplay').textContent = this.totalSteps.toLocaleString();
    document.getElementById('totalSaplingsDisplay').textContent = this.totalSaplings.toLocaleString();
    document.getElementById('co2OffsetDisplay').textContent = (this.totalSaplings * this.CO2_PER_SAPLING).toFixed(0) + ' kg';
    document.getElementById('streakDisplay').textContent = this.streak.toString();
    
    // Update progress to next milestone
    this.updateMilestoneProgress();
    
    // Update weekly challenge
    this.updateWeeklyChallenge();
    
    // Update analytics
    this.updateAnalytics();
  }
  
  updateMilestoneProgress() {
    const milestones = [10, 25, 50, 100, 200, 500, 1000];
    let nextMilestone = milestones.find(m => m > this.totalSaplings) || (Math.ceil(this.totalSaplings / 1000) + 1) * 1000;
    let previousMilestone = milestones.filter(m => m <= this.totalSaplings).pop() || 0;
    
    const progress = ((this.totalSaplings - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
    
    document.getElementById('milestoneProgress').style.width = Math.min(progress, 100) + '%';
    document.getElementById('progressText').textContent = `${this.totalSaplings} / ${nextMilestone} saplings`;
    document.getElementById('progressPercent').textContent = Math.floor(progress) + '%';
    
    // Update next reward
    const rewards = {
      10: 'Bronze Badge',
      25: 'Silver Badge', 
      50: 'Gold Badge',
      100: 'Platinum Badge',
      200: 'Forest Guardian',
      500: 'Eco Champion',
      1000: 'Planet Protector'
    };
    document.getElementById('nextReward').textContent = rewards[nextMilestone] || 'Legendary Status';
  }
  
  updateWeeklyChallenge() {
    const progress = (this.weeklyDistance / this.WEEKLY_CHALLENGE_TARGET) * 100;
    document.getElementById('challengeProgress').style.width = Math.min(progress, 100) + '%';
    document.getElementById('challengeDistance').textContent = `${this.weeklyDistance.toFixed(1)} / ${this.WEEKLY_CHALLENGE_TARGET.toFixed(1)} km`;
    
    // Calculate days left in week
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7;
    document.getElementById('challengeTimeLeft').textContent = daysUntilSunday === 0 ? 'Last day!' : `${daysUntilSunday} days left`;
  }
  
  updateAnalytics() {
    document.getElementById('totalTreesAnalytics').textContent = this.totalSaplings.toLocaleString();
    document.getElementById('co2SavedAnalytics').textContent = (this.totalSaplings * this.CO2_PER_SAPLING).toFixed(0) + ' kg';
    
    // Calculate community rank (simulated)
    const rank = Math.max(1, Math.floor(Math.random() * 50) + 1);
    document.getElementById('communityRankAnalytics').textContent = `#${rank}`;
  }
  
  generateHeroTrees() {
    const heroTrees = document.getElementById('heroTrees');
    const treeEmojis = ['🌲', '🌳', '🌴', '🌿', '🌱', '🍃'];
    
    for (let i = 0; i < 12; i++) {
      const tree = document.createElement('div');
      tree.className = 'tree';
      tree.textContent = treeEmojis[Math.floor(Math.random() * treeEmojis.length)];
      tree.style.setProperty('--i', i);
      heroTrees.appendChild(tree);
    }
  }
  
  generateForest() {
    const forestGrid = document.getElementById('forestGrid');
    forestGrid.innerHTML = '';
    
    if (this.totalSaplings === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'Start tracking to grow your forest!';
      emptyMessage.style.color = 'var(--gray-500)';
      emptyMessage.style.fontSize = 'var(--font-size-lg)';
      forestGrid.appendChild(emptyMessage);
      return;
    }
    
    const maxTrees = Math.min(this.totalSaplings, 100);
    const treeTypes = ['🌲', '🌳', '🌴'];
    
    for (let i = 0; i < maxTrees; i++) {
      const tree = document.createElement('div');
      tree.className = 'forest-tree';
      tree.textContent = treeTypes[i % treeTypes.length];
      tree.style.animationDelay = `${i * 0.05}s`;
      forestGrid.appendChild(tree);
    }
    
    if (this.totalSaplings > 100) {
      const moreText = document.createElement('div');
      moreText.textContent = `+${this.totalSaplings - 100} more trees`;
      moreText.style.color = 'var(--primary-dark)';
      moreText.style.fontWeight = '600';
      moreText.style.fontSize = 'var(--font-size-lg)';
      forestGrid.appendChild(moreText);
    }
  }
  
  updateLeaderboard() {
    const leaderboardData = [
      { name: 'Alex Chen', saplings: 156, avatar: '👨‍💻', change: '+12' },
      { name: 'Sarah Johnson', saplings: 142, avatar: '👩‍🌾', change: '+8' },
      { name: 'Mike Rodriguez', saplings: 138, avatar: '👨‍🎓', change: '+15' },
      { name: 'You', saplings: this.totalSaplings, avatar: '🌱', change: '+0', isCurrentUser: true },
      { name: 'Emma Wilson', saplings: 89, avatar: '👩‍💼', change: '+5' },
      { name: 'David Kim', saplings: 76, avatar: '👨‍🔬', change: '+3' },
      { name: 'Lisa Zhang', saplings: 65, avatar: '👩‍🎨', change: '+7' },
      { name: 'Tom Brown', saplings: 52, avatar: '👨‍🏫', change: '+2' }
    ];
    
    // Sort by saplings
    leaderboardData.sort((a, b) => b.saplings - a.saplings);
    
    const leaderboardList = document.getElementById('leaderboardList');
    leaderboardList.innerHTML = '';
    
    leaderboardData.forEach((user, index) => {
      const item = document.createElement('div');
      item.className = `leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`;
      
      const rankClass = index < 3 ? 'top-3' : '';
      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      
      item.innerHTML = `
        <div class="leaderboard-rank ${rankClass}">
          ${rankEmoji || (index + 1)}
        </div>
        <div class="leaderboard-avatar">${user.avatar}</div>
        <div class="leaderboard-info">
          <div class="leaderboard-name">${user.name}</div>
          <div class="leaderboard-stats">${user.saplings} saplings planted</div>
        </div>
        <div class="leaderboard-score">
          <div class="leaderboard-saplings">${user.saplings}</div>
          <div class="leaderboard-change">${user.change}</div>
        </div>
      `;
      
      leaderboardList.appendChild(item);
    });
  }
  
  filterLeaderboard(filter) {
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // In a real app, this would filter the data
    this.showNotification(`Showing ${filter} leaderboard`, 'success');
  }
  
  initChart() {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return;
    
    // Get last 7 days of data
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = this.dailyData[dateStr] || { steps: 0, distance: 0, saplings: 0 };
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        steps: dayData.steps,
        distance: dayData.distance,
        saplings: dayData.saplings
      });
    }
    
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: last7Days.map(d => d.date),
        datasets: [
          {
            label: 'Steps',
            data: last7Days.map(d => d.steps),
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            borderColor: 'rgba(34, 197, 94, 1)',
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Saplings',
            data: last7Days.map(d => d.saplings),
            backgroundColor: 'rgba(251, 191, 36, 0.5)',
            borderColor: 'rgba(251, 191, 36, 1)',
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Steps'
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            grid: {
              drawOnChartArea: false
            },
            title: {
              display: true,
              text: 'Saplings'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }
  
  updateChart() {
    if (!this.chart) return;
    
    // Update chart with new data
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = this.dailyData[dateStr] || { steps: 0, distance: 0, saplings: 0 };
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        steps: dayData.steps,
        saplings: dayData.saplings
      });
    }
    
    this.chart.data.labels = last7Days.map(d => d.date);
    this.chart.data.datasets[0].data = last7Days.map(d => d.steps);
    this.chart.data.datasets[1].data = last7Days.map(d => d.saplings);
    this.chart.update();
  }
  
  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    if (this.lastActiveDate === yesterdayStr) {
      this.streak += 1;
    } else if (this.lastActiveDate !== today) {
      this.streak = 1;
    }
    
    this.lastActiveDate = today;
  }
  
  checkWeeklyReset() {
    const lastReset = localStorage.getItem('lastWeeklyReset');
    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    
    if (!lastReset || parseInt(lastReset) !== currentWeek) {
      this.weeklyDistance = 0;
      localStorage.setItem('lastWeeklyReset', currentWeek.toString());
      this.saveToStorage();
    }
  }
  
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  updateAchievements() {
    const achievements = [
      { id: 'bronze', threshold: 10, icon: '🥉', title: 'Bronze Planter' },
      { id: 'silver', threshold: 25, icon: '🥈', title: 'Silver Planter' },
      { id: 'gold', threshold: 50, icon: '🥇', title: 'Gold Planter' },
      { id: 'platinum', threshold: 100, icon: '💎', title: 'Platinum Planter' }
    ];
    
    achievements.forEach(achievement => {
      const progress = Math.min((this.totalSaplings / achievement.threshold) * 100, 100);
      const progressEl = document.getElementById(`${achievement.id}Progress`);
      const textEl = document.getElementById(`${achievement.id}Text`);
      const statusEl = document.getElementById(`${achievement.id}Status`);
      const cardEl = document.querySelector(`[data-achievement="${achievement.id}"]`);
      
      if (progressEl) progressEl.style.width = progress + '%';
      if (textEl) textEl.textContent = `${this.totalSaplings} / ${achievement.threshold}`;
      
      if (this.totalSaplings >= achievement.threshold) {
        if (statusEl) statusEl.textContent = '✅';
        if (cardEl) cardEl.classList.add('unlocked');
      } else {
        if (statusEl) statusEl.textContent = '🔒';
        if (cardEl) cardEl.classList.remove('unlocked');
      }
    });
  }
  
  checkAchievements() {
    const achievements = [
      { id: 'bronze', threshold: 10, icon: '🥉', title: 'Bronze Planter', description: 'Planted your first 10 saplings!' },
      { id: 'silver', threshold: 25, icon: '🥈', title: 'Silver Planter', description: 'Reached 25 saplings milestone!' },
      { id: 'gold', threshold: 50, icon: '🥇', title: 'Gold Planter', description: 'Amazing! 50 saplings planted!' },
      { id: 'platinum', threshold: 100, icon: '💎', title: 'Platinum Planter', description: 'Incredible! 100 saplings achieved!' }
    ];
    
    achievements.forEach(achievement => {
      if (this.totalSaplings >= achievement.threshold && !this.achievements[achievement.id]) {
        this.achievements[achievement.id] = true;
        this.showAchievementModal(achievement);
        this.saveToStorage();
      }
    });
    
    this.updateAchievements();
  }
  
  showAchievementModal(achievement) {
    const modal = document.getElementById('achievementModal');
    const icon = document.getElementById('achievementIcon');
    const title = document.getElementById('achievementTitle');
    const description = document.getElementById('achievementDescription');
    
    icon.textContent = achievement.icon;
    title.textContent = achievement.title;
    description.textContent = achievement.description;
    
    modal.classList.add('active');
    
    // Auto close after 5 seconds
    setTimeout(() => {
      this.closeAchievementModal();
    }, 5000);
  }
  
  closeAchievementModal() {
    document.getElementById('achievementModal').classList.remove('active');
  }
  
  showNotification(message, type = 'success') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }
  
  saveToStorage() {
    localStorage.setItem('totalSteps', this.totalSteps.toString());
    localStorage.setItem('totalSaplings', this.totalSaplings.toString());
    localStorage.setItem('streak', this.streak.toString());
    localStorage.setItem('lastActiveDate', this.lastActiveDate || '');
    localStorage.setItem('weeklyDistance', this.weeklyDistance.toString());
    localStorage.setItem('dailyData', JSON.stringify(this.dailyData));
    localStorage.setItem('achievements', JSON.stringify(this.achievements));
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new KilometreeApp();
});