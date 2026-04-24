// mini-game-integration.js - STARS Keyboard Mini-Game Integration
// Extends STARS interface with active request queue and scoring for ATC training

/**
 * STARS Mini-Game Interface Extension
 * Adds active request display, scoring interface, and game controls
 */
class STARSMiniGameInterface {
  constructor() {
    this.isGameMode = false;
    this.activeRequests = new Map(); // requestId -> request data
    this.gameController = null;
    this.currentScore = 0;
    this.sessionStats = null;
    
    // UI elements
    this.elements = {
      gamePanel: null,
      requestQueue: null,
      scoreDisplay: null,
      timerDisplay: null,
      gameControls: null
    };
    
    // Event listeners
    this.eventListeners = new Map();
    
    console.log('🎮 STARS Mini-Game Interface initialized');
  }

  /**
   * Initialize mini-game interface
   */
  initialize() {
    this.createGameInterface();
    this.setupEventHandlers();
    this.setupKeyboardShortcuts();
    
    console.log('✅ Mini-game interface ready');
  }

  /**
   * Create game interface elements
   */
  createGameInterface() {
    // Create mini-game panel
    const gamePanel = document.createElement('div');
    gamePanel.id = 'mini-game-panel';
    gamePanel.className = 'mini-game-panel hidden';
    gamePanel.innerHTML = this.getGamePanelHTML();
    
    // Insert after main keyboard
    const keyboardContainer = document.querySelector('.keyboard-container') || document.body;
    keyboardContainer.parentNode.insertBefore(gamePanel, keyboardContainer.nextSibling);
    
    // Cache element references
    this.elements.gamePanel = gamePanel;
    this.elements.requestQueue = gamePanel.querySelector('#request-queue');
    this.elements.scoreDisplay = gamePanel.querySelector('#score-display');
    this.elements.timerDisplay = gamePanel.querySelector('#timer-display');
    this.elements.gameControls = gamePanel.querySelector('#game-controls');
    
    // Add CSS styles
    this.addGameStyles();
  }

  /**
   * Get HTML for game panel
   */
  getGamePanelHTML() {
    return `
      <div class="game-header">
        <h3>🎯 ATC Training Mini-Game</h3>
        <div class="game-status">
          <span id="timer-display" class="timer">00:00</span>
          <span id="score-display" class="score">Score: 0</span>
        </div>
      </div>
      
      <div class="game-content">
        <div class="request-queue-container">
          <h4>📻 Active Pilot Requests</h4>
          <div id="request-queue" class="request-queue">
            <div class="queue-empty">No active requests</div>
          </div>
        </div>
        
        <div class="performance-panel">
          <h4>📊 Performance</h4>
          <div id="performance-stats">
            <div class="stat">
              <span class="stat-label">Response Time:</span>
              <span class="stat-value" id="avg-response-time">--</span>
            </div>
            <div class="stat">
              <span class="stat-label">Accuracy:</span>
              <span class="stat-value" id="accuracy-score">--%</span>
            </div>
            <div class="stat">
              <span class="stat-label">Concurrent:</span>
              <span class="stat-value" id="concurrent-count">0</span>
            </div>
          </div>
        </div>
      </div>
      
      <div id="game-controls" class="game-controls">
        <button id="start-game" class="btn btn-primary">Start Training</button>
        <button id="pause-game" class="btn btn-secondary hidden">Pause</button>
        <button id="stop-game" class="btn btn-danger hidden">Stop</button>
        <button id="overwhelm-mode" class="btn btn-warning">Overwhelm Mode</button>
      </div>
      
      <div class="game-hints">
        <h4>💡 Training Tips</h4>
        <ul>
          <li><kbd>F1</kbd> - Start/Stop training session</li>
          <li><kbd>F2</kbd> - Toggle pause</li>
          <li><kbd>F3</kbd> - Switch between requests</li>
          <li><kbd>Tab</kbd> - Quick-fill expected entry</li>
        </ul>
      </div>
    `;
  }

