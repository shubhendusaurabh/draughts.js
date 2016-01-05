'use strict';

var sample = '';
sample += '[Event "NK 2009, ronde 12, 17 april"]' + '\n';
 sample += '[Site "nk2009.dvvbi.nl"]' + '\n';
 sample += '[Date "17 april 2009"]' + '\n';
 sample += '[Round "12"]' + '\n';
 sample += '[White "Jeroen van den Akker"]' + '\n';
 sample += '[Black "Roel Boomstra"]' + '\n';
 sample += '[Result "1-1"]' + '\n';
 sample += '' + '\n';
 sample += '1. 32-28 17-22  2. 28x17 11x22  3. 37-32  6-11  4. 41-37 12-17  5. 46-41  8-12' + '\n';
 sample += '6. 34-29 19-23  7. 40-34 14-19  8. 45-40 10-14  9. 32-28 23x32 10. 37x28  5-10' + '\n';
 sample += '11. 41-37 20-24 12. 29x20 15x24 13. 34-30 16-21 14. 31-26 11-16 15. 37-31  1-6 ' + '\n';
 sample += '16. 40-34  7-11 17. 30-25  2-7  18. 34-30  3-8  19. 39-34 18-23 20. 47-41 23x32' + '\n';
 sample += '21. 38x18 12x23 22. 34-29 23x34 23. 30x39  7-12 24. 43-38 19-23 25. 41-37 13-18' + '\n';
 sample += '26. 37-32 24-29 27. 33x24 23-28 28. 32x23 18x20 29. 42-37 20-24 30. 37-32 12-18' + '\n';
 sample += '31. 39-33  8-13 32. 49-43 18-22 33. 32-27 21x32 34. 38x18 13x22 35. 31-27 22x31' + '\n';
 sample += '36. 26x37 14-19 37. 43-38 19-23 38. 48-42 10-14 39. 44-40  9-13 40. 40-34 23-28' + '\n';
 sample += '41. 33x22 17x28 42. 50-44 11-17 43. 34-29 24x33 44. 38x29 16-21 45. 44-39 17-22' + '\n';
 sample += '46. 42-38 21-27 47. 35-30  6-11 48. 30-24 11-17 49. 38-33 13-18 50. 37-31 28-32' + '\n';
 sample += '51. 24-20 14-19 52. 29-24 19x30 53. 25x34 17-21 54. 33-28 22x44 55. 31x13 44-50' + '\n';
 sample += '56. 13-8  32-38 57.  8-2  38-43 58. 20-14 43-48 59.  2-16 48x3  60. 16x32  3-26' + '\n';
 sample += '1-1' + '\n' + '\n';

 /*
 ||==================================================================================
 || DESCRIPTION OF IMPLEMENTATION PRINCIPLES
 || A. Position for rules (internal representation): string with length 56.
 ||    Special numbering for easy applying rules.
 ||    Valid characters: b B w W 0 -
 ||       b (black) B (black king) w (white) W (white king) 0 (empty) (- unused)
 ||    Examples:
 ||      '-bbbBBB000w-wwWWWwwwww-bbbbbbbbbb-000wwwwwww-00bbbwwWW0-'
 ||      '-0000000000-0000000000-0000000000-0000000000-0000000000-'  (empty position)
 ||      '-bbbbbbbbbb-bbbbbbbbbb-0000000000-wwwwwwwwww-wwwwwwwwww-'  (start position)
 || B. Position (external respresentation): string with length 51.
 ||    Square numbers are represented by the position of the characters.
 ||    Position 0 is reserved for the side to move (B or W)
 ||    Valid characters: b B w W 0
 ||       b (black) B (black king) w (white) W (white king) 0 (empty)
 ||    Examples:
 ||       'B00000000000000000000000000000000000000000000000000'  (empty position)
 ||       'Wbbbbbbbbbbbbbbbbbbbb0000000000wwwwwwwwwwwwwwwwwwww'  (start position)
 ||       'WbbbbbbBbbbbb00bbbbb000000w0W00ww00wwwwww0wwwwwwwww'  (random position)
 ||
 || External numbering      Internal Numbering
 || --------------------    --------------------
 ||   01  02  03  04  05      01  02  03  04  05
 || 06  07  08  09  10      06  07  08  09  10
 ||   11  12  13  14  15      12  13  14  15  16
 || 16  17  18  19  20      17  18  19  20  21
 ||   21  22  23  24  25      23  24  25  26  27
 || 26  27  28  29  30      28  29  30  31  32
 ||   31  32  33  34  35      34  35  36  37  38
 || 36  37  38  39  40      39  40  41  42  43
 ||   41  42  43  44  45      45  46  47  48  49
 || 46  47  48  49  50      50  51  52  53  54
 || --------------------    --------------------
 ||
 || Internal numbering has fixed direction increments for easy applying rules:
 ||   NW   NE         -5   -6
 ||     \ /             \ /
 ||     sQr     >>      sQr
 ||     / \             / \
 ||   SW   SE         +5   +6
 ||
 || DIRECTION-STRINGS
 || Strings of variable length for each of four directions at one square.
 || Each string represents the position in that direction.
 || Directions: NE, SE, SW, NW (wind directions)
 || Example for square 29 (internal number):
 ||   NE: 29, 24, 19, 14, 09, 04     b00bb0
 ||   SE: 35, 41, 47, 53             bww0
 ||   SW: 34, 39                     b0
 ||   NW: 23, 17                     bw
 || CONVERSION internal to external representation of numbers.
 ||   N: external number, values 1..50
 ||   M: internal number, values 0..55 (invalid 0,11,22,33,44,55)
 ||   Formulas:
 ||   M = N + floor((N-1)/10)
 ||   N = M - floor((M-1)/11)
 ||
 ||==================================================================================
 */
