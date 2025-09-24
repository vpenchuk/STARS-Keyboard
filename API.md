# STARS Keyboard Simulator - API Documentation

## Overview

The STARS Keyboard Simulator integrates with the FDIO (Flight Data Input Output) system via HTTP REST API. This document details the API communication, message formats, and integration patterns.

## FDIO Server Integration

### Base Configuration
- **Server URL**: `http://localhost:3001`
- **Protocol**: HTTP/1.1
- **Content-Type**: `application/json`
- **Connection**: Keep-Alive (10-second health checks)

## API Endpoints

### 1. Health Check

**Endpoint**: `GET /health`

**Purpose**: Monitor FDIO server availability and connection status.

**Request**:
```http
GET /health HTTP/1.1
Host: localhost:3001
Content-Type: application/json
```

**Response (Success)**:
```json
{
    "status": "OK",
    "service": "FDIO HTTP Server",
    "timestamp": "2025-09-24T05:01:00.000Z",
    "uptime": 125.4
}
```

**Response (Error)**:
- HTTP 500+ status codes
- Network connection failures
- Timeout after 5 seconds

**STARS Implementation**:
```javascript
async function checkConnection() {
    try {
        const response = await fetch('http://localhost:3001/health');
        if (response.ok) {
            isConnected = true;
            console.log('🔗 FDIO Connected');
        }
    } catch (error) {
        isConnected = false;
        console.log('⚠️ FDIO Disconnected');
    }
}
```

### 2. Send STARS Message

**Endpoint**: `POST /stars/message`

**Purpose**: Submit flight plan data from STARS keyboard to FDIO for processing.

**Request**:
```http
POST /stars/message HTTP/1.1
Host: localhost:3001
Content-Type: application/json

{
    "message": "N77B P28A TOB 1A +"
}
```

**Response (Success)**:
```json
{
    "success": true,
    "message": "Flight plan created successfully",
    "flightPlan": {
        "id": "FP_1758604166661_drf5xd",
        "aircraftID": "N77B",
        "computerID": "053",
        "beaconCode": "0132",
        "route": "KRST.TOB",
        "state": "PROPOSED"
    },
    "starsInfo": {
        "type": "Local",
        "rule": "IFR",
        "squawkType": "ifr",
        "originalMessage": "N77B P28A TOB 1A +"
    },
    "timestamp": "2025-09-24T05:01:00.000Z"
}
```

**Response (Error)**:
```json
{
    "success": false,
    "error": "Invalid STARS message format - minimum 3 fields required",
    "timestamp": "2025-09-24T05:01:00.000Z"
}
```

**STARS Implementation**:
```javascript
async function sendToFDIO() {
    const message = content.split('\n').join(' ').replace(/\s+/g, ' ').trim();
    
    console.log('📡 Sending to FDIO:', message);
    
    const response = await fetch('http://localhost:3001/stars/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
    
    const data = await response.json();
    
    if (data.success) {
        console.log('✅ FDIO Success:', 
            `${data.starsInfo.type} ${data.starsInfo.rule} - ${data.flightPlan.aircraftID} (${data.flightPlan.beaconCode})`);
    } else {
        console.error('❌ FDIO Error:', data.error);
    }
}
```

## Message Formats

### STARS Input Format

STARS keyboard entries use newline-separated fields that are converted to space-separated format for API transmission.

#### Terminal Display:
```
N77B
P28A
TOB
1A
+
```

#### API Message:
```json
{
    "message": "N77B P28A TOB 1A +"
}
```

### Flight Plan Types

#### Local IFR
**Format**: `N77B P28A TOB 1A +`
- **Callsign**: 4-character N-number (N77B)
- **Aircraft Type**: P28A
- **Destination**: TOB
- **Sync Code**: 1A
- **IFR Flag**: +
- **Squawk Range**: 01XX (Local IFR)

#### Local VFR
**Format**: `53Q C172 1A`
- **Callsign**: 3-character (53Q)
- **Aircraft Type**: C172
- **Sync Code**: 1A
- **Squawk Range**: 04XX (Local VFR)

#### National IFR
**Format**: `N12345 FCM P28A 1A +`
- **Callsign**: Full N-number (N12345)
- **Destination**: FCM
- **Aircraft Type**: P28A
- **Sync Code**: 1A
- **IFR Flag**: +
- **Squawk Range**: Generic

#### National VFR
**Format**: `N67890 TOB C172 1A`
- **Callsign**: Full N-number (N67890)
- **Destination**: TOB
- **Aircraft Type**: C172
- **Sync Code**: 1A
- **Squawk Range**: Generic

## Response Processing

### Success Response Fields

