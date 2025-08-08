// Kilometree Professional Web Application
// Main JavaScript Module
//
// This module encapsulates all core functionalities of the Kilometree app,
// including step tracking, data persistence, UI updates, and feature integrations.

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { GoogleIntegration } from './google.js';

class KilometreeApp {
  constructor() {
    // Initialize application state variables. These are persisted in localStorage.
    this.isTracking = false;
    this.currentSteps = 0;
    this.totalSteps = parseInt(localStorage.getItem('totalSteps') || '0');
    this.totalSaplings = parseInt(localStorage.getItem('totalSaplings') || '0');
    this.streak = parseInt(localStorage.getItem('streak') || '0');
    this.lastActiveDate = localStorage.getItem('lastActiveDate');
    this.weeklyDistance = parseFloat(localStorage.getItem('weeklyDistance') || '0');
    this.dailyData = JSON.parse(localStorage.getItem('dailyData') || '{}');
    this.achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
    
    // New state for Google Fit integration and manual input
    this.googleFitEnabled = localStorage.getItem('googleFitEnabled') === 'true';
    this.manualSteps = 0;
    this.useManualInput = localStorage.getItem('useManualInput') === 'true';
    
    // User authentication state
    this.userProfile = JSON.parse(localStorage.getItem('userProfile') || 'null');
    
    // Internal state for simulation and chart instances
    this.stepInterval = null;
    this.chart = null;
    this.google = null;

    // Event data - simulated for now. In a real application, this would come from an API.
    this.events = [
      {
        id: 'event-1',
        title: 'Community Tree Planting Day',
        date: 'October 26, 2024',
        time: '9:00 AM - 12:00 PM',
        location: 'Eco Park, City Center',
        description: 'Join us to plant 1000 native trees and help restore local biodiversity.',
        link: '#',
        linkText: 'Sign Up',
        imageUrl: 'assets/images/event-tree-planting.jpg', // Placeholder image
        youtubeEmbedUrl: 'https://www.youtube.com/embed/your-video-id-1' // Example YouTube embed
      },
      {
        id: 'event-2',
        title: 'Kilometree 1-Year Anniversary Celebration',
        date: 'November 15, 2024',
        time: '6:00 PM - 9:00 PM',
        location: 'Virtual Event (Zoom)',
        description: 'Celebrate a year of environmental impact with games, guest speakers, and surprises!',
        link: '#',
        linkText: 'RSVP',
        imageUrl: 'assets/images/event-celebration.jpg', // Placeholder image
        youtubeEmbedUrl: '' // Empty to test fallback
      },
      {
        id: 'event-3',
        title: 'Coastal Cleanup Drive',
        date: 'December 7, 2024',
        time: '8:00 AM - 11:00 AM',
        location: 'White Sand Beach',
        description: 'Help us clear plastic and debris from our beautiful coastline. Bags and gloves provided.',
        link: '#',
        linkText: 'Volunteer',
        imageUrl: '', // Empty to test image fallback
        youtubeEmbedUrl: 'https://www.youtube.com/embed/your-video-id-3'
      },
    ];

    // Leaderboard data - simulated for now. This would also come from a backend in a real app.
    this.leaderboard = {
      weekly: [
        { name: 'Alex Chen', saplings: 12, avatar: '👨‍💻', change: '+12' },
        { name: 'You', saplings: 0, avatar: '🌱', change: '+0', isCurrentUser: true },
        { name: 'Sarah Johnson', saplings: 8, avatar: '👩‍🌾', change: '+8' },
        { name: 'Mike Rodriguez', saplings: 5, avatar: '👨‍🎓', change: '+5' },
      ],
      monthly: [
        { name: 'Alex Chen', saplings: 48, avatar: '👨‍💻', change: '+20' },
        { name: 'Sarah Johnson', saplings: 35, avatar: '👩‍🌾', change: '+15' },
        { name: 'You', saplings: 0, avatar: '🌱', change: '+0', isCurrentUser: true },
        { name: 'Mike Rodriguez', saplings: 28, avatar: '👨‍🎓', change: '+10' },
      ],
      alltime: [
        { name: 'Alex Chen', saplings: 156, avatar: '👨‍💻', change: '+12' },
        { name: 'Sarah Johnson', saplings: 142, avatar: '👩‍🌾', change: '+8' },
        { name: 'Mike Rodriguez', saplings: 138, avatar: '👨‍🎓', change: '+15' },
        { name: 'You', saplings: 0, avatar: '🌱', change: '+0', isCurrentUser: true },
        { name: 'Emma Wilson', saplings: 89, avatar: '👩‍💼', change: '+5' },
        { name: 'David Kim', saplings: 76, avatar: '👨‍🔬', change: '+3' },
        { name: 'Lisa Zhang', saplings: 65, avatar: '👩‍🎨', change: '+7' },
        { name: 'Tom Brown', saplings: 52, avatar: '👨‍🏫', change: '+2' }
      ]
    };
    
    // Constants for calculations and feature thresholds.
    this.STEP_TO_KM = 0.0008; // Kilometers per step
    this.KM_TO_SAPLINGS = 1; // Saplings earned per kilometer
    this.CO2_PER_SAPLING = 22; // kg CO2 absorbed per tree per year (approx)
    this.WEEKLY_CHALLENGE_TARGET = 10; // km weekly challenge goal
    
    this.init();
  }
  
  /**
   * Initializes the application by setting up event listeners, navigation,
   * updating UI, generating dynamic content, and restoring previous state.
   */
  init() {
    this.setupEventListeners();
    this.setupNavigation();
    this.updateUI(); // Initial UI update based on stored data
    this.generateHeroTrees();
    this.generateForest();
    this.updateLeaderboard();
    this.initChart();
    this.checkWeeklyReset();
    this.updateAchievements();
    this.generateEvents();
    this.setupGoogle();
    this.initializeGoogleTools();
    this.updateGoogleFitUI();
    this.updateAuthUI();

    // Restore last active section from localStorage to maintain user's last view.
    const lastActiveSection = localStorage.getItem('lastActiveSection');
    if (lastActiveSection) {
      // Deactivate all nav links and sections
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
      });

      // Activate the last viewed nav link and section
      const targetNavLink = document.querySelector(`[data-section="${lastActiveSection}"]`);
      const targetSectionElement = document.getElementById(lastActiveSection);