var Checkers = function (fen) {
  var BLACK = 'B';
  var WHITE = 'W';

  var EMPTY = -1;

  var MAN = 'b';
  var KING = 'w';

  var SYMBOLS = 'bwBW';

  var DEFAULT_FEN = 'W:W31-50:B1-20';

  var position;
  var DEFAULT_POSITION_INTERNAL = '-bbbbbbbbbb-bbbbbbbbbb-0000000000-wwwwwwwwww-wwwwwwwwww-';
  var DEFAULT_POSITION_EXTERNAL = 'Wbbbbbbbbbbbbbbbbbbbb0000000000wwwwwwwwwwwwwwwwwwww';
  position = DEFAULT_POSITION_INTERNAL;
  var STEPS = {NE: -5, SE: 6, SW: 5, NW: -6};

  var POSSIBLE_RESULTS = ['1-0', '0-1', '1/2-1/2', '*'];

  var FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    PROMOTION: 'p'
  };

  var UNICODES = {
    'w': '\u26C0',
    'b': '\u26C2',
    'B': '\u26C1',
    'W': '\u26C3',
    '0': '  '
  }

  var SIGNS = {
    n: '-',
    c: 'x'
  };

  var BITS = {
    NORMAL: 1,
    CAPTURE: 2,
    PROMOTION: 4
  };

  var turn = WHITE;
  var half_moves = 0;
  var moveNumber = 1;
  var history = [];
  var header = {};

  if (!fen) {
    load(DEFAULT_FEN);
  } else {
    load(fen);
  }

  function clear() {
    position = DEFAULT_POSITION_INTERNAL;
    turn = WHITE;
    half_moves = 0;
    moveNumber = 1;
    history = [];
    header = {};
    update_setup(generate_fen());
  }

  function reset() {
    load(DEFAULT_FEN);
  }

  function load(fen) {
    // TODO for default fen
      var dimension = 10;
    if (!fen || fen == DEFAULT_FEN) {
      position = DEFAULT_POSITION_INTERNAL;
      update_setup(generate_fen(position));
      return true;
    }
    // fen_constants(dimension); //TODO for empty fens

    var squareCount = parseInt(dimension * dimension / 2);
    var checkedFen = validate_fen(fen);
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

    // var positions = new Array();
    for (var i = 1; i <= position.length; i++) {
      // console.log(position[i]);
      position = position.setCharAt(convertNumber(i, 'internal'), '0');
    }
    position = position.setCharAt(0, turn);
    // console.log(position, turn);
    // TODO refactor
    for (var k = 1; k <= 2; k++) {
      // TODO called twide
      // console.log(tokens);
      var color = tokens[k].substr(0, 1);
      var sideString = tokens[k].substr(1);
      if (sideString.length == 0) continue;
      var numbers = sideString.split(',');
      console.log(color, sideString, numbers);
      for (var i = 0; i < numbers.length; i++) {
        var numSquare = numbers[i];
        var isKing = (numSquare.substr(0, 1) == 'K' ? true : false);
        numSquare = (isKing == true ? numSquare.substr(1) : numSquare); //strip K
        var range = numSquare.split('-');
        if (range.length == 2) {
          var from = parseInt(range[0]);
          var to = parseInt(range[1]);
          for (var j = from; j <= to; j++) {
            console.log(position[j], 'looop');
            position = position.setCharAt(j, (isKing == true ? color.toUpperCase() : color.toLowerCase()));
            // put({type: color.toLowerCase(), color: color});
          }
        } else {
          var numSquare = parseInt(numSquare);
          // console.log(position, 'else');
          position = position.setCharAt(numSquare, (isKing == true ? color.toUpperCase() : color.toLowerCase()));
          // put({type: color.toLowerCase(), color: color});
        }
      }
    }

    // console.log(position);
    update_setup(generate_fen(position));

    return true;
  }

  function validate_fen(fen) {
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
          if (!(range[0] >= 1 && range[0] <= 100)) {
            return {valid: false, error: errors[6], fen: fen};
          }
          if (isInteger(range[1]) == false) {
            return {valid: false, error: errors[5], fen: fen};
          }
          if (!(range[1] >= 1 && range[1] <= 100)) {
            return {valid: false, error: errors[6], fen: fen};
          }
        } else {
          if (isInteger(numSquare) == false) {
            return {valid: false, error: errors[5], fen: fen};
          }
          if (!(numSquare >= 1 && numSquare <= 100)) {
            return {valid: false, error: errors[6], fen: fen};
          }
        }
      }
    }

    return {valid: true, error_number: 0, error: errors[0]};
  }

  function generate_fen() {
    var black = [];
    var white = [];
    var externalPosition = convertPosition(position);
    for (var i = 0; i < externalPosition.length; i++) {
      switch (externalPosition[i]) {
        case 'w':
          white.push(i);
          break;
        case 'W':
          white.push('K'+i);
          break;
        case 'b':
          black.push(i);
          break;
        case 'B':
          black.push(i);
        default:
          break;
      }
    }
    return turn.toUpperCase() + ':W:' + white.join(',') + 'B:' + black.join(',');
  }

  function generatePDN(options) {
    // for html usage {maxWidth: 72, newline_char: "<br />"}
    var newline = (typeof options === 'object' && typeof options.newline_char === 'string') ?
                    options.newline_char : '\n';
    var maxWidth = (typeof options === 'object' && typeof options.maxWidth === 'number') ?
                    options.maxWidth : 0;
    var result = [];
    var headerExists = false;

    for (var i in header) {
      result.push('[' + i + ' \"' + header[i] + '\"]' + newline);
      headerExists = true;
    }

    if (headerExists && history.length) {
      result.push(newline);
    }

    var tempHistory = clone(history);

    var moves = [];
    var moveString = '';
    var moveNumber = 1;

    while (tempHistory.length > 0) {
      var move = tempHistory.shift();
      // console.log(move);
      if (move.turn == 'W') {
        moveString += moveNumber + '. ';
      }
      moveString += move.move.from;
      if (move.move.flags === 'c') {
        moveString += 'x';
      } else {
        moveString += '-'
      }
      moveString += move.move.to;
      moveString += ' ';
      moveNumber += 1;
    }

    if (moveString.length) {
      moves.push(moveString);
    }

    // TODO resutl from pdn or header??
    if (typeof header.Result !== 'undefined') {
      moves.push(header.Result);
    }

    if (maxWidth === 0) {
      return result.join('') + moves.join(' ');
    }

    var currentWidth = 0;
    for (var i = 0; i < moves.length; i++) {
      if (currentWidth + moves[i].length > maxWidth && i !== 0) {
        if (result[result.length - 1] === ' ') {
          result.pop();
        }

        result.push(newline);
        currentWidth = 0;
      } else if (i !== 0){
        result.push(' ');
        currentWidth++;
      }
      result.push(' ');
      currentWidth += moves[i].length;
    }

    return result.join('');
  }

  function set_header(args) {
    for (var i = 0; i < args.length; i += 2) {
      if (typeof args[i] === 'string' && typeof args[i+1] === 'string') {
        header[args[i]] = args[i+1];
      }
    }
    return header;
  }

  /* called when the initial board setup is changed with put() or remove().
   * modifies the SetUp and FEN properties of the header object.  if the FEN is
   * equal to the default position, the SetUp and FEN are deleted
   * the setup is only updated if history.length is zero, ie moves haven't been
   * made.
   */
  function update_setup(fen) {
    if (history.length > 0) {
      return false;
    }
    if (fen != DEFAULT_FEN) {
      header['SetUp'] = '1';
      header['FEN'] = fen;
    } else {
      delete header['SetUp'];
      delete header['FEN'];
    }
  }

  function parsePDN(pdn, options) {
    var newline_char = (typeof options === 'object' &&
                          typeof options.newline_char === 'string') ?
                          options.newline_char : '\r?\n';
        var regex = new RegExp('^(\\[(.|' + mask(newline_char) + ')*\\])' +
                               '(' + mask(newline_char) + ')*' +
                               '1.(' + mask(newline_char) + '|.)*$', 'g');

    function mask(str) {
      return str.replace(/\\/g, '\\');
    }

    function parsePDNHeader(header, options) {
      var headerObj = {};
      var headers = header.split(new RegExp(mask(newline_char)));
      var key = '';
      var value = '';

      for (var i = 0; i < headers.length; i++) {
        key = headers[i].replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1');
        value = headers[i].replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1');
        if (trim(key).length > 0) {
          headerObj[key] = value;
        }
        // console.log(key, value);
      }

      return headerObj;
    }

    var headerString = pdn.replace(regex, '$1');
    if (headerString[0] !== '[') {
      headerString = '';
    }

    reset();

    var headers = parsePDNHeader(headerString, options);

    for (var key in headers) {
      set_header([key, headers[key]]);
    }

    if (headers['Setup'] === '1') {
      if (!(('FEN' in headers) && load(headers['FEN']))) {
        console.log('fen invalide');
        return false;
      } else {
        console.log(ascii());
        console.log('fen valid');
      }
    } else {
      // console.log('setup not present');
      position = DEFAULT_POSITION_INTERNAL;
    }

    /* delete header to get the moves */
    var ms = pdn.replace(headerString, '').replace(new RegExp(mask(newline_char), 'g'), ' ');

    /* delete comments */
    ms = ms.replace(/(\{[^}]+\})+?/g, '');

    /* delete recursive annotation variations */
    var rav_regex = /(\([^\(\)]+\))+?/g
    while (rav_regex.test(ms)) {
      ms = ms.replace(rav_regex, '');
    }

    /* delete move numbers */
    //TODO not working for move numbers with space
    ms = ms.replace(/\d+\./g, '');

    /* delete ... indicating black to move */
    ms = ms.replace(/\.\.\./g, '');

    /* trim and get array of moves */
    var moves = trim(ms).split(new RegExp(/\s+/));

    /* delete empty entries */
    moves = moves.join(',').replace(/,,+/g, ',').split(',');

    var move = '';
    // console.log(moves);
    // console.log(position);
    for (var half_move = 0; half_move < moves.length - 1; half_move += 1) {

      // console.log(moves[half_move]);
      move = getMoveObject(moves[half_move]);
      if (!move) {
        return false;
      } else {
        makeMove(move);
        // console.log(move);
        // console.log('move made\n and board is\n');
        // console.log(ascii());
      }
    }

    var result = moves[moves.length - 1];
    if (POSSIBLE_RESULTS.indexOf(result) > -1) {
      console.log(headers);
      if (headers['Result'] === 'undefined') {
        set_header(['Result', result]);
        // console.log(headers);
      }
    } else {
      move = getMoveObject(result);
      if (!move) {
        return false;
      } else {
        makeMove(move);
      }
    }
    // console.log(moves);
    return true;
  }

  function getMoveObject(move) {
    // console.log('getting object for', move);
    // TODO move flags for both capture and promote??
    var tempMove = {};
    var matches = move.split(/[x|-]/);
    tempMove.from = matches[0];
    tempMove.to = matches[1];
    var moveType = move.match(/[x|-]/);
    if (moveType == '-') {
      tempMove.flags = FLAGS.NORMAL
    } else {
      tempMove.flags = FLAGS.CAPTURE;
    }
    // console.log(move.from, convertNumber(move.from, 'internal'), position, position.charAt(convertNumber(move.from, 'external')));
    tempMove.piece = position.charAt(convertNumber(tempMove.from, 'internal'));
    // console.log('calling legal moves');
    var moves = getLegalMoves(tempMove.from);
    // console.log(moves, 'from legal moves', tempMove);
    // if move legal then make move
    for (var i = 0; i < moves.length; i += 1) {
      // console.log(tempMove.to, convertNumber(moves[i].to, 'external'), 'is valid ?');
      if (tempMove.to == convertNumber(moves[i].to, 'external')) {
        if (moves[i].takes.length > 0) {
          tempMove.flags = FLAGS.CAPTURE;
          tempMove.captures = moves[i].takes;
          tempMove.piecesCaptured = moves[i].piecesTaken;
        }
        return tempMove;
      }
    }
    console.log(moves, tempMove);
    return false;
  }

  function makeMove(move) {
    var us = turn;
    var them = swap_color(us);
    // console.log(turn, us, them);
    // console.log(us, them, 'mke in mive', move, position.charAt(convertNumber(move.to, 'internal')));
    push(move);
    // console.log(move,position);
    position = position.setCharAt(convertNumber(move.to, 'internal'), position.charAt(convertNumber(move.from, 'internal')));
    position = position.setCharAt(convertNumber(move.from, 'internal'), 0);

// console.log(position, 'makeMove no capture');
    if (move.flags == 'c' && move.captures.length) {
      for (var i = 0; i < move.captures.length; i++) {
        position = position.setCharAt(move.captures[i], 0);
        // console.log('setting captures bit at', convertNumber(move.captures[i], 'external'));
      }
    }
// console.log(move, us, them, move.piece);
    // Promoting piece here
    if (move.to <= 5 && move.piece == 'w') {
      // console.log('piece promoted');
      position = position.setCharAt(convertNumber(move.to, 'internal'), move.piece.toUpperCase());
    } else if (move.to >= 46 && move.piece == 'b') {
      position = position.setCharAt(convertNumber(move.to, 'internal'), move.piece.toUpperCase());
    }

    if (turn == BLACK) {
      moveNumber += 1;
    }
    turn = swap_color(turn);
  }

  function get(square) {
    var piece = position.charAt(convertNumber(square, 'internal'));
    return piece;
  }

  function put(piece, square) {
    // check for valid piece string
    if (SYMBOLS.match(piece) == null) {
      return false;
    }


    // check for valid square
    if (outsideBoard(convertNumber(square, 'internal')) == true) {
      return false;
    }

    position = position.setCharAt(convertNumber(square, 'internal'), piece);
    update_setup(generate_fen());

    return true;
  }

  function remove(square) {
    var piece = get(square);
    position = position.setCharAt(convertNumber(square, 'internal'), 0);
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

  function generate_moves(square) {

    var us = turn;
    var them = swap_color(us);
    var moves = [];
    if (square) {
      moves = getLegalMoves(square);
    } else {
      var externalPosition = convertPosition(position, 'external');
      // console.log(externalPosition, position);
      var pos = 1;
      for (var i = 1; i < externalPosition.length; i++) {
        if (externalPosition[i] == us || externalPosition[i] == us.toLowerCase()) {
          var tempMoves = getLegalMoves(i);

          if (tempMoves.length) {
            moves.push(convertMoves(tempMoves, 'external'));

          }
        }
      }
    }

    return moves = [].concat.apply([], moves);
  }

  function getLegalMoves(index) {
    // var captures = getCaptures(index);
    // var kingCaptures = getCaptures(index);
    var legalMoves;
    if (index) {

      var index = convertNumber(index, 'internal')

      var captures = capturesAtSquare(index, {position: position, dirFrom: ''}, {jumps: [index], takes: [], piecesTaken: []});

      captures = longestCapture(captures);
      legalMoves = captures;
      // console.log(index, 'captures', captures);
      if (captures == 0) {
        legalMoves = movesAtSquare(index);
      }

    }
    // console.log(legalMoves);
    return legalMoves;
  }

  function getMoves(index) {
    var moves = [];
    var pos = 0;
    var color = position[index];
    color = color.toLowerCase();
    console.log(index, color, 'movesfetching');
    while (pos != -1) {
      pos = position.indexOf(color, pos + 1);
      // console.log(pos, color);
      if (pos != -1) {
        var posFrom = pos;
        var tempMoves = movesAtSquare(posFrom, position);
        moves = moves.concat(tempMoves);
      }
    }
    console.log(moves, 'fetched');
    return moves;
  }

  function movesAtSquare(square) {
    var moves = [];
    var posFrom = square;
    var piece = position.charAt(posFrom);
    // console.log(piece, square, 'movesAtSquare');
    switch (piece) {
      case 'b':
      case 'w':
        var dirStrings = directionStrings(position, posFrom, 2);
        // console.log(dirStrings);
        for (var dir in dirStrings) {
          var str = dirStrings[dir];

          var matchArray = str.match(/^[bw]0/) //e.g. b0 w0
          if (matchArray != null && validDir(piece, dir) == true) {
            var posTo = posFrom + STEPS[dir];
            var moveObject = {from: posFrom, to: posTo, takes: [], jumps: []};
            moves.push(moveObject);
          }
        }
        break;
      case 'W':
      case 'B':
        var dirStrings = directionStrings(position, posFrom);
        for (var dir in dirStrings) {
          var str = dirStrings[dir];

          var matchArray = str.match(/^[BW]0/) //e.g. B000, W0
          if (matchArray != null) {
            for (var i = 0; i < matchArray[0].length; i++) {
              var posTo = posFrom + (i * STEPS[dir]);
              var moveObject = {from: posFrom, to: posTo, takes: [], jumps: []};
              moves.push(moveObject);
            }
          }
        }
      default:
        return moves;
    }
    return moves;
  }

  function getCaptures(index) {
    var captures = [];
    var pos = 0;
    var color = position[index];
    console.log('getting capture',position, index);
    // color = color.toLowerCase();
    while (pos != -1) {
      pos = position.indexOf(color, pos + 1);
      if (pos != -1) {
        var posFrom = pos;
        var state = {position: position, dirFrom: ''};
        var capture = {jumps: [], takes: [], from: posFrom, to: '', piecesTaken: []};
        capture.jumps[0] = posFrom;
        console.log(posFrom, state, capture);
        var tempCaptures = capturesAtSquare(pos, state, capture);
        captures = captures.concat(tempCaptures);
      }
    }
    captures = longestCapture(captures);
    return captures;
  }

  function capturesAtSquare(posFrom, state, capture) {
    // console.log(posFrom, state, capture, 'gettting captures');
    var piece = state.position.charAt(posFrom);
    // console.log(piece);
    if (piece != 'b' && piece != 'w' && piece != 'B' && piece != 'W') {
      return [capture];
    }
    if (piece == 'b' || piece == 'w') {
      var dirString = directionStrings(state.position, posFrom, 3);
    } else {
      var dirString = directionStrings(state.position, posFrom);
    }
// console.log(piece, dirString);
    var finished = true;
    var captureArrayForDir = {};
    for (var dir in dirString) {
      if (dir == state.dirFrom) {
        continue;
      }
      var str = dirString[dir];
      switch (piece) {
        case 'b':
        case 'w':
          var matchArray = str.match(/^b[wW]0|^w[bB]0/); //matches: bw0, bW0, wB0, wb0
          if (matchArray != null) {
            var posTo = posFrom + (2 * STEPS[dir]);
            var posTake = posFrom + (1 * STEPS[dir]);
            if (capture.takes.indexOf(posTake) > -1) {
              continue; //capturing twice forbidden
            }
            var updateCapture = clone(capture);
            updateCapture.to = posTo;
            updateCapture.jumps.push(posTo);
            updateCapture.takes.push(posTake);
            updateCapture.piecesTaken.push(position.charAt(posTake));
// console.log(updateCapture);
            var updateState = clone(state);
            updateState.dirFrom = oppositeDir(dir);
            var pieceCode = updateState.position.charAt(posFrom);
            updateState.position = updateState.position.setCharAt(posFrom, '0');
            updateState.position = updateState.position.setCharAt(posTo, pieceCode);
            finished = false;
            captureArrayForDir[dir] = capturesAtSquare(posTo, updateState, updateCapture);
          }
          break;
        case 'B':
        case 'W':
          var matchArray = str.match(/^B0*[wW]0+|^W0*[bB]0+/);  // matches: B00w000, WB00
          if (matchArray != null) {
            var matchStr = matchArray[0];
            var matchArraySubstr = match_str.match(/[wW]0+$|[bB]0+$/);  // matches: w000, B00
            var matchSubstr = matchArraySubstr[0];
            var takeIndex = matchStr.length - matchSubstr.length;
            var posTake = posFrom + (takeIndex * STEPS[dir]);
            if (capture.takes.indexOf(posTake) > -1) {
              continue;
            }
            for (var i = 0; i < matchSubstr.length; i++) {
              var posTo = posFrom + ((takeIndex + k) * STEPS[dir]);
              var updateCapture = clone(capture);
              updateCapture.jumps.push(posTo);
              updateCapture.to = posTo;
              updateCapture.takes.push(posTake);
              updateCapture.piecesTaken.push(position.charAt(posTake));
              var updateState = clone(state);
              updateState.dirFrom = oppositeDir(dir);
              var pieceCode = updateState.position.charAt(posFrom);
              updateState.position = updateState.position.setCharAt(posFrom, '0');
              updateState.position = updateState.position.setCharAt(posTo, pieceCode);
              finished = false;
              var dirIndex = dir + i.toString();
              captureArrayForDir[dirIndex] = capturesAtSquare(posTo, updateState, updateCapture);
            }
          }
          break;
        default:
          var captureArrayForDir = [];
      }
    }
    var captureArray = [];
    if (finished == true) {
      captureArray[0] = capture;
    } else {
      for (var dir in captureArrayForDir) {
        captureArray = captureArray.concat(captureArrayForDir[dir]);
      }
    }
    return captureArray;
  }

  function push(move) {
    history.push({
      move: move,
      turn: turn,
      moveNumber: moveNumber
    });
  }

  function undoMove() {
    var old = history.pop();
    console.log(old);
    if (old == null) {
      return null;
    }

    var move = old.move;
    turn = old.turn;
    moveNumber = old.moveNumber;

    var us = turn;
    var them = swap_color(turn);
// console.log(position, 'before');
    position = position.setCharAt(convertNumber(move.from, 'internal'), move.piece);
    position = position.setCharAt(convertNumber(move.to, 'internal'), 0);
    if (move.flags == 'c') {
      for (var i = 0; i < move.captures.length; i++) {
        position = position.setCharAt(convertNumber(move.captures[i], 'internal'), move.piecesCaptured[i]);
      }
    } else if (move.flags == 'p') {
      position = position.setCharAt(convertNumber(move.from, 'internal'), move.piece.toLowerCase());
    }
// console.log(position, 'after');
    return move;

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

  function longestCapture(captures) {
    var maxJumpCount = 0;
    for (var i = 0; i < captures.length; i++) {
      // console.log(captures[i]);
      var jumpCount = captures[i].jumps.length;
      if (jumpCount > maxJumpCount) {
        maxJumpCount = jumpCount;
      }
    }

    var selectedCaptures = [];
    if (maxJumpCount < 2) {
      return selectedCaptures;
    }

    for (var i = 0; i < captures.length; i++) {
      if (captures[i].jumps.length == maxJumpCount) {
        selectedCaptures.push(captures[i]);
      }
    }

    return selectedCaptures;
  }

  function convertMoves(moves, type) {
    // console.log(moves);
    var tempMoves = [];
    if (!type) {
      return tempMoves;
    }
    for (var i = 0; i < moves.length; i++) {
      var moveObject = {jumps: [], takes: []};
      moveObject.from = convertNumber(moves[i].from, type);
      for (var j = 0; j < moves[i].jumps.length; j++) {
        moveObject.jumps[j] = convertNumber(moves[i].jumps[j], type);
      }
      for (var j = 0; j < moves[i].takes.length; j++) {
        moveObject.takes[j] = convertNumber(moves[i].takes[j], type);
      }
      moveObject.to = convertNumber(moves[i].to, type);
      tempMoves.push(moveObject);
    }
    return tempMoves;
  }

  function convertNumber(number, notation) {
    var num = parseInt(number);
    switch (notation) {
      case 'internal':
        var result = num + Math.floor((num - 1) / 10);
        break;
      case 'external':
        var result = num - Math.floor((num - 1) / 11);
        break;
      default:
        var result = num;
    }
    return result;
  }

  function convertPosition(position, notation) {
    switch (notation) {
      case 'internal':
        var sub1 = position.substr(1, 10);
        var sub2 = position.substr(11, 10);
        var sub3 = position.substr(21, 10);
        var sub4 = position.substr(31, 10);
        var sub5 = position.substr(41, 10);
        var newPosition = '-' + sub1 + '-' + sub2 + '-' + sub3 + '-' + sub4 + '-' + sub5 + '-';
        break;
      case 'external':
        var sub1 = position.substr(1, 10);
        var sub2 = position.substr(12, 10);
        var sub3 = position.substr(23, 10);
        var sub4 = position.substr(34, 10);
        var sub5 = position.substr(45, 10);
        var newPosition = '?' + sub1 + sub2 + sub3 + sub4 + sub5;
        break;
      default:
        var newPosition = position;
    }
    return newPosition;
  }

  function outsideBoard(square) {
    // internal notation only
    var n = parseInt(square);
    if (n >= 0 && n <= 55 && (n%11) != 0) {
      // console.log('inside', n);
      return false;
    } else {
      // console.log('outside', n);
      return true;
    }
  }

  function directionStrings(tempPosition, square, maxLength) {
    // Create direction strings for square at position (internal representation)
    // Output object with four directions as properties (four rhumbs).
    // Each property has a string as value representing the pieces in that direction.
    // Piece of the given square is part of each string.
    // Example of output: {NE: 'b0', SE: 'b00wb00', SW: 'bbb00', NW: 'bb'}
    // Strings have maximum length of given maxLength.
    if (arguments.length == 2) {
      var maxLength = 100;
    }
// console.log(tempPosition, square, maxLength);
    var dirStrings = {};
    if (outsideBoard(square) == true) {
      return 334;
    }

    for (var dir in STEPS) {
      var dirArray = [];
      var i = 0;
      do {
        dirArray[i] = tempPosition.charAt(square + i * STEPS[dir]);
        i++;
        var index = square + i * STEPS[dir];
        var outside = outsideBoard(square + i * STEPS[dir]);
      } while (outside == false && i < maxLength);

      dirStrings[dir] = dirArray.join('');
    }

    return dirStrings;
  }

  function oppositeDir(direction) {
    var opposite = {NE: 'SW', SE: 'NW', SW: 'NE', NW: 'SE'};
    return opposite[direction];
  }

  function validDir(piece, dir) {
    var validDirs = {};
    validDirs.w = {NE: true,  SE: false, SW: false, NW: true};
    validDirs.b = {NE: false, SE: true,  SW: true,  NW: false};
    return validDirs[piece][dir];
  }

  function ascii(unicode) {
    var extPosition = convertPosition(position, 'external');
    var s = '\n+-------------------------------+\n';
    var i = 1;
    for (var row = 1; row <= 10; row++) {
      s += '|\t';
      if (row % 2 != 0) {
        s += '  ';
      }
      for (var col = 1; col <= 10; col++) {
        if (col % 2 == 0) {
          s += '  ';
          i++;
        } else {
          if (unicode == true) {
            s += ' ' + UNICODES[extPosition[i]];
          } else {
            s += ' ' + extPosition[i];
          }

        }
      }
      if (row % 2 == 0) {
        s += '  ';
      }
      s += '\t|\n';
    }
    s += '+-------------------------------+\n';
    return  s;
  }

  function gameOver() {
    // First check if any piece left
    for (var i = 0; i < position.length; i++) {
      if (position[i].toLowerCase() == turn.toLowerCase()) {
        // if moves left game not over
        // console.log('checking if no moves left');
        return !generate_moves();
      }
    }
    return true;
  }

  function getHistory(options) {
    var tempHistory = clone(history);
    var moveHistory = [];
    var verbose = (typeof options !== 'undefined' && 'verbose' in options && options.verbose);

    while (tempHistory.length > 0) {
      var move = tempHistory.shift();
      // console.log(move);
      if (verbose) {
        moveHistory.push(makePretty(move));
      } else {
        moveHistory.push(move.move.from + SIGNS[move.move.flags] + move.move.to);
      }
    }

    return moveHistory;
  }

  function getPosition() {
    return position;
  }

  function makePretty(uglyMove) {
    console.log(uglyMove);
    var move = {};
    move.from = uglyMove.move.from;
    move.to = uglyMove.move.to;
    move.flags = uglyMove.move.flags;
    move.moveNumber = uglyMove.moveNumber;
    move.piece = uglyMove.move.piece;
    if (move.flags === 'c') {
      move.captures = uglyMove.move.captures.join(',');
    }
    return move;
  }

  function clone(obj) {
    var dupe = JSON.parse(JSON.stringify(obj));
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
      makeMove(moves[i]);
      if (!king_attacked(color)) {
        if (depth - 1 > 0) {
          var child_nodes = perft(depth - 1);
          nodes += child_nodes;
        } else {
          nodes++;
        }
      }
      undoMove();
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

    moves: generate_moves,

    gameOver: gameOver,

    validate_fen: validate_fen,

    fen: generate_fen,

    pdn: generatePDN,

    load_pdn: function (pdn, options) {

    },

    parsePDN: parsePDN,

    header: function () {
      return set_header(arguments);
    },

    ascii: ascii,

    turn: function () {
      return turn;
    },

    move: function move(move) {
      if (typeof move.to == 'undefined' && typeof move.from == 'undefined') {
        return false;
      }
      var moves = getLegalMoves(move.from);
      for (var i = 0; i < moves.length; i++) {
        if (move.to == convertNumber(moves[i].to, 'external')) {
          makeMove(move);
          return move;
        }
      }
      return false;
    },

    getMoves: getMoves,

    getLegalMoves: getLegalMoves,

    undo: function () {
      var move = undoMove();
      return (move) ? move : null;
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

    history: getHistory,

    convertMoves: convertMoves,

    convertNumber: convertNumber,

    convertPosition: convertPosition,

    outsideBoard: outsideBoard,

    directionStrings: directionStrings,

    oppositeDir: oppositeDir,

    validDir: validDir,

    position: getPosition,

    clone: clone,

    makePretty: makePretty
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

String.prototype.setCharAt = function(idx, chr) {
  var idx = parseInt(idx);
  if(idx > this.length - 1) {
    return this.toString();
  } else {
    return this.substr(0, idx) + chr + this.substr(idx + 1);
  }
};
