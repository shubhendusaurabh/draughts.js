if (typeof require != "undefined") {
  var chai = require('chai');
  var Draughts = require('./draughts').Draughts;
}

var assert = chai.assert;

describe("Perft", function() {
  var perfts = [

  ];

  perfts.forEach(function(perft) {
    var draughts = new Draughts();
    draughts.load(perft.fen);

    it(perft.fen, function() {
      var nodes = draughts.perft(perft.depth);
      assert(nodes == perft.nodes);
    });

  });
});


describe("Single Square Move Generation", function() {

  var positions = [

  ];

  positions.forEach(function(position) {
    var draughts = new Draughts();
    draughts.load(position.fen);

    it(position.fen + ' ' + position.square, function() {

      var moves = draughts.moves({square: position.square, verbose: position.verbose});
      var passed = position.moves.length == moves.length;

      for (var j = 0; j < moves.length; j++) {
        if (!position.verbose) {
          passed = passed && moves[j] == position.moves[j];
        } else {
          for (var k in moves[j]) {
            passed = passed && moves[j][k] == position.moves[j][k];
          }
        }
      }
      assert(passed);

    });

  });

});





describe("Insufficient Material", function() {

  var positions = [

  ];

  positions.forEach(function(position) {
    var draughts = new Draughts();
    draughts.load(position.fen);

    it(position.fen, function() {
      if (position.draw) {
        assert(draughts.insufficient_material() && draughts.in_draw());
      } else {
        assert(!draughts.insufficient_material() && !draughts.in_draw());
      }
    });

  });

});


describe("Threefold Repetition", function() {

  var positions = [

  ];

  positions.forEach(function(position) {
    var draughts = new Draughts();
    draughts.load(position.fen);

    it(position.fen, function() {

      var passed = true;
      for (var j = 0; j < position.moves.length; j++) {
        if (draughts.in_threefold_repetition()) {
          passed = false;
          break;
        }
        draughts.move(position.moves[j]);
      }

      assert(passed && draughts.in_threefold_repetition() && draughts.in_draw());

    });

  });

});


describe("Get/Put/Remove", function() {

  var draughts = new Draughts();
  var passed = true;
  var positions = [

  ];

  positions.forEach(function(position) {

    passed = true;
    draughts.clear();

    it("position should pass - " + position.should_pass, function() {

      /* places the pieces */
      for (var square in position.pieces) {
        passed &= draughts.put(position.pieces[square], square);
      }

      /* iterate over every square to make sure get returns the proper
       * piece values/color
       */
      for (var j = 0; j < draughts.SQUARES.length; j++) {
        var square = draughts.SQUARES[j];
        if (!(square in position.pieces)) {
          if (draughts.get(square)) {
            passed = false;
            break;
          }
        } else {
          var piece = draughts.get(square);
          if (!(piece &&
              piece.type == position.pieces[square].type &&
              piece.color == position.pieces[square].color)) {
            passed = false;
            break;
          }
        }
      }

      if (passed) {
        /* remove the pieces */
        for (var j = 0; j < draughts.SQUARES.length; j++) {
          var square = draughts.SQUARES[j];
          var piece = draughts.remove(square);
          if ((!(square in position.pieces)) && piece) {
            passed = false;
            break;
          }

          if (piece &&
             (position.pieces[square].type != piece.type ||
              position.pieces[square].color != piece.color)) {
            passed = false;
            break;
          }
        }
      }

      /* finally, check for an empty board */
      passed = passed && (draughts.fen() == '8/8/8/8/8/8/8/8 w - - 0 1');

      /* some tests should fail, so make sure we're supposed to pass/fail each
       * test
       */
      passed = (passed == position.should_pass);

      assert(passed);
    });

  });

});


describe("FEN", function() {

  var positions = [
  ];

  positions.forEach(function(position) {
    var draughts = new Draughts();

    it(position.fen + ' (' + position.should_pass + ')', function() {
      draughts.load(position.fen);
      assert(draughts.fen() == position.fen == position.should_pass);
    });

  });

});