| Field | Description | Example |
|-------|-------------|---------|
| `success` | Operation status | `true` |
| `message` | Status message | "Flight plan created successfully" |
| `flightPlan.id` | Unique flight plan ID | "FP_1758604166661_drf5xd" |
| `flightPlan.aircraftID` | Aircraft callsign | "N77B" |
| `flightPlan.computerID` | Computer ID (CID) | "053" |
| `flightPlan.beaconCode` | Assigned squawk code | "0132" |
| `flightPlan.route` | Flight route | "KRST.TOB" |
| `flightPlan.state` | Flight plan state | "PROPOSED" |
| `starsInfo.type` | Flight type | "Local" or "National" |
| `starsInfo.rule` | Flight rules | "IFR" or "VFR" |
| `starsInfo.squawkType` | Squawk classification | "ifr", "vfr", "generic" |
| `starsInfo.originalMessage` | Original STARS input | "N77B P28A TOB 1A +" |

### Error Response Fields

| Field | Description | Example |
|-------|-------------|---------|
| `success` | Always `false` for errors | `false` |
| `error` | Error description | "Invalid STARS message format" |
| `timestamp` | Error timestamp | "2025-09-24T05:01:00.000Z" |

## Error Handling

### Network Errors
```javascript
try {
    const response = await fetch(url);
    // Handle response
} catch (error) {
    console.error('❌ Network Error:', error.message);
    // Handle network failure
}
```

### HTTP Errors
```javascript
if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
```

### Server Errors
```javascript
const data = await response.json();
if (!data.success) {
    console.error('❌ FDIO Error:', data.error);
    showMessage(`❌ Error: ${data.error}`, 'error');
}
```

## Connection Management

### Connection States
- **Connected**: FDIO server responding to health checks
- **Disconnected**: Server unavailable or network issues
- **Connecting**: Health check in progress

### Health Check Schedule
- **Initial**: On page load
- **Periodic**: Every 10 seconds
- **After Error**: Immediate retry on next operation

### UI State Updates
```javascript
function updateConnectionStatus(status) {
    elements.connectionStatusEl.textContent = 
        status === 'connected' ? 'FDIO: Connected' : 'FDIO: Disconnected';
    elements.connectionStatusEl.classList.remove('connected', 'disconnected');
    elements.connectionStatusEl.classList.add(status);
}
```

## Rate Limiting

### Current Implementation
- No explicit rate limiting
- Connection pooling via browser
- 5-second timeout per request

### Recommendations
- Implement client-side debouncing for rapid submissions
- Server-side rate limiting on FDIO endpoints
- Connection pooling optimization

## Security Considerations

### CORS Configuration
FDIO server must allow STARS origin:
```javascript
// FDIO server CORS configuration
app.use(cors({
    origin: ['http://localhost:8080'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Input Validation
- Client-side: Basic format checking
- Server-side: Comprehensive STARS message validation
- No sensitive data transmission

## Testing and Debugging

### API Testing
```bash
# Test health endpoint
curl http://localhost:3001/health

# Test STARS message
curl -X POST http://localhost:3001/stars/message \
  -H "Content-Type: application/json" \
  -d '{"message":"N77B P28A TOB 1A +"}'
```

### Network Monitoring
1. Open DevTools → Network tab
2. Filter by "localhost:3001"
3. Monitor request/response cycles
4. Check for failed requests or timeouts

### Console Debugging
Monitor these log patterns:
```
🔗 FDIO Connected
📡 Sending to FDIO: N77B P28A TOB 1A +
✅ FDIO Success: Local IFR - N77B (0132)
❌ FDIO Error: Invalid format
❌ Network Error: Failed to fetch
```

## Integration Patterns

### Polling Pattern (Health Checks)
```javascript
setInterval(checkConnection, 10000);
```

### Request-Response Pattern (Flight Plans)
```javascript
// Immediate request on user action
button.addEventListener('click', async () => {
    await sendToFDIO();
});
```

### State Synchronization
```javascript
// Update UI based on connection state
function updateEnterButton() {
    elements.enterBtn.disabled = !hasContent || !isConnected;
}
```

## Future API Enhancements

### Proposed Features
- **WebSocket Connection**: Real-time updates
- **Batch Submission**: Multiple flight plans
- **Status Updates**: Flight plan state changes
- **Authentication**: Secure access control

### API Versioning
- Current: Unversioned endpoints
- Recommended: `/api/v1/` prefix for future versions
- Backward compatibility maintenance

## Related Documentation

- **FDIO HTTP_API.md**: Complete FDIO API specification
- **ATC Simulator WARP.md**: Overall system architecture
- **STARS TECHNICAL.md**: Implementation details