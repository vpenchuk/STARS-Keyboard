# STARS Keyboard Simulator - Technical Documentation

## Architecture Overview

The STARS Keyboard Simulator is implemented as a single-page web application with real-time FDIO integration. The architecture was designed to avoid CORS issues while maintaining modularity and maintainability.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Backend Integration**: REST API communication with FDIO server
- **Styling**: Responsive CSS Grid layout with animations
- **Deployment**: HTTP server (Python or Node.js)

## File Architecture

### Current Implementation (Production)
```
index.html              # Single-file application
├── HTML Structure      # Keyboard layout and UI
├── CSS Styles         # Responsive design and animations
└── JavaScript Logic   # Combined application logic
```

### Legacy Implementation (Development)
```
js/
├── config.js          # Configuration and validation
├── keyboard.js        # Keyboard input handling
├── fdio-client.js     # FDIO HTTP communication
├── practice.js        # Training system (unused)
├── main.js           # Application controller
└── test.js           # Development testing
```

## Core Components

### 1. Keyboard Input System

#### Physical Keyboard Mapping
```javascript
// Key mapping logic
const keyMapping = {
    'a-z': 'A-Z',           // Letters to uppercase
    '0-9': '0-9',           // Numbers direct
    'shift+8': '*',         // Asterisk
    'shift+=': '+',         // Plus sign  
    'shift+6': '^',         // Caret
    ' ': 'SPACE',           // Space bar
    'Enter': 'ENTER',       // Enter key
    'Backspace': 'BACKSPACE', // Backspace
    'Delete': 'CLEAR',      // Delete key
    'Escape': 'CLEAR'       // Escape key
};
```

#### Visual Feedback System
```javascript
function flashKey(button) {
    button.classList.add('flash');
    setTimeout(() => {
        button.classList.remove('flash');
    }, 200);
}
```

### 2. FDIO Communication Layer

#### Connection Management
```javascript
async function checkConnection() {
    try {
        const response = await fetch('http://localhost:3001/health');
        if (response.ok) {
            if (!isConnected) {
                console.log('🔗 FDIO Connected');
            }
            isConnected = true;
            updateConnectionStatus('connected');
        }
    } catch (error) {
        if (isConnected) {
            console.log('⚠️ FDIO Disconnected');
        }
        isConnected = false;
        updateConnectionStatus('disconnected');
    }
}
```

#### Flight Plan Transmission
```javascript
async function sendToFDIO() {
    const message = content.split('\n').join(' ').replace(/\s+/g, ' ').trim();
    
    console.log('📡 Sending to FDIO:', message);
    
    try {
        const response = await fetch('http://localhost:3001/stars/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        
        const data = await response.json();
        // Handle response...
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}
```

### 3. UI State Management

#### Application State
```javascript
// Global application state
let content = '';           // Terminal content
let isConnected = false;    // FDIO connection status
let entriesSent = 0;        // Success counter
```

#### Button State Logic
```javascript
function updateEnterButton() {
    const hasContent = content.trim().length > 0;
    if (elements.enterBtn) {
        // Disabled when no content OR no connection
        elements.enterBtn.disabled = !hasContent || !isConnected;
    }
}
```

## CSS Grid Layout

### Keyboard Layout
```css
.keyboard {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    grid-template-rows: repeat(7, 1fr);
    gap: clamp(2px, 0.6vw, 6px);
}
```

### Responsive Design
```css
/* Scalable font sizes */
.key {
    font-size: clamp(14px, 2vw, 24px);
}

/* Mobile adaptations */
@media (max-width: 768px) {
    #entry-controls {
        flex-direction: column;
    }
}
```

## Event Handling System

### Event Flow
1. **Physical Key Press** → `keydown` event
2. **Key Mapping** → Convert to STARS key
3. **Visual Feedback** → Flash corresponding button
4. **Content Processing** → Update terminal or trigger action
5. **State Update** → Update UI and button states

### Event Listeners
```javascript
document.addEventListener('keydown', (e) => {
    // Prevent default browser behavior
    if (shouldHandleKey(e.key)) {
        e.preventDefault();
        handlePhysicalKey(e.key, e.shiftKey);
    }
});
```

## FDIO API Integration

### Message Format
STARS messages are converted from terminal format to API format:
```
Terminal: N77B
          P28A  
          TOB
          1A
          +

API: "N77B P28A TOB 1A +"
```

### Response Handling
```javascript
// Success response structure
{
    "success": true,
    "flightPlan": {
        "id": "FP_...",
        "aircraftID": "N77B", 
        "beaconCode": "0132",
        "route": "KRST.TOB"
    },
    "starsInfo": {
        "type": "Local",
        "rule": "IFR"
    }
}
```

## Error Handling

### Network Errors
- Connection timeouts
- Server unavailability  
- HTTP error responses
- JSON parsing failures

### User Input Validation
- Empty message detection
- Format validation (delegated to FDIO)
- Connection requirement enforcement

### Logging Strategy
- **Critical**: API communication and errors
- **Informational**: Connection status changes
- **Excluded**: Individual key presses and UI interactions

## Performance Optimizations

### DOM Caching
```javascript
// Cache DOM elements at initialization
const elements = {
    termContent: document.getElementById('term-content'),
    enterBtn: document.getElementById('btn-enter'),
    // ... other elements
};
```

### Event Debouncing
- Connection checks: 10-second intervals
- Flash animations: 200ms duration
- State updates: Immediate (no debouncing needed)

## Browser Compatibility

### Requirements
- ES6+ support (async/await, arrow functions)
- CSS Grid support
- Fetch API support
- Modern event handling

### Tested Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Security Considerations

### CORS Policy
- FDIO server configured with allowed origins
- No external API calls
- Local development environment

### Input Sanitization
- No HTML injection risks (textContent used)
- FDIO server handles input validation
- No client-side data persistence

## Development vs Production

### Development Mode
- Modular JavaScript files
- Requires HTTP server for ES6 modules
- Enhanced debugging capabilities

### Production Mode  
- Single HTML file
- No module dependencies
- Simplified deployment

## Debugging Guidelines

### Console Monitoring
1. Check for initialization messages
2. Monitor connection status logs
3. Verify API request/response logs
4. Watch for error messages

### Network Analysis
1. Open DevTools Network tab
2. Monitor /health endpoint calls
3. Inspect /stars/message POST requests
4. Check response status codes

### Common Issues

#### CORS Errors
- **Symptom**: Module loading failures
- **Solution**: Use HTTP server, not file:// protocol

#### Connection Issues
- **Symptom**: "FDIO: Disconnected" status
- **Solution**: Verify FDIO server on port 3001

#### Input Not Working
- **Symptom**: Keys not responding
- **Solution**: Check console for JavaScript errors

## Deployment Options

### Local Development
```bash
python3 -m http.server 8080
```

### Production Server
- Any HTTP server (Apache, Nginx, etc.)
- Serve index.html as static file
- Ensure FDIO server accessibility

## Future Enhancements

### Planned Features
- Practice mode integration
- Enhanced error reporting
- Configuration management
- Offline mode capability

### Architecture Improvements
- Service worker for offline support
- WebSocket real-time updates
- Local storage for user preferences
- Progressive Web App features