# draughts.js

A modern ES6 JavaScript draughts (checkers) library for move generation/validation, piece placement/movement, and draw detection - basically everything but the AI.

Inspired by [chess.js](https://github.com/jhlywa/chess.js)

## Features

- **ES6+ Modern JavaScript** with comprehensive JSDoc type annotations
- **Full draughts/checkers game logic** including captures, promotions, and game ending conditions
- **FEN notation support** for position loading and saving
- **PDN (Portable Draughts Notation)** for game import/export
- **Move validation** and legal move generation
- **TypeScript-friendly** with detailed JSDoc types
- **Node.js and Browser compatible**

## Installation

### Browser
```html
<script src="path/to/draughts.js"></script>
```

### Node.js
```bash
npm install draughts
```

```js
const Draughts = require('draughts');
// or import Draughts from 'draughts'; // ES6 modules
```

## Quick Start

```js
// Create a new game
const game = new Draughts();

// Play a random game
while (!game.gameOver()) {
  const moves = game.moves();
  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  game.move(randomMove);
}

console.log('Game over!');
console.log('Final position:', game.fen());
console.log('Game notation:', game.pdn());
```

## API Reference

### Constructor

**`new Draughts([fen])`**

Creates a new draughts game instance.

```js
// Start with default position
const game = new Draughts();

// Load a specific position using FEN
const game = new Draughts('W:W31-50:B1-20');
```

**Parameters:**
- `fen` *(string, optional)*: FEN string to initialize the board position

---

### Game State Methods

**`.gameOver()`**

Returns `true` if the game has ended (no legal moves or no pieces remaining).

```js
const game = new Draughts();
console.log(game.gameOver()); // false
```

**`.turn()`**

Returns the current player's turn as a lowercase string.

```js
const game = new Draughts();
console.log(game.turn()); // 'w' (white to move)
```

**`.inDraw()`**

Returns `true` if the game is drawn due to insufficient material (only kings remaining with 2 or fewer pieces total).

```js
console.log(game.inDraw()); // false
```

---

### Move Generation and Validation

**`.moves([square])`**

Returns an array of legal moves for the current position.

```js
const game = new Draughts();
const moves = game.moves();
console.log(moves.length); // Number of legal moves

// Get moves for a specific square
const squareMoves = game.moves(35);
```

**`.getLegalMoves(square)`**

Returns legal moves from a specific square.

```js
const game = new Draughts();
const moves = game.getLegalMoves(35);
console.log(moves);
// [
//   { jumps: [], takes: [], from: 35, to: 30, piecesTaken: undefined },
//   { jumps: [], takes: [], from: 35, to: 31, piecesTaken: undefined }
// ]
```

**`.move(moveObject)`**

**⚠️ API Change**: Now requires move object instead of string!

Attempts to make a move. Returns the move object if legal, `false` otherwise.

```js
const game = new Draughts();

// ✅ Correct - Use move object
const result = game.move({ from: 35, to: 30 });
console.log(result);
// { jumps: [], takes: [], from: 35, to: 30, flags: 'n', piece: 'w' }

// ❌ Old string format no longer works
// game.move('35-30'); // Returns false
```

**Parameters:**
- `moveObject` *(object)*: Move object with `from` and `to` properties
  - `from` *(number)*: Source square (1-50)
  - `to` *(number)*: Destination square (1-50)

---

### Board Manipulation

**`.get(square)`**

Returns the piece at the given square.

```js
const game = new Draughts();
console.log(game.get(35)); // 'w' (white piece)
console.log(game.get(25)); // '0' (empty square)
```

**`.put(piece, square)`**

Places a piece on the board.

```js
game.clear();
game.put('w', 35); // Place white piece on square 35
console.log(game.get(35)); // 'w'
```

**Parameters:**
- `piece` *(string)*: Piece type ('b', 'B', 'w', 'W')
- `square` *(number)*: Target square (1-50)

**`.remove(square)`**

Removes and returns the piece at the given square.

```js
const piece = game.remove(35);
console.log(piece); // 'w'
console.log(game.get(35)); // '0'
```

**`.clear()`**

Clears the board to the starting position.

```js
game.clear();
```

**`.reset()`**

Resets the game to the initial starting position.

```js
game.reset();
```

---

### Position and Notation

**`.fen()`**

Returns the current position in FEN (Forsyth-Edwards Notation).

```js
const game = new Draughts();
console.log(game.fen());
// 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
```

**`.load(fen)`**

Loads a position from a FEN string.

```js
const success = game.load('W:W31-50:B1-20');
console.log(success); // true if loaded successfully
```

**`.validate_fen(fen)`**

Validates a FEN string without loading it.

```js
const result = game.validate_fen('W:W31-50:B1-20');
console.log(result);
// { valid: true, error_number: 0, error: { code: 0, message: 'no errors' } }
```

**`.ascii([unicode])`**

Returns an ASCII representation of the board.

```js
const game = new Draughts();
console.log(game.ascii());
// +-------------------------------+
// |     b   b   b   b   b         |
// |   b   b   b   b   b           |
// |     b   b   b   b   b         |
// |   b   b   b   b   b           |
// |     0   0   0   0   0         |
// |   0   0   0   0   0           |
// |     w   w   w   w   w         |
// |   w   w   w   w   w           |
// |     w   w   w   w   w         |
// |   w   w   w   w   w           |
// +-------------------------------+

// Use Unicode symbols
console.log(game.ascii(true)); // Uses ♠, ♥, etc. symbols
```

---

### Game History

**`.history([options])`**

Returns the move history.

```js
const game = new Draughts();
game.move({ from: 35, to: 30 });
game.move({ from: 19, to: 23 });

console.log(game.history());
// ['35-30', '19-23']

// Get verbose history with detailed move objects
console.log(game.history({ verbose: true }));
// [{ from: 35, to: 30, flags: 'n', piece: 'w', moveNumber: 1 }, ...]
```

**`.undo()`**

Undoes the last move.

```js
const game = new Draughts();
const originalFen = game.fen();

game.move({ from: 35, to: 30 });
const undoneMove = game.undo();

console.log(game.fen() === originalFen); // true
console.log(undoneMove); // The move that was undone
```

---

### PDN (Portable Draughts Notation)

**`.header([key, value, ...])`**

Sets or gets PDN header information.

```js
// Set headers
game.header('White', 'Alice', 'Black', 'Bob', 'Date', '2024-01-01');

// Get headers
console.log(game.header());
// { White: 'Alice', Black: 'Bob', Date: '2024-01-01' }
```

**`.pdn([options])`**

Exports the game in PDN format.

```js
const game = new Draughts();
game.header('White', 'Alice', 'Black', 'Bob');
game.move({ from: 35, to: 30 });
game.move({ from: 19, to: 23 });

console.log(game.pdn());
// [White "Alice"]
// [Black "Bob"]
//
// 1. 35-30 19-23
```

**Options:**
- `maxWidth` *(number)*: Maximum line width for formatting
- `newline_char` *(string)*: Character to use for line breaks (default: '\\n')

**`.parsePDN(pdn, [options])`**

Loads a game from PDN notation.

```js
const pdn = `
[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. 35-30 19-23 2. 30-25 20-24
`;

const success = game.parsePDN(pdn);
console.log(success); // true if parsed successfully
```

---

### Utility Methods

**`.captures()`**

Returns all possible capture moves for the current player.

```js
const captures = game.captures();
console.log(captures); // Array of capture move objects
```

**`.perft(depth)`**

Performance test function - counts total positions at given depth.

```js
const nodeCount = game.perft(3);
console.log(`Positions at depth 3: ${nodeCount}`);
```

---

## TypeScript Support

The library includes comprehensive JSDoc type annotations for excellent TypeScript support:

```typescript
interface MoveObject {
  from: number;           // Source square (1-50)
  to: number;             // Destination square (1-50)
  flags: string;          // Move flags: 'n', 'c', 'p'
  piece: string;          // Moving piece: 'b', 'B', 'w', 'W'
  takes?: number[];       // Captured piece positions
  jumps?: number[];       // Jump sequence positions
  piecesTaken?: string[]; // Captured piece types
}

interface ValidationResult {
  valid: boolean;
  error?: {
    code: number;
    message: string;
  };
  fen: string;
}
```

## Examples

### Basic Game Loop
```js
const game = new Draughts();

while (!game.gameOver()) {
  const moves = game.moves();
  
  if (moves.length === 0) break;
  
  // Make a random move
  const randomMove = moves[Math.floor(Math.random() * moves.length)];
  const result = game.move(randomMove);
  
  if (result) {
    console.log(`Move: ${result.from}-${result.to}`);
  }
}

console.log('Final position:', game.fen());
```

### Loading and Analyzing Positions
```js
// Load a specific position
const game = new Draughts('B:W31,32,33,34,35,36,37,38,39,40:B11,12,13,14,15,16,17,18,19,20');

console.log('Current turn:', game.turn());
console.log('Legal moves:', game.moves().length);
console.log('Captures available:', game.captures().length);

// Show the board
console.log(game.ascii());
```

### Working with PDN
```js
const game = new Draughts();

// Set up game metadata
game.header('Event', 'Friendly Match');
game.header('White', 'Player 1');
game.header('Black', 'Player 2');
game.header('Date', '2024-01-01');

// Play some moves
game.move({ from: 35, to: 30 });
game.move({ from: 19, to: 23 });
game.move({ from: 32, to: 28 });

// Export as PDN
console.log(game.pdn());
```

## Browser Compatibility

Works in all modern browsers that support ES6 features:
- Chrome 51+
- Firefox 54+
- Safari 10+
- Edge 15+

For older browsers, use a transpiler like Babel.

## Sites Using draughts.js

- [Checkers/Draughts Online](https://www.shubhu.in/checkers-online/)

Need a user interface? Try the [draughtsboardJS](http://github.com/shubhendusaurabh/draughtsboardJS) library.

## Maintainers

- [@petitlapin](https://github.com/petitlapin)
- [@Richienb](https://github.com/Richienb)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MPL-2.0 License.