  /**
   * Add CSS styles for game interface
   */
  addGameStyles() {
    const styles = `
      .mini-game-panel {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #0f4c75;
        border-radius: 8px;
        padding: 20px;
        margin-top: 20px;
        color: #e8e8e8;
        font-family: 'Courier New', monospace;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
      }
      
      .game-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #0f4c75;
      }
      
      .game-header h3 {
        margin: 0;
        color: #00d4ff;
        text-shadow: 0 0 10px rgba(0,212,255,0.3);
      }
      
      .game-status {
        display: flex;
        gap: 20px;
      }
      
      .timer, .score {
        background: rgba(0,0,0,0.4);
        padding: 5px 12px;
        border-radius: 4px;
        font-weight: bold;
        border: 1px solid #0f4c75;
      }
      
      .timer {
        color: #00ff88;
      }
      
      .score {
        color: #ffaa00;
      }
      
      .game-content {
        display: grid;
        grid-template-columns: 2fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .request-queue {
        background: rgba(0,0,0,0.3);
        border: 1px solid #333;
        border-radius: 4px;
        padding: 15px;
        max-height: 300px;
        overflow-y: auto;
      }
      
      .queue-empty {
        text-align: center;
        color: #666;
        font-style: italic;
        padding: 20px;
      }
      
      .request-item {
        background: rgba(0,100,200,0.2);
        border: 1px solid #0064c8;
        border-radius: 4px;
        padding: 12px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      
      .request-item:hover {
        background: rgba(0,100,200,0.3);
        transform: translateY(-1px);
      }
      
      .request-item.selected {
        border-color: #00ff88;
        background: rgba(0,255,136,0.2);
      }
      
      .request-item.urgent {
        border-color: #ff4444;
        background: rgba(255,68,68,0.2);
        animation: urgent-blink 2s infinite;
      }
      
      @keyframes urgent-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      
      .request-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      
      .request-callsign {
        font-weight: bold;
        color: #00d4ff;
      }
      
      .request-time {
        font-size: 0.9em;
        color: #aaa;
      }
      
      .request-text {
        font-size: 0.9em;
        line-height: 1.3;
        margin-bottom: 5px;
      }
      
      .request-expected {
        font-size: 0.8em;
        color: #888;
        background: rgba(0,0,0,0.3);
        padding: 4px 8px;
        border-radius: 2px;
        font-family: monospace;
      }
      
      .performance-panel {
        background: rgba(0,0,0,0.3);
        border: 1px solid #333;
        border-radius: 4px;
        padding: 15px;
      }
      
      .stat {
        display: flex;
        justify-content: space-between;
        margin-bottom: 10px;
        padding: 5px 0;
        border-bottom: 1px solid #333;
      }
      
      .stat:last-child {
        border-bottom: none;
      }
      
      .stat-label {
        color: #ccc;
      }
      
      .stat-value {
        color: #00ff88;
        font-weight: bold;
      }
      
      .game-controls {
        display: flex;
        gap: 10px;
        margin-bottom: 20px;
      }
      
      .btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      }
      
      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      }
      
      .btn-primary {
        background: #0064c8;
        color: white;
      }
      
      .btn-primary:hover {
        background: #0078e8;
      }
      
      .btn-secondary {
        background: #666;
        color: white;
      }
      
      .btn-secondary:hover {
        background: #777;
      }
      
      .btn-danger {
        background: #cc4444;
        color: white;
      }
      
      .btn-danger:hover {
        background: #dd5555;
      }
      
      .btn-warning {
        background: #ff8800;
        color: white;
      }
      
      .btn-warning:hover {
        background: #ff9900;
      }
      
      .game-hints {
        background: rgba(0,0,0,0.2);
        border: 1px solid #333;
        border-radius: 4px;
        padding: 15px;
      }
      
      .game-hints h4 {
        margin-top: 0;
        color: #00d4ff;
      }
      
      .game-hints ul {
        margin: 0;
        padding-left: 20px;
      }
      
      .game-hints li {
        margin-bottom: 5px;
      }
      
      .game-hints kbd {
        background: #333;
        border: 1px solid #555;
        border-radius: 2px;
        padding: 2px 6px;
        font-size: 0.9em;
      }
      
      .hidden {
        display: none !important;
      }
      
      /* Mobile responsive */
      @media (max-width: 768px) {
        .game-content {
          grid-template-columns: 1fr;
        }
        
        .game-controls {
          flex-wrap: wrap;
        }
        
        .btn {
          flex: 1;
          min-width: 120px;
        }
      }
    `;
    
    // Add styles to document
    if (!document.querySelector('#mini-game-styles')) {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'mini-game-styles';
      styleSheet.textContent = styles;
      document.head.appendChild(styleSheet);
    }
  }

  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    const controls = this.elements.gameControls;
    
