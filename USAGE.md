# STARS Keyboard Simulator - User Manual

## Getting Started

### System Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- FDIO server running on localhost:3001
- Python 3 or Node.js for HTTP server
- Keyboard and mouse/touchpad

### Launch Instructions

1. **Start the servers:**
   ```bash
   ./start.sh
   ```
   
2. **Open your web browser to:**
   ```
   http://localhost:8080
   ```

3. **Verify connection:**
   - Look for "FDIO: Connected" (green) in the top-right corner
   - If red "FDIO: Disconnected", check server status

## Interface Overview

### Main Components

#### 1. Control Bar (Top)
- **Flight Plan Mode Button** - Switch between modes (currently flight plan only)
- **Entry Prompt** - Shows current status and messages
- **Hint Text** - Additional information area
- **Entries Sent Counter** - Number of successful submissions
- **Connection Status** - FDIO server connection indicator

#### 2. Terminal Window (Middle)
- **Black screen with green text** - Shows your flight plan entry
- **Entry Controls** - Clear Entry button
- **Multi-line display** - Each SPACE creates a new line

#### 3. STARS Keyboard (Bottom)
- **Yellow keys** - Letters (A-Z), numbers (0-9), symbols (+, *, ^)
- **Blue keys** - Directional numbers with arrows
- **Green keys** - Function buttons (disabled in simulation)
- **Red ENTER button** - Sends flight plan to FDIO

## Using Your Physical Keyboard

### Key Mapping
Your computer keyboard maps directly to the STARS keyboard:

| Physical Key | STARS Key | Function |
|--------------|-----------|----------|
| A-Z | A-Z | Letter input |
| 0-9 | 0-9 | Number input |
| SPACEBAR | SPACE | Field separator (new line) |
| ENTER | ENTER | Send to FDIO |
| BACKSPACE | BACK SPACE | Delete last character |
| DELETE | CLEAR | Clear terminal |
| ESCAPE | CLEAR | Clear terminal |
| SHIFT + 8 | * | Asterisk |
| SHIFT + = | + | Plus (IFR flag) |
| SHIFT + 6 | ^ | Caret |

### Visual Feedback
- **On-screen keys flash** when you type
- **Yellow flash** for regular keys
- **Immediate response** for better typing experience

## Flight Plan Entry

### Flight Plan Types

The STARS system supports four types of flight plan entries:

#### Local IFR
For local aircraft operating under Instrument Flight Rules:
```
N77B
P28A
TOB
1A
+
```
**Fields:**
- **N77B** - 4-character N-number callsign
- **P28A** - Aircraft type
- **TOB** - Destination airport/fix
- **1A** - Sync code (for coordination)
- **+** - IFR flag (indicates instrument flight rules)

#### Local VFR
For local aircraft operating under Visual Flight Rules:
```
53Q
C172
1A
```
**Fields:**
- **53Q** - 3-character callsign
- **C172** - Aircraft type
- **1A** - Sync code

#### National IFR
For national aircraft operating under Instrument Flight Rules:
```
N12345
FCM
P28A
1A
+
```
**Fields:**
- **N12345** - Full N-number callsign
- **FCM** - Destination airport/fix
- **P28A** - Aircraft type
- **1A** - Sync code
- **+** - IFR flag

#### National VFR
For national aircraft operating under Visual Flight Rules:
```
N67890
TOB
C172
1A
```
**Fields:**
- **N67890** - Full N-number callsign
- **TOB** - Destination airport/fix
- **C172** - Aircraft type
- **1A** - Sync code

### Entry Process

1. **Type the first field** (callsign)
2. **Press SPACEBAR** to move to next line
3. **Type the second field** (aircraft type or destination)
4. **Press SPACEBAR** for next line
5. **Continue until all fields entered**
6. **Press ENTER** to send to FDIO

### Example Entry Session
```
1. Type: N77B
2. Press: SPACEBAR (creates new line)
3. Type: P28A
4. Press: SPACEBAR
5. Type: TOB
6. Press: SPACEBAR
7. Type: 1A
8. Press: SPACEBAR
9. Type: +
10. Press: ENTER (sends to FDIO)
```

## System Responses

### Success Messages
When a flight plan is successfully processed:
- **Green success message** appears in prompt area
- **Console log**: "✅ FDIO Success: Local IFR - N77B (0132)"
- **Counter increments** showing entries sent
- **Terminal clears** automatically
- **ENTER button re-enables** for next entry

### Error Messages
When there's an issue:
- **Red error message** appears in prompt area
- **Console log**: "❌ FDIO Error: [description]"
- **Terminal content remains** for correction
- **ENTER button stays available** for retry

### Connection Issues
When FDIO server is unavailable:
- **Status shows**: "FDIO: Disconnected" (red)
- **ENTER button disabled** (grayed out)
- **Cannot send flight plans** until reconnected
- **System automatically retries** every 10 seconds

## Common Procedures