describe("PDN", function() {

  var passed = true;
  var error_message;
  var positions = [

    ];

  positions.forEach(function(position, i) {

    it(i, function() {
      var draughts = ("starting_position" in position) ? new Draughts(position.starting_position) : new Draughts();
      passed = true;
      error_message = "";
      for (var j = 0; j < position.moves.length; j++) {
        if (draughts.move(position.moves[j]) === null) {
          error_message = "move() did not accept " + position.moves[j] + " : ";
          break;
        }
      }

      draughts.header.apply(null, position.header);
      var pdn = draughts.pdn({max_width:position.max_width, newline_char:position.newline_char});
      var fen = draughts.fen();
      passed = pdn === position.pdn && fen === position.fen;
      assert(passed && error_message.length == 0);
    });

  });

});


describe("Load PDN", function() {

  var draughts = new Draughts();
  var tests = [
  ];

  var newline_chars = ['\n', '<br />', '\r\n', 'BLAH'];

  tests.forEach(function(t, i) {
    newline_chars.forEach(function(newline, j) {
      it(i + String.fromCharCode(97 + j), function() {
        var result = draughts.load_pdn(t.pdn.join(newline), { newline_char: newline });
        var should_pass = t.expect;

        /* some tests are expected to fail */
        if (should_pass) {

        /* some pdn's tests contain comments which are stripped during parsing,
         * so we'll need compare the results of the load against a FEN string
         * (instead of the reconstructed pdn [e.g. test.pdn.join(newline)])
         */

          if ('fen' in t) {
            assert(result && draughts.fen() == t.fen);
          } else {
            assert(result && draughts.pdn({ max_width: 65, newline_char: newline }) == t.pdn.join(newline));
          }
        } else {
          /* this test should fail, so make sure it does */
          assert(result == should_pass);
        }
      });

    });

  });

  // special case dirty file containing a mix of \n and \r\n
  it('dirty pdn', function() {
    var pdn;
    var result = draughts.load_pdn(pdn, { newline_char: '\r?\n' });
    assert(result);

    assert(draughts.load_pdn(pdn));
    assert(draughts.pdn().match(/^\[\[/) === null);
  });

});


describe("Make Move", function() {

  var positions = [

  ];

  positions.forEach(function(position) {
    var draughts = new Draughts();
    draughts.load(position.fen);
    it(position.fen + ' (' + position.move + ' ' + position.legal + ')', function() {
      var result = draughts.move(position.move);
      if (position.legal) {
        assert(result
               && draughts.fen() == position.next
               && result.captured == position.captured);
      } else {
        assert(!result);
      }
    });

  });

});


describe("Validate FEN", function() {

  var draughts = new Draughts();
  var positions = [

  ];

  positions.forEach(function(position) {

    it(position.fen + ' (valid: ' + (position.error_number  == 0) + ')', function() {
      var result = draughts.validate_fen(position.fen);
      assert(result.error_number == position.error_number, result.error_number);
    });

  });
});

describe("History", function() {

  var draughts = new Draughts();
  var tests = [
  ];

  tests.forEach(function(t, i) {
    var passed = true;

    it(i, function() {
      draughts.reset();

      for (var j = 0; j < t.moves.length; j++) {
        draughts.move(t.moves[j])
      }

      var history = draughts.history({verbose: t.verbose});
      if (t.fen != draughts.fen()) {
        passed = false;
      } else if (history.length != t.moves.length) {
        passed = false;
      } else {
        for (var j = 0; j < t.moves.length; j++) {
          if (!t.verbose) {
            if (history[j] != t.moves[j]) {
              passed = false;
              break;
            }
          } else {
            for (var key in history[j]) {
              if (history[j][key] != t.moves[j][key]) {
                passed = false;
                break;
              }
            }
          }
        }
      }
      assert(passed);
    });

  });
});

describe('Regression Tests', function() {

});
