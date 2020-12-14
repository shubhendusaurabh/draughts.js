A Javascript draughts or checkers library for move generation/validation, piece placement/movement, and draw detection.

Inspired from [chess.js](https://github.com/jhlywa/chess.js)

# draughts.js

draughts.js is a Javascript draughts library that is used for draughts move
generation/validation, piece placement/movement, and game status
detection - basically everything but the AI.

draughts.js is in development.

## Installation
Download the `draughts.js` file & include it in your html page.
```
<script src="/js/draughts.js"></script>
```

## Example Code
The code below plays a complete game of draughts ... randomly.

```js
var draughts = new Draughts();

while (!draughts.game_over()) {
  var moves = draughts.moves();
  var move = moves[Math.floor(Math.random() * moves.length)];
  draughts.move(move);
}
console.log(draughts.pdn());
```

## Sites Using draughts.js

- [Checkers/Draughts online](https://www.shubhu.in/checkers-online/)

Need a user interface?  Try [draughtsboardJS](http://github.com/shubhendusaurabh/draughtsboardJS) library.

## API

### Constructor: draughts([ fen ])
The draughts() constructor takes a optional parameter which specifies the board configuration
in [Forsyth-Edwards Notation](http://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).

```js
// board defaults to the starting position when called with no parameters
var draughts = new Draughts();

// pass in a FEN string to load a particular position
var draughts = new Draughts('W:W31-50:B1-20');
```

### .ascii()
Returns a string containing an ASCII diagram of the current position.

```js
var draughts = new Draughts();

// make some moves
draughts.move('35-31');
draughts.move('19-23');
draughts.move('32-27');

draughts.ascii();
// +------------------------------+
// |   	   b   b   b   b   b  	  |
// |   	 b   b   b   b   b    	  |
// |   	   b   b   b   b   b  	  |
// |   	 b   b   b   0   b    	  |
// |   	   0   0   b   0   0  	  |
// |   	 0   w   0   0   w    	  |
// |   	   w   0   w   w   0  	  |
// |   	 w   w   w   w   w    	  |
// |   	   w   w   w   w   w  	  |
// |   	 w   w   w   w   w    	  |
// +------------------------------+
```

### .clear()
Clears the board.

```js
draughts.clear();
draughts.fen();
// -> 'W:B:W' <- empty board
```

### .fen()
Returns the FEN string for the current position.

```js
var draughts = new Draughts();

// make some moves
draughts.move('35-31');
draughts.move('19-23');
draughts.move('32-27');

draughts.fen();
// -> "B:W27,30,31,33,34,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,23"
```

### .game_over()
Returns true if the game has ended via no moves left, or no pieces rule. Otherwise, returns false.

```js
var draughts = new Draughts();
draughts.game_over();
// -> false

```

### .get(square)
Returns the piece on the square:

```js
draughts.clear();
draughts.put('b', '23') // put a black man on a5

draughts.get('23');
// -> { 'b' },
draughts.get('50');
// -> null
```

### .history([ options ])
Returns a list containing the moves of the current game.  Options is an optional
parameter which may contain a 'verbose' flag.  See .moves() for a description of the
verbose move fields.

```js
var draughts = new Draughts();
draughts.move('35-31');
draughts.move('19-23');
draughts.move('32-27');

draughts.history();
// -> ["35-30", "19-23", "32-27"]

draughts.history({ verbose: true });
// -> [{ color: 'w', from: 'e2', to: 'e4', flags: 'b', piece: 'p', san: 'e4' },
//     { color: 'b', from: 'e7', to: 'e5', flags: 'b', piece: 'p', san: 'e5' },
//     { color: 'w', from: 'f2', to: 'f4', flags: 'b', piece: 'p', san: 'f4' },
//     { color: 'b', from: 'e5', to: 'f4', flags: 'c', piece: 'p', captured: 'p', san: 'exf4' }]
```

### .in_draw()
Returns true or false if the game is drawn (50-move rule or insufficient material).

```js
var draughts = new Draughts('4k3/4P3/4K3/8/8/8/8/8 b - - 0 78');
draughts.in_draw();
// -> true
```


### .in_threefold_repetition()
#### TODO
### .header()
Allows header information to be added to pdn output. Any number of key/value
pairs can be passed to .header().

```js
draughts.header('White', 'Shubhendu');
draughts.header('Black', 'Saurabh');

// or

draughts.header('White', 'Shubhendu', 'Black', 'Saurabh', 'Date', '2016-??-??');
```

Calling .header() without any arguments returns the header information as an object.

```js
draughts.header();
// -> { White: 'Shubhendu', Black: 'Saurabh', Date: '2016-??-??' }
```

### .load(fen)
The board is cleared and the FEN string is loaded.  Returns true if position was
successfully loaded, otherwise false.

```js
var draughts = new Draughts();
draughts.load('W:W31-50:B1-20');
// -> true

draughts.load('W:W31-55:B1-20');
// -> false, bad piece X
```

### .load_pdn(pdn, [ options ])
Load the moves of a game stored in
[Portable Draughts Notation](https://en.wikipedia.org/wiki/Portable_Draughts_Notation).
Options is a optional parameter that contains a 'newline_char' which is a
string representation of a RegExp (and should not be pre-escaped) and defaults
to '\r?\n'). Returns true if the pdn was parsed successfully, otherwise false.

```js
var draughts = new Draughts();
pdn = ['[Event "18th Computer Olympiad, 10x10 Draughts"]',
       '[Site "Leiden, NLD"]',
       '[Date "2015.07.04"]',
       '[Round "1"]',
       '[White "Scan"]',
       '[Black "Moby Dam (Jun 30 2015)"]',
       '[Result "1-0"]',
       '',
        '1. 34-30 19-23 2. 30-25 20-24 3. 33-29 24x33 4. 39x19 14x23 5. 40-34 9-14 6.',
        '44-39 14-20 7. 25x14 10x19 8. 50-44 5-10 9. 38-33 10-14 10. 42-38 23-28 11.',
        '32x23 18x40 12. 45x34 12-18 13. 35-30 7-12 14. 37-32 18-23 15. 44-40 12-18 16.',
        '41-37 1-7 17. 46-41 7-12 18. 47-42 23-28 19. 33x22 17x28 20. 32x23 19x28 21.',
        '38-32 13-19 22. 32x23 19x28 23. 43-38 8-13 24. 38-32 13-19 25. 32x23 19x28 26.',
        '42-38 11-17 27. 31-27 6-11 28. 38-33 18-23 29. 33x22 17x28 30. 37-31 11-17 31.',
        '27-22 28-32 32. 22x11 16x7 33. 48-42 12-18 34. 31-26 2-8 35. 36-31 7-12 36.',
        '40-35 15-20 37. 49-43 23-28 38. 34-29 12-17 39. 30-24 20-25 40. 42-38 25-30',
        '41. 38x27 30x19 42. 41-36 28-32 43. 27x38 19-23 44. 31-27 23x34 45. 39x30 8-12',
        '46. 30-24 3-8 47. 43-39 18-23 48. 27-21 23-28 49. 36-31 8-13 50. 35-30 14-19',
        '51. 21-16 12-18 52. 31-27 19-23 53. 38-33 28-32 54. 27x38 18-22 55. 24-20',
        '22-27 56. 30-24 17-21 57. 26x17 27-31 58. 17-12 31-36 59. 12-7 36-41 60. 38-32',
        '13-18 61. 7-2 23-29 62. 2-13 29x27 63. 13x47 4-10 64. 24-19 10-15 65. 47-24',
        '1-0'];
draughts.load_pdn(pdn.join('\n'));
// -> true

draughts.fen()
// -> "B:W27,30,31,33,34,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,20,23"

draughts.ascii()
// +--------------------------+
// |	   b   b   b   b   b  	|
// |	 b   b   b   b   b    	|
// |	   b   b   b   b   b  	|
// |	 b   b   b   0   b    	|
// |	   0   0   b   0   0  	|
// |	 0   w   0   0   w    	|
// |	   w   0   w   w   0  	|
// |	 w   w   w   w   w    	|
// |	   w   w   w   w   w  	|
// |	 w   w   w   w   w    	|
// +--------------------------+
```

### .move(move)
Attempts to make a move on the board, returning a move object if the move was
legal, otherwise null.

```js
var draughts = new Draughts();

draughts.move('e4')
// -> {flags: "n", from: 35, jumps: Array[0], piece: "w", piecesTaken: undefined, takes: Array[0], to: 30}
```

### .moves([ options ])
Returns a list of legals moves from the current position.  The function takes an optional parameter which controls the single-square move generation and verbosity.

```js
var draughts = new Draughts();
draughts.moves();
// -> {from: 16, jumps: Array[0], piecesTaken: undefined, takes: Array[0], to: 21}

```

### .getLegalMoves(squareNum)
Returns a list of legals moves from the given square.

```js
var draughts = new Draughts();
draughts.getLegalMoves();
// -> [
  {
    "jumps": [],
    "takes": [],
    "from": 32,
    "to": 28
  },
  {
    "jumps": [],
    "takes": [],
    "from": 32,
    "to": 27
  }
]

```

### .pdn([ options ])
Returns the game in pdn format. Options is an optional parameter which may include
max width and/or a newline character settings.

```js
var draughts = new Draughts();
draughts.header('White', 'Plunky', 'Black', 'Plinkie');
draughts.move('35-31');
draughts.move('19-23');
draughts.move('32-27');

draughts.pdn({ max_width: 5, newline_char: '<br />' });
// -> [SetUp "1"]<br />[FEN "W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20"]<br /><br />1. 35-30
```

### .put(piece, square)
Place a piece on square where piece is an object with the form
{ piece: ..., square: ... }.  Returns true if piece was successfully placed,
otherwise the board remains unchanged and false is returned.  `put()` will fail
when passed an invalid piece or square.

```js
draughts.clear();

draughts.put({ piece: 'w', square: 35}) // put a black pawn on a5
// -> true

```

### .remove(square)
Remove and return the piece on _square_.

```js

draughts.remove('35');
// -> { type: 'p', color: 'b' },
```

### .reset()
Reset the board to the initial starting position.


### .turn()
Returns the current side to move.

```js
draughts.load('W:W31-50:B1-20')
draughts.turn()
// -> 'w'
```

### .undo()
Takeback the last half-move, returning a move object if successful, otherwise null.

```js
var draughts = new Draughts();

draughts.fen();
// -> 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
draughts.move({from: 35, to: 30});
draughts.fen();
// -> 'B:W30,31,32,33,34,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'

draughts.undo();
// -> { flags: "n", from: 35, jumps: Array[0], piece: "w", piecesTaken: undefined, takes: Array[0], to: 30 }
draughts.fen();
// -> 'W:W31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50:B1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20'
draughts.undo();
// -> null
```

### .validate_fen(fen):
Returns a validation object specifying validity or the errors found within the
FEN string.

```js
draughts.validate_fen('');
// -> { error: { code: 0, message: "no errors"}, error_number: 0, valid: true' }

draughts.validate_fen('4r3/8/X12XPk/1p6/pP2p1R1/P1B5/2P2K2/3r4 w - - 1 45');
// -> {error: {code: 1, message: "fen position is not a string"}, valid: false }
```

## Maintainers
- [@petitlapin](https://github.com/petitlapin)
- [@Richienb](https://github.com/Richienb)

## BUGS

- Piece promotion may be buggy.

## TODO

- Investigate the use of piece lists (this may shave a few cycles off
  generate_moves() and attacked()).
- Refactor API to use camelCase - yuck.
- Add more robust FEN validation.
