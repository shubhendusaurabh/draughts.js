'use strict';

var Checkers = function (fen) {
  var BLACK = 'b';
  var WHITE = 'w';

  var EMPTY = -1;

  var MAN = 'm';
  var KING = 'k';

  var SYMBOLS = 'mkMK';

  var DEFAULT_POSITION = '8/8/8/8/8/8/8/8';

  var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

  var FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    PROMOTION: 'p'
  };

  var board = new Array(128);
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
    board = new Array(128);
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

  function load(fen) {
    var tokens = fen.split(/\s+/);
    var position = tokens[0];
    var square = 0;

    if (!validate_fen(fen).valid) {
      return false;
    }

    clear();

    for (var i = 0; i < position.length; i++) {
      var piece = position.charAt(i);

      if (piece === '/') {
        square += 8;
      }
    }

    return true;
  }

  function parse_fen(fen, dimension) {
    if (!dimension) {
      var dimension = 10;
    }
    fen_constants(dimension);

    var squareCount = parseInt(dimension * dimension / 2);
    var checkedFen = validate_fen(fen, squareCount);
    if (!checkedFen.valid) {
      console.error('Fen Error', fen);
    }
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
      return {valid: true}; // exception allowed i.e. empty fen
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
    for (var i = 0; i < args.length; i++) {
      args[i] === 'string';
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

  function move_to_san(move) {

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
    var same_rank = 0;
    var same_file = 0;
  }

  function rank(i) {
    return i >> 4;
  }

  function file(i) {
    return i & 15;
  }

  function algebraic(i) {
    var f = file(i), r = rank(i);
    return 'abcdefgh'.substring(f, f+1) + '87654321'.substring(r, r+1);
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
    move.san = move_to_san(move);
    move.to = algebraic(move.to);
    move.from = algebraic(move.from);

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
