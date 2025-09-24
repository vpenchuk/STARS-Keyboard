# STARS Keyboard Simulator

A web-based simulation of the STARS (Standard Terminal Automation Replacement System) keyboard used in air traffic control facilities. This simulator provides authentic keyboard layout, flight plan entry functionality, and real-time integration with the FDIO (Flight Data Input Output) system.

## Overview

The STARS Keyboard Simulator is part of a larger ATC (Air Traffic Control) simulation environment that includes:
- **STARS Keyboard** (This module) - Flight plan entry interface
- **FDIO System** - Flight data processing and storage
- **ATC Radar Display** - Visual display of aircraft and flight plans

## Features

### 🎹 Authentic STARS Keyboard
- **Complete keyboard layout** with proper color coding
- **Yellow keys** - Alphanumeric input (A-Z, 0-9, symbols)
- **Green keys** - Function buttons (currently disabled for simulation)
- **Blue keys** - Directional numbers with arrow symbols
- **Red ENTER button** - Sends flight plans to FDIO

### ⌨️ Physical Keyboard Integration
- **QWERTY mapping** - Type on your computer keyboard
- **Visual feedback** - On-screen keys flash when physical keys are pressed
- **Special key support** - Shift combinations for symbols (*, +, ^)
- **Keyboard shortcuts** - Enter to send, Escape to clear

### ✈️ Flight Plan Entry
Supports all standard STARS flight plan formats:

#### Local IFR
```
N77B P28A TOB 1A +
```
- 4-character N-number callsign
- Aircraft type, destination, sync code, IFR flag

#### Local VFR  
```
53Q C172 1A
```
- 3-character callsign
- Aircraft type, sync code

#### National IFR
```
N12345 FCM P28A 1A +
```
- Full N-number callsign
- Destination, aircraft type, sync code, IFR flag

#### National VFR
```
N67890 TOB C172 1A
```
- Full N-number callsign  
- Destination, aircraft type, sync code

### 🔗 FDIO Integration
- **Real-time connection monitoring** to FDIO server
- **HTTP API communication** for flight plan submission
- **Automatic format validation** before sending
- **Success/error feedback** with flight plan details
- **Squawk code assignment** based on flight type

### 📱 Responsive Design
- **Mobile-friendly** interface
- **Scalable keyboard layout** adapts to screen size
- **Touch-friendly buttons** for tablet/mobile use

## Quick Start

### Prerequisites
- Node.js (for FDIO server)
- Python 3 (for HTTP server)
- Modern web browser with ES6 support

### Running the Simulator

1. **Start both servers:**
   ```bash
   ./start.sh
   ```
   
   Or manually:
   
   ```bash
   # Terminal 1 - Start FDIO server
   cd ../FDIO
   node http-server.js
   
   # Terminal 2 - Start STARS HTTP server  
   cd .
   python3 -m http.server 8080
   ```

2. **Open in browser:**
   ```
   http://localhost:8080
   ```

3. **Verify connection:**
   - Look for "FDIO: Connected" (green) in top-right
   - If disconnected, check that FDIO server is running on port 3001

### Basic Usage

1. **Enter a flight plan** using keyboard or mouse:
   ```
   N77B P28A TOB 1A +
   ```

2. **Use SPACEBAR** to separate fields (creates new lines in terminal)

3. **Press ENTER** (key or button) to send to FDIO

4. **Check console** for API communication logs

5. **View success message** with flight plan details and squawk code

## File Structure

```
STARS Keyboard/
├── README.md              # This file
├── TECHNICAL.md           # Technical documentation
├── API.md                 # API integration guide
├── USAGE.md              # User manual
├── CHANGELOG.md          # Version history
├── start.sh              # Startup script
├── index.html            # Main application
├── styles.css            # Stylesheet (legacy)
├── standalone.html       # Self-contained version
└── js/                   # Modular JavaScript (legacy)
    ├── config.js
    ├── keyboard.js
    ├── fdio-client.js
    ├── practice.js
    ├── main.js
    └── test.js
```

## Architecture

The simulator uses a **single-file architecture** (`index.html`) to avoid CORS issues and ensure reliable operation. The application consists of:

- **HTML Structure** - Keyboard layout and terminal interface
- **CSS Styling** - Responsive design and animations  
- **JavaScript Logic** - Input handling, FDIO communication, and UI updates

## Integration

### FDIO Server
The simulator communicates with the FDIO server running on `localhost:3001` using REST API calls:

- **Health Check**: `GET /health`
- **Send Flight Plan**: `POST /stars/message`

### ATC Radar Display
Flight plans submitted through STARS are processed by FDIO and made available to the radar display system for visualization.

## Development

### Console Logging
The application provides clean, professional logging:

- `🔗 FDIO Connected` - Connection established
- `📡 Sending to FDIO: [message]` - Flight plan transmission
- `✅ FDIO Success: [details]` - Successful processing
- `❌ FDIO Error: [error]` - Server-side errors
- `❌ Network Error: [error]` - Connection issues

### Debugging
1. Open browser developer console (F12)
2. Monitor network requests in Network tab
3. Check console for API communication logs
4. Verify FDIO server status at `http://localhost:3001/health`

## Version History

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## License

This project is part of the ATC Simulator suite and is intended for educational and training purposes.

## Support

For technical issues, check:
1. [TECHNICAL.md](TECHNICAL.md) - Technical documentation
2. [API.md](API.md) - API integration details  
3. Console logs for error messages
4. FDIO server status and logs