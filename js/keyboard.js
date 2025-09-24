// keyboard.js - Keyboard input handling and visual feedback

import { CONFIG } from './config.js';

export class KeyboardHandler {
    constructor() {
        this.content = '';
        this.listeners = [];
        this.keyButtons = new Map();
        this.contentDiv = null;
        this.isShiftPressed = false;
        
        this.init();
    }

    init() {
        this.contentDiv = document.getElementById('term-content');
        this.setupKeyButtons();
        this.setupPhysicalKeyboard();
    }

    // Setup on-screen keyboard buttons
    setupKeyButtons() {
        document.querySelectorAll('.key').forEach(btn => {
            const key = btn.getAttribute('data-key');
            const qwerty = btn.getAttribute('data-qwerty');
            
            if (key) {
                this.keyButtons.set(key, btn);
            }
            
            if (qwerty) {
                this.keyButtons.set(qwerty.toLowerCase(), btn);
            }

            // Handle on-screen button clicks
            if (btn.hasAttribute('data-clickable')) {
                btn.addEventListener('click', () => this.handleKeyPress(btn));
            }
        });

        // Setup special buttons
        const clearBtn = document.getElementById('btn-clear');
        const backspaceBtn = document.getElementById('btn-backspace');
        const spaceBtn = document.getElementById('btn-space');
        const enterBtn = document.getElementById('btn-enter');

        if (clearBtn) this.keyButtons.set('clear', clearBtn);
        if (backspaceBtn) this.keyButtons.set('backspace', backspaceBtn);
        if (spaceBtn) this.keyButtons.set('space', spaceBtn);
        if (enterBtn) {
            this.keyButtons.set('enter', enterBtn);
            // Ensure ENTER button has click listener (might not have data-clickable)
            enterBtn.addEventListener('click', () => {
                console.log('ENTER button clicked!');
                this.handleKeyPress(enterBtn);
            });
            console.log('ENTER button found and click listener added');
        } else {
            console.error('ENTER button not found!');
        }
    }

