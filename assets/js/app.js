// Kilometree prototype JavaScript
//
// This simplified script simulates a pedometer, converts steps
// into kilometres and saplings, updates progress indicators and
// totals.  It deliberately avoids external dependencies and
// localStorage for reliability when running from a file:// URL.

(function () {
  // Configuration
  const STEP_INTERVAL_MS = 800;      // interval between simulated step increments
  const STEP_LENGTH_KM  = 0.0008;    // approximate kilometres per step
  const MILESTONES      = [10, 25, 50, 100, 200];

  // DOM elements
  const stepCountEl       = document.getElementById('stepCount');
  const kmCountEl         = document.getElementById('kmCount');
  const saplingCountEl    = document.getElementById('saplingCount');
  const progressBarEl     = document.getElementById('saplingProgressBar');
  const milestoneLabelEl  = document.getElementById('milestoneLabel');
  const totalStepsEl      = document.getElementById('totalSteps');
  const totalKmEl         = document.getElementById('totalKilometers');
  const totalSaplingsEl   = document.getElementById('totalSaplings');
  const saplingsPlantedEl = document.getElementById('saplingsPlanted');
  const distanceCoveredEl = document.getElementById('distanceCovered');
  const daysStreakEl      = document.getElementById('daysStreak');
  const startBtnEl        = document.getElementById('startButton');
  const stopBtnEl         = document.getElementById('stopButton');
  const resetBtnEl        = document.getElementById('resetButton');

  // Achievement badge elements
  const badgeBronzeEl   = document.getElementById('badgeBronze');
  const badgeSilverEl   = document.getElementById('badgeSilver');
  const badgeGoldEl     = document.getElementById('badgeGold');
  const badgePlatinumEl = document.getElementById('badgePlatinum');
  // Leaderboard element
  const leaderboardBodyEl = document.getElementById('leaderboardBody');
  // Carbon impact elements
  const co2OffsetEl     = document.getElementById('co2Offset');
  const co2ProgressBarEl= document.getElementById('co2ProgressBar');
  const co2GoalLabelEl  = document.getElementById('co2GoalLabel');
  // Challenge elements
  const challengeDistanceEl = document.getElementById('challengeDistance');
  const challengeProgressBarEl = document.getElementById('challengeProgressBar');
  const challengeLabelEl = document.getElementById('challengeLabel');

  // State variables
  let liveSteps = 0;
  let liveKilometres = 0;
  let liveSaplings = 0;
  let totalSteps = 0;
  let totalKilometres = 0;
  let totalSaplings = 0;
  let daysStreak = 0;
  let simulationInterval = null;
  let lastActivityDate = null;

  // Constants for extra features
  const CO2_PER_TREE   = 22; // kg CO₂ absorbed per tree per year (approx)
  const CO2_GOAL       = 1000; // kg goal for progress bar
  const CHALLENGE_DISTANCE = 10; // km weekly challenge

  // Data structure for analytics; stores per-date totals
  const dailyData = {};

  // Chart.js instance
  let analyticsChart = null;

  // Simple in-memory leaderboard; will be sorted by saplings desc
  let leaderboard = [
    { name: 'Alex', saplings: 20 },
    { name: 'Sam', saplings: 15 },
    { name: 'Taylor', saplings: 5 }
  ];

  // Helper to update leaderboard UI
  function updateLeaderboard() {
    // ensure current user entry exists and update
    const you = leaderboard.find(p => p.name === 'You');
    if (you) {
      you.saplings = totalSaplings;
    } else {
      leaderboard.push({ name: 'You', saplings: totalSaplings });
    }
    // sort descending
    leaderboard.sort((a, b) => b.saplings - a.saplings);
    // rebuild table
    leaderboardBodyEl.innerHTML = '';
    leaderboard.forEach((player, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `<th scope="row">${index + 1}</th><td>${player.name}</td><td>${player.saplings}</td>`;
      leaderboardBodyEl.appendChild(row);
    });
  }

  // Determine the next milestone threshold based on saplings earned
  function nextMilestone(currentSaplings) {
    for (const m of MILESTONES) {
      if (currentSaplings < m) return m;
    }
    // Beyond highest milestone: increment in steps equal to last milestone
    const last = MILESTONES[MILESTONES.length - 1];
    return Math.ceil(currentSaplings / last + 1) * last;
  }

  // Update the display for live counts and totals
  function updateUI() {
    // Live counts
    stepCountEl.textContent    = liveSteps.toLocaleString();
    kmCountEl.textContent      = liveKilometres.toFixed(2) + ' km';
    saplingCountEl.textContent = liveSaplings + ' sapling' + (liveSaplings !== 1 ? 's' : '');

    // Progress bar
    const milestone = nextMilestone(liveSaplings);
    const progress  = (liveSaplings / milestone) * 100;
    progressBarEl.style.width = Math.min(progress, 100) + '%';
    milestoneLabelEl.textContent = `${liveSaplings} / ${milestone} saplings`;

    // Totals
    totalStepsEl.textContent      = totalSteps.toLocaleString();
    totalKmEl.textContent         = totalKilometres.toFixed(2);
    totalSaplingsEl.textContent   = totalSaplings.toLocaleString();
    saplingsPlantedEl.textContent = totalSaplings.toLocaleString();
    distanceCoveredEl.textContent = totalKilometres.toFixed(2) + ' km';
    daysStreakEl.textContent      = daysStreak;

    // Achievements badges
    badgeBronzeEl.textContent   = totalSaplings >= 10 ? '✓' : '0';
    badgeSilverEl.textContent   = totalSaplings >= 25 ? '✓' : '0';
    badgeGoldEl.textContent     = totalSaplings >= 50 ? '✓' : '0';
    badgePlatinumEl.textContent = totalSaplings >= 100 ? '✓' : '0';

    // Carbon impact calculation
    const co2 = totalSaplings * CO2_PER_TREE;
    co2OffsetEl.textContent    = co2.toFixed(0) + ' kg';
    const co2Progress = Math.min((co2 / CO2_GOAL) * 100, 100);
    co2ProgressBarEl.style.width = co2Progress + '%';
    co2GoalLabelEl.textContent = `${co2.toFixed(0)} / ${CO2_GOAL} kg goal`;

    // Challenge progress
    const challengeProgress = totalKilometres % CHALLENGE_DISTANCE;
    challengeDistanceEl.textContent = CHALLENGE_DISTANCE + ' km';
    const challengePercent = Math.min((challengeProgress / CHALLENGE_DISTANCE) * 100, 100);
    challengeProgressBarEl.style.width = challengePercent + '%';
    challengeLabelEl.textContent = `${challengeProgress.toFixed(2)} / ${CHALLENGE_DISTANCE} km`;

    // Update leaderboard
    updateLeaderboard();

    // Update virtual forest
    updateForest();
  }

  // Simulate steps being taken
  function simulateStep() {
    const stepIncrement = Math.floor(Math.random() * 5) + 1; // between 1 and 5 steps
    liveSteps += stepIncrement;
    liveKilometres = liveSteps * STEP_LENGTH_KM;
    liveSaplings   = Math.floor(liveKilometres); // 1 sapling per full kilometre
    updateUI();
  }

  // Start the simulation if not already running
  function startSimulation() {
    if (simulationInterval) return;
    simulationInterval = setInterval(simulateStep, STEP_INTERVAL_MS);
  }

  // Stop the simulation
  function stopSimulation() {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      simulationInterval = null;
    }
  }

  // Reset live counters and accumulate them into totals
  function resetCounters() {
    if (liveSteps === 0) return;
    // Update totals
    totalSteps      += liveSteps;
    totalKilometres += liveKilometres;
    totalSaplings   += liveSaplings;
    // Update streak: increment if a day of activity passes continuously
    const today = new Date().toISOString().slice(0, 10);
    if (lastActivityDate === today) {
      // already recorded activity today
    } else if (lastActivityDate) {
      // compare date difference
      const last = new Date(lastActivityDate);
      const diff = (new Date(today) - last) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        daysStreak += 1;
      } else {
        daysStreak = 1;
      }
    } else {
      daysStreak = 1;
    }
    lastActivityDate = today;
    // Before clearing, update analytics data with current session
    updateAnalytics();
    // Reset live values
    liveSteps = 0;
    liveKilometres = 0;
    liveSaplings = 0;
    updateUI();
  }

  // Attach event listeners
  startBtnEl.addEventListener('click', startSimulation);
  stopBtnEl.addEventListener('click', stopSimulation);
  resetBtnEl.addEventListener('click', resetCounters);

  // Donation button listener
  const donateBtn = document.getElementById('donateButton');
  const donationAmountSelect = document.getElementById('donationAmount');
  if (donateBtn && donationAmountSelect) {
    donateBtn.addEventListener('click', () => {
      const amount = donationAmountSelect.value;
      alert(`Thank you for donating ₱${amount}!\nYour generosity helps plant more trees.`);
    });
  }

  // Build the virtual forest based on total saplings
  function updateForest() {
    const container = document.getElementById('forestGrid');
    if (!container) return;
    // remove existing
    container.innerHTML = '';
    const maxTrees = 100;
    const numTrees = Math.min(totalSaplings, maxTrees);
    for (let i = 0; i < numTrees; i++) {
      const icon = document.createElement('i');
      icon.className = 'fas fa-tree';
      container.appendChild(icon);
    }
    if (totalSaplings > maxTrees) {
      const more = document.createElement('span');
      more.className = 'ms-2 fw-bold';
      more.textContent = `+${totalSaplings - maxTrees} more`;
      container.appendChild(more);
    }
  }

  // Populate or update analytics chart
  function updateAnalytics() {
    // accumulate daily totals
    const today = new Date().toISOString().slice(0, 10);
    if (!dailyData[today]) {
      dailyData[today] = { km: 0, saplings: 0 };
    }
    dailyData[today].km += liveKilometres;
    dailyData[today].saplings += liveSaplings;
    // Build arrays sorted by date
    const dates = Object.keys(dailyData).sort();
    const kmData = dates.map(d => parseFloat(dailyData[d].km.toFixed(2)));
    const saplingData = dates.map(d => dailyData[d].saplings);
    // If chart not created, create it
    const ctx = document.getElementById('analyticsChart');
    if (!ctx) return;
    if (!analyticsChart) {
      analyticsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Distance (km)',
              data: kmData,
              backgroundColor: 'rgba(76, 175, 80, 0.5)',
              borderColor: 'rgba(76, 175, 80, 1)',
              borderWidth: 1,
              yAxisID: 'y',
            },
            {
              label: 'Saplings',
              data: saplingData,
              backgroundColor: 'rgba(255, 193, 7, 0.5)',
              borderColor: 'rgba(255, 193, 7, 1)',
              borderWidth: 1,
              yAxisID: 'y1',
            },
          ],
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
                text: 'Distance (km)',
              },
            },
            y1: {
              type: 'linear',
              position: 'right',
              grid: {
                drawOnChartArea: false,
              },
              title: {
                display: true,
                text: 'Saplings',
              },
            },
          },
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });
    } else {
      analyticsChart.data.labels = dates;
      analyticsChart.data.datasets[0].data = kmData;
      analyticsChart.data.datasets[1].data = saplingData;
      analyticsChart.update();
    }
  }


  // Initialize when page resources have finished loading
  window.addEventListener('load', () => {
    updateUI();
  });
})();