    // Start game button
    controls.querySelector('#start-game')?.addEventListener('click', () => {
      this.startGame();
    });
    
    // Pause game button
    controls.querySelector('#pause-game')?.addEventListener('click', () => {
      this.togglePause();
    });
    
    // Stop game button  
    controls.querySelector('#stop-game')?.addEventListener('click', () => {
      this.stopGame();
    });
    
    // Overwhelm mode toggle
    controls.querySelector('#overwhelm-mode')?.addEventListener('click', () => {
      this.toggleOverwhelmMode();
    });
    
    // Request queue clicks
    this.elements.requestQueue?.addEventListener('click', (e) => {
      const requestItem = e.target.closest('.request-item');
      if (requestItem) {
        this.selectRequest(requestItem.dataset.requestId);
      }
    });
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when game is active
      if (!this.isGameMode) return;
      
      switch (e.code) {
        case 'F1':
          e.preventDefault();
          if (this.gameController?.gameState === 'IDLE') {
            this.startGame();
          } else {
            this.stopGame();
          }
          break;
          
        case 'F2':
          e.preventDefault();
          this.togglePause();
          break;
          
        case 'F3':
          e.preventDefault();
          this.selectNextRequest();
          break;
          
        case 'Tab':
          if (e.ctrlKey) {
            e.preventDefault();
            this.quickFillExpectedEntry();
          }
          break;
      }
    });
  }

  /**
   * Connect to game controller
   */
  connectGameController(gameController) {
    this.gameController = gameController;
    
    // Setup game event listeners
    gameController.addEventListener('pilot_request', (data) => {
      this.displayActiveRequest(data.scenario);
      this.playRequestSound();
    });
    
    gameController.addEventListener('scenario_complete', (data) => {
      this.removeActiveRequest(data.scenarioId);
      this.updatePerformanceDisplay();
    });
    
    gameController.addEventListener('session_started', (data) => {
      this.onGameStarted(data);
    });
    
    gameController.addEventListener('session_stopped', (data) => {
      this.onGameStopped(data);
    });
    
    gameController.addEventListener('session_paused', (data) => {
      this.onGamePaused();
    });
    
    gameController.addEventListener('session_resumed', (data) => {
      this.onGameResumed();
    });
    
    console.log('🔗 Connected to game controller');
  }

  /**
   * Toggle mini-game mode
   */
  toggleGameMode() {
    this.isGameMode = !this.isGameMode;
    
    if (this.isGameMode) {
      this.elements.gamePanel.classList.remove('hidden');
      console.log('🎮 Mini-game mode activated');
    } else {
      this.elements.gamePanel.classList.add('hidden');
      if (this.gameController?.gameState === 'RUNNING') {
        this.stopGame();
      }
      console.log('⌨️ Normal mode activated');
    }
    
    // Emit mode change event
    this.emit('mode_changed', { gameMode: this.isGameMode });
  }

  /**
   * Start training game
   */
  async startGame() {
    if (!this.gameController) {
      console.error('Game controller not connected');
      return;
    }
    
    try {
      // Configure game settings
      const config = {
        difficulty: 'MIXED',
        maxConcurrentRequests: 3,
        sessionDuration: 600000, // 10 minutes
        autoVoicePlayback: true
      };
      
      // Start game session
      await this.gameController.startSession(config);
      
      console.log('🚀 Training session started');
      
    } catch (error) {
      console.error('Failed to start game:', error);
      this.showError('Failed to start training session');
    }
  }

  /**
   * Stop training game
   */
  stopGame() {
    if (!this.gameController) return;
    
    const sessionSummary = this.gameController.stopSession();
    this.onGameStopped(sessionSummary);
    
    console.log('🛑 Training session stopped');
  }

  /**
   * Toggle pause/resume
   */
  togglePause() {
    if (!this.gameController) return;
    
    if (this.gameController.gameState === 'RUNNING') {
      this.gameController.pauseSession();
    } else if (this.gameController.gameState === 'PAUSED') {
      this.gameController.resumeSession();
    }
  }

  /**
   * Toggle overwhelm mode
   */
  toggleOverwhelmMode() {
    if (!this.gameController) return;
    
    if (this.gameController.config.overwhelmMode) {
      this.gameController.disableOverwhelmMode();
      this.elements.gameControls.querySelector('#overwhelm-mode').textContent = 'Overwhelm Mode';
      this.showMessage('Normal mode restored', 'success');
    } else {
      this.gameController.enableOverwhelmMode();
      this.elements.gameControls.querySelector('#overwhelm-mode').textContent = 'Normal Mode';
      this.showMessage('Overwhelm mode activated! 😰', 'warning');
    }
  }

  /**
   * Display active pilot request
   */
  displayActiveRequest(scenario) {
    // Remove empty state
    const emptyState = this.elements.requestQueue.querySelector('.queue-empty');
    if (emptyState) emptyState.remove();
    
    // Create request item
    const requestItem = document.createElement('div');
    requestItem.className = 'request-item';
    requestItem.dataset.requestId = scenario.id;
    
    const timeElapsed = scenario.activatedTime ? 
      Math.round((Date.now() - scenario.activatedTime) / 1000) : 0;
    
    const isUrgent = timeElapsed > 30; // Mark as urgent after 30 seconds
    if (isUrgent) {
      requestItem.classList.add('urgent');
    }
    
    requestItem.innerHTML = `
      <div class="request-header">
        <span class="request-callsign">${scenario.callsign}</span>
        <span class="request-time">${timeElapsed}s</span>
      </div>
      <div class="request-text">${scenario.pilotRequest}</div>
      <div class="request-expected">Expected: ${this.getExpectedEntryDisplay(scenario)}</div>
    `;
    
    // Add to queue
    this.elements.requestQueue.appendChild(requestItem);
    this.activeRequests.set(scenario.id, scenario);
    
    // Auto-select if first request
    if (this.activeRequests.size === 1) {
      this.selectRequest(scenario.id);
    }
    
    // Update concurrent count
    this.updateConcurrentCount();
  }

  /**
   * Remove active request
   */
  removeActiveRequest(scenarioId) {
    const requestItem = this.elements.requestQueue.querySelector(`[data-request-id="${scenarioId}"]`);
    if (requestItem) {
      requestItem.remove();
    }
    
    this.activeRequests.delete(scenarioId);
    
    // Show empty state if no requests
    if (this.activeRequests.size === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'queue-empty';
      emptyState.textContent = 'No active requests';
      this.elements.requestQueue.appendChild(emptyState);
    }
    
    this.updateConcurrentCount();
  }

  /**
   * Select a request for focus
   */
  selectRequest(requestId) {
    // Remove previous selection
    this.elements.requestQueue.querySelectorAll('.request-item').forEach(item => {
      item.classList.remove('selected');
    });
    
    // Select new request
    const requestItem = this.elements.requestQueue.querySelector(`[data-request-id="${requestId}"]`);
    if (requestItem) {
      requestItem.classList.add('selected');
      
      // Scroll into view
      requestItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      
      // Emit selection event
      this.emit('request_selected', { requestId });
    }
  }

  /**
   * Select next request in queue
   */
  selectNextRequest() {
    const requests = Array.from(this.elements.requestQueue.querySelectorAll('.request-item'));
    const currentSelected = this.elements.requestQueue.querySelector('.request-item.selected');
    
    if (requests.length === 0) return;
    
    let nextIndex = 0;
    if (currentSelected) {
      const currentIndex = requests.indexOf(currentSelected);
      nextIndex = (currentIndex + 1) % requests.length;
    }
    
    const nextRequest = requests[nextIndex];
    if (nextRequest) {
      this.selectRequest(nextRequest.dataset.requestId);
    }
  }

  /**
   * Quick-fill expected FDIO entry
   */
  quickFillExpectedEntry() {
    const selectedRequest = this.elements.requestQueue.querySelector('.request-item.selected');
    if (!selectedRequest) return;
    
    const requestId = selectedRequest.dataset.requestId;
    const scenario = this.activeRequests.get(requestId);
    
    if (!scenario?.expectedResponse?.fdioEntry) return;
    
    const expected = scenario.expectedResponse.fdioEntry;
    
    // Fill FDIO fields (assuming STARS interface has these inputs)
    this.fillFDIOField('callsign', expected.callsign);
    this.fillFDIOField('aircraftType', expected.aircraftType);  
    this.fillFDIOField('destination', expected.destination);
    
    if (expected.ifrIndicator) {
      this.fillFDIOField('ifrIndicator', expected.ifrIndicator);
    }
    
    this.showMessage('Expected entry filled', 'info');
  }

  /**
   * Fill FDIO field (helper)
   */
  fillFDIOField(fieldName, value) {
    // This would interface with the main STARS keyboard input system
    // Implementation depends on how STARS keyboard handles input
    console.log(`Fill ${fieldName}: ${value}`);
    
    // Emit event for STARS keyboard to handle
    this.emit('fill_field', { field: fieldName, value });
  }

  /**
   * Get expected entry display string
   */
  getExpectedEntryDisplay(scenario) {
    const expected = scenario.expectedResponse?.fdioEntry;
    if (!expected) return 'N/A';
    
    let display = `${expected.callsign} ${expected.aircraftType}`;
    
    if (expected.destination) {
      display += ` ${expected.destination}`;
    }
    
    if (expected.ifrIndicator) {
      display += ` ${expected.ifrIndicator}`;
    }
    
    return display;
  }

  /**
   * Update concurrent request count
   */
  updateConcurrentCount() {
    const countElement = this.elements.gamePanel.querySelector('#concurrent-count');
    if (countElement) {
      countElement.textContent = this.activeRequests.size.toString();
    }
  }

  /**
   * Update performance display
   */
  updatePerformanceDisplay() {
    if (!this.gameController) return;
    
    const report = this.gameController.getPerformanceSummary();
    if (!report) return;
    
    const stats = report.session?.stats;
    if (!stats) return;
    
    // Update response time
    const responseTimeElement = this.elements.gamePanel.querySelector('#avg-response-time');
    if (responseTimeElement) {
      responseTimeElement.textContent = `${Math.round(stats.averageResponseTime)}ms`;
    }
    
    // Update accuracy
    const accuracyElement = this.elements.gamePanel.querySelector('#accuracy-score');
    if (accuracyElement) {
      accuracyElement.textContent = `${Math.round(stats.accuracyScore)}%`;
    }
    
    // Update total score
    this.currentScore = Math.round(stats.totalScore);
    this.elements.scoreDisplay.textContent = `Score: ${this.currentScore}`;
  }

  /**
   * Update timer display
   */
  updateTimerDisplay() {
    if (!this.gameController || !this.gameController.gameStartTime) {
      this.elements.timerDisplay.textContent = '00:00';
      return;
    }
    
    const elapsed = Date.now() - this.gameController.gameStartTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    
    this.elements.timerDisplay.textContent = 
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Game event handlers
   */
  onGameStarted(data) {
    this.elements.gameControls.querySelector('#start-game').classList.add('hidden');
    this.elements.gameControls.querySelector('#pause-game').classList.remove('hidden');
    this.elements.gameControls.querySelector('#stop-game').classList.remove('hidden');
    
    // Start timer update
    this.timerInterval = setInterval(() => this.updateTimerDisplay(), 1000);
    
    this.showMessage('Training session started! 🚀', 'success');
  }

  onGameStopped(sessionSummary) {
    this.elements.gameControls.querySelector('#start-game').classList.remove('hidden');
    this.elements.gameControls.querySelector('#pause-game').classList.add('hidden');
    this.elements.gameControls.querySelector('#stop-game').classList.add('hidden');
    
    // Stop timer update
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    // Clear active requests
    this.activeRequests.clear();
    this.elements.requestQueue.innerHTML = '<div class="queue-empty">No active requests</div>';
    
    // Show session summary
    this.showSessionSummary(sessionSummary);
  }

  onGamePaused() {
    this.elements.gameControls.querySelector('#pause-game').textContent = 'Resume';
    this.showMessage('Session paused', 'info');
  }

  onGameResumed() {
    this.elements.gameControls.querySelector('#pause-game').textContent = 'Pause';
    this.showMessage('Session resumed', 'info');
  }

  /**
   * Show session summary modal/popup
   */
  showSessionSummary(sessionSummary) {
    if (!sessionSummary) return;
    
    const summary = `
      Training Session Complete!
      
      Duration: ${Math.round(sessionSummary.duration / 1000)}s
      Scenarios: ${sessionSummary.scenarioCount}
      Average Score: ${Math.round(sessionSummary.stats?.totalScore || 0)}/100
      
      Performance: ${this.getPerformanceRank(sessionSummary.stats?.totalScore || 0)}
    `;
    
    alert(summary); // Replace with better modal in production
  }

  /**
   * Get performance rank
   */
  getPerformanceRank(score) {
    if (score >= 90) return 'EXPERT 🏆';
    if (score >= 80) return 'ADVANCED ⭐';
    if (score >= 70) return 'PROFICIENT 👍';
    if (score >= 60) return 'DEVELOPING 📈';
    return 'NOVICE 🌱';
  }

  /**
   * Play request sound notification
   */
  playRequestSound() {
    // Play audio notification for new requests
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YWoGAACBhYqFUl46N3F2eWFvUXi/');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore audio play errors
    } catch (e) {
      // Audio not supported - could use visual notification instead
    }
  }

  /**
   * Show temporary message
   */
  showMessage(message, type = 'info', duration = 3000) {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `game-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      border-radius: 4px;
      color: white;
      font-weight: bold;
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;
    
    // Set background color based on type
    const colors = {
      success: '#28a745',
      warning: '#ffc107', 
      error: '#dc3545',
      info: '#17a2b8'
    };
    messageEl.style.backgroundColor = colors[type] || colors.info;
    
    document.body.appendChild(messageEl);
    
    // Remove after duration
    setTimeout(() => {
      messageEl.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => messageEl.remove(), 300);
    }, duration);
  }

  /**
   * Show error message
   */
  showError(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Event listener management
   */
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  removeEventListener(event, callback) {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) return;
    
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Event listener error for '${event}':`, error);
      }
    });
  }

  /**
   * Get interface statistics
   */
  getStats() {
    return {
      gameMode: this.isGameMode,
      activeRequests: this.activeRequests.size,
      currentScore: this.currentScore,
      sessionActive: this.gameController?.gameState === 'RUNNING'
    };
  }
}

// Create and export singleton instance  
export const starsMiniGameInterface = new STARSMiniGameInterface();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    starsMiniGameInterface.initialize();
  });
} else {
  starsMiniGameInterface.initialize();
}

// Add CSS animation keyframes
const animationStyles = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;

if (!document.querySelector('#game-animations')) {
  const animSheet = document.createElement('style');
  animSheet.id = 'game-animations';
  animSheet.textContent = animationStyles;
  document.head.appendChild(animSheet);
}