### Standard Flight Plan Entry
1. Verify FDIO connection (green status)
2. Enter flight plan fields separated by SPACE
3. Review entry in terminal window
4. Press ENTER to send
5. Confirm success message
6. Begin next entry

### Correcting Mistakes
- **Wrong character**: Press BACKSPACE to delete last character
- **Wrong field**: Press BACKSPACE multiple times or CLEAR button
- **Start over**: Press DELETE or ESCAPE to clear terminal
- **After sending**: Cannot modify sent entries (contact controller)

### Clearing the Terminal
- **ESCAPE key** - Clears terminal and flashes CLEAR button
- **DELETE key** - Clears terminal and flashes CLEAR button
- **Clear Entry button** - Clears terminal (mouse/touch)

## Tips for Efficient Use

### Typing Speed
- **Use physical keyboard** for faster entry
- **Watch on-screen feedback** to confirm input
- **Develop muscle memory** for field sequences
- **Practice common aircraft types and airports**

### Error Prevention
- **Double-check callsigns** - Most critical field
- **Verify aircraft types** - Use standard ICAO codes
- **Confirm airport codes** - 3-4 character identifiers
- **Check IFR flag placement** - Always last field for IFR

### Workflow Optimization
- **Keep reference materials handy** - Aircraft types, airport codes
- **Use consistent formatting** - Follow examples exactly
- **Monitor console logs** - Watch for patterns in errors
- **Clear terminal between entries** - Avoid confusion

## Troubleshooting

### ENTER Button Not Working
**Symptoms**: Button appears grayed out
**Causes**:
- No content in terminal (type something first)
- FDIO server disconnected (check status)
- JavaScript error (check browser console)

**Solutions**:
1. Enter some text in terminal
2. Check FDIO server is running on port 3001
3. Refresh browser page
4. Check browser console for errors

### Keys Not Responding  
**Symptoms**: Typing doesn't appear in terminal
**Causes**:
- Browser focus lost
- JavaScript error
- Page not fully loaded

**Solutions**:
1. Click in browser window to focus
2. Refresh the page
3. Check browser console for errors
4. Verify servers are running

### Connection Problems
**Symptoms**: "FDIO: Disconnected" status
**Causes**:
- FDIO server not running
- Port 3001 blocked
- Network connectivity issues

**Solutions**:
1. Start FDIO server: `cd ../FDIO && node http-server.js`
2. Check server logs for errors
3. Test health endpoint: `curl http://localhost:3001/health`
4. Restart both servers

### Flight Plan Rejected
**Symptoms**: Error message after pressing ENTER
**Causes**:
- Invalid format
- Missing required fields
- Incorrect field order

**Solutions**:
1. Review format examples in this manual
2. Check field count and order
3. Verify callsign format (N-numbers, character count)
4. Ensure sync codes and flags are correct

## Browser Console

### Viewing Console Logs
1. **Open Developer Tools**: Press F12 or right-click → Inspect
2. **Go to Console tab**
3. **Monitor messages** while using application

### Important Log Messages
- `🔗 FDIO Connected` - Connection established
- `📡 Sending to FDIO: [message]` - Flight plan being sent  
- `✅ FDIO Success: [details]` - Successful processing
- `❌ FDIO Error: [error]` - Server-side error
- `❌ Network Error: [error]` - Connection problem

### Using Logs for Troubleshooting
- **No logs**: JavaScript not loading (check servers)
- **Connection logs only**: FDIO communication working
- **Error logs**: Review message format
- **Network errors**: Check FDIO server status

## Advanced Features

### Keyboard Shortcuts
- **ENTER**: Send flight plan (same as clicking ENTER button)
- **ESCAPE**: Clear terminal (same as clicking CLEAR ENTRY)
- **No other shortcuts currently implemented**

### Mobile/Tablet Use
- **Touch-friendly buttons** - All keys clickable
- **Responsive layout** - Adapts to screen size
- **Portrait/landscape support** - Automatic adjustment
- **Virtual keyboard compatible** - Works with on-screen keyboards

### Multiple Windows
- **Each browser tab independent** - Separate sessions
- **Shared FDIO server** - All tabs use same backend
- **Counter per session** - Entry counts not shared
- **Concurrent use supported** - Multiple operators possible

## Best Practices

### Data Entry Standards
- **Use uppercase letters** - System automatically converts
- **Standard aircraft codes** - ICAO 4-character codes preferred
- **Valid airport identifiers** - Use FAA LID or ICAO codes
- **Consistent sync codes** - Follow facility procedures

### Quality Control
- **Verify before sending** - Review terminal contents
- **Monitor success messages** - Confirm flight plan creation
- **Track squawk codes** - Note assigned beacon codes
- **Document issues** - Report systematic problems

### Training Recommendations
- **Start with examples** - Use provided flight plan samples
- **Practice basic types** - Master Local VFR/IFR first
- **Build speed gradually** - Accuracy before speed
- **Use real-world data** - Practice with actual callsigns/airports

This user manual provides comprehensive guidance for operating the STARS Keyboard Simulator effectively and efficiently.