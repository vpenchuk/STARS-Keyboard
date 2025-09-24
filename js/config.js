// config.js - Configuration for STARS Keyboard Simulator

export const CONFIG = {
    // FDIO Server Configuration
    FDIO_SERVER: {
        HOST: 'localhost',
        PORT: 3001,
        BASE_URL: 'http://localhost:3001',
        ENDPOINTS: {
            HEALTH: '/health',
            STARS_MESSAGE: '/stars/message',
            FLIGHTPLAN: '/flightplan',
            DEPARTURE: '/departure',
            STRIP_REQUEST: '/strip/request',
            FLIGHTPLANS: '/flightplans',
            STATS: '/stats'
        },
        TIMEOUT: 5000, // 5 seconds
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1 second
    },

    // Application Settings
    APP: {
        NAME: 'STARS Keyboard Simulator',
        VERSION: '2.0.0',
        TERMINAL_LINES: 5,
        AUTO_CLEAR_DELAY: 30000, // 30 seconds
        FLASH_DURATION: 200, // milliseconds
        VIEWPORT_UPDATE_THROTTLE: 100 // milliseconds
    },

    // Flight Plan Formats
    FLIGHT_PLAN_TYPES: {
        LOCAL_IFR: {
            name: 'Local IFR',
            fields: ['callsign', 'aircraftType', 'destination', 'sync', 'ifrFlag'],
            example: 'N77B P28A TOB 1A +',
            description: 'Local IFR flight with 4-char N-number'
        },
        LOCAL_VFR: {
            name: 'Local VFR',
            fields: ['callsign', 'aircraftType', 'sync'],
            example: '53Q C172 1A',
            description: 'Local VFR flight with 3-char callsign'
        },
        NATIONAL_IFR: {
            name: 'National IFR',
            fields: ['callsign', 'destination', 'aircraftType', 'sync', 'ifrFlag'],
            example: 'N12345 FCM P28A 1A +',
            description: 'National IFR flight with full N-number'
        },
        NATIONAL_VFR: {
            name: 'National VFR',
            fields: ['callsign', 'destination', 'aircraftType', 'sync'],
            example: 'N67890 TOB C172 1A',
            description: 'National VFR flight with full N-number'
        }
    },

    // Sample Data for Practice
    SAMPLE_DATA: {
        CALLSIGNS: {
            LOCAL_3CHAR: ['53Q', '77B', '123', '456', '789', 'ABC', 'DEF'],
            LOCAL_4CHAR: ['N77B', 'N123', 'N456', 'N789'],
            NATIONAL: ['N12345', 'N67890', 'N11111', 'N22222', 'N33333']
        },
        AIRCRAFT_TYPES: ['P28A', 'C172', 'C152', 'BE20', 'PA28', 'C182', 'SR22'],
        DESTINATIONS: ['TOB', 'FCM', 'RST', 'MSP', 'STC', 'DLH', 'FRM', 'GPZ'],
        SYNC_CODES: ['1A', '2A', '3A', '1B', '2B', '3B'],
        IFR_FLAG: '+'
    },

    // Keyboard Mapping
    KEYBOARD: {
        // Map QWERTY keys to STARS keys
        QWERTY_TO_STARS: {
            'a': 'A', 'b': 'B', 'c': 'C', 'd': 'D', 'e': 'E', 'f': 'F', 'g': 'G',
            'h': 'H', 'i': 'I', 'j': 'J', 'k': 'K', 'l': 'L', 'm': 'M', 'n': 'N',
            'o': 'O', 'p': 'P', 'q': 'Q', 'r': 'R', 's': 'S', 't': 'T', 'u': 'U',
            'v': 'V', 'w': 'W', 'x': 'X', 'y': 'Y', 'z': 'Z',
            '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
            'shift+8': '*', 'shift+=': '+', 'shift+6': '^',
            ' ': 'SPACE', 'backspace': 'BACKSPACE', 'delete': 'CLEAR'
        },

        // Special key handling
        SPECIAL_KEYS: {
            'SPACE': ' ',
            'BACKSPACE': 'backspace',
            'CLEAR': 'clear',
            '+': '+',
            '^': '^',
            '●': '●'
        }
    },

    // UI Messages
    MESSAGES: {
        READY: 'Ready for Flight Plan Entry',
        PRACTICE_MODE: 'Practice Mode - Type airport codes',
        FLIGHT_PLAN_MODE: 'Flight Plan Mode - Enter STARS format',
        CONNECTED: 'FDIO: Connected',
        DISCONNECTED: 'FDIO: Disconnected',
        CONNECTING: 'FDIO: Connecting...',
        SEND_SUCCESS: 'Flight plan sent successfully!',
        SEND_ERROR: 'Failed to send flight plan',
        INVALID_FORMAT: 'Invalid flight plan format',
        ENTRY_CLEARED: 'Entry cleared',
        CONNECTION_ERROR: 'Connection error - check FDIO server'
    },

    // Airport/Fix data for practice (subset of original list)
    AIRPORTS: [
        ['MSP', 'Minneapolis-St. Paul International'],
        ['RST', 'Rochester, MN'],
        ['STC', 'St. Cloud, MN'],
        ['DLH', 'Duluth, MN'],
        ['TOB', 'Dodge Center, MN'],
        ['FCM', 'Flying Cloud (Eden Prairie, MN)'],
        ['ANE', 'Anoka County (Blaine, MN)'],
        ['MIC', 'Crystal (Minneapolis, MN)'],
        ['SGS', 'South St. Paul (St. Paul, MN)'],
        ['LVN', 'Airlake (Lakeville, MN)'],
        ['FRM', 'Fairmont, MN'],
        ['GPZ', 'Grand Rapids, MN'],
        ['HIB', 'Hibbing, MN'],
        ['INL', 'International Falls, MN'],
        ['BRD', 'Brainerd, MN']
    ]
};