    // Setup physical keyboard event listeners
    setupPhysicalKeyboard() {
        document.addEventListener('keydown', (e) => {
            // Track shift key for special characters
            if (e.key === 'Shift') {
                this.isShiftPressed = true;
                return;
            }

            // Prevent default behavior for keys we handle
            if (this.shouldHandleKey(e.key)) {
                e.preventDefault();
                this.handlePhysicalKey(e.key, e.shiftKey);
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key === 'Shift') {
                this.isShiftPressed = false;
            }
        });

        // Prevent browser shortcuts that might interfere
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && ['a', 'r', 't', 'w'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
    }

    // Check if we should handle this physical key
    shouldHandleKey(key) {
        const normalizedKey = key.toLowerCase();
        return (
            /^[a-z0-9]$/.test(normalizedKey) ||
            key === ' ' ||
            key === 'Backspace' ||
            key === 'Delete' ||
            key === 'Enter' ||
            key === 'Escape' ||
            key === '+' ||
            key === '*' ||
            key === '^'
        );
    }

    // Handle physical keyboard input
    handlePhysicalKey(key, shiftPressed) {
        let starsKey = null;
        let button = null;

        // Handle special key combinations
        if (key === '8' && shiftPressed) {
            starsKey = '*';
            button = this.keyButtons.get('*');
        } else if (key === '=' && shiftPressed) {
            starsKey = '+';
            button = this.keyButtons.get('+');
        } else if (key === '6' && shiftPressed) {
            starsKey = '^';
            button = this.keyButtons.get('^');
        } else if (key === ' ') {
            starsKey = 'SPACE';
            button = this.keyButtons.get('space');
        } else if (key === 'Backspace') {
            starsKey = 'BACKSPACE';
            button = this.keyButtons.get('backspace');
        } else if (key === 'Delete') {
            starsKey = 'CLEAR';
            button = this.keyButtons.get('clear');
        } else if (key === 'Enter') {
            starsKey = 'ENTER';
            button = this.keyButtons.get('enter');
        } else if (key === 'Escape') {
            starsKey = 'CLEAR';
            button = this.keyButtons.get('clear');
        } else {
            // Regular character
            const normalizedKey = key.toUpperCase();
            starsKey = normalizedKey;
            button = this.keyButtons.get(normalizedKey) || this.keyButtons.get(key.toLowerCase());
        }

        if (button && starsKey) {
            console.log(`Physical key pressed: ${key} -> ${starsKey}`, button);
            this.flashKey(button);
            this.processKeyInput(starsKey, button);
        } else {
            console.log(`Physical key not handled: ${key}, button found:`, !!button, 'starsKey:', starsKey);
        }
    }

    // Handle on-screen button press
    handleKeyPress(button) {
        let key = null;

        if (button.id === 'btn-clear') {
            key = 'CLEAR';
        } else if (button.id === 'btn-backspace') {
            key = 'BACKSPACE';
        } else if (button.id === 'btn-space') {
            key = 'SPACE';
        } else if (button.id === 'btn-enter') {
            key = 'ENTER';
        } else {
            key = button.getAttribute('data-key');
        }

        if (key) {
            this.flashKey(button);
            this.processKeyInput(key, button);
        }
    }

    // Process the actual key input
    processKeyInput(key, button) {
        console.log(`processKeyInput called with key: ${key}`);
        switch (key) {
            case 'CLEAR':
                this.content = '';
                break;
            case 'BACKSPACE':
                this.content = this.content.slice(0, -1);
                break;
            case 'SPACE':
                this.content += '\n';
                break;
            case 'ENTER':
                console.log('ENTER key processed, notifying listeners...');
                // ENTER key doesn't modify content, just triggers send action
                // Content modification is handled by the main app
                break;
            default:
                this.content += key;
                break;
        }

        this.updateDisplay();
        this.notifyListeners(key, this.content);
    }

    // Flash key for visual feedback
    flashKey(button) {
        if (!button) return;

        button.classList.add('flash');
        setTimeout(() => {
            button.classList.remove('flash');
        }, CONFIG.APP.FLASH_DURATION);
    }

    // Update terminal display
    updateDisplay() {
        if (this.contentDiv) {
            this.contentDiv.textContent = this.content;
            this.contentDiv.scrollTop = this.contentDiv.scrollHeight;
        }
    }

    // Add event listener for key presses
    addEventListener(callback) {
        this.listeners.push(callback);
    }

    // Remove event listener
    removeEventListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    // Notify all listeners of key press
    notifyListeners(key, content) {
        this.listeners.forEach(listener => {
            try {
                listener(key, content, this.content.split('\n'));
            } catch (error) {
                console.error('Error in keyboard listener:', error);
            }
        });
    }

    // Get current content
    getContent() {
        return this.content;
    }

    // Get content as lines (split by newlines/spaces)
    getLines() {
        return this.content.split('\n').filter(line => line.trim().length > 0);
    }

    // Get current line being typed
    getCurrentLine() {
        const lines = this.content.split('\n');
        return lines[lines.length - 1] || '';
    }

    // Set content programmatically
    setContent(content) {
        this.content = content || '';
        this.updateDisplay();
        this.notifyListeners('SET', this.content);
    }

    // Clear content
    clear() {
        this.content = '';
        this.updateDisplay();
        this.notifyListeners('CLEAR', this.content);
    }

    // Check if content is empty
    isEmpty() {
        return this.content.trim().length === 0;
    }

    // Get content as STARS message format
    getAsSTARSMessage() {
        // Convert newlines to spaces and clean up
        return this.content
            .split('\n')
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Highlight specific key (for training purposes)
    highlightKey(keyChar) {
        // Remove previous highlights
        document.querySelectorAll('.key.highlighted').forEach(btn => {
            btn.classList.remove('highlighted');
        });

        // Add highlight to target key
        const button = this.keyButtons.get(keyChar) || this.keyButtons.get(keyChar.toLowerCase());
        if (button) {
            button.classList.add('highlighted');
            return true;
        }
        return false;
    }

    // Remove all key highlights
    clearHighlights() {
        document.querySelectorAll('.key.highlighted').forEach(btn => {
            btn.classList.remove('highlighted');
        });
    }

    // Disable/enable keyboard
    setEnabled(enabled) {
        document.querySelectorAll('.key[data-clickable]').forEach(btn => {
            btn.disabled = !enabled;
        });
    }

    // Get keyboard statistics
    getStats() {
        return {
            totalCharacters: this.content.length,
            totalLines: this.content.split('\n').length,
            currentLine: this.getCurrentLine(),
            isEmpty: this.isEmpty(),
            asSTARS: this.getAsSTARSMessage()
        };
    }
}

// Export singleton instance
export const keyboard = new KeyboardHandler();