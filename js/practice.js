// practice.js - Practice system for flight plan entry training

import { CONFIG } from './config.js';

export class PracticeSystem {
    constructor() {
        this.isActive = false;
        this.currentPrompt = null;
        this.startTime = 0;
        this.completionTimes = [];
        this.sessionStats = {
            total: 0,
            correct: 0,
            averageTime: 0
        };
        this.listeners = [];
    }

    // Generate random flight plan practice prompt
    generatePrompt() {
        const types = Object.keys(CONFIG.FLIGHT_PLAN_TYPES);
        const randomType = types[Math.floor(Math.random() * types.length)];
        const typeConfig = CONFIG.FLIGHT_PLAN_TYPES[randomType];

        let prompt = {};

        switch (randomType) {
            case 'LOCAL_IFR':
                prompt = {
                    type: randomType,
                    fields: {
                        callsign: this.getRandomElement(CONFIG.SAMPLE_DATA.CALLSIGNS.LOCAL_4CHAR),
                        aircraftType: this.getRandomElement(CONFIG.SAMPLE_DATA.AIRCRAFT_TYPES),
                        destination: this.getRandomElement(CONFIG.SAMPLE_DATA.DESTINATIONS),
                        sync: this.getRandomElement(CONFIG.SAMPLE_DATA.SYNC_CODES),
                        ifrFlag: CONFIG.SAMPLE_DATA.IFR_FLAG
                    },
                    expectedAnswer: '',
                    description: typeConfig.description
                };
                prompt.expectedAnswer = `${prompt.fields.callsign} ${prompt.fields.aircraftType} ${prompt.fields.destination} ${prompt.fields.sync} ${prompt.fields.ifrFlag}`;
                break;

            case 'LOCAL_VFR':
                prompt = {
                    type: randomType,
                    fields: {
                        callsign: this.getRandomElement(CONFIG.SAMPLE_DATA.CALLSIGNS.LOCAL_3CHAR),
                        aircraftType: this.getRandomElement(CONFIG.SAMPLE_DATA.AIRCRAFT_TYPES),
                        sync: this.getRandomElement(CONFIG.SAMPLE_DATA.SYNC_CODES)
                    },
                    expectedAnswer: '',
                    description: typeConfig.description
                };
                prompt.expectedAnswer = `${prompt.fields.callsign} ${prompt.fields.aircraftType} ${prompt.fields.sync}`;
                break;

            case 'NATIONAL_IFR':
                prompt = {
                    type: randomType,
                    fields: {
                        callsign: this.getRandomElement(CONFIG.SAMPLE_DATA.CALLSIGNS.NATIONAL),
                        destination: this.getRandomElement(CONFIG.SAMPLE_DATA.DESTINATIONS),
                        aircraftType: this.getRandomElement(CONFIG.SAMPLE_DATA.AIRCRAFT_TYPES),
                        sync: this.getRandomElement(CONFIG.SAMPLE_DATA.SYNC_CODES),
                        ifrFlag: CONFIG.SAMPLE_DATA.IFR_FLAG
                    },
                    expectedAnswer: '',
                    description: typeConfig.description
                };
                prompt.expectedAnswer = `${prompt.fields.callsign} ${prompt.fields.destination} ${prompt.fields.aircraftType} ${prompt.fields.sync} ${prompt.fields.ifrFlag}`;
                break;

            case 'NATIONAL_VFR':
                prompt = {
                    type: randomType,
                    fields: {
                        callsign: this.getRandomElement(CONFIG.SAMPLE_DATA.CALLSIGNS.NATIONAL),
                        destination: this.getRandomElement(CONFIG.SAMPLE_DATA.DESTINATIONS),
                        aircraftType: this.getRandomElement(CONFIG.SAMPLE_DATA.AIRCRAFT_TYPES),
                        sync: this.getRandomElement(CONFIG.SAMPLE_DATA.SYNC_CODES)
                    },
                    expectedAnswer: '',
                    description: typeConfig.description
                };
                prompt.expectedAnswer = `${prompt.fields.callsign} ${prompt.fields.destination} ${prompt.fields.aircraftType} ${prompt.fields.sync}`;
                break;
        }

        return prompt;
    }

    // Generate airport code practice (legacy support)
    generateAirportPrompt() {
        const [code, name] = this.getRandomElement(CONFIG.AIRPORTS);
        const promptByCode = Math.random() < 0.5;

        return {
            type: 'AIRPORT',
            code: code,
            name: name,
            promptText: promptByCode ? code : name,
            expectedAnswer: code,
            promptByCode: promptByCode,
            description: `Airport code: ${code} - ${name}`
        };
    }

