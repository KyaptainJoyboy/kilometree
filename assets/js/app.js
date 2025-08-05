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
  const resetBtnEl        = document.getElementById('resetButton');

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
  }

  // Simulate steps being taken
  function simulateStep() {
    const stepIncrement = Math.floor(Math.random() * 3) + 1; // between 1 and 3 steps
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
    // Reset live values
    liveSteps = 0;
    liveKilometres = 0;
    liveSaplings = 0;
    updateUI();
  }

  // Attach event listeners
  resetBtnEl.addEventListener('click', () => {
    resetCounters();
  });

  // Initialize when page resources have finished loading
  window.addEventListener('load', () => {
    updateUI();
    startSimulation();
  });
})();