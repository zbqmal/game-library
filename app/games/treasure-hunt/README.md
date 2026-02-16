# TreasureHunt Game

## Table of Contents
1. [Overview](#overview)
2. [Game Rules](#game-rules)
3. [Local Multiplayer](#local-multiplayer)
4. [Online Multiplayer](#online-multiplayer)
5. [Gameplay Scenarios](#gameplay-scenarios)
6. [Architecture](#architecture)
7. [API Documentation](#api-documentation)
8. [Known Issues](#known-issues)
9. [Future Enhancements](#future-enhancements)

---

## Overview

TreasureHunt is a turn-based multiplayer game where players take turns uncovering tiles on a grid to find a hidden treasure. The game supports both local (hot-seat) and online multiplayer modes.

### Core Mechanics

- **Turn-Based Gameplay**: Players alternate turns uncovering tiles
- **Hidden Treasure**: One tile contains a treasure (💎), others are empty (🕳️)
- **Covered Tiles**: All tiles start covered with shrubs (🌳)
- **Win Condition**: First player to uncover the treasure wins

### Supported Modes

- **Local Multiplayer**: 2-6 players on the same device (hot-seat)
- **Online Multiplayer**: 2-6 players across devices with real-time synchronization

---

## Game Rules

### How to Play

1. Players take turns clicking on covered tiles
2. Each tile reveals either:
   - **💎 Treasure**: Player wins immediately
   - **🕳️ Empty**: Turn passes to next player
3. All tiles start covered with **🌳 shrubs**
4. First player to find the treasure wins

### Turn-Based Mechanics

- Players alternate in sequential order (Player 1 → Player 2 → ... → Player N → Player 1)
- Only the current player can uncover tiles
- Once a tile is uncovered, it cannot be clicked again
- Game ends immediately when treasure is found

### Tile Types

| Tile State | Visual | Description |
|------------|--------|-------------|
| Covered | 🌳 | Unclicked tile, appears as a green shrub |
| Empty | 🕳️ | Revealed empty tile with hole |
| Treasure | 💎 | Winning tile with diamond |

### Grid Sizes Available

- **3×3 grid**: 9 tiles
- **4×4 grid**: 16 tiles
- **5×5 grid**: 25 tiles
- **6×6 grid**: 36 tiles

### Player Count

- **Minimum**: 2 players
- **Maximum**: 6 players (absolute limit)
- **Grid-Based Limit**: Cannot exceed half the number of tiles
  - 3×3 grid: max 4 players
  - 4×4, 5×5, 6×6 grids: max 6 players

---

## Local Multiplayer

Local multiplayer allows 2-6 players to play on the same device using hot-seat gameplay.

### Configuration

1. Navigate to **TreasureHunt** game page
2. Select **Grid Size** (3×3, 4×4, 5×5, or 6×6)
3. Enter **Number of Players** (2-6, respecting grid limits)
4. Enter **Player Names** (optional, up to 20 characters each)
   - Default names: "Player 1", "Player 2", etc.
5. Click **Start Game**

### Hot-Seat Gameplay

- All players share the same device
- Players take turns physically passing the device
- Current player's name is displayed at the top
- Only covered tiles are clickable during your turn

### Player Name Customization

- Each player can have a custom name (max 20 characters)
- Empty names default to "Player 1", "Player 2", etc.
- Names are displayed throughout the game

### Grid Size Selection

Grid size determines the number of tiles and maximum players:

| Grid Size | Total Tiles | Max Players |
|-----------|-------------|-------------|
| 3×3 | 9 | 4 |
| 4×4 | 16 | 6 |
| 5×5 | 25 | 6 |
| 6×6 | 36 | 6 |

---

## Online Multiplayer

Online multiplayer enables players to join from different devices with real-time synchronization via Firebase Firestore.

### Complete Flow

#### 1. Room Creation

**Steps:**
1. Navigate to **TreasureHunt** → Click "Play Online Multiplayer"
2. Enter your **username** (max 20 characters)
3. Click **"Create Room"**
4. System automatically assigns:
   - 6-character room code (e.g., "ABC123")
   - Grid size: 3×3 (default)
   - Max players: 4 (default, based on 3×3 grid)
   - Player number: 1 (host)
   - Room status: "waiting"

**Important Notes:**
- Room code is unique and case-insensitive
- Host is always playerNumber 1
- Default max players is 4 (can change with grid size)
- Room expires after 1 hour of inactivity

#### 2. Joining a Room

**Steps:**
1. Enter the **room code** (6 characters)
2. Enter your **username**
3. Click **"Join Room"**
4. System assigns sequential playerNumber (2, 3, 4, etc.)

**Join Conditions:**
- Room must exist and status must be "waiting"
- Room cannot be full (playerCount < maxPlayers)
- Valid username (1-20 characters)

**Join Failures:**
- Room not found (404)
- Room full (400)
- Room already started (cannot join mid-game)

#### 3. Lobby (Waiting State)

**Host Capabilities:**
- Change grid size (3×3, 4×4, 5×5, or 6×6)
  - Changing grid size automatically updates maxPlayers
  - If current playerCount exceeds new maxPlayers, change is rejected
- Start game (requires 2+ players)
- Leave room (host transfers to next player)

**Non-Host Capabilities:**
- View grid size (read-only)
- View player list with host indicator (⭐)
- Copy room link to share
- Leave room

**Lobby Display:**
- **Room Code**: Displayed prominently at top
- **Player List**: Shows all players with:
  - Player number and username
  - Host indicator (⭐ for host)
  - "(You)" label for current user
  - Disconnected status (🔴 if lastSeen > 1 minute)
- **Grid Size**: Selectable by host, read-only for others
- **Buttons**:
  - "📋 Copy Code" - Copy room code to clipboard
  - "🔗 Share Link" - Copy/share room URL
  - "Start Game" - Host only, enabled when 2+ players
  - "Leave Room" - All players

#### 4. Active Game

**Game Start:**
- Host clicks "Start Game"
- Room status changes to "playing"
- Game state initialized with random treasure position
- All players see the game board

**Turn Display:**
- **Current Player**: Sees "🎯 Your Turn!" banner + clickable tiles
- **Other Players**: See "Waiting for [Player Name]..." + disabled tiles
- Player list highlights current player with green background

**Making Moves:**
1. Current player clicks a covered tile (🌳)
2. Optimistic UI update shows loading spinner
3. API validates move (correct player, valid tile)
4. Tile reveals either:
   - **💎 Treasure**: Game ends, winner announced
   - **🕳️ Empty**: Turn passes to next player
5. Real-time update via Firestore syncs to all players

**Real-Time Synchronization:**
- All game state changes broadcast via Firestore listeners
- Players see moves in real-time
- Optimistic updates for smooth UX
- Haptic feedback on mobile devices

**In-Game Buttons:**
- **"Back to TreasureHunt"**: Any player can leave
  - Leaving player returns to main TreasureHunt page
  - Remaining players sent back to lobby
  - Room resets to "waiting" status
  - If host leaves, next player becomes host

#### 5. Game Over (Finished State)

**Winner Display:**
- Large trophy emoji (🎉)
- "🎉 [Player Name] wins!" message
- Shows number of tiles uncovered

**Host Capabilities:**
- **"Play Again"** button:
  - Immediately starts new game with same players and grid size
  - Generates new treasure position
  - Room status: "waiting" → "playing"
- **"Back to Lobby"** button:
  - Returns all players to lobby (waiting state)
  - Clears game state
  - Host can change grid size again

**Non-Host Display:**
- **"Back to Lobby"** button (disabled/grayed out)
- "Waiting for host..." message
- Cannot start new game or return to lobby independently

#### 6. Back to Lobby

**Host-Initiated Flow:**
1. Host clicks "Back to Lobby" after game ends
2. Room status changes to "waiting"
3. Game state clears (gameState: null)
4. All players return to lobby view
5. Host can change grid size for next game
6. Host can start new game when ready

**Why Host-Only:**
- Prevents conflicts (multiple players trying to return simultaneously)
- Host maintains control over room flow
- Clear authority structure

#### 7. Leaving Room

**From Lobby:**
- Click "Leave Room" button
- Player removed from room.players
- If host leaves:
  - Next player (lowest playerNumber) becomes host
  - Host transferred automatically
- If last player leaves:
  - Room deleted automatically

**From Active Game:**
- Click "Back to TreasureHunt" button
- Leaving player returns to main page
- **All other players sent to lobby**
- Room status resets to "waiting"
- Game state clears
- Players can start new game

**Host Transfer:**
- Occurs when host leaves
- Next sequential player becomes host
- Host indicator (⭐) updates automatically
- New host gains all host privileges

#### 8. Reconnection

**Automatic Reconnection:**
- Session data stored in `sessionStorage`:
  - playerId (UUID)
  - roomCode (6 chars)
  - username (string)
  - timestamp (milliseconds)
- On page refresh:
  - Checks sessionStorage
  - Verifies session not expired (<1 hour)
  - Verifies room still exists
  - Auto-rejoins room seamlessly
- If successful: Returns to lobby/game as if never left
- If failed: Clears session, shows error message

**Session Expiration:**
- Sessions expire after **1 hour**
- Expired sessions cannot reconnect
- User must create/join new room

**Room Cleanup:**
- Rooms auto-delete after 1 hour of inactivity
- Based on `lastActivity` timestamp
- Prevents database bloat
- Disconnected players shown with 🔴 indicator

**Heartbeat System:**
- Client sends heartbeat every 30 seconds
- Updates player's `lastSeen` timestamp
- Players shown as disconnected if `lastSeen` > 1 minute
- Heartbeat stops when tab inactive (future enhancement)

---

## Gameplay Scenarios

Comprehensive scenarios covering all aspects of room management, gameplay, and edge cases.

### 1. Room Creation & Joining

#### Scenario 1.1: Basic room creation

**Context**: New player wants to start an online game

**Steps:**
1. Alice navigates to TreasureHunt online multiplayer
2. Enters username "Alice"
3. Clicks "Create Room"

**Expected Result:**
- Room created with 6-character code (e.g., "XYZ789")
- Alice is host (playerNumber 1)
- Grid size: 3×3 (default)
- Max players: 4 (default)
- Status: "waiting"
- Alice sees lobby with room code and options to change grid size

**API Call:**
```
POST /api/rooms/create
Body: { username: "Alice" }
Response: { roomCode: "XYZ789", playerId: "uuid-alice" }
```

#### Scenario 1.2: Second player joins

**Context**: Another player wants to join Alice's room

**Steps:**
1. Bob enters room code "XYZ789"
2. Enters username "Bob"
3. Clicks "Join Room"

**Expected Result:**
- Bob joins as playerNumber 2
- Both Alice and Bob see updated player list
- Bob sees grid size (read-only)
- Alice can still change grid size
- Alice can now start game (2+ players met)

**API Call:**
```
POST /api/rooms/join
Body: { roomCode: "XYZ789", username: "Bob" }
Response: { playerId: "uuid-bob", playerNumber: 2 }
```

#### Scenario 1.3: Third player joins mid-lobby

**Context**: Carol joins while Alice and Bob are configuring

**Steps:**
1. Alice changes grid size to 4×4 (maxPlayers now 6)
2. Carol joins with code "XYZ789"
3. Enters username "Carol"

**Expected Result:**
- Carol joins as playerNumber 3
- All three players see updated player list
- Grid size is 4×4 for everyone
- Max players shown as 6
- Real-time sync ensures everyone sees same state

### 2. Lobby Configuration

#### Scenario 2.1: Host changes grid size

**Context**: Alice wants larger grid for more players

**Steps:**
1. Alice (host) in lobby with Bob
2. Alice clicks "5×5" grid size button
3. System updates grid size

**Expected Result:**
- Grid size changes to 5×5
- Max players updates to 6
- Both Alice and Bob see update in real-time
- Info text updates: "5×5 grid = 25 tiles (max 6 players)"

**API Call:**
```
POST /api/rooms/XYZ789/update-config
Body: { gridSize: 5 }
Response: 200 OK
```

**Real-Time Update:**
- Firestore listener broadcasts config change
- All players' UIs update automatically

#### Scenario 2.2: Host changes grid size with too many players (validation)

**Context**: 5 players in room, host tries to change to 3×3

**Steps:**
1. Room has 5 players
2. Alice (host) clicks "3×3" grid size button
3. System validates change

**Expected Result:**
- API rejects change (400 error)
- Error message: "Cannot set grid size to 3×3. Current player count (5) exceeds maximum allowed players (4) for this grid size."
- Grid size remains unchanged
- Toast error shown to Alice

**Validation Logic:**
```typescript
maxPlayers = min(6, floor(gridSize * gridSize / 2))
if (currentPlayerCount > maxPlayers) {
  reject with error
}
```

#### Scenario 2.3: Non-host tries to change grid size

**Context**: Bob (non-host) wants to change grid size

**Steps:**
1. Bob clicks on grid size button

**Expected Result:**
- Buttons are not interactive for Bob (read-only display)
- Only shows current grid size as text
- No API call made
- UI shows "Grid Size: 3×3 (9 tiles)" without buttons

### 3. Starting the Game

#### Scenario 3.1: Host starts game successfully

**Context**: Alice (host) has Bob and Carol in lobby, ready to start

**Steps:**
1. Alice clicks "Start Game" button
2. System validates (2+ players, host privileges)
3. Game initializes

**Expected Result:**
- Room status changes: "waiting" → "playing"
- Game state initialized:
  - Random treasure position generated
  - All tiles set to "covered"
  - Current player: 1 (Alice)
- All players see game board
- Alice sees "Your Turn!" message
- Bob and Carol see "Waiting for Alice..." message

**API Call:**
```
POST /api/rooms/XYZ789/start
Body: { playerId: "uuid-alice" }
Response: 200 OK
```

**Game State:**
```typescript
{
  tiles: ["covered", "covered", ...], // 9 tiles for 3×3
  treasurePosition: 5, // random 0-8
  currentPlayer: 1,
  winner: null,
  isGameOver: false,
  playerCount: 3,
  playerNames: ["Alice", "Bob", "Carol"],
  gridSize: 3
}
```

#### Scenario 3.2: Non-host tries to start game

**Context**: Bob (non-host) tries to start game

**Steps:**
1. Bob attempts to click "Start Game" button

**Expected Result:**
- Button not visible to Bob (host-only UI)
- If API somehow called: 403 Forbidden error
- Only host can start games

#### Scenario 3.3: Start game with less than 2 players

**Context**: Alice (host) alone in lobby

**Steps:**
1. Alice clicks "Start Game" button

**Expected Result:**
- Button disabled (grayed out)
- Validation prevents start: minimum 2 players required
- If API called: 400 error "Need at least 2 players to start"

### 4. Gameplay - Making Moves

#### Scenario 4.1: Player 1's first move (non-treasure)

**Context**: Game started, Alice's turn

**Steps:**
1. Alice clicks tile at position 0
2. Tile is not treasure (empty)

**Expected Result:**
- Optimistic UI: Tile shows loading spinner immediately
- API processes move
- Tile updates to "uncovered-empty" (🕳️)
- Current player changes: 1 → 2
- Real-time update to all players
- Bob now sees "Your Turn!" banner
- Alice sees "Waiting for Bob..."

**API Call:**
```
POST /api/rooms/XYZ789/move
Body: { playerId: "uuid-alice", tilePosition: 0 }
Response: 200 OK
```

**State Update:**
```typescript
{
  tiles: ["uncovered-empty", "covered", "covered", ...],
  currentPlayer: 2, // Bob's turn
  ...
}
```

#### Scenario 4.2: Player 2's move (out of turn attempt)

**Context**: Alice's turn, but Bob tries to move

**Steps:**
1. Current player is Alice (player 1)
2. Bob clicks a tile

**Expected Result:**
- Bob's UI prevents click (tiles disabled/not clickable)
- If somehow API called: 403 error "Not your turn"
- Toast message: "It's not your turn!"
- No game state change
- Alice's turn continues

#### Scenario 4.3: Player finds treasure

**Context**: Carol's turn, clicks treasure tile

**Steps:**
1. Current player: Carol (player 3)
2. Carol clicks tile at position 5 (treasure position)

**Expected Result:**
- Optimistic UI: Tile shows loading
- API processes move
- Tile updates to "uncovered-treasure" (💎)
- Game state updates:
  - `winner: 3`
  - `isGameOver: true`
- All players see:
  - "🎉 Carol wins!" message
  - Treasure tile revealed
  - Progress shown: "Found after X tiles uncovered"
- Host sees: "Play Again" and "Back to Lobby" buttons
- Non-hosts see: Disabled "Back to Lobby" + "Waiting for host..."

**State Update:**
```typescript
{
  tiles: [..., "uncovered-treasure", ...],
  winner: 3,
  isGameOver: true,
  ...
}
```

**Room Status:**
- Changes to "finished"

### 5. Post-Game Actions

#### Scenario 5.1: Host clicks "Play Again"

**Context**: Game finished, Alice (host) wants immediate rematch

**Steps:**
1. Game over, Carol won
2. Alice clicks "Play Again" button
3. System restarts game

**Expected Result:**
- New game starts immediately
- Room status: "finished" → "playing"
- New game state:
  - New random treasure position
  - All tiles reset to "covered"
  - Current player: 1 (Alice)
- All players see fresh game board
- Same players, same grid size
- **Does not return to lobby**

**API Call:**
```
POST /api/rooms/XYZ789/start
Body: { playerId: "uuid-alice" }
Response: 200 OK
```

#### Scenario 5.2: Host clicks "Back to Lobby" (only host can enable)

**Context**: Game finished, Alice wants to return to lobby (maybe change grid size)

**Steps:**
1. Game over, Carol won
2. Alice clicks "Back to Lobby" button
3. System returns to lobby

**Expected Result:**
- Room status: "finished" → "waiting"
- Game state clears (gameState: null)
- All players return to lobby view
- Player list maintained
- Alice can change grid size again
- Alice can start new game when ready
- Bob and Carol see grid size (read-only)

**API Call:**
```
POST /api/rooms/XYZ789/back-to-lobby
Response: 200 OK
```

#### Scenario 5.3: Player clicks "Back to TreasureHunt" during game (leaves, others to lobby)

**Context**: Mid-game, Bob needs to leave

**Steps:**
1. Game in progress (status: "playing")
2. Bob clicks "Back to TreasureHunt" button
3. Bob leaves room

**Expected Result:**
- Bob redirected to main TreasureHunt page
- Bob removed from room.players
- **All remaining players sent to lobby**
- Room status: "playing" → "waiting"
- Game state clears
- Alice and Carol see lobby
- If Bob was host: Carol becomes new host
- Players can start new game from lobby

**Why send others to lobby:**
- Prevents game state corruption
- Fair to all players (game interrupted)
- Clear reset point

#### Scenario 5.4: Host clicks "Stop Game" (with confirmation prompt)

**Context**: Mid-game, Alice (host) wants to stop and return to lobby

**Steps:**
1. Game in progress
2. Alice clicks "Stop Game" button
3. Confirmation dialog appears: "Are you sure you want to stop the game?"
4. Alice confirms

**Expected Result:**
- Room status: "playing" → "waiting"
- Game state clears
- All players return to lobby
- No winner declared
- Alice can start new game or change grid size

**Note**: This feature is mentioned in requirements but needs implementation verification. Currently, the "Back to TreasureHunt" button serves this purpose when anyone leaves during game.

### 6. Leaving Room

#### Scenario 6.1: Non-host leaves from lobby

**Context**: Bob wants to leave before game starts

**Steps:**
1. In lobby, 3 players (Alice host, Bob, Carol)
2. Bob clicks "Leave Room"
3. Bob removed from room

**Expected Result:**
- Bob redirected to landing page
- Bob's sessionStorage cleared
- Alice and Carol see updated player list (2 players)
- Room continues with Alice (host) and Carol
- Room still valid, can add new players

**API Call:**
```
POST /api/rooms/XYZ789/leave
Body: { playerId: "uuid-bob" }
Response: 200 OK
```

#### Scenario 6.2: Host leaves from lobby (host transfer)

**Context**: Alice (host) needs to leave, Bob and Carol still in room

**Steps:**
1. In lobby, 3 players (Alice playerNumber 1, Bob 2, Carol 3)
2. Alice clicks "Leave Room"
3. Alice removed, host transfers

**Expected Result:**
- Alice redirected to landing page
- Bob becomes new host (lowest playerNumber: 2)
- Bob now has host controls:
  - Can change grid size
  - Can start game
  - Sees host star (⭐)
- Carol sees Bob as host
- Room continues normally with Bob as host

**Host Transfer Logic:**
```typescript
// Find next host (lowest playerNumber)
const remainingPlayers = Object.values(room.players)
  .filter(p => p.playerId !== leavingPlayerId)
  .sort((a, b) => a.playerNumber - b.playerNumber);

if (remainingPlayers.length > 0) {
  newHostId = remainingPlayers[0].playerId;
  // Update room.hostId and player.isHost flags
}
```

#### Scenario 6.3: Last player leaves (room deletion)

**Context**: Only Alice remains in room

**Steps:**
1. Alice (only player) clicks "Leave Room"
2. Room has no remaining players

**Expected Result:**
- Alice redirected to landing page
- Room document deleted from Firestore
- Room code freed for reuse
- Cleanup prevents orphaned rooms

**API Logic:**
```typescript
if (remainingPlayerCount === 0) {
  await db.collection('rooms').doc(roomCode).delete();
}
```

### 7. Reconnection

#### Scenario 7.1: Page refresh during lobby

**Context**: Alice accidentally refreshes browser in lobby

**Steps:**
1. Alice in lobby, room code "XYZ789"
2. Browser refreshes (F5 or accidental close)
3. Page reloads

**Expected Result:**
- Component checks sessionStorage on mount
- Finds: playerId, roomCode, username, timestamp
- Verifies session not expired (<1 hour)
- Verifies room exists (GET /api/rooms/XYZ789)
- Auto-rejoins room seamlessly
- Alice sees lobby as if never left
- Session preserved

**SessionStorage Data:**
```javascript
{
  "treasure-hunt-player-id": "uuid-alice",
  "treasure-hunt-room-code": "XYZ789",
  "treasure-hunt-username": "Alice",
  "treasure-hunt-timestamp": "1707667288000"
}
```

#### Scenario 7.2: Page refresh during active game

**Context**: Bob refreshes during his turn

**Steps:**
1. Game in progress, Bob's turn
2. Browser refreshes
3. Page reloads

**Expected Result:**
- Auto-reconnection via sessionStorage
- Verifies room exists and status is "playing"
- Bob sees game board with current state
- If still Bob's turn: Sees "Your Turn!" banner
- If turn moved: Sees "Waiting for [Player]..."
- Game continues seamlessly

**Why it works:**
- Game state stored in Firestore (server-side)
- Real-time listener re-established
- Client simply re-subscribes to updates

#### Scenario 7.3: Session expired (>1 hour)

**Context**: Alice created room, left browser idle for 2 hours

**Steps:**
1. Alice returns after 2 hours
2. Page refreshes (or navigates back)
3. Component checks sessionStorage

**Expected Result:**
- Timestamp check: `Date.now() - timestamp > 3600000` (1 hour in ms)
- Session marked as expired
- SessionStorage cleared
- Toast error: "Your session has expired. Please create or join a new room."
- Shows landing page
- Must create/join new room

**Additionally:**
- Room likely auto-deleted (1 hour inactivity cleanup)
- Even if room exists, session not valid

### 8. Network Issues

#### Scenario 8.1: Network drop during move

**Context**: Alice makes move but network disconnects

**Steps:**
1. Alice clicks tile
2. Optimistic UI updates (shows loading)
3. Network request fails (timeout/no connection)

**Expected Result:**
- API call fails with error
- Optimistic update reverted (tile back to covered)
- Error toast: "That move couldn't be completed. Please try again."
- Game state unchanged (server-side)
- Alice can retry move
- Other players unaffected

**Error Handling:**
```typescript
try {
  await fetch('/api/rooms/XYZ789/move', { ... });
} catch (err) {
  setOptimisticTile(null); // Revert
  setToastError('Move failed. Please try again.');
}
```

#### Scenario 8.2: Firestore listener disconnects

**Context**: Firestore connection lost during game

**Steps:**
1. Network interruption or Firestore issue
2. Listener connection drops

**Expected Result:**
- `onSnapshot` error callback triggers
- Error toast: "Lost connection to game server. Please refresh."
- User prompted to refresh page
- On refresh: Reconnection flow (see Scenario 7.2)
- Game state preserved (server-side)

**Error Handler:**
```typescript
onSnapshot(roomRef, 
  (snapshot) => { /* success */ },
  (error) => {
    console.error('Firestore error:', error);
    setToastError('Lost connection. Please refresh.');
  }
);
```

### 9. Edge Cases

#### Scenario 9.1: Double-click tile

**Context**: Alice rapidly clicks same tile twice

**Steps:**
1. Alice's turn
2. Alice double-clicks tile at position 3
3. First click registers

**Expected Result:**
- First click: Optimistic update, API call initiated
- Second click: Prevented by `loading` or `optimisticTile` state
- Only one API call made
- Tile uncovered once
- No duplicate move

**Prevention Logic:**
```typescript
if (loading || optimisticTile !== null) {
  return; // Prevent duplicate clicks
}
```

#### Scenario 9.2: Two players click different tiles simultaneously

**Context**: Bug - both players click at exact same moment

**Steps:**
1. Alice's turn (player 1)
2. Bob somehow clicks tile at same instant
3. Both API calls sent

**Expected Result:**
- Server validates turn on each request
- Alice's move: Succeeds (correct player)
- Bob's move: Fails (403 "Not your turn")
- Only Alice's move processed
- Game state updated correctly
- Bob sees error toast (client-side)

**Server-Side Validation:**
```typescript
if (gameState.currentPlayer !== playerNumber) {
  return { error: "Not your turn", status: 403 };
}
```

#### Scenario 9.3: Host starts game while someone is joining

**Context**: Race condition - Alice starts as Dave is joining

**Steps:**
1. Room has Alice, Bob, Carol
2. Alice clicks "Start Game"
3. Simultaneously, Dave clicks "Join Room"

**Expected Result:**
- **If Dave's join completes first:**
  - Dave joins (playerNumber 4)
  - Alice's start succeeds with 4 players
  - All 4 players see game
- **If Alice's start completes first:**
  - Room status: "waiting" → "playing"
  - Dave's join fails (cannot join mid-game)
  - Error: "Cannot join - game already started"
  - Dave shown error toast

**Join Validation:**
```typescript
if (room.status !== 'waiting') {
  return { error: "Game already in progress", status: 400 };
}
```

#### Scenario 9.4: Room full but join attempt races

**Context**: Room at max capacity, two try to join

**Steps:**
1. Room has 4/4 players (3×3 grid, maxPlayers: 4)
2. Eve and Frank both try to join simultaneously

**Expected Result:**
- **Server-side transaction/lock (if implemented):**
  - One join succeeds (e.g., Eve)
  - Other join fails (Frank)
  - Frank sees: "This room is full. Please try a different room."
- **Without transaction:**
  - Both might join briefly
  - Next operation (e.g., start game) might fail validation
  - Manual cleanup needed

**Current Implementation:**
- Basic check: `playerCount < maxPlayers`
- Race condition possible without atomic operations
- Future enhancement: Use Firestore transactions

#### Scenario 9.5: Browser back button (should keep player in room via sessionStorage)

**Context**: Alice uses browser back button during game

**Steps:**
1. Alice in game or lobby
2. Alice clicks browser back button
3. Navigates to previous page

**Expected Result:**
- SessionStorage persists (playerId, roomCode, etc.)
- If Alice navigates back to /games/treasure-hunt/online:
  - Auto-reconnection triggers
  - Alice rejoins room seamlessly
- If Alice navigates elsewhere:
  - Session data remains (1 hour expiry)
  - Can return later if within 1 hour
- Alice remains in room.players (not removed)

**SessionStorage Benefit:**
- Survives navigation within same tab
- Does NOT survive tab close
- Does NOT survive browser close

#### Scenario 9.6: Heartbeat stops (tab inactive) - future enhancement

**Context**: Alice leaves tab inactive for extended period

**Steps:**
1. Alice in game
2. Switches to different tab
3. Leaves inactive for 5+ minutes

**Expected Result (Current):**
- Heartbeat continues (setInterval runs)
- Alice's `lastSeen` updates every 30 seconds
- Appears connected even if inactive

**Future Enhancement:**
- Detect tab visibility (Page Visibility API)
- Pause heartbeat when tab inactive
- After 2-3 minutes: Mark as disconnected
- Show 🔴 indicator to other players
- On tab return: Resume heartbeat, reconnect

**Implementation Idea:**
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(heartbeatInterval); // Pause
  } else {
    startHeartbeat(); // Resume
  }
});
```

#### Scenario 9.7: Player re-joins previous room (host re-join bug to be fixed)

**Context**: Known issue - Host leaves and tries to re-join

**Steps:**
1. Alice (host) leaves room "XYZ789"
2. Bob becomes new host
3. Alice tries to join "XYZ789" again with same username

**Expected Result (Desired):**
- Alice joins as new player with new playerNumber
- Alice is NOT host (Bob is host)
- Room continues normally

**Current Bug (if exists):**
- Potential conflicts with playerId reuse
- May show Alice as host incorrectly
- May have permission conflicts

**Fix Needed:**
- On leave: Fully remove player from room.players
- On re-join: Generate new playerId
- Treat as completely new player
- Clear sessionStorage on leave

### 10. UI State Transitions

**Complete flow from creation to multiple games:**

```
┌─────────────┐
│   Landing   │ ← User enters online multiplayer
│   Screen    │
└──────┬──────┘
       │
       ├─ Create Room ──→ Host (Player 1)
       │                       │
       └─ Join Room ───→ Non-Host (Player 2+)
                              │
                              ▼
                        ┌──────────┐
                        │  Lobby   │ ← Status: "waiting"
                        │ (Waiting)│
                        └────┬─────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              Host changes      Host starts
              grid size         game (2+ players)
                    │                 │
                    └────────┬────────┘
                             ▼
                        ┌──────────┐
                        │  Active  │ ← Status: "playing"
                        │   Game   │
                        └────┬─────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              Player finds      Player leaves
              treasure          (during game)
                    │                 │
                    ▼                 └──→ All to Lobby
              ┌──────────┐
              │Game Over │ ← Status: "finished"
              │(Finished)│
              └────┬─────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    Host clicks         Host clicks
    "Play Again"        "Back to Lobby"
         │                   │
         └──→ Active Game    └──→ Lobby
              (playing)           (waiting)
```

**State Persistence:**
- All states sync via Firestore real-time listeners
- SessionStorage enables reconnection
- Players can join/leave at any state (with restrictions)

---

## Architecture

### Room States

The room can be in one of three states:

| State | Description | Allowed Actions |
|-------|-------------|-----------------|
| `waiting` | Lobby state, players joining and configuring | Join, Leave, Change grid size (host), Start game (host) |
| `playing` | Active game in progress | Make moves (current player), Leave (sends others to lobby) |
| `finished` | Game over, winner determined | Play Again (host), Back to Lobby (host), Leave |

**State Transitions:**
- `waiting` → `playing`: Host starts game
- `playing` → `finished`: Player finds treasure
- `finished` → `playing`: Host clicks "Play Again"
- `finished` → `waiting`: Host clicks "Back to Lobby"
- `playing` → `waiting`: Any player leaves during game
- Any state → (deleted): Last player leaves

### Player Roles

#### Host
- **How Assigned**: Creator of room (playerNumber 1)
- **Privileges**:
  - Change grid size in lobby
  - Start game (requires 2+ players)
  - Restart game after finish ("Play Again")
  - Return to lobby after finish ("Back to Lobby")
- **Transfer**: If host leaves, next player (lowest playerNumber) becomes host
- **Indicator**: ⭐ shown next to name

#### Non-Host
- **How Assigned**: Join existing room (playerNumber 2+)
- **Privileges**:
  - View current configuration
  - Share room code/link
  - Leave room
  - Make moves during their turn
- **Restrictions**:
  - Cannot change grid size
  - Cannot start game
  - Cannot restart game or return to lobby
  - Must wait for host to control game flow

### Data Structure

#### Room Document

```typescript
interface Room {
  // Unique identifier
  roomCode: string;              // 6-character code (e.g., "ABC123")
  
  // Room metadata
  hostId: string;                // UUID of host player
  gameId: 'treasure-hunt';       // Game type identifier
  status: 'waiting' | 'playing' | 'finished';
  
  // Timestamps
  createdAt: Timestamp;          // Room creation time
  lastActivity: Timestamp;       // Last action timestamp (for cleanup)
  
  // Configuration
  config: {
    gridSize: number;            // 3-6 (grid dimension)
    maxPlayers: number;          // 2-6 (set based on grid size)
  };
  
  // Game state (null when not playing)
  gameState: GameState | null;
  
  // Players map
  players: Record<string, Player>;  // Key: playerId, Value: Player object
}
```

**Example:**
```json
{
  "roomCode": "ABC123",
  "hostId": "550e8400-e29b-41d4-a716-446655440000",
  "gameId": "treasure-hunt",
  "status": "waiting",
  "createdAt": "2024-01-15T10:30:00Z",
  "lastActivity": "2024-01-15T10:35:00Z",
  "config": {
    "gridSize": 4,
    "maxPlayers": 6
  },
  "gameState": null,
  "players": {
    "550e8400-e29b-41d4-a716-446655440000": {
      "playerId": "550e8400-e29b-41d4-a716-446655440000",
      "username": "Alice",
      "playerNumber": 1,
      "joinedAt": "2024-01-15T10:30:00Z",
      "isHost": true,
      "lastSeen": "2024-01-15T10:35:00Z"
    },
    "550e8400-e29b-41d4-a716-446655440001": {
      "playerId": "550e8400-e29b-41d4-a716-446655440001",
      "username": "Bob",
      "playerNumber": 2,
      "joinedAt": "2024-01-15T10:32:00Z",
      "isHost": false,
      "lastSeen": "2024-01-15T10:35:00Z"
    }
  }
}
```

#### Player Object

```typescript
interface Player {
  playerId: string;              // UUID (unique identifier)
  username: string;              // Display name (1-20 chars)
  playerNumber: number;          // Sequential number (1-6)
  joinedAt: Timestamp;           // Join timestamp
  isHost: boolean;               // Host privilege flag
  lastSeen?: Timestamp;          // Last heartbeat timestamp
  isConnected?: boolean;         // Connection status (derived)
}
```

#### GameState Object

```typescript
interface GameState {
  tiles: TileState[];            // Array of tile states
  treasurePosition: number;      // Index of treasure (0 to tiles.length-1)
  currentPlayer: PlayerTurn;     // 1-6 (which player's turn)
  winner: PlayerTurn | null;     // Winner's playerNumber or null
  isGameOver: boolean;           // Game ended flag
  playerCount: number;           // Number of players (2-6)
  playerNames: string[];         // Array of player names
  gridSize: number;              // Grid dimension (3-6)
}

type TileState = 'covered' | 'uncovered-empty' | 'uncovered-treasure';
type PlayerTurn = 1 | 2 | 3 | 4 | 5 | 6;
```

**Example:**
```json
{
  "tiles": [
    "covered", "uncovered-empty", "covered",
    "covered", "covered", "uncovered-treasure",
    "covered", "covered", "covered"
  ],
  "treasurePosition": 5,
  "currentPlayer": 2,
  "winner": null,
  "isGameOver": false,
  "playerCount": 3,
  "playerNames": ["Alice", "Bob", "Carol"],
  "gridSize": 3
}
```

### Real-Time Synchronization

**Firestore Listeners:**
- Each client subscribes to room document: `db.collection('rooms').doc(roomCode)`
- `onSnapshot()` callback fires on any change
- All clients see updates in real-time

**Update Flow:**
1. Player action (e.g., click tile)
2. Client sends API request
3. Server validates and updates Firestore
4. Firestore broadcasts change to all listeners
5. All clients receive update and re-render

**Optimistic Updates:**
- UI updates immediately before server response
- Improves perceived performance
- Reverted if server rejects action

**Heartbeat Mechanism:**
- Client updates `lastSeen` every 30 seconds
- Server marks player as disconnected if `lastSeen` > 1 minute
- UI shows 🔴 indicator for disconnected players

### Session Management

**SessionStorage Keys:**
```typescript
const STORAGE_KEYS = {
  PLAYER_ID: 'treasure-hunt-player-id',       // UUID
  ROOM_CODE: 'treasure-hunt-room-code',       // 6-char code
  USERNAME: 'treasure-hunt-username',         // Display name
  TIMESTAMP: 'treasure-hunt-timestamp',       // Creation time (ms)
};
```

**Session Lifecycle:**
1. **Creation**: On room create/join, save to sessionStorage
2. **Validation**: On page load, check if session exists and not expired
3. **Reconnection**: If valid, auto-rejoin room
4. **Expiration**: Sessions expire after 1 hour
5. **Cleanup**: On leave or expiration, clear sessionStorage

**Why SessionStorage:**
- Persists across page refreshes (same tab)
- Isolated per tab (multiple tabs = separate sessions)
- Cleared on tab/browser close (security)
- No server-side session management needed

### Room Cleanup

**Automatic Cleanup:**
- Runs periodically (e.g., every 5 minutes)
- Deletes rooms where `lastActivity` > 1 hour old
- Prevents database bloat
- Disconnected players removed

**Manual Cleanup:**
- Room deleted when last player leaves
- Triggered by leave API endpoint

**Cleanup API:**
```
GET /api/rooms/cleanup
```

---

## API Documentation

### Base URL
All API endpoints are relative to: `/api/rooms`

### Endpoints

#### 1. Create Room
**Endpoint:** `POST /api/rooms/create`

**Description:** Creates a new room with the requesting player as host.

**Request Body:**
```typescript
{
  username: string;  // 1-20 characters
}
```

**Response (201 Created):**
```typescript
{
  roomCode: string;  // 6-character room code
  playerId: string;  // UUID of the player
}
```

**Errors:**
- `400`: Invalid username (empty or >20 chars)
- `503`: Firebase not configured

**Example:**
```bash
curl -X POST /api/rooms/create \
  -H "Content-Type: application/json" \
  -d '{"username": "Alice"}'

# Response:
# {"roomCode": "ABC123", "playerId": "550e8400..."}
```

---

#### 2. Join Room
**Endpoint:** `POST /api/rooms/join`

**Description:** Adds a player to an existing room.

**Request Body:**
```typescript
{
  roomCode: string;  // 6-character code (case-insensitive)
  username: string;  // 1-20 characters
}
```

**Response (200 OK):**
```typescript
{
  playerId: string;      // UUID of the player
  playerNumber: number;  // Sequential number (2-6)
}
```

**Errors:**
- `400`: Invalid input (missing fields, invalid username)
- `400`: Room is full
- `400`: Game already in progress (cannot join mid-game)
- `404`: Room not found

**Example:**
```bash
curl -X POST /api/rooms/join \
  -H "Content-Type: application/json" \
  -d '{"roomCode": "ABC123", "username": "Bob"}'

# Response:
# {"playerId": "550e8400...", "playerNumber": 2}
```

---

#### 3. Get Room
**Endpoint:** `GET /api/rooms/[roomCode]`

**Description:** Retrieves room details (used for reconnection validation).

**Parameters:**
- `roomCode` (path): 6-character room code

**Response (200 OK):**
```typescript
{
  exists: boolean;
}
```

**Errors:**
- `404`: Room not found

**Example:**
```bash
curl /api/rooms/ABC123

# Response:
# {"exists": true}
```

---

#### 4. Leave Room
**Endpoint:** `POST /api/rooms/[roomCode]/leave`

**Description:** Removes a player from the room. Handles host transfer and room deletion.

**Parameters:**
- `roomCode` (path): 6-character room code

**Request Body:**
```typescript
{
  playerId: string;  // UUID of leaving player
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  message: string;  // "Left room successfully" or "Room deleted (last player)"
}
```

**Behavior:**
- Removes player from `room.players`
- If player was host: Transfers host to next player (lowest playerNumber)
- If last player: Deletes room entirely
- If during game: Sends remaining players to lobby (status → "waiting")

**Errors:**
- `400`: Missing playerId
- `404`: Room not found

**Example:**
```bash
curl -X POST /api/rooms/ABC123/leave \
  -H "Content-Type: application/json" \
  -d '{"playerId": "550e8400..."}'

# Response:
# {"success": true, "message": "Left room successfully"}
```

---

#### 5. Update Configuration
**Endpoint:** `POST /api/rooms/[roomCode]/update-config`

**Description:** Updates room configuration (grid size). Host-only, lobby-only.

**Parameters:**
- `roomCode` (path): 6-character room code

**Request Body:**
```typescript
{
  gridSize: number;  // 3-6
}
```

**Response (200 OK):**
```typescript
{
  success: true;
}
```

**Validation:**
- Must be host
- Room must be in "waiting" status
- Grid size must be 3-6
- Current playerCount must not exceed new maxPlayers

**Errors:**
- `400`: Invalid grid size
- `400`: Player count exceeds new max
- `403`: Not host
- `403`: Game already started
- `404`: Room not found

**Example:**
```bash
curl -X POST /api/rooms/ABC123/update-config \
  -H "Content-Type: application/json" \
  -d '{"gridSize": 5}'

# Response:
# {"success": true}
```

---

#### 6. Start Game
**Endpoint:** `POST /api/rooms/[roomCode]/start`

**Description:** Starts a new game or restarts after game over. Host-only.

**Parameters:**
- `roomCode` (path): 6-character room code

**Request Body:**
```typescript
{
  playerId: string;  // UUID of host
}
```

**Response (200 OK):**
```typescript
{
  success: true;
}
```

**Behavior:**
- Validates host privileges
- Validates player count (2+)
- Initializes game state with random treasure
- Updates room status: "waiting" → "playing" or "finished" → "playing"

**Errors:**
- `400`: Less than 2 players
- `400`: Missing playerId
- `403`: Not host
- `404`: Room not found

**Example:**
```bash
curl -X POST /api/rooms/ABC123/start \
  -H "Content-Type: application/json" \
  -d '{"playerId": "550e8400..."}'

# Response:
# {"success": true}
```

---

#### 7. Make Move
**Endpoint:** `POST /api/rooms/[roomCode]/move`

**Description:** Processes a player's move (uncover tile).

**Parameters:**
- `roomCode` (path): 6-character room code

**Request Body:**
```typescript
{
  playerId: string;      // UUID of player
  tilePosition: number;  // Index of tile (0 to tiles.length-1)
}
```

**Response (200 OK):**
```typescript
{
  success: true;
  isTreasure: boolean;   // Whether treasure was found
  winner: number | null; // Winner's playerNumber if treasure found
}
```

**Validation:**
- Room must be in "playing" status
- Must be player's turn (`currentPlayer === playerNumber`)
- Tile must be "covered" (not already uncovered)

**Behavior:**
- If treasure: Sets winner, game over, status → "finished"
- If empty: Advances to next player

**Errors:**
- `400`: Invalid input (missing fields, invalid position)
- `400`: Tile already uncovered
- `403`: Not your turn
- `403`: Game not in progress
- `404`: Room not found
- `404`: Player not in room

**Example:**
```bash
curl -X POST /api/rooms/ABC123/move \
  -H "Content-Type: application/json" \
  -d '{"playerId": "550e8400...", "tilePosition": 3}'

# Response (empty tile):
# {"success": true, "isTreasure": false, "winner": null}

# Response (treasure):
# {"success": true, "isTreasure": true, "winner": 2}
```

---

#### 8. Back to Lobby
**Endpoint:** `POST /api/rooms/[roomCode]/back-to-lobby`

**Description:** Returns room to lobby state after game ends. Host-only.

**Parameters:**
- `roomCode` (path): 6-character room code

**Request Body:** (empty or host validation)

**Response (200 OK):**
```typescript
{
  success: true;
}
```

**Behavior:**
- Room status: "finished" → "waiting"
- Clears game state (gameState: null)
- Preserves players and configuration
- Host can start new game or change config

**Errors:**
- `403`: Not host
- `404`: Room not found

**Example:**
```bash
curl -X POST /api/rooms/ABC123/back-to-lobby

# Response:
# {"success": true}
```

---

#### 9. Room Cleanup
**Endpoint:** `GET /api/rooms/cleanup`

**Description:** Deletes rooms inactive for >1 hour (scheduled task).

**Response (200 OK):**
```typescript
{
  deletedCount: number;  // Number of rooms deleted
}
```

**Example:**
```bash
curl /api/rooms/cleanup

# Response:
# {"deletedCount": 3}
```

---

### Error Response Format

All errors follow this structure:
```typescript
{
  error: string;     // Human-readable error message
  message?: string;  // Additional details (optional)
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `201`: Created (new resource)
- `400`: Bad Request (invalid input)
- `403`: Forbidden (authorization failure)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error
- `503`: Service Unavailable (Firebase not configured)

---

### Rate Limiting

**Not Currently Implemented**

Future considerations:
- Limit room creation per IP (prevent spam)
- Limit move frequency (prevent abuse)
- Implement exponential backoff for retries

---

### Authentication

**Current:** No authentication required (anonymous play)

**Security:**
- Rooms identified by random 6-character codes
- Players identified by UUIDs (generated server-side)
- Room codes hard to guess (36^6 = ~2 billion combinations)
- Sessions expire after 1 hour

**Future Enhancements:**
- Optional user accounts (Firebase Auth)
- Persistent profiles
- Match history

---

## Known Issues

### 1. Host Re-Join Bug
**Description:** If host leaves and re-joins same room, may encounter permission conflicts.

**Symptoms:**
- May appear as host incorrectly
- May not be able to start game
- May cause duplicate player entries

**Workaround:**
- Don't re-join rooms after leaving
- Create new room instead

**Fix Status:** Needs investigation
- Ensure playerId is regenerated on re-join
- Clear sessionStorage completely on leave
- Validate player doesn't exist before re-adding

### 2. Race Condition: Simultaneous Joins to Full Room
**Description:** Two players might join simultaneously when room is at max capacity.

**Symptoms:**
- Both might see successful join briefly
- Next action (e.g., start game) fails validation
- Manual cleanup needed

**Mitigation:**
- Client-side validation prevents most cases
- Server validates on each critical operation

**Fix Status:** Future enhancement
- Implement Firestore transactions for atomic operations
- Use distributed locking

### 3. Heartbeat Continues in Inactive Tabs
**Description:** Heartbeat keeps running even when tab is inactive for extended periods.

**Impact:**
- Players appear "connected" even if tab backgrounded
- Doesn't affect gameplay but misleading indicator

**Workaround:** None currently

**Fix Status:** Future enhancement (see Scenario 9.6)
- Detect tab visibility with Page Visibility API
- Pause heartbeat when inactive
- Mark as disconnected after threshold

### 4. No Transaction Support for Critical Operations
**Description:** Certain operations (join, start) not atomic.

**Risk:**
- Race conditions possible under high concurrency
- Data inconsistencies in edge cases

**Mitigation:**
- Server-side validation catches most issues
- Low likelihood in typical usage

**Fix Status:** Future enhancement
- Implement Firestore transactions for:
  - Room joins
  - Game starts
  - Host transfers

### 5. Room Cleanup Timing
**Description:** Rooms deleted after 1 hour, but cleanup runs periodically (not instant).

**Impact:**
- Rooms might exist slightly longer than 1 hour
- Minor database bloat (negligible)

**Fix Status:** Acceptable as-is
- Cleanup runs every 5 minutes (or as scheduled)
- 1-hour window is guideline, not hard limit

### 6. Limited Error Recovery
**Description:** Network errors during critical operations (e.g., move) require manual retry.

**Impact:**
- User must click again
- Optimistic update reverted

**Mitigation:**
- Clear error messages guide user
- Game state preserved server-side

**Fix Status:** Future enhancement
- Implement automatic retry with exponential backoff
- Queue failed operations

### 7. No Player Kick Functionality
**Description:** Host cannot remove disruptive or AFK players.

**Impact:**
- Must wait for AFK timeout (1 hour)
- Game might be stuck with unresponsive player

**Workaround:**
- Host can leave and create new room
- Others can join new room

**Fix Status:** Future enhancement
- Add "Kick Player" button for host
- Requires API endpoint and UI

---

## Future Enhancements

### High Priority

#### 1. Improved Reconnection
- **Feature**: Better handling of network disruptions
- **Details**:
  - Auto-retry on Firestore listener disconnect
  - Exponential backoff for API failures
  - Queue moves when offline, sync on reconnect
  - Visual indicator for connection status

#### 2. Player Kick Functionality
- **Feature**: Allow host to remove players
- **Details**:
  - "Kick Player" button in player list (host-only)
  - Confirmation dialog
  - Kicked player redirected to landing
  - Remaining players stay in room

#### 3. Transaction-Based Operations
- **Feature**: Atomic operations for critical actions
- **Details**:
  - Firestore transactions for joins, starts, moves
  - Eliminates race conditions
  - Guarantees data consistency

#### 4. Improved Heartbeat System
- **Feature**: Tab visibility detection
- **Details**:
  - Pause heartbeat when tab inactive
  - Resume on tab focus
  - Mark as disconnected after 2-3 minutes inactive
  - More accurate connection status

### Medium Priority

#### 5. User Accounts & Profiles
- **Feature**: Optional Firebase Authentication
- **Details**:
  - Sign up with email or social login
  - Persistent profiles
  - Match history
  - Win/loss statistics
  - Leaderboards

#### 6. Room Privacy Options
- **Feature**: Public vs. private rooms
- **Details**:
  - Public rooms: Listed in lobby browser
  - Private rooms: Join by code only
  - Optional password protection

#### 7. Spectator Mode
- **Feature**: Allow non-players to watch games
- **Details**:
  - Spectators don't affect game
  - Can join mid-game
  - Read-only view of board
  - Chat with other spectators

#### 8. Chat System
- **Feature**: In-game text chat
- **Details**:
  - Chat in lobby and during game
  - Per-room chat history
  - Optional chat moderation
  - Emoji support

#### 9. Game Variations
- **Feature**: Alternative game modes
- **Details**:
  - **Timed Turns**: Time limit per move
  - **Multiple Treasures**: Find 2+ treasures to win
  - **Obstacles**: Some tiles blocked, can't uncover
  - **Hints**: First player to X tiles gets hint

#### 10. Mobile App
- **Feature**: Native iOS/Android apps
- **Details**:
  - Better mobile experience
  - Push notifications (turn reminders)
  - Offline mode (local multiplayer)
  - App-specific features (camera avatar)

### Low Priority

#### 11. Sound Effects
- **Feature**: Audio feedback for actions
- **Details**:
  - Tile uncover sound
  - Treasure found fanfare
  - Turn notification chime
  - Mute option

#### 12. Animations
- **Feature**: Visual transitions
- **Details**:
  - Tile flip animation
  - Treasure reveal sparkle
  - Turn change fade
  - Player join/leave notification

#### 13. Accessibility Improvements
- **Feature**: Enhanced a11y support
- **Details**:
  - Screen reader optimization
  - Keyboard navigation
  - High contrast mode
  - Larger touch targets

#### 14. Analytics
- **Feature**: Game analytics dashboard
- **Details**:
  - Average game duration
  - Grid size preferences
  - Player count distribution
  - Win rate by player position

#### 15. Tournament Mode
- **Feature**: Organized competitive play
- **Details**:
  - Bracket system
  - Scheduled tournaments
  - Prize tracking
  - Tournament history

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Code Style**: Follow existing patterns (React, TypeScript, Firebase)
2. **Testing**: Add tests for new features
3. **Documentation**: Update this README for significant changes
4. **Issues**: Check known issues before reporting bugs

---

## License

[Include license information here]

---

## Contact

[Include contact/support information here]

---

**Last Updated**: February 2026
**Version**: 1.0.0