// Viewport height handler for mobile devices
export function setupViewportHeight() {
    function setViewportHeight() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    let throttleTimer = null;
    const throttledSetViewportHeight = () => {
        if (throttleTimer) return;
        throttleTimer = setTimeout(() => {
            setViewportHeight();
            throttleTimer = null;
        }, CONFIG.APP.VIEWPORT_UPDATE_THROTTLE);
    };

    setViewportHeight();
    window.addEventListener('resize', throttledSetViewportHeight);
    window.addEventListener('orientationchange', throttledSetViewportHeight);
}

// Validate flight plan format
export function validateFlightPlan(message) {
    if (!message || typeof message !== 'string') {
        return { valid: false, error: 'Empty message' };
    }

    const fields = message.trim().split(/\s+/);
    
    if (fields.length < 3) {
        return { valid: false, error: 'Minimum 3 fields required' };
    }

    const callsign = fields[0];
    const hasIFR = fields.includes('+');

    // Determine type based on callsign pattern
    let type = null;
    if (callsign.length === 3 && !callsign.startsWith('N')) {
        type = hasIFR ? 'LOCAL_IFR' : 'LOCAL_VFR';
    } else if (callsign.length === 4 && callsign.startsWith('N')) {
        type = 'LOCAL_IFR'; // Local IFR with N-number
    } else if (callsign.length > 4 && callsign.startsWith('N')) {
        type = hasIFR ? 'NATIONAL_IFR' : 'NATIONAL_VFR';
    }

    if (!type) {
        return { valid: false, error: 'Invalid callsign format' };
    }

    const expectedFields = CONFIG.FLIGHT_PLAN_TYPES[type].fields.length;
    if (fields.length !== expectedFields) {
        return { 
            valid: false, 
            error: `${type} requires ${expectedFields} fields, got ${fields.length}` 
        };
    }

    return { 
        valid: true, 
        type: type,
        fields: fields,
        description: CONFIG.FLIGHT_PLAN_TYPES[type].description
    };
}

export default CONFIG;