# Game Library – Project Specification

## Purpose

I plan to fully rewrite the repository **@zbqmal/game-library** as a fresh version from scratch.

All existing code will be deleted, and the project will be rebuilt with a clean, maintainable architecture:

- **Frontend**: Next.js
- **Backend**: Node.js–based backend (NestJS optional; lighter alternatives preferred)
- **Database**: Used to store game scoreboards

The website will be called **Game Library**.

---

## Overview

**Game Library** is a web platform that hosts a collection of small, casual games.

- Users can play games **without logging in**
- If a user achieves a score that ranks in the **Top 10**, they may record their name on that game’s scoreboard
- Designed for casual, repeat visits where players try to beat existing records

---

## Frontend Requirements (Acceptance Criteria)

### General

- Responsive web design
- Clean, simple UI
- No authentication required

---

## Pages

### 1. Main Page (Home)

#### Required Elements

- Website title: **Game Library**
- Short, friendly introduction message

Example:

> “Enjoy a collection of fun mini-games and challenge yourself to beat other players’ scores!”

#### Game List

- Displayed as a **tile / grid layout** (similar to YouTube’s web interface)
- Each tile includes:
  - Game thumbnail image
  - Game title

#### Other

- Scrollable page
- Search bar to search games by name

---

### 2. Game Page (Generic Layout)

Each game page should include:

- Game title
- Short **How to Play** description
- Main game screen (center)
- Scoreboard (if applicable)
  - Displayed on the **right side**
  - Shows **Top 10 scores**

Each scoreboard entry includes:

- Player name
- Score
- Date / time recorded

#### Name Input Field

- Visible **only if** the player achieves a Top-10 score

---

## Games

### 1. Number Guessing Game

**Working title**: Up and Down (name can be changed)

#### Gameplay

- At game start, generate a random number
  - Default range: **1–100**
  - Range must be configurable by the player
- Default number of attempts: **5**
  - Number of attempts must also be configurable

#### UI

- Center of the screen shows a **question mark (?)**
- Below it:
  - Number input field
  - **Submit / Try** button
- Display remaining attempts
- Display result messages after each guess

#### Messages

- Guess too low:
  - `UP! Answer is higher than <your guess>`
- Guess too high:
  - `DOWN! Answer is lower than <your guess>`
- Correct guess:
  - `CONGRATS! You’re correct!`

#### Other

- **Retry / Reset** button required
- **No scoreboard** is needed for this game

---

### 2. Stairs Game

#### Reference

- Original C++ implementation exists on GitHub [STAIRS](https://github.com/zbqmal/stairs)
- Use original logic as reference
- If possible, **port or render the original logic directly** rather than rewriting

#### Gameplay

- Player rolls a dice
- Dice result determines how many stairs the player climbs
- Number of stairs climbed = potential score

Once the player reaches the top:

- A **GAME START** button appears
- Clicking it launches a **random mini-game**

#### Rules

- If the player **wins** the random game:
  - Stair count is recorded as the score
- If the player **loses the first game**:
  - Score becomes **0**, even if stairs were climbed

#### Scoreboard

- This game **requires a scoreboard**

#### Random Game Pool

- Random Game 1: (to be defined)
- Additional games can be added later

---

### 3. Rock–Paper–Scissors (vs Computer)

#### Gameplay

- Player plays Rock–Paper–Scissors against the computer
- Computer move is randomly generated
- Player continues playing until they **lose**

#### Scoring

- Score = number of **consecutive wins**

#### UI

- Three image buttons:
  - Rock
  - Paper
  - Scissors

After selection:

- Show countdown animation: **3 → 2 → 1**
- Reveal result

#### End of Game

When the player loses:

- Show final score
- If score is in **Top 10**:
  - Show name input field
- Show **Restart** button

#### Scoreboard

- Required for this game

---

## Backend & Database Requirements

### Database

Must store scoreboard records per game.

Each record should include:

- Game ID
- Player name
- Score
- Timestamp

Please suggest:

- An appropriate database type (SQLite, PostgreSQL, MongoDB, etc.)
- A recommended data schema
- Reasoning for why it fits this project

---

### Backend Service

Responsible for:

- Storing scores
- Retrieving Top-10 scores per game

- REST or simple API is sufficient
- NestJS is commonly used but may be overkill

Please suggest:

- A lightweight backend framework (Express, Fastify, tRPC, serverless, etc.)
- Justification for the choice

---

## Goal

The final result should be:

- Easy to extend with new games
- Simple to deploy
- Clear separation between frontend, backend, and database
- Well-structured codebase that GitHub Copilot can easily assist with