      if (targetNavLink) {
        targetNavLink.classList.add('active');
      }
      if (targetSectionElement) {
        targetSectionElement.classList.add('active');
      }
    }
  }
  
  /**
   * Sets up all global event listeners for interactive elements.
   */
  setupEventListeners() {
    // Tracker control buttons
    document.getElementById('startBtn').addEventListener('click', () => this.startTracking());
    document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTracking());
    document.getElementById('saveBtn').addEventListener('click', () => this.saveSession());
    // The primary CTA button on the hero section also starts tracking
    document.getElementById('startTrackingBtn').addEventListener('click', () => this.startTracking());
    
    // Achievement modal close button
    document.getElementById('closeAchievementModal').addEventListener('click', () => this.closeAchievementModal());
    
    // Leaderboard filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.filterLeaderboard(e.target.dataset.filter));
    });

    // Donation button interaction
    document.getElementById('donateButton').addEventListener('click', () => this.handleDonation());
    
    // New: Manual step input and Google Fit toggle
    document.getElementById('manualStepInput')?.addEventListener('input', (e) => this.manualSteps = parseInt(e.target.value) || 0);
    document.getElementById('manualStepSubmitBtn')?.addEventListener('click', () => this.saveManualSteps());
    document.getElementById('toggleGoogleFit')?.addEventListener('change', (e) => this.toggleGoogleFit(e.target.checked));
    document.getElementById('promptManualInputBtn')?.addEventListener('click', () => this.showManualInputModal());
    
    // Manual input modal controls
    document.getElementById('closeManualInputModal')?.addEventListener('click', () => document.getElementById('manualInputModal').classList.remove('active'));
    document.getElementById('manualStepSubmitBtnModal')?.addEventListener('click', () => this.saveManualSteps());
    
    // Google Fit sync button
    document.getElementById('googleFitSyncBtn')?.addEventListener('click', () => this.fetchGoogleFitStepsForToday());
    
    // Google Tools Section Event Listeners
    document.getElementById('googleFitToggle')?.addEventListener('click', () => {
      this.toggleGoogleTool('googleFit');
    });
    
    document.getElementById('analyticsToggle')?.addEventListener('click', () => {
      this.toggleGoogleTool('analytics');
    });
    
    document.getElementById('calendarToggle')?.addEventListener('click', () => {
      this.toggleGoogleTool('calendar');
    });
    
    document.getElementById('sheetsToggle')?.addEventListener('click', () => {
      this.toggleGoogleTool('sheets');
    });
    
    document.getElementById('youtubeToggle')?.addEventListener('click', () => {
      this.toggleGoogleTool('youtube');
    });
    
    document.getElementById('formsToggle')?.addEventListener('click', () => {
      this.toggleGoogleTool('forms');
    });

    // Google Tools Action Buttons
    document.getElementById('syncNowBtn')?.addEventListener('click', () => {
      this.fetchGoogleFitStepsForToday();
    });
    
    document.getElementById('openAnalyticsBtn')?.addEventListener('click', () => {
      this.openGoogleAnalytics();
    });
    
    document.getElementById('createEventBtn')?.addEventListener('click', () => {
      this.createGoogleCalendarEvent();
    });
    
    document.getElementById('syncToSheetsBtn')?.addEventListener('click', () => {
      this.syncToGoogleSheets();
    });
    
    document.getElementById('uploadVideoBtn')?.addEventListener('click', () => {
      document.getElementById('videoFileInput').click();
    });
    
    document.getElementById('submitFeedbackBtn')?.addEventListener('click', () => {
      this.submitGoogleForm();
    });
    
    document.getElementById('openGoogleSettingsBtn')?.addEventListener('click', () => {
      document.getElementById('googleSettingsModal').classList.add('active');
    });
    
    // Video file input
    document.getElementById('videoFileInput')?.addEventListener('change', (e) => {
      if (e.target.files[0]) {
        this.uploadYouTubeVideo(e.target.files[0]);
      }
    });
    
    // Authentication buttons
    document.getElementById('loginBtn')?.addEventListener('click', () => this.handleLogin());
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.handleLogout());
    
    // Sidebar functionality
    document.getElementById('menuToggle')?.addEventListener('click', () => this.toggleSidebar());
    document.getElementById('sidebarClose')?.addEventListener('click', () => this.closeSidebar());
    document.getElementById('sidebarOverlay')?.addEventListener('click', () => this.closeSidebar());
  }
  
  /**
   * Configures the main navigation and mobile menu toggle functionality.
   */
  setupNavigation() {
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    const sections = document.querySelectorAll('.section');
    
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent default anchor link behavior
        const targetSection = e.currentTarget.dataset.section; // Get target section ID from data-attribute
        
        // Update active navigation link styling
        sidebarLinks.forEach(l => l.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        // Show the target section and hide others
        sections.forEach(s => s.classList.remove('active'));
        document.getElementById(targetSection).classList.add('active');
        
        // Close the sidebar
        this.closeSidebar();

        // Save the currently active section to localStorage for persistence
        localStorage.setItem('lastActiveSection', targetSection);
      });
    });
  }
  
  /**
   * Sidebar functionality methods
   */
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
      
      // Prevent body scroll when sidebar is open
      if (sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }
  
  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    if (sidebar && overlay) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
  
  /**
   * Initializes Google integrations and wires UI controls.
   */
  setupGoogle() {
    try {
      this.google = new GoogleIntegration({
        onAuthChange: async (isSignedIn) => {
          const signInBtn = document.getElementById('googleSignInBtn');
          const signOutBtn = document.getElementById('googleSignOutBtn');
          if (signInBtn && signOutBtn) {
            signInBtn.disabled = isSignedIn;
            signOutBtn.disabled = !isSignedIn;
          }
          
          if (isSignedIn) {
            await this.loadUserProfile();
          } else {
            this.clearUserProfile();
          }
          
          this.updateAuthUI();
          this.updateGoogleFitUI(); // Update UI on auth change
        }
      });
      this.google.initialize();
    } catch (e) {
      console.error('Failed to initialize Google integrations', e);
    }

    const openSettingsBtn = document.getElementById('openSettingsBtn');
    const closeSettingsBtn = document.getElementById('closeSettingsModal');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsModal = document.getElementById('googleSettingsModal');

    if (openSettingsBtn && settingsModal) {
      openSettingsBtn.addEventListener('click', () => settingsModal.classList.add('active'));
    }
    if (closeSettingsBtn && settingsModal) {
      closeSettingsBtn.addEventListener('click', () => settingsModal.classList.remove('active'));
    }
    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', () => {
        const config = this.readSettingsForm();
        this.google?.saveConfig(config);
        settingsModal?.classList.remove('active');
        this.showNotification('Settings saved', 'success');
      });
    }

    const signInBtn = document.getElementById('googleSignInBtn');
    const signOutBtn = document.getElementById('googleSignOutBtn');
    const sheetsSyncBtn = document.getElementById('sheetsSyncBtn');
    const calendarEventBtn = document.getElementById('calendarEventBtn');
    const formSubmitBtn = document.getElementById('formSubmitBtn');
    const lookerBtn = document.getElementById('lookerBtn');
    const youtubeUploadBtn = document.getElementById('youtubeUploadBtn');
    const youtubeFileInput = document.getElementById('youtubeFileInput');

    signInBtn?.addEventListener('click', () => this.google?.signIn());
    signOutBtn?.addEventListener('click', () => this.google?.signOut());
    sheetsSyncBtn?.addEventListener('click', async () => {
      try {
        await this.google?.appendToSheet({
          date: new Date().toISOString().split('T')[0],
          totalSteps: this.totalSteps,
          totalSaplings: this.totalSaplings,
          co2Kg: this.totalSaplings * this.CO2_PER_SAPLING,
          weeklyKm: this.weeklyDistance
        });
        this.showNotification('Synced progress to Google Sheets', 'success');
      } catch (e) {
        console.error(e);
        this.showNotification('Sheets sync failed. Check settings/permissions.', 'error');
      }
    });
    calendarEventBtn?.addEventListener('click', async () => {
      try {
        const nextPlantingDate = this.google?.getNextSaturday();
        await this.google?.createCalendarEvent({
          title: 'Kilometree Planting Day',
          description: `Celebrating ${this.totalSaplings} saplings planted!`,
          start: nextPlantingDate,
          durationHours: 2
        });
        this.showNotification('Calendar event created', 'success');
      } catch (e) {
        console.error(e);
        this.showNotification('Calendar event failed. Check settings/permissions.', 'error');
      }
    });
    formSubmitBtn?.addEventListener('click', async () => {
      try {
        await this.google?.submitFormResponse({
          user: 'You',
          totalSaplings: this.totalSaplings,
          weeklyKm: this.weeklyDistance
        });
        this.showNotification('Form submitted', 'success');
      } catch (e) {
        console.error(e);
        this.showNotification('Form submission failed. Check settings/permissions.', 'error');
      }
    });
    lookerBtn?.addEventListener('click', () => this.google?.openLookerDashboard());
    youtubeUploadBtn?.addEventListener('click', async () => {
      try {
        const file = youtubeFileInput?.files?.[0];
        if (!file) {
          this.showNotification('Choose a video file first', 'warning');
          return;
        }
        await this.google?.uploadYouTubeVideo({
          file,
          title: 'Kilometree Campaign Video',
          description: `Auto-uploaded summary. Total saplings: ${this.totalSaplings}.`
        });
        this.showNotification('YouTube upload started', 'success');
      } catch (e) {
        console.error(e);
        this.showNotification('YouTube upload failed. Check settings/permissions.', 'error');
      }
    });
    
    // Fetch and display Google Fit data on load if enabled
    this.updateGoogleFitUI();
    if (this.googleFitEnabled && this.google?.isReady) {
      this.fetchGoogleFitStepsForToday();
    }
  }

  /**
   * Handles user login through Google OAuth
   */
  async handleLogin() {
    try {
      await this.google?.signIn();
      await this.loadUserProfile();
      this.updateAuthUI();
      this.showNotification('Successfully signed in!', 'success');
    } catch (error) {
      console.error('Login failed:', error);
      this.showNotification('Login failed. Please try again.', 'error');
    }
  }

  /**
   * Handles user logout
   */
  async handleLogout() {
    try {
      this.google?.signOut();
      this.clearUserProfile();
      this.updateAuthUI();
      this.showNotification('Successfully signed out!', 'info');
    } catch (error) {
      console.error('Logout failed:', error);
      this.showNotification('Logout failed. Please try again.', 'error');
    }
  }

  /**
   * Loads user profile information from Google
   */
  async loadUserProfile() {
    try {
      if (!this.google?.accessToken) return;
      
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${this.google.accessToken}`
        }
      });
      
      if (response.ok) {
        const userInfo = await response.json();
        this.userProfile = {
          id: userInfo.id,
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture
        };
        localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Clears user profile data
   */
  clearUserProfile() {
    this.userProfile = null;
    localStorage.removeItem('userProfile');
  }

  /**
   * Updates the authentication UI based on login status
   */
  updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const userProfile = document.getElementById('userProfile');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    
    // Sidebar user elements
    const sidebarUserAvatar = document.getElementById('sidebarUserAvatar');
    const sidebarUserName = document.getElementById('sidebarUserName');
    const sidebarUser = document.getElementById('sidebarUser');
    
    if (this.userProfile) {
      // User is logged in
      loginBtn?.classList.add('hidden');
      userProfile?.classList.remove('hidden');
      
      if (userAvatar) {
        userAvatar.src = this.userProfile.picture || '';
        userAvatar.alt = `${this.userProfile.name}'s avatar`;
      }
      
      if (userName) {
        userName.textContent = this.userProfile.name || this.userProfile.email || 'User';
      }
      
      // Update sidebar user info
      if (sidebarUserAvatar) {
        sidebarUserAvatar.src = this.userProfile.picture || '';
        sidebarUserAvatar.alt = `${this.userProfile.name}'s avatar`;
      }
      
      if (sidebarUserName) {
        sidebarUserName.textContent = this.userProfile.name || this.userProfile.email || 'User';
      }
      
      if (sidebarUser) {
        const userStatus = sidebarUser.querySelector('.user-status');
        if (userStatus) {
          userStatus.textContent = 'Signed in';
        }
      }
    } else {
      // User is not logged in
      loginBtn?.classList.remove('hidden');
      userProfile?.classList.add('hidden');
      
      // Reset sidebar user info
      if (sidebarUserAvatar) {
        sidebarUserAvatar.src = '';
        sidebarUserAvatar.alt = 'Guest User';
      }
      
      if (sidebarUserName) {
        sidebarUserName.textContent = 'Guest User';
      }
      
      if (sidebarUser) {
        const userStatus = sidebarUser.querySelector('.user-status');
        if (userStatus) {
          userStatus.textContent = 'Not signed in';
        }
      }
    }
  }

  /**
   * Reads settings modal inputs into a config object
   */
  readSettingsForm() {
    const get = (id) => document.getElementById(id)?.value ?? '';
    const cfg = {
      clientId: get('googleClientId'),
      apiKey: get('googleApiKey'),
      calendarId: get('googleCalendarId'),
      sheetId: get('googleSheetId'),
      formId: get('googleFormId'),
      formPrefillUrl: get('googleFormPrefillUrl'),
      lookerUrl: get('googleLookerUrl'),
      appsScriptWebAppUrl: get('appsScriptWebAppUrl'),
      autoSync: !!document.getElementById('autoSyncToggle')?.checked,
      // New: Google Fit toggle setting
      googleFitEnabled: !!document.getElementById('toggleGoogleFit')?.checked
    };
    return cfg;
  }
  
  /**
   * Toggles Google Fit integration on/off.
   * @param {boolean} enable - Whether to enable Google Fit.
   */
  toggleGoogleFit(enable) {
    this.googleFitEnabled = enable;
    localStorage.setItem('googleFitEnabled', enable.toString());
    this.updateGoogleFitUI();
    if (enable) {
      this.fetchGoogleFitStepsForToday();
      this.showNotification('Google Fit integration enabled.', 'success');
    } else {
      this.showNotification('Google Fit integration disabled. Using simulated steps.', 'info');
      // Optionally reset current steps if disabling Google Fit
      this.currentSteps = 0;
      this.updateCurrentDisplay();
      this.pauseTracking(); // Stop any active tracking
    }
  }
  
  /**
   * Updates UI elements related to Google Fit and manual input based on current state.
   */
  updateGoogleFitUI() {
    const googleFitSection = document.getElementById('googleFitSection');
    const manualInputSection = document.getElementById('manualInputSection');
    const toggleGoogleFitCheckbox = document.getElementById('toggleGoogleFit');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const googleSignOutBtn = document.getElementById('googleSignOutBtn');
    const trackerControls = document.querySelector('.tracker-controls');
    const trackerStatus = document.getElementById('trackerStatus');
    
    if (!googleFitSection || !manualInputSection || !toggleGoogleFitCheckbox) return;
    
    toggleGoogleFitCheckbox.checked = this.googleFitEnabled;
    
    if (this.googleFitEnabled) {
      googleFitSection.style.display = 'block';
      manualInputSection.style.display = 'none';
      trackerControls.style.display = 'none'; // Hide simulation controls
      trackerStatus.style.display = 'none';
      if (this.google?.isSignedIn) {
        googleSignInBtn.style.display = 'none';
        googleSignOutBtn.style.display = 'inline-flex';
      } else {
        googleSignInBtn.style.display = 'inline-flex';
        googleSignOutBtn.style.display = 'none';
      }
      // Always allow manual input if Google Fit is enabled but API access might not be ready
      document.getElementById('promptManualInputBtn').style.display = 'inline-flex';
    } else {
      googleFitSection.style.display = 'none';
      manualInputSection.style.display = 'flex'; // Show manual input for non-Google Fit
      trackerControls.style.display = 'flex'; // Show simulation controls
      trackerStatus.style.display = 'flex';
      googleSignInBtn.style.display = 'none';
      googleSignOutBtn.style.display = 'none';
      document.getElementById('promptManualInputBtn').style.display = 'none';
    }
    
    // Update "Start Tracking" button text based on mode
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) {
      startTrackingBtn.querySelector('span').textContent = this.googleFitEnabled ? 'Sync with Google Fit' : 'Start Tracking';
    }
  }
  
  /**
   * Fetches daily steps from Google Fit API.
   */
  async fetchGoogleFitStepsForToday() {
    if (!this.googleFitEnabled || !this.google?.isSignedIn) return;
    
    const today = new Date().toISOString().split('T')[0];
    try {
      this.updateTrackerStatus('Syncing with Google Fit...', 'tracking');
      const steps = await this.google?.getDailySteps(today);
      this.currentSteps = steps;
      this.updateCurrentDisplay();
      this.updateTrackerStatus(`Synced ${steps} steps from Google Fit`, 'success');
      this.showNotification(`Successfully synced ${steps} steps from Google Fit.`, 'success');
      
      // Immediately save if auto-sync is enabled
      this.saveSession();
    } catch (e) {
      console.error('Failed to fetch Google Fit steps:', e);
      this.showNotification('Failed to sync with Google Fit. Please sign in or check permissions.', 'error');
      this.updateTrackerStatus('Google Fit sync failed', 'error');
      // Fallback to manual input if Google Fit fails
      this.showManualInputModal('Google Fit data could not be fetched. Please enter your steps manually.');
    }
  }
  
  /**
   * Displays the modal for manual step input.
   * @param {string} [message] - Optional message to display in the modal.
   */
  showManualInputModal(message = '') {
    const modal = document.getElementById('manualInputModal');
    const messageEl = document.getElementById('manualInputMessage');
    if (modal && messageEl) {
      messageEl.textContent = message;
      modal.classList.add('active');
      // Pre-fill with currentSteps if it's from a failed Fit sync
      document.getElementById('manualStepInput').value = this.currentSteps > 0 ? this.currentSteps.toString() : '';
    }
  }
  
  /**
   * Saves manually entered steps and updates UI.
   */
  saveManualSteps() {
    const inputEl = document.getElementById('manualStepInput');
    const steps = parseInt(inputEl.value);
    if (isNaN(steps) || steps < 0) {
      this.showNotification('Please enter a valid number of steps.', 'error');
      return;
    }
    
    this.currentSteps = steps;
    this.updateCurrentDisplay();
    this.saveSession();
    document.getElementById('manualInputModal').classList.remove('active');
    this.showNotification(`Manually entered ${steps} steps.`, 'success');
  }
  
  /**
   * Starts the step tracking simulation.
   * Prevents multiple simulations from running concurrently.
   */
  startTracking() {
    if (this.googleFitEnabled) {
      this.fetchGoogleFitStepsForToday();
      return;
    }
    
    if (this.isTracking) return; // Prevent starting if already tracking
    
    this.isTracking = true;
    this.updateTrackerStatus('Tracking active', 'tracking');
    
    // Disable Start and enable Pause/Save buttons
    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('saveBtn').disabled = false;
    
    // Simulate steps at a set interval
    this.stepInterval = setInterval(() => {
      this.simulateSteps();
    }, 1000); // Simulate steps every second
    
    this.showNotification('Tracking started! Start moving to earn saplings.', 'success');
  }
  
  /**
   * Pauses the step tracking simulation.
   */
  pauseTracking() {
    if (!this.isTracking) return; // Only pause if currently tracking
    
    this.isTracking = false;
    this.updateTrackerStatus('Tracking paused', 'paused');
    
    // Enable Start and disable Pause button
    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    
    // Stop the step simulation interval
    if (this.stepInterval) {
      clearInterval(this.stepInterval);
      this.stepInterval = null;
    }
    
    this.showNotification('Tracking paused. Click start to continue.', 'warning');
  }
  
  /**
   * Saves the current session's accumulated steps, distance, and saplings
   * to overall totals and persists them in localStorage.
   */
  saveSession() {
    let stepsToSave = this.currentSteps; // Default to current steps
    
    if (this.googleFitEnabled && this.google?.isSignedIn) {
      // If Google Fit is enabled and signed in, stepsToSave should already be from Fit
      // No need for further action here, currentSteps is already updated by fetchGoogleFitStepsForToday
    } else if (this.useManualInput) {
      stepsToSave = this.manualSteps; // Use manual steps if enabled
    } else if (this.currentSteps === 0) {
      this.showNotification('No activity to save!', 'warning');
      return;
    }
    
    // Ensure currentSteps is updated for consistency before calculations
    this.currentSteps = stepsToSave;
    
    // Accumulate current session's data into total counts
    this.totalSteps += this.currentSteps;
    const sessionDistance = this.currentSteps * this.STEP_TO_KM;
    const sessionSaplings = Math.floor(sessionDistance); // 1 sapling per full kilometer
    this.totalSaplings += sessionSaplings;
    this.weeklyDistance += sessionDistance;
    
    // Update daily activity data for analytics chart
    const today = new Date().toISOString().split('T')[0];
    if (!this.dailyData[today]) {
      this.dailyData[today] = { steps: 0, distance: 0, saplings: 0 };
    }
    this.dailyData[today].steps += this.currentSteps;
    this.dailyData[today].distance += sessionDistance;
    this.dailyData[today].saplings += sessionSaplings;
    
    // Update activity streak
    this.updateStreak();
    
    // Persist all data to localStorage
    this.saveToStorage();
    
    // Reset current session counters if not using Google Fit (which provides daily totals)
    if (!this.googleFitEnabled) {
      this.currentSteps = 0;
      this.pauseTracking(); // Automatically pause after saving for simulation
    }
    
    // Update all UI elements with new total data
    this.updateUI();
    this.generateForest();
    this.updateChart();
    this.checkAchievements();
    
    this.showNotification(`Session saved! You earned ${sessionSaplings} saplings.`, 'success');
    
    // Reset tracker status and disable save button if not Google Fit
    if (!this.googleFitEnabled) {
      this.updateTrackerStatus('Ready to track', 'ready');
      document.getElementById('saveBtn').disabled = true;
    }
    
    // Auto sync with Google services if enabled
    try {
      this.google?.autoSyncOnSave?.({
        totalSteps: this.totalSteps,
        totalSaplings: this.totalSaplings,
        co2Kg: this.totalSaplings * this.CO2_PER_SAPLING,
        weeklyKm: this.weeklyDistance
      });
    } catch (e) {
      console.warn('Auto sync skipped', e);
    }
  }
  
  /**
   * Simulates step increments, updating live counts.
   */
  simulateSteps() {
    // Simulate realistic step increments (between 1 and 8 steps per second)
    const increment = Math.floor(Math.random() * 8) + 1;
    this.currentSteps += increment;
    this.updateCurrentDisplay();
  }
  
  /**
   * Updates the live display of current steps, distance, and saplings.
   */
  updateCurrentDisplay() {
    const distance = this.currentSteps * this.STEP_TO_KM;
    const saplings = Math.floor(distance);
    
    document.getElementById('currentSteps').textContent = this.currentSteps.toLocaleString();
    document.getElementById('currentDistance').textContent = distance.toFixed(2) + ' km';
    document.getElementById('currentSaplings').textContent = saplings.toString();
    
    // Also update the manual input field if the modal is open
    const manualInputEl = document.getElementById('manualStepInput');
    if (manualInputEl && document.getElementById('manualInputModal').classList.contains('active')) {
      manualInputEl.value = this.currentSteps.toString();
    }
  }
  
  /**
   * Updates the visual status of the activity tracker.
   * @param {string} message - The status message to display.
   * @param {string} type - The type of status (e.g., 'tracking', 'paused', 'ready').
   */
  updateTrackerStatus(message, type) {
    const statusEl = document.getElementById('trackerStatus');
    const statusDot = statusEl.querySelector('.status-dot');
    const statusText = statusEl.querySelector('span');
    
    if (!statusEl) return; // Defensive check
    
    statusText.textContent = message;
    
    // Update status dot color based on type
    statusDot.className = 'status-dot'; // Reset class before adding new ones
    if (type === 'tracking') {
      statusDot.style.backgroundColor = 'var(--success)';
    } else if (type === 'paused') {
      statusDot.style.backgroundColor = 'var(--warning)';
    } else if (type === 'error') {
      statusDot.style.backgroundColor = 'var(--error)';
    } else {
      statusDot.style.backgroundColor = 'var(--gray-400)';
    }
  }
  
  /**
   * Updates all primary UI elements with the latest aggregated data.
   */
  updateUI() {
    // Update main statistics display
    document.getElementById('totalStepsDisplay').textContent = this.totalSteps.toLocaleString();
    document.getElementById('totalSaplingsDisplay').textContent = this.totalSaplings.toLocaleString();
    document.getElementById('co2OffsetDisplay').textContent = (this.totalSaplings * this.CO2_PER_SAPLING).toFixed(0) + ' kg';
    document.getElementById('streakDisplay').textContent = this.streak.toString();
    
    // Update progress bars and charts
    this.updateMilestoneProgress();
    this.updateWeeklyChallenge();
    this.updateAnalytics();
    this.updateGoogleFitUI(); // Ensure correct UI is shown based on enabled status
    this.updateAuthUI(); // Update authentication UI
  }
  
  /**
   * Updates the progress bar and text for the next sapling milestone.
   */
  updateMilestoneProgress() {
    const milestones = [10, 25, 50, 100, 200, 500, 1000];
    // Determine the next milestone to aim for
    let nextMilestone = milestones.find(m => m > this.totalSaplings) || (Math.ceil(this.totalSaplings / 1000) + 1) * 1000;
    // Determine the previous milestone for accurate progress calculation
    let previousMilestone = milestones.filter(m => m <= this.totalSaplings).pop() || 0;
    
    // Calculate progress percentage
    const progress = ((this.totalSaplings - previousMilestone) / (nextMilestone - previousMilestone)) * 100;
    
    // Update DOM elements
    document.getElementById('milestoneProgress').style.width = Math.min(progress, 100) + '%';
    document.getElementById('progressText').textContent = `${this.totalSaplings} / ${nextMilestone} saplings`;
    document.getElementById('progressPercent').textContent = Math.floor(progress) + '%';
    
    // Update display for the next reward based on milestones
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
  
  /**
   * Updates the weekly challenge progress bar and related text.
   */
  updateWeeklyChallenge() {
    const progress = (this.weeklyDistance / this.WEEKLY_CHALLENGE_TARGET) * 100;
    document.getElementById('challengeProgress').style.width = Math.min(progress, 100) + '%';
    document.getElementById('challengeDistance').textContent = `${this.weeklyDistance.toFixed(1)} / ${this.WEEKLY_CHALLENGE_TARGET.toFixed(1)} km`;
    
    // Calculate and display days left in the current week
    const now = new Date();
    const daysUntilSunday = (7 - now.getDay()) % 7; // Days until next Sunday (0 for Sunday, 1 for Monday, etc.)
    document.getElementById('challengeTimeLeft').textContent = daysUntilSunday === 0 ? 'Last day!' : `${daysUntilSunday} days left`;
  }
  
  /**
   * Updates the environmental impact and community rank analytics displays.
   */
  updateAnalytics() {
    document.getElementById('totalTreesAnalytics').textContent = this.totalSaplings.toLocaleString();
    document.getElementById('co2SavedAnalytics').textContent = (this.totalSaplings * this.CO2_PER_SAPLING).toFixed(0) + ' kg';
    
    // Simulate community rank. In a real app, this would be dynamic from a backend.
    const rank = Math.max(1, Math.floor(Math.random() * 50) + 1);
    document.getElementById('communityRankAnalytics').textContent = `#${rank}`;
  }
  
  /**
   * Generates a set of floating tree emojis for the hero section background.
   */
  generateHeroTrees() {
    const heroTrees = document.getElementById('heroTrees');
    const treeEmojis = ['🌲', '🌳', '🌴', '🌿', '🌱', '🍃'];
    
    // Clear any existing trees before generating new ones
    if (heroTrees) heroTrees.innerHTML = '';

    for (let i = 0; i < 12; i++) {
      const tree = document.createElement('div');
      tree.className = 'tree';
      tree.textContent = treeEmojis[Math.floor(Math.random() * treeEmojis.length)];
      tree.style.setProperty('--i', i); // Custom property for animation delay
      heroTrees.appendChild(tree);
    }
  }
  
  /**
   * Renders the virtual forest grid based on the total number of saplings.
   * Displays up to 100 trees, then indicates additional trees.
   */
  generateForest() {
    const forestGrid = document.getElementById('forestGrid');
    if (!forestGrid) return; // Exit if the forest grid container is not found

    forestGrid.innerHTML = ''; // Clear existing trees in the grid
    
    // Display a message if no saplings have been earned yet
    if (this.totalSaplings === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'Start tracking to grow your forest!';
      emptyMessage.style.color = 'var(--gray-500)';
      emptyMessage.style.fontSize = 'var(--font-size-lg)';
      forestGrid.appendChild(emptyMessage);
      return;
    }
    
    const maxTrees = Math.min(this.totalSaplings, 100); // Limit display to 100 trees for visual performance
    const treeTypes = ['<i class="fas fa-tree"></i>', '<i class="fas fa-leaf"></i>', '<i class="fas fa-seedling"></i>'];
    
    for (let i = 0; i < maxTrees; i++) {
      const tree = document.createElement('div');
      tree.className = 'forest-tree';
      tree.innerHTML = treeTypes[i % treeTypes.length]; // Cycle through tree icons
      tree.style.animationDelay = `${i * 0.05}s`; // Stagger animation for a dynamic effect
      forestGrid.appendChild(tree);
    }
    
    // Show count of additional trees if more than maxTrees have been earned
    if (this.totalSaplings > 100) {
      const moreText = document.createElement('div');
      moreText.textContent = `+${this.totalSaplings - 100} more trees`;
      moreText.style.color = 'var(--primary-dark)';
      moreText.style.fontWeight = '600';
      moreText.style.fontSize = 'var(--font-size-lg)';
      forestGrid.appendChild(moreText);
    }
  }
  
  /**
   * Updates and renders the leaderboard based on the specified filter.
   * @param {string} filter - The leaderboard filter (e.g., 'weekly', 'monthly', 'alltime').
   */
  updateLeaderboard(filter = 'alltime') {
    let currentLeaderboardData = this.leaderboard[filter];

    // Update the 'You' entry with the current user's total saplings for the 'alltime' view
    if (filter === 'alltime') {
      const you = currentLeaderboardData.find(p => p.isCurrentUser);
      if (you) {
        you.saplings = this.totalSaplings;
      } else {
        // Add 'You' to the leaderboard if not present (should ideally be done once)
        currentLeaderboardData.push({ name: 'You', saplings: this.totalSaplings, avatar: '🌱', change: '+0', isCurrentUser: true });
      }
    }
    
    // Sort leaderboard data by saplings in descending order
    currentLeaderboardData.sort((a, b) => b.saplings - a.saplings);
    
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return; // Exit if leaderboard container is not found

    leaderboardList.innerHTML = ''; // Clear existing leaderboard entries
    
    // Render each player in the leaderboard
    currentLeaderboardData.forEach((user, index) => {
      const item = document.createElement('div');
      // Add 'current-user' class for distinct styling of the current user's entry
      item.className = `leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`;
      
      // Determine rank class and emoji for top players
      const rankClass = index < 3 ? 'top-3' : '';
      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      
      item.innerHTML = `
        <div class="leaderboard-rank ${rankClass}">
          ${rankEmoji || (index + 1)} <!-- Display emoji for top 3, else number rank -->
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
  
  /**
   * Handles filtering the leaderboard based on the selected criteria.
   * @param {string} filter - The filter criterion (e.g., 'weekly', 'monthly', 'alltime').
   */
  filterLeaderboard(filter) {
    // Update active state of filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    this.updateLeaderboard(filter); // Re-render leaderboard with the new filter
    this.showNotification(`Showing ${filter} leaderboard`, 'success');
  }
  
  /**
   * Initializes the Chart.js instance for daily activity analytics.
   */
  initChart() {
    const ctx = document.getElementById('dailyChart');
    if (!ctx) return; // Exit if chart canvas is not found
    
    // Prepare data for the last 7 days from stored daily data
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
    
    // Create new Chart.js instance
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
            yAxisID: 'y' // Primary Y-axis for steps
          },
          {
            label: 'Saplings',
            data: last7Days.map(d => d.saplings),
            backgroundColor: 'rgba(251, 191, 36, 0.5)',
            borderColor: 'rgba(251, 191, 36, 1)',
            borderWidth: 2,
            yAxisID: 'y1' // Secondary Y-axis for saplings
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
              drawOnChartArea: false // Prevent grid lines from secondary axis
            },
            title: {
              display: true,
              text: 'Saplings'
            }
          }
        },
        plugins: {
          legend: {
            display: true // Show dataset legend
          }
        }
      }
    });
  }
  
  /**
   * Updates the existing Chart.js instance with new daily data.
   */
  updateChart() {
    if (!this.chart) return; // Exit if chart is not initialized
    
    // Re-prepare data for the last 7 days (or actual dynamic range)
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
    
    // Update chart data and redraw
    this.chart.data.labels = last7Days.map(d => d.date);
    this.chart.data.datasets[0].data = last7Days.map(d => d.steps);
    this.chart.data.datasets[1].data = last7Days.map(d => d.saplings);
    this.chart.update();
  }
  
  /**
   * Updates the user's consecutive day streak.
   */
  updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // If last activity was yesterday, increment streak. Else, reset or start new.
    if (this.lastActiveDate === yesterdayStr) {
      this.streak += 1;
    } else if (this.lastActiveDate !== today) {
      this.streak = 1; // Start a new streak if no activity today or yesterday
    }
    
    this.lastActiveDate = today; // Update last active date to today
  }
  
  /**
   * Checks if a new week has started and resets the weekly distance challenge.
   */
  checkWeeklyReset() {
    const lastReset = localStorage.getItem('lastWeeklyReset');
    const now = new Date();
    const currentWeek = this.getWeekNumber(now);
    
    // If no previous reset or if the current week is different, reset weekly distance
    if (!lastReset || parseInt(lastReset) !== currentWeek) {
      this.weeklyDistance = 0;
      localStorage.setItem('lastWeeklyReset', currentWeek.toString());
      this.saveToStorage(); // Persist the reset
    }
  }
  
  /**
   * Calculates the week number for a given date (ISO 8601 compliant).
   * @param {Date} date - The date object to calculate week number for.
   * @returns {number} The week number.
   */
  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    // Calculate days passed since the start of the year
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000; // milliseconds in a day
    // Calculate week number. +1 handles 0-indexed days and ensures week starts from 1.
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }
  
  /**
   * Updates the display for achievement badges and progress.
   */
  updateAchievements() {
    // Define achievement thresholds and display properties
    const achievements = [
      { id: 'bronze', threshold: 10, icon: '<i class="fas fa-medal"></i>', title: 'Bronze Planter' },
      { id: 'silver', threshold: 25, icon: '<i class="fas fa-medal"></i>', title: 'Silver Planter' },
      { id: 'gold', threshold: 50, icon: '<i class="fas fa-medal"></i>', title: 'Gold Planter' },
      { id: 'platinum', threshold: 100, icon: '<i class="fas fa-medal"></i>', title: 'Platinum Planter' }
    ];
    
    achievements.forEach(achievement => {
      // Calculate progress towards each achievement
      const progress = Math.min((this.totalSaplings / achievement.threshold) * 100, 100);
      const progressEl = document.getElementById(`${achievement.id}Progress`);
      const textEl = document.getElementById(`${achievement.id}Text`);
      const statusEl = document.getElementById(`${achievement.id}Status`);
      const cardEl = document.querySelector(`[data-achievement="${achievement.id}"]`);
      
      // Update progress bar and text
      if (progressEl) progressEl.style.width = progress + '%';
      if (textEl) textEl.textContent = `${this.totalSaplings} / ${achievement.threshold}`;
      
      // Update achievement status (locked/unlocked) and card styling
      if (this.totalSaplings >= achievement.threshold) {
        if (statusEl) statusEl.textContent = '✅'; // Unlocked icon
        if (cardEl) cardEl.classList.add('unlocked');
      } else {
        if (statusEl) statusEl.textContent = '🔒'; // Locked icon
        if (cardEl) cardEl.classList.remove('unlocked');
      }
    });
  }
  
  /**
   * Checks for newly unlocked achievements and displays a modal notification.
   */
  checkAchievements() {
    // Full definition of achievements including descriptions for modal
    const achievements = [
      { id: 'bronze', threshold: 10, icon: '<i class="fas fa-medal"></i>', title: 'Bronze Planter', description: 'Planted your first 10 saplings!' },
      { id: 'silver', threshold: 25, icon: '<i class="fas fa-medal"></i>', title: 'Silver Planter', description: 'Reached 25 saplings milestone!' },
      { id: 'gold', threshold: 50, icon: '<i class="fas fa-medal"></i>', title: 'Gold Planter', description: 'Amazing! 50 saplings planted!' },
      { id: 'platinum', threshold: 100, icon: '<i class="fas fa-medal"></i>', title: 'Platinum Planter', description: 'Incredible! 100 saplings achieved!' }
    ];
    
    achievements.forEach(achievement => {
      // Check if achievement is unlocked and not already recorded as unlocked
      if (this.totalSaplings >= achievement.threshold && !this.achievements[achievement.id]) {
        this.achievements[achievement.id] = true; // Mark as unlocked
        this.showAchievementModal(achievement); // Display achievement modal
        this.saveToStorage(); // Persist unlocked achievement
      }
    });
    
    this.updateAchievements(); // Update achievement display regardless of new unlocks
  }
  
  /**
   * Displays a modal for an unlocked achievement.
   * @param {object} achievement - The achievement object to display.
   */
  showAchievementModal(achievement) {
    const modal = document.getElementById('achievementModal');
    const icon = document.getElementById('achievementIcon');
    const title = document.getElementById('achievementTitle');
    const description = document.getElementById('achievementDescription');
    
    // Populate modal content
    icon.innerHTML = achievement.icon; // Use innerHTML for Font Awesome icon
    title.textContent = achievement.title;
    description.textContent = achievement.description;
    
    modal.classList.add('active'); // Show the modal
    
    // Automatically close the modal after 5 seconds
    setTimeout(() => {
      this.closeAchievementModal();
    }, 5000);
  }
  
  /**
   * Closes the achievement modal.
   */
  closeAchievementModal() {
    document.getElementById('achievementModal').classList.remove('active');
  }
  
  /**
   * Displays a transient notification message to the user.
   * @param {string} message - The message to display.
   * @param {string} type - The type of notification (e.g., 'success', 'warning', 'error').
   */
  showNotification(message, type = 'success') {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    // Automatically remove the notification after 4 seconds
    setTimeout(() => {
      notification.remove();
    }, 4000);
  }

  /**
   * Handles the donation process (simulated).
   * In a real application, this would integrate with a payment gateway.
   */
  handleDonation() {
    const donationAmountSelect = document.getElementById('donationAmount');
    const amount = donationAmountSelect.value;
    
    this.showNotification(`Thank you for your generous donation of ₱${amount}! Every tree counts.`, 'success');
  }

  /**
   * Generates and displays event cards in the Upcoming Events section.
   */
  generateEvents() {
    const eventsGrid = document.getElementById('eventsGrid');
    if (!eventsGrid) return; // Exit if the events grid container is not found

    eventsGrid.innerHTML = ''; // Clear any existing event cards

    this.events.forEach(event => {
      const eventCard = document.createElement('div');
      eventCard.className = 'event-card';
      eventCard.innerHTML = `
        ${event.imageUrl ? `<img src="${event.imageUrl}" alt="${event.title}" class="event-card-image" />` : `<div class="event-card-image event-placeholder"><i class="fas fa-image"></i></div>`}
        <div class="event-card-content">
          <div class="event-date-time">
            <span class="event-date">${event.date}</span>
            <span class="event-time">${event.time}</span>
          </div>
          <h3 class="event-title">${event.title}</h3>
          <p class="event-description">${event.description}</p>
          ${event.youtubeEmbedUrl ? this.handleYouTubeEmbed(event.youtubeEmbedUrl) : ''}
          <div class="event-details">
            <span class="event-location">
              <i class="fas fa-map-marker-alt"></i>
              ${event.location}
            </span>
            <a href="${event.link}" class="event-link" target="_blank" rel="noopener noreferrer">${event.linkText}</a>
          </div>
        </div>
      `;
      eventsGrid.appendChild(eventCard);
    });
  }
  
  /**
   * Handles potential YouTube video embedding issues by showing an alert or fallback. (This function is new)
   */
  handleYouTubeEmbed(embedUrl) {
    if (!embedUrl) {
      this.showNotification('YouTube video is unavailable or invalid.', 'warning');
      return `<div class="youtube-fallback"><i class="fab fa-youtube"></i> Video Unavailable</div>`;
    } else if (!embedUrl.includes('youtube.com/embed/')) {
      this.showNotification('Invalid YouTube embed URL.', 'warning');
      return `<div class="youtube-fallback"><i class="fab fa-youtube"></i> Invalid Video URL</div>`;
    }
    return `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="youtube-embed"></iframe>`;
  }

  // Google Tools Methods
  toggleGoogleTool(toolName) {
    const toggle = document.getElementById(`${toolName}Toggle`);
    if (toggle) {
      toggle.classList.toggle('active');
      const isActive = toggle.classList.contains('active');
      
      // Store the state
      localStorage.setItem(`googleTool_${toolName}`, isActive.toString());
      
      // Show notification
      this.showNotification(`${toolName.charAt(0).toUpperCase() + toolName.slice(1)} ${isActive ? 'enabled' : 'disabled'}`, 'success');
    }
  }

  async openGoogleAnalytics() {
    try {
      if (!this.google) {
        this.showNotification('Please sign in to Google first', 'warning');
        return;
      }
      
      // Open Google Analytics or Looker Studio dashboard
      const config = this.readSettingsForm();
      if (config.lookerUrl) {
        window.open(config.lookerUrl, '_blank');
      } else {
        this.showNotification('Analytics dashboard URL not configured', 'warning');
      }
    } catch (error) {
      console.error('Error opening analytics:', error);
      this.showNotification('Failed to open analytics', 'error');
    }
  }

  async createGoogleCalendarEvent() {
    try {
      if (!this.google) {
        this.showNotification('Please sign in to Google first', 'warning');
        return;
      }
      
      const eventTitle = 'Kilometree Activity Session';
      const eventDescription = `Completed ${this.totalSteps} steps and planted ${this.totalSaplings} trees!`;
      const startTime = new Date();
      
      await this.google.createCalendarEvent({
        title: eventTitle,
        description: eventDescription,
        start: startTime,
        durationHours: 1
      });
      
      this.showNotification('Calendar event created successfully!', 'success');
    } catch (error) {
      console.error('Error creating calendar event:', error);
      this.showNotification('Failed to create calendar event', 'error');
    }
  }

  async syncToGoogleSheets() {
    try {
      if (!this.google) {
        this.showNotification('Please sign in to Google first', 'warning');
        return;
      }
      
      const today = new Date().toISOString().split('T')[0];
      const co2Kg = Math.round((this.totalSteps * 0.00004) * 100) / 100;
      const weeklyKm = Math.round((this.weeklyDistance * 100) / 100);
      
      await this.google.appendToSheet({
        date: today,
        totalSteps: this.totalSteps,
        totalSaplings: this.totalSaplings,
        co2Kg: co2Kg,
        weeklyKm: weeklyKm
      });
      
      this.showNotification('Data synced to Google Sheets!', 'success');
    } catch (error) {
      console.error('Error syncing to sheets:', error);
      this.showNotification('Failed to sync to Google Sheets', 'error');
    }
  }

  async uploadYouTubeVideo(file) {
    try {
      if (!this.google) {
        this.showNotification('Please sign in to Google first', 'warning');
        return;
      }
      
      const title = `Kilometree Journey - ${new Date().toLocaleDateString()}`;
      const description = `My environmental impact journey with Kilometree! Steps: ${this.totalSteps}, Trees planted: ${this.totalSaplings}`;
      
      await this.google.uploadYouTubeVideo({
        file: file,
        title: title,
        description: description
      });
      
      this.showNotification('Video uploaded to YouTube successfully!', 'success');
    } catch (error) {
      console.error('Error uploading video:', error);
      this.showNotification('Failed to upload video', 'error');
    }
  }

  async submitGoogleForm() {
    try {
      if (!this.google) {
        this.showNotification('Please sign in to Google first', 'warning');
        return;
      }
      
      const userName = this.userProfile?.name || 'Anonymous User';
      const weeklyKm = Math.round((this.weeklyDistance * 100) / 100);
      
      await this.google.submitFormResponse({
        user: userName,
        totalSaplings: this.totalSaplings,
        weeklyKm: weeklyKm
      });
      
      this.showNotification('Feedback submitted successfully!', 'success');
    } catch (error) {
      console.error('Error submitting form:', error);
      this.showNotification('Failed to submit feedback', 'error');
    }
  }

  // Initialize Google Tools UI
  initializeGoogleTools() {
    // Restore toggle states from localStorage
    const tools = ['googleFit', 'analytics', 'calendar', 'sheets', 'youtube', 'forms'];
    tools.forEach(tool => {
      const isActive = localStorage.getItem(`googleTool_${tool}`) === 'true';
      const toggle = document.getElementById(`${tool}Toggle`);
      if (toggle && isActive) {
        toggle.classList.add('active');
      }
    });
  }
  
  /**
   * Saves all relevant application state data to localStorage.
   */
  saveToStorage() {
    localStorage.setItem('totalSteps', this.totalSteps.toString());
    localStorage.setItem('totalSaplings', this.totalSaplings.toString());
    localStorage.setItem('streak', this.streak.toString());
    localStorage.setItem('lastActiveDate', this.lastActiveDate || '');
    localStorage.setItem('weeklyDistance', this.weeklyDistance.toString());
    localStorage.setItem('dailyData', JSON.stringify(this.dailyData));
    localStorage.setItem('achievements', JSON.stringify(this.achievements));
    localStorage.setItem('googleFitEnabled', this.googleFitEnabled.toString());
    localStorage.setItem('useManualInput', this.useManualInput.toString());
    
    // Save user profile if available
    if (this.userProfile) {
      localStorage.setItem('userProfile', JSON.stringify(this.userProfile));
    }
  }
}

// Initialize the Kilometree application once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
  console.log('Kilometree app initializing...');
  new KilometreeApp();
});