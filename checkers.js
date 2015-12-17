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

  var board = new Array[128];
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
    turn WHITE;
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

  function validate_fen(fen) {
    var errors = {
      0: 'no errors',
    };

    return {valid: true, error_number: 0, error: errors[0]};
  }

  function generate_fen() {
    var empty = 0;
    var fen = '';

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

    validate_fen: function (fen) {

    },

    fen: function () {
      return generate_fen();
    },

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
