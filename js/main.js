// main.js - Main application controller

import { CONFIG, setupViewportHeight, validateFlightPlan } from './config.js';
import { keyboard } from './keyboard.js';
import { fdioClient } from './fdio-client.js';
import { practice } from './practice.js';

class STARSApp {
    constructor() {
        this.mode = 'flightplan'; // 'flightplan' or 'practice'
        this.showHints = false;
        this.entriesSent = 0;
        this.autoSendEnabled = false;
        
        this.elements = {
            modeBtn: document.getElementById('btn-mode'),
            promptEl: document.getElementById('entry-prompt'),
            hintEl: document.getElementById('hint-text'),
            entryCountEl: document.getElementById('entry-count'),
            connectionStatusEl: document.getElementById('connection-status'),
            enterBtn: document.getElementById('btn-enter'),
            clearBtn: document.getElementById('btn-clear-entry'),
            terminalEl: document.getElementById('term-content')
        };

        this.init();
    }

    init() {
        console.log(`🚀 Starting ${CONFIG.APP.NAME} v${CONFIG.APP.VERSION}`);
        
        // Setup viewport height for mobile
        setupViewportHeight();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize UI state
        this.updateUI();
        
        console.log('✅ STARS Keyboard Simulator initialized');
    }

    setupEventListeners() {
        // Mode toggle button
        this.elements.modeBtn?.addEventListener('click', () => {
            this.toggleMode();
        });

        // ENTER button is handled by keyboard.js - no separate listener needed

        // Clear button
        this.elements.clearBtn?.addEventListener('click', () => {
            this.clearEntry();
        });

        // Keyboard input listener
        keyboard.addEventListener((key, content, lines) => {
            this.handleKeyboardInput(key, content, lines);
        });

        // FDIO client listeners
        fdioClient.addEventListener((event, data) => {
            this.handleFDIOEvent(event, data);
        });

        // Practice system listeners
        practice.addEventListener((event, data) => {
            this.handlePracticeEvent(event, data);
        });

        // Note: Keyboard shortcuts are handled by keyboard.js
        // Enter key -> ENTER button -> sends to FDIO
        // Escape key -> CLEAR button -> clears entry
    }

    // Toggle between flight plan mode and practice mode
    toggleMode() {
        if (this.mode === 'flightplan') {
            this.mode = 'practice';
            this.elements.modeBtn.textContent = this.showHints ? 'Hide Hints' : 'Show Hints';
            this.startPractice();
        } else if (this.mode === 'practice' && !practice.isActivePractice()) {
            // Start new practice
            this.startPractice();
        } else {
            // Toggle hints or return to flight plan mode
            if (practice.isActivePractice()) {
                this.showHints = !this.showHints;
                this.elements.modeBtn.textContent = this.showHints ? 'Hide Hints' : 'Show Hints';
                this.updateHint();
            } else {
                this.mode = 'flightplan';
                this.elements.modeBtn.textContent = 'Practice Mode';
                this.updateUI();
            }
        }
    }

    // Start practice session
    startPractice() {
        this.mode = 'practice';
        practice.startPractice('flightplan');
        this.elements.modeBtn.textContent = 'Show Hints';
        this.showHints = false;
    }

    // Handle keyboard input
    handleKeyboardInput(key, content, lines) {
        console.log(`handleKeyboardInput called with key: ${key}`);
        this.updateEnterButton();
        
        // Handle ENTER key - send to FDIO
        if (key === 'ENTER') {
            console.log('ENTER key detected, calling sendToFDIO...');
            this.sendToFDIO();
            return;
        }
        
        if (this.mode === 'practice' && practice.isActivePractice()) {
            const starsMessage = keyboard.getAsSTARSMessage();
            const result = practice.checkAnswer(starsMessage);
            
            if (result.correct) {
                // Automatically start next practice after delay
                setTimeout(() => {
                    keyboard.clear();
                    practice.startPractice('flightplan');
                }, 800);
            }
        }
    }

    // Handle FDIO client events
    handleFDIOEvent(event, data) {
        switch (event) {
            case 'connection-status':
                this.updateConnectionStatus(data);
                break;
            case 'stars-success':
                this.handleSTARSSuccess(data);
                break;
            case 'stars-error':
                this.handleSTARSError(data);
                break;
            default:
                console.log('FDIO event:', event, data);
        }
    }

    // Handle practice system events
    handlePracticeEvent(event, data) {
        switch (event) {
            case 'prompt-started':
                this.updatePracticePrompt(data);
                break;
            case 'answer-correct':
                this.handleCorrectAnswer(data);
                break;
            case 'answer-incorrect':
                this.handleIncorrectAnswer(data);
                break;
            default:
                console.log('Practice event:', event, data);
        }
    }

    // Update practice prompt display
    updatePracticePrompt(data) {
        const prompt = data.prompt;
        let promptText = '';

        if (prompt.type === 'AIRPORT') {
            promptText = `Type → ${prompt.promptText}`;
        } else {
            promptText = `Enter ${prompt.type.replace('_', ' ')} flight plan`;
        }

        this.elements.promptEl.textContent = promptText;
        this.updateHint();
    }

