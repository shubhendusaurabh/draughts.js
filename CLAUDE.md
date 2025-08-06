# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a JavaScript draughts (checkers) library for move generation/validation, piece placement/movement, and draw detection. It's inspired by chess.js and provides a complete API for implementing draughts games.

## Commands

### Testing
```bash
npm test
# Runs Mocha tests in tests.js
```

### Build/Minification
```bash
npm run minify
# Creates minified version using UglifyJS
```

## Core Architecture

### Main Library (draughts.js)
- Single-file library with constructor function `Draughts`
- Uses internal 56-character position representation for rule processing
- Converts between internal and external (51-character) representations
- External position format: first character indicates turn (B/W), positions 1-50 represent board squares

### Position Representation
- **Internal**: 56-char string with special numbering for easy rule application
- **External**: 51-char string where position 0 = side to move, positions 1-50 = board squares
- **Pieces**: 'b' (black), 'B' (black king), 'w' (white), 'W' (white king), '0' (empty)

### Key Functions
- `generate_moves()`: Core move generation logic
- `makeMove()`: Executes moves and updates game state
- `validate_fen()`: FEN string validation
- `load()/generate_fen()`: Position loading/saving
- `getLegalMoves()`: Move generation for specific squares

### Game Formats
- **FEN**: Forsyth-Edwards Notation for position representation (e.g., 'W:W31-50:B1-20')
- **PDN**: Portable Draughts Notation for game recording

### Testing Framework
- Uses Mocha + Chai for testing
- Tests in tests.js cover perft calculations and move generation
- Currently has placeholder test structures for perft and single-square move generation