    // Start new practice prompt
    startPractice(mode = 'flightplan') {
        this.currentPrompt = mode === 'airport' ? this.generateAirportPrompt() : this.generatePrompt();
        this.startTime = Date.now();
        this.isActive = true;
        
        this.notifyListeners('prompt-started', {
            prompt: this.currentPrompt,
            mode: mode
        });

        return this.currentPrompt;
    }

    // Check if the current answer matches the expected answer
    checkAnswer(userInput) {
        if (!this.currentPrompt || !this.isActive) {
            return { correct: false, reason: 'No active practice' };
        }

        const cleanInput = userInput.trim().replace(/\s+/g, ' ');
        const expectedAnswer = this.currentPrompt.expectedAnswer;

        const isCorrect = cleanInput === expectedAnswer;

        if (isCorrect) {
            const elapsed = Date.now() - this.startTime;
            this.completionTimes.push(elapsed);
            this.sessionStats.total++;
            this.sessionStats.correct++;
            this.sessionStats.averageTime = this.completionTimes.reduce((a, b) => a + b, 0) / this.completionTimes.length;

            this.notifyListeners('answer-correct', {
                prompt: this.currentPrompt,
                userInput: cleanInput,
                timeMs: elapsed,
                stats: this.sessionStats
            });

            this.isActive = false;
            return { correct: true, timeMs: elapsed };
        } else {
            this.sessionStats.total++;
            
            this.notifyListeners('answer-incorrect', {
                prompt: this.currentPrompt,
                userInput: cleanInput,
                expected: expectedAnswer,
                stats: this.sessionStats
            });

            return { 
                correct: false, 
                reason: `Expected: ${expectedAnswer}, Got: ${cleanInput}` 
            };
        }
    }

    // Get hint for current prompt
    getHint() {
        if (!this.currentPrompt) {
            return null;
        }

        if (this.currentPrompt.type === 'AIRPORT') {
            return this.currentPrompt.promptByCode 
                ? `${this.currentPrompt.code} - ${this.currentPrompt.name}`
                : this.currentPrompt.code;
        } else {
            // Flight plan hint
            const fields = Object.entries(this.currentPrompt.fields)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            return `${this.currentPrompt.type} - ${fields}`;
        }
    }

    // Get practice format explanation
    getFormatExplanation(type) {
        if (type === 'AIRPORT') {
            return 'Type the 3-4 character airport code';
        }

        const typeConfig = CONFIG.FLIGHT_PLAN_TYPES[type];
        if (typeConfig) {
            return `${typeConfig.name}: ${typeConfig.example}`;
        }

        return 'Follow STARS flight plan format';
    }

    // Stop current practice
    stop() {
        this.isActive = false;
        this.currentPrompt = null;
        this.notifyListeners('practice-stopped', { stats: this.sessionStats });
    }

    // Reset session statistics
    resetStats() {
        this.completionTimes = [];
        this.sessionStats = {
            total: 0,
            correct: 0,
            averageTime: 0
        };
        this.notifyListeners('stats-reset', { stats: this.sessionStats });
    }

    // Get current session statistics
    getStats() {
        return {
            ...this.sessionStats,
            accuracy: this.sessionStats.total > 0 ? (this.sessionStats.correct / this.sessionStats.total * 100) : 0,
            totalAttempts: this.sessionStats.total,
            isActive: this.isActive,
            currentPrompt: this.currentPrompt
        };
    }

    // Get random element from array
    getRandomElement(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Add event listener
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

    // Notify all listeners
    notifyListeners(event, data) {
        this.listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (error) {
                console.error('Error in practice listener:', error);
            }
        });
    }

    // Generate practice suggestions based on performance
    getSuggestions() {
        const suggestions = [];

        if (this.sessionStats.total === 0) {
            suggestions.push("Start with Local VFR entries - they're the simplest format");
        } else {
            const accuracy = this.sessionStats.correct / this.sessionStats.total * 100;
            
            if (accuracy < 50) {
                suggestions.push("Focus on the basic format: Callsign, Aircraft Type, Destination, Sync Code");
                suggestions.push("Remember: Local flights use 3-4 char callsigns, National use full N-numbers");
            } else if (accuracy < 80) {
                suggestions.push("Good progress! Pay attention to field order - it varies by flight type");
                suggestions.push("IFR flights always end with '+' symbol");
            } else {
                suggestions.push("Excellent! Try practicing different flight types to build muscle memory");
                suggestions.push("Consider practicing with the FDIO integration to complete the workflow");
            }

            if (this.sessionStats.averageTime > 10000) {
                suggestions.push("Try to increase your typing speed - aim for under 10 seconds per entry");
            }
        }

        return suggestions;
    }

    // Check if practice system is active
    isActivePractice() {
        return this.isActive;
    }

    // Get current prompt info
    getCurrentPrompt() {
        return this.currentPrompt;
    }
}

// Export singleton instance
export const practice = new PracticeSystem();