    // Handle correct practice answer
    handleCorrectAnswer(data) {
        this.elements.promptEl.textContent = `✅ Correct! Time: ${data.timeMs}ms`;
        this.elements.hintEl.textContent = '';
        
        // Update stats display
        const stats = data.stats;
        const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
        console.log(`Practice stats: ${stats.correct}/${stats.total} (${accuracy}%) - Avg: ${Math.round(stats.averageTime)}ms`);
    }

    // Handle incorrect practice answer
    handleIncorrectAnswer(data) {
        this.elements.promptEl.textContent = `❌ Expected: ${data.expected}`;
        this.elements.hintEl.textContent = data.reason;
    }

    // Update hint display
    updateHint() {
        if (this.mode === 'practice' && this.showHints) {
            const hint = practice.getHint();
            this.elements.hintEl.textContent = hint || '';
        } else {
            this.elements.hintEl.textContent = '';
        }
    }

    // Send current entry to FDIO
    async sendToFDIO() {
        const message = keyboard.getAsSTARSMessage();
        
        if (!message) {
            this.showMessage('No entry to send', 'error');
            return;
        }

        // Validate format first
        const validation = validateFlightPlan(message);
        if (!validation.valid) {
            this.showMessage(`Invalid format: ${validation.error}`, 'error');
            return;
        }

        if (!fdioClient.isConnected) {
            this.showMessage('FDIO not connected', 'error');
            return;
        }

        try {
            this.elements.enterBtn.disabled = true;
            this.elements.enterBtn.textContent = 'SENDING...';
            
            const result = await fdioClient.sendSTARSMessage(message);
            this.handleSTARSSuccess(result);
            
        } catch (error) {
            this.handleSTARSError({ error: error.message, message });
        } finally {
            this.elements.enterBtn.disabled = false;
            this.elements.enterBtn.textContent = 'ENTER';
            this.updateEnterButton();
        }
    }

    // Handle successful STARS message send
    handleSTARSSuccess(data) {
        this.entriesSent++;
        this.elements.entryCountEl.textContent = this.entriesSent.toString();
        
        const fp = data.flightPlan;
        const info = data.starsInfo;
        
        this.showMessage(`✅ ${info.type} ${info.rule} flight plan created: ${fp.aircraftID} (${fp.beaconCode})`, 'success');
        
        // Clear entry after successful send
        keyboard.clear();
        
        console.log('Flight plan created:', fp);
    }

    // Handle STARS message send error
    handleSTARSError(data) {
        this.showMessage(`❌ Error: ${data.error}`, 'error');
        console.error('STARS send error:', data);
    }

    // Clear current entry
    clearEntry() {
        keyboard.clear();
        this.updateUI();
        this.showMessage('Entry cleared', 'info');
    }

    // Update connection status display
    updateConnectionStatus(data) {
        const statusEl = this.elements.connectionStatusEl;
        if (!statusEl) return;

        statusEl.textContent = fdioClient.getStatusMessage();
        
        // Update CSS classes
        statusEl.classList.remove('connected', 'disconnected', 'connecting');
        statusEl.classList.add(data.status);
    }

    // Update enter button state
    updateEnterButton() {
        const hasContent = !keyboard.isEmpty();
        const isConnected = fdioClient.isConnected;
        
        if (this.elements.enterBtn) {
            this.elements.enterBtn.disabled = !hasContent || !isConnected;
        }
    }

    // Update UI state
    updateUI() {
        if (this.mode === 'flightplan') {
            this.elements.promptEl.textContent = CONFIG.MESSAGES.READY;
            this.elements.modeBtn.textContent = 'Practice Mode';
        }
        
        this.updateEnterButton();
        this.updateConnectionStatus({ status: fdioClient.connectionStatus });
    }

    // Show temporary message
    showMessage(message, type = 'info', duration = 3000) {
        const originalText = this.elements.promptEl.textContent;
        
        // Apply styling based on type
        let className = '';
        switch (type) {
            case 'success':
                className = 'success-message';
                break;
            case 'error':
                className = 'error-message';
                break;
            case 'info':
            default:
                className = 'info-message';
                break;
        }
        
        this.elements.promptEl.textContent = message;
        this.elements.promptEl.className = className;
        
        setTimeout(() => {
            this.elements.promptEl.textContent = originalText;
            this.elements.promptEl.className = '';
        }, duration);
    }

    // Get application statistics
    getStats() {
        return {
            mode: this.mode,
            entriesSent: this.entriesSent,
            fdioConnection: fdioClient.getConnectionInfo(),
            practiceStats: practice.getStats(),
            keyboardStats: keyboard.getStats()
        };
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.starsApp = new STARSApp();
    
    // Expose useful objects to global scope for debugging
    if (typeof window !== 'undefined') {
        window.CONFIG = CONFIG;
        window.keyboard = keyboard;
        window.fdioClient = fdioClient;
        window.practice = practice;
    }
});

// Add some additional CSS for message styling
const messageStyles = `
.success-message { color: #32CD32 !important; }
.error-message { color: #FF6B6B !important; }
.info-message { color: #4ECDC4 !important; }
.key.highlighted { 
    box-shadow: 0 0 10px #FFD700, inset 0 0 10px rgba(255, 215, 0, 0.3) !important;
    border: 2px solid #FFD700 !important;
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = messageStyles;
document.head.appendChild(styleSheet);