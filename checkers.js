'use strict';

var sample = '';
sample += '[Event "NK 2009, ronde 12, 17 april"]' + '\n';
 sample += '[Site "nk2009.dvvbi.nl"]' + '\n';
 sample += '[Date "17 april 2009"]' + '\n';
 sample += '[Round "12"]' + '\n';
 sample += '[White "Jeroen van den Akker"]' + '\n';
 sample += '[Black "Roel Boomstra"]' + '\n';
 sample += '[Result "1-1"]' + '\n';
 sample += '  1. 32-28 17-22  2. 28x17 11x22  3. 37-32  6-11  4. 41-37 12-17  5. 46-41  8-12' + '\n';
 sample += '  6. 34-29 19-23  7. 40-34 14-19  8. 45-40 10-14  9. 32-28 23x32 10. 37x28  5-10' + '\n';
 sample += ' 11. 41-37 20-24 12. 29x20 15x24 13. 34-30 16-21 14. 31-26 11-16 15. 37-31  1-6 ' + '\n';
 sample += ' 16. 40-34  7-11 17. 30-25  2-7  18. 34-30  3-8  19. 39-34 18-23 20. 47-41 23x32' + '\n';
 sample += ' 21. 38x18 12x23 22. 34-29 23x34 23. 30x39  7-12 24. 43-38 19-23 25. 41-37 13-18' + '\n';
 sample += ' 26. 37-32 24-29 27. 33x24 23-28 28. 32x23 18x20 29. 42-37 20-24 30. 37-32 12-18' + '\n';
 sample += ' 31. 39-33  8-13 32. 49-43 18-22 33. 32-27 21x32 34. 38x18 13x22 35. 31-27 22x31' + '\n';
 sample += ' 36. 26x37 14-19 37. 43-38 19-23 38. 48-42 10-14 39. 44-40  9-13 40. 40-34 23-28' + '\n';
 sample += ' 41. 33x22 17x28 42. 50-44 11-17 43. 34-29 24x33 44. 38x29 16-21 45. 44-39 17-22' + '\n';
 sample += ' 46. 42-38 21-27 47. 35-30  6-11 48. 30-24 11-17 49. 38-33 13-18 50. 37-31 28-32' + '\n';
 sample += ' 51. 24-20 14-19 52. 29-24 19x30 53. 25x34 17-21 54. 33-28 22x44 55. 31x13 44-50' + '\n';
 sample += ' 56. 13-8  32-38 57.  8-2  38-43 58. 20-14 43-48 59.  2-16 48x3  60. 16x32  3-26' + '\n';
 sample += '1-1' + '\n' + '\n';

var Checkers = function (fen) {
  var BLACK = 'B';
  var WHITE = 'W';

  var EMPTY = -1;

  var MAN = 'm';
  var KING = 'k';

  var SYMBOLS = 'mkMK';

  var DEFAULT_POSITION = 'B:B:W';

  var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

  var FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    PROMOTION: 'p'
  };

  var board = new Array(100);
  var kings = {w: EMPTY, b: EMPTY};
  var turn = WHITE;
  var half_moves = 0;
  var move_number = 1;
  var history = [];
  var header = {};

  if (!fen) {
    load(DEFAULT_POSITION);
  } else {
    load(fen);
  }

  function clear() {
    board = new Array(100);
    kings = {w: EMPTY, b: EMPTY};
    turn = WHITE;
    half_moves = 0;
    move_number = 1;
    history = [];
    header = {};
    update_setup(generate_fen());
  }

  function reset() {
    load(DEFAULT_POSITION);
  }

  function load(fen, dimension) {
    if (!dimension) {
      var dimension = 10;
    }
    // fen_constants(dimension); //TODO for empty fens

    var squareCount = parseInt(dimension * dimension / 2);
    var checkedFen = validate_fen(fen, squareCount);
    if (!checkedFen.valid) {
      console.error('Fen Error', fen);
    }

    clear();

    // remove spaces
    fen = fen.replace(/\s+/g, '');
    // remove suffixes
    fen.replace(/\..*$/, '');

    var tokens = fen.split(':');
    // which side to move
    turn = tokens[0].substr(0, 1);

    var positions = new Array();
    for (var i = 0; i <= squareCount; i++) {
      positions[i] = '0';
    }
    positions[0] = turn;
    // TODO refactor
    for (var k = 1; k <= 2; k++) {
      console.log(tokens);
      var color = tokens[k].substr(0, 1);
      var sideString = tokens[k].substr(1);
      if (sideString.length == 0) continue;
      var numbers = sideString.split(',');
      for (var i = 0; i < numbers.length; i++) {
        var numSquare = numbers[i];
        var isKing = (numSquare.substr(0, 1) == 'K' ? true : false);
        numSquare = (isKing == true ? numSquare.substr(1) : numSquare); //strip K
        var range = numSquare.split('-');
        if (range.length == 2) {
          var from = parseInt(range[0]);
          var to = parseInt(range[1]);
          for (var j = from; j <= to; j++) {
            positions[j] = (isKing == true ? color.toUpperCase() : color.toLowerCase());
            put({type: color.toLowerCase(), color: color});
          }
        } else {
          var numSquare = parseInt(numSquare);
          positions[numSquare] = (isKing == true ? color.toUpperCase() : color.toLowerCase());
          put({type: color.toLowerCase(), color: color});
        }
      }
    }

    // return positions.join('');
    update_setup(generate_fen(positions));

    return true;
  }

  function validate_fen(fen, squareCount) {
    // var fenPattern = /^(W|B):(W|B)((?:K?\d*)(?:,K?\d+)*?)(?::(W|B)((?:K?\d*)(?:,K?\d+)*?))?$/;
    var errors = [
      {
        code: 0,
        message: 'no errors',
      },
      {
        code: 1,
        message: 'fen position not a string'
      },
      {
        code: 2,
        message: 'fen position has not colon at second position'
      },
      {
        code: 3,
        message: 'fen position has not 2 colons'
      },
      {
        code: 4,
        message: 'side to move of fen position not valid'
      },
      {
        code: 5,
        message: 'color(s) of sides of fen position not valid'
      },
      {
        code: 6,
        message: 'squares of fen position not integer'
      },
      {
        code: 7,
        message: 'squares of fen position not valid',
      },
      {
        code: 8,
        message: 'empty fen position'
      }
    ];

    if (typeof fen !== 'string') {
      return {valid: false, error: errors[0], fen: fen};
    }

    var fen = fen.replace(/\s+/g, '');

    if (fen == 'B::' || fen == 'W::' || fen == '?::') {
      return {valid: true, fen: fen+':B:W'}; // exception allowed i.e. empty fen
    }

    fen = fen.replace(/\..*$/, '');

    if (fen === '') {
      return {valid: false, error: errors[7], fen: fen};
    }

    if (fen.substr(1, 1) !== ':') {
      return {valid: false, error: errors[1], fen: fen};
    }

    // fen should be 3 sections separated by colons
    var parts = fen.split(':');
    if (parts.length !== 3) {
      return {valid: false, error: errors[2], fen: fen};
    }

    //  which side to move
    var turnColor = parts[0];
    if (turnColor !== 'B' && turnColor !== 'W' && turnColor !== '?') {
      return {valid: false, error: errors[3], fen: fen};
    }

    // check colors of both sides
    var colors = parts[1].substr(0, 1) + parts[2].substr(0, 1);
    if (colors != 'BW' && colors != 'WB') {
      return {valid: false, error: errors[4], fen: fen};
    }

    // check parts for both sides
    for (var k = 1; k <= 2; k += 1) {
      var sideString = parts[k].substr(1); // Stripping color
      if (sideString.length === 0) {
        continue;
      }
      var numbers = sideString.split(',');
      for (var i = 0; i < numbers.length; i++) {
        var numSquare = numbers[i];
        var isKing = (numSquare.substr(0, 1) == 'K' ? true : false);
        numSquare = (isKing == true ? numSquare.substr(1) : numSquare);
        var range = numSquare.split('-');
        if (range.length === 2) {
          if (isInteger(range[0]) == false) {
            console.log(isInteger(range[0]));
            return {valid: false, error: errors[5], fen: fen, range: range[0]};
          }
          if (!(range[0] >= 1 && range[0] <= squareCount)) {
            return {valid: false, error: errors[6], fen: fen};
          }
          if (isInteger(range[1]) == false) {
            return {valid: false, error: errors[5], fen: fen};
          }
          if (!(range[1] >= 1 && range[1] <= squareCount)) {
            return {valid: false, error: errors[6], fen: fen};
          }
        } else {
          if (isInteger(numSquare) == false) {
            return {valid: false, error: errors[5], fen: fen};
          }
          if (!(numSquare >= 1 && numSquare <= squareCount)) {
            return {valid: false, error: errors[6], fen: fen};
          }
        }
      }
    }
    // var turnColor = '';
    // var whiteManPositions = [];
    // var whiteKingPositions = [];
    // var blackManPositions = [];
    // var blackKingPositions = [];
    //
    // var m = fen.match(fenPattern);
    // if (m) {
    //   turnColor = m[1];
    // }

    return {valid: true, error_number: 0, error: errors[0]};
  }

  function generate_fen() {
    var empty = 0;
    var fen = '';
    var cflags = '';
    var move_number = '';

    return [fen, turn, cflags, move_number].join(' ');
  }

  function set_header(args) {
    for (var i = 0; i < args.length; i += 2) {
      if (typeof args[i] === 'string' && typeof args[i+1] === 'string') {
        header[args[i]] = args[i+1];
      }
    }
    return header;
  }

  function update_setup(fen) {
    if (history.length > 0) {
      return false;
    }
    if (fen != DEFAULT_POSITION) {
      header['SetUp'] = '1';
      header['FEN'] = fen;
    } else {
      delete header['SetUp'];
      delete header['FEN'];
    }
  }

  function parsePDN(pdn, options) {
    function mask(str) {
      return str.replace(/\\/g, '\\');
    }

    var tagsPattern = /^\[\s*(\w*)\s*\"(.*?)\"\s*\]$/;
    var movesPattern = /(?:(\d+)\.(?:\.\.|\s+\.\.\.)?)?\s*(\d+(?:[-x]\d+)+)([\!\?\*\(\)]*)\s+(?:\{([^}]*)\}){0,1}\s*(?:(\d+(?:[-x]\d+)+)([\!\?\*\(\)]*)\s+?(?:\{([^}]*)\}){0,1})?/g;
    var gameTerminatePattern = /\s([012]\-[012]|1\/2\-1\/2|\*)\s/g;

    var temp = pdn.trim() + " ";

    var list = [];
    var match;
    var idxNextGame = 0;
    var cpt = 0;
    while ((match = gameTerminatePattern.exec(temp)) != null) {
      console.log(match);
      cpt += 1;
      if (cpt > 200) {
        break;
      }
      var idxStart = match.index;
      var idxEnd = idxStart + match[0].length;

      var map = {};
      map['idxStartGame'] = "" + idxNextGame;
      map['idxStartGameTermination'] = "" + idxStart;
      map['idxEndGame'] = "" + idxEnd;
      list.push(map);

      idxNextGame = idxEnd;
      console.log(idxNextGame, idxEnd);
    }
    console.log(list);
  }

  function get(square) {
    var piece = board[SQUARES[square]];
    return (piece) ? {type: piece.type, color: piece.color} : null;
  }

  function put(piece, square) {
    // check for valid piece object
    if (!('type' in piece && 'color' in piece)) {
      return false;
    }

    // check for piece
    if (SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
      return false;
    }

    // check for valid square
    if (!(square in SQUARES)) {
      return false;
    }

    var sq = SQUARES[square];

    board[sq] = {type: piece.type, color: piece.color};
    update_setup(generate_fen());

    return true;
  }

  function remove(square) {
    var piece = get(square);
    board[SQUARES[square]] = null;
    update_setup(generate_fen());

    return piece;
  }

  function build_move(board, from, to, flags, promotion) {
    var move = {
      color: turn,
      from: from,
      to: to,
      flags: flags,
      piece: board[from].type
    };

    if (promotion) {
      move.flags |= BITS.PROMOTION;
    }

    if (board[to]) {
      move.captured = board[to].type;
    } else if (flags & BITS.CAPTURE) {
      move.captured = MAN;
    }
    return move;
  }

  function generate_moves(options) {
    function add_move(board, moves, from, to, flags) {
      if (true) {

      } else {

      }
    }

    var moves = [];
    var us = turn;
    var them = swap_color(us);

    var first_sq;
    var last_sq;
    var single_square = false;

    var legal;
  }

  function attacked(color, square) {

  }

  function push(move) {
    history.push({
      move: move,
      turn: turn,
      move_number: move_number
    });
  }

  function make_move(move) {
    var us = turn;
    var them = swap_color(us);
    push(move);

    board[move.to] = board[move.from];
    board[move.from] = null;
  }

  function undo_move() {
    var old = history.pop();
    if (old == null) {
      return null;
    }
  }

  function get_disambiguator(move) {
    var moves = generate_moves();

    var from = move.from;
    var to = move.to;
    var piece = move.piece;

    var ambiguities = 0;
  }

  function swap_color(c) {
    return c === WHITE ? BLACK : WHITE;
  }

  function is_digit(c) {
    return '0123456789'.indexOf(c) !== -1;
  }

  function isInteger(int) {
    var regex = /^\d+$/;
    if (regex.test(int)) {
      return true;
    } else {
      return false;
    }
  }

  function make_pretty(ugly_move) {
    var move = clone(ugly_move);
    // move.san = move_to_san(move);
    // move.to = algebraic(move.to);
    // move.from = algebraic(move.from);

    var flags = '';

    for (var flag in BITS) {
      if (BITS[flag] & move.flags) {
        flags += FLAGS[flag];
      }
    }
    move.flags = flags;

    return move;
  }

  function clone(obj) {
    var dupe = (obj instanceof Array) ? [] : {};

    for (var property in obj) {
      if (typeof property === 'object') {
        dupe[property] = clone(obj[property]);
      } else {
        dupe[property] = obj[property];
      }
    }

    return dupe;
  }

  function trim(str) {
    return str.replace(/^\s+|\s+$/g, '');
  }

  function perft(depth) {
    var moves = generate_moves({legal: false});
    var nodes = 0;
    var color = turn;

    for (var i = 0; i < moves.length; i++) {
      make_move(moves[i]);
      if (!king_attacked(color)) {
        if (depth - 1 > 0) {
          var child_nodes = perft(depth - 1);
          nodes += child_nodes;
        } else {
          nodes++;
        }
      }
      undo_move();
    }

    return nodes;
  }

  return {
    WHITE: WHITE,
    BLACK: BLACK,
    MAN: MAN,
    KING: KING,
    FLAGS: FLAGS,
    SQUARES: 'A8',

    load: function (fen) {
      return load(fen);
    },

    reset: function () {
      return reset();
    },

    moves: function (options) {

    },

    game_over: function () {

    },

    validate_fen: validate_fen,

    fen: generate_fen,

    pdn: function (options) {

    },

    load_pdn: function (pdn, options) {

    },

    parsePDN: parsePDN,

    header: function () {
      return set_header(arguments);
    },

    ascii: function () {
      return ascii();
    },

    turn: function () {
      return turn;
    },

    move: function move(move) {

    },

    undo: function () {
      var move = undo_move();
      return (move) ? make_pretty(move) : null;
    },

    clear: function () {
      return clear();
    },

    put: function (piece, square) {
      return put(piece, square);
    },

    get: function (square) {
      return get(square);
    },

    remove: function (square) {
      return remove(square);
    },

    perft: function (depth) {
      return perft(depth);
    },

    square_color: function(square) {
      return null;
    },

    history: function (options) {

    }
  }
};

if (typeof exports !== 'undefined') {
  exports.Checkers = Checkers;
}

if (typeof define !== 'undefined') {
  define (function () {
    return Checkers;
  });
}
