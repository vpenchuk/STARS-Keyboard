// fdio-client.js - HTTP client for FDIO integration

import { CONFIG } from './config.js';

export class FDIOClient {
    constructor() {
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
        this.retryCount = 0;
        this.listeners = [];
        this.lastHealthCheck = null;
        
        // Auto-check connection on startup
        this.checkConnection();
        
        // Set up periodic health checks
        setInterval(() => {
            this.checkConnection();
        }, 10000); // Check every 10 seconds
    }

    // Check if FDIO server is available
    async checkConnection() {
        try {
            this.updateConnectionStatus('connecting');
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.FDIO_SERVER.TIMEOUT);
            
            const response = await fetch(`${CONFIG.FDIO_SERVER.BASE_URL}${CONFIG.FDIO_SERVER.ENDPOINTS.HEALTH}`, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.isConnected = true;
                this.retryCount = 0;
                this.lastHealthCheck = data;
                this.updateConnectionStatus('connected');
                return true;
            } else {
                throw new Error(`Server returned ${response.status}`);
            }
        } catch (error) {
            this.isConnected = false;
            this.lastHealthCheck = null;
            this.updateConnectionStatus('disconnected');
            
            console.warn('FDIO connection check failed:', error.message);
            return false;
        }
    }

    // Send STARS message to FDIO
    async sendSTARSMessage(message) {
        if (!message || message.trim().length === 0) {
            throw new Error('Empty message');
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.FDIO_SERVER.TIMEOUT);

            const response = await fetch(`${CONFIG.FDIO_SERVER.BASE_URL}${CONFIG.FDIO_SERVER.ENDPOINTS.STARS_MESSAGE}`, {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message.trim() })
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.success) {
                this.notifyListeners('stars-success', data);
                return data;
            } else {
                throw new Error(data.error || 'Unknown server error');
            }
        } catch (error) {
            // If it's a network error, check connection
            if (error.name === 'TypeError' || error.name === 'AbortError') {
                this.checkConnection();
            }
            
            this.notifyListeners('stars-error', { error: error.message, message });
            throw error;
        }
    }

    // Send departure message
    async sendDepartureMessage(message) {
        try {
            const response = await this.makeRequest(CONFIG.FDIO_SERVER.ENDPOINTS.DEPARTURE, {
                message: message
            });

            this.notifyListeners('departure-success', response);
            return response;
        } catch (error) {
            this.notifyListeners('departure-error', { error: error.message, message });
            throw error;
        }
    }

    // Request flight strip
    async requestFlightStrip(identifier, fix, output) {
        try {
            const response = await this.makeRequest(CONFIG.FDIO_SERVER.ENDPOINTS.STRIP_REQUEST, {
                identifier,
                fix,
                output
            });

            this.notifyListeners('strip-success', response);
            return response;
        } catch (error) {
            this.notifyListeners('strip-error', { error: error.message, identifier, fix, output });
            throw error;
        }
    }

    // Get flight plans list
    async getFlightPlans(limit = 20) {
        try {
            const url = `${CONFIG.FDIO_SERVER.BASE_URL}${CONFIG.FDIO_SERVER.ENDPOINTS.FLIGHTPLANS}?limit=${limit}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.notifyListeners('flightplans-retrieved', data);
            return data;
        } catch (error) {
            this.notifyListeners('flightplans-error', { error: error.message });
            throw error;
        }
    }

    // Get specific flight plan
    async getFlightPlan(identifier) {
        try {
            const url = `${CONFIG.FDIO_SERVER.BASE_URL}${CONFIG.FDIO_SERVER.ENDPOINTS.FLIGHTPLANS}/${encodeURIComponent(identifier)}`;
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Flight plan not found: ${identifier}`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.notifyListeners('flightplan-retrieved', data);
            return data;
        } catch (error) {
            this.notifyListeners('flightplan-error', { error: error.message, identifier });
            throw error;
        }
    }

    // Get server statistics
    async getStats() {
        try {
            const response = await this.makeRequest(CONFIG.FDIO_SERVER.ENDPOINTS.STATS, null, 'GET');
            this.notifyListeners('stats-retrieved', response);
            return response;
        } catch (error) {
            this.notifyListeners('stats-error', { error: error.message });
            throw error;
        }
    }

    // Generic HTTP request helper
    async makeRequest(endpoint, body = null, method = 'POST') {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.FDIO_SERVER.TIMEOUT);

        try {
            const options = {
                method,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            const response = await fetch(`${CONFIG.FDIO_SERVER.BASE_URL}${endpoint}`, options);
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            
            // Check connection if network error
            if (error.name === 'TypeError' || error.name === 'AbortError') {
                this.checkConnection();
            }
            
            throw error;
        }
    }

    // Update connection status and notify listeners
    updateConnectionStatus(status) {
        if (this.connectionStatus !== status) {
            this.connectionStatus = status;
            this.notifyListeners('connection-status', { status, isConnected: status === 'connected' });
        }
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
                console.error('Error in FDIO client listener:', error);
            }
        });
    }

    // Get connection info
    getConnectionInfo() {
        return {
            isConnected: this.isConnected,
            status: this.connectionStatus,
            serverUrl: CONFIG.FDIO_SERVER.BASE_URL,
            lastHealthCheck: this.lastHealthCheck,
            retryCount: this.retryCount
        };
    }

    // Test connection with retry logic
    async testConnection(maxRetries = CONFIG.FDIO_SERVER.RETRY_ATTEMPTS) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const success = await this.checkConnection();
                if (success) {
                    return { success: true, attempt };
                }
            } catch (error) {
                console.warn(`Connection test attempt ${attempt} failed:`, error.message);
            }

            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, CONFIG.FDIO_SERVER.RETRY_DELAY));
            }
        }

        return { success: false, attempts: maxRetries };
    }

    // Force reconnection attempt
    async reconnect() {
        this.retryCount++;
        return await this.checkConnection();
    }

    // Get formatted status message
    getStatusMessage() {
        switch (this.connectionStatus) {
            case 'connected':
                return CONFIG.MESSAGES.CONNECTED;
            case 'connecting':
                return CONFIG.MESSAGES.CONNECTING;
            case 'disconnected':
            default:
                return CONFIG.MESSAGES.DISCONNECTED;
        }
    }
}

// Export singleton instance
export const fdioClient = new FDIOClient();