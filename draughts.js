'use strict'

/**
 * @typedef {Object} MoveObject
 * @property {number} from - Source square number (1-50)
 * @property {number} to - Destination square number (1-50)
 * @property {string} flags - Move flags: 'n' (normal), 'c' (capture), 'p' (promotion)
 * @property {string} piece - The piece being moved ('b', 'B', 'w', 'W')
 * @property {number[]} [takes] - Array of captured piece positions
 * @property {number[]} [captures] - Alias for takes (captured piece positions)
 * @property {string[]} [piecesCaptured] - Array of captured pieces
 * @property {string[]} [piecesTaken] - Alias for piecesCaptured
 * @property {number[]} [jumps] - Array of positions in the jump sequence
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Whether the FEN is valid
 * @property {Object} [error] - Error object if validation fails
 * @property {number} [error.code] - Error code
 * @property {string} [error.message] - Error message
 * @property {string} fen - The original FEN string
 */

/**
 * @typedef {Object} HistoryEntry
 * @property {MoveObject} move - The move that was made
 * @property {string} turn - The player who made the move ('B' or 'W')
 * @property {number} moveNumber - The move number
 */

/**
 * @typedef {Object} GameState
 * @property {string} position - Internal position representation (56 chars)
 * @property {string} turn - Current player turn ('B' or 'W')
 * @property {number} moveNumber - Current move number
 * @property {HistoryEntry[]} history - Game move history
 * @property {Object<string, string>} header - PDN header information
 */

/**
 * @typedef {Object} CaptureState
 * @property {string} position - Current board position
 * @property {string} dirFrom - Direction came from (to avoid backtracking)
 */

/**
 * @typedef {Object} DirectionStrings
 * @property {string} NE - Northeast direction string
 * @property {string} SE - Southeast direction string
 * @property {string} SW - Southwest direction string
 * @property {string} NW - Northwest direction string
 */

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
/**
 * Creates a new Draughts game instance
 * @param {string} [fen] - FEN string to initialize the game position
 * @constructor
 */
function Draughts (fen) {
  // Game constants
  const BLACK = 'B'
  const WHITE = 'W'
  const MAN = 'b'
  const KING = 'w'
  const SYMBOLS = 'bwBW'
  const DEFAULT_FEN = 'W:W31-50:B1-20'
  const DEFAULT_POSITION_INTERNAL = '-bbbbbbbbbb-bbbbbbbbbb-0000000000-wwwwwwwwww-wwwwwwwwww-'
  const DEFAULT_POSITION_EXTERNAL = 'Wbbbbbbbbbbbbbbbbbbbb0000000000wwwwwwwwwwwwwwwwwwww'
  const STEPS = { NE: -5, SE: 6, SW: 5, NW: -6 }
  const POSSIBLE_RESULTS = ['2-0', '0-2', '1-1', '0-0', '*', '1-0', '0-1']
  const FLAGS = {
    NORMAL: 'n',
    CAPTURE: 'c',
    PROMOTION: 'p'
  }

  const UNICODES = {
    'w': '\u26C0',
    'b': '\u26C2',
    'B': '\u26C3',
    'W': '\u26C1',
    '0': '\u0020\u0020'
  }

  const SIGNS = {
    n: '-',
    c: 'x'
  }
  const BITS = {
    NORMAL: 1,
    CAPTURE: 2,
    PROMOTION: 4
  }

  // Game state variables
  let position
  let turn = WHITE
  let moveNumber = 1
  let history = []
  let header = {}

  /**
   * Clears the board to empty state
   * @returns {void}
   */
  const clear = () => {
    position = DEFAULT_POSITION_INTERNAL
    turn = WHITE
    moveNumber = 1
    history = []
    header = {}
    update_setup(generate_fen())
  }

  /**
   * Resets the game to the starting position
   * @returns {void}
   */
  const reset = () => {
    load(DEFAULT_FEN)
  }

  /**
   * Loads a position from FEN string
   * @param {string} fen - FEN string representing the position
   * @returns {boolean} True if FEN was loaded successfully, false otherwise
   */
  const load = (fen) => {
    // Handle default FEN
    if (!fen || fen === DEFAULT_FEN) {
      position = DEFAULT_POSITION_INTERNAL
      update_setup(generate_fen(position))
      return true
    }

    const checkedFen = validate_fen(fen)
    if (!checkedFen.valid) {
      console.error('Fen Error', fen, checkedFen)
      return false
    }

    clear()

    // Clean up FEN string
    fen = fen.replace(/\s+/g, '').replace(/\..*$/, '')

    const tokens = fen.split(':')
    // Set which side to move
    turn = tokens[0].slice(0, 1)

    let externalPosition = DEFAULT_POSITION_EXTERNAL
    for (let i = 1; i <= externalPosition.length; i++) {
      externalPosition = setCharAt(externalPosition, i, 0)
    }
    externalPosition = setCharAt(externalPosition, 0, turn)

    // Process both sides (white and black)
    for (let k = 1; k <= 2; k++) {
      const color = tokens[k].slice(0, 1)
      const sideString = tokens[k].slice(1)
      if (sideString.length === 0) continue
      
      const numbers = sideString.split(',')
      for (let i = 0; i < numbers.length; i++) {
        let numSquare = numbers[i]
        const isKing = numSquare.slice(0, 1) === 'K'
        numSquare = isKing ? numSquare.slice(1) : numSquare // strip K
        
        const range = numSquare.split('-')
        if (range.length === 2) {
          const from = parseInt(range[0], 10)
          const to = parseInt(range[1], 10)
          for (let j = from; j <= to; j++) {
            const pieceChar = isKing ? color.toUpperCase() : color.toLowerCase()
            externalPosition = setCharAt(externalPosition, j, pieceChar)
          }
        } else {
          const squareNum = parseInt(numSquare, 10)
          const pieceChar = isKing ? color.toUpperCase() : color.toLowerCase()
          externalPosition = setCharAt(externalPosition, squareNum, pieceChar)
        }
      }
    }

    position = convertPosition(externalPosition, 'internal')
    update_setup(generate_fen(position))

    return true
  }

  /**
   * Validates a FEN string for correctness
   * @param {string} fen - FEN string to validate
   * @returns {ValidationResult} Object containing validation result and error info
   */
  const validate_fen = (fen) => {
    const errors = [
      { code: 0, message: 'no errors' },
      { code: 1, message: 'fen position not a string' },
      { code: 2, message: 'fen position has not colon at second position' },
      { code: 3, message: 'fen position has not 2 colons' },
      { code: 4, message: 'side to move of fen position not valid' },
      { code: 5, message: 'color(s) of sides of fen position not valid' },
      { code: 6, message: 'squares of fen position not integer' },
      { code: 7, message: 'squares of fen position not valid' },
      { code: 8, message: 'empty fen position' }
    ]

    if (typeof fen !== 'string') {
      return { valid: false, error: errors[0], fen }
    }

    fen = fen.replace(/\s+/g, '')

    // Handle empty FEN exceptions
    if (fen === 'B::' || fen === 'W::' || fen === '?::') {
      return { valid: true, fen: `${fen}:B:W` }
    }
    
    fen = fen.trim().replace(/\..*$/, '')

    if (fen === '') {
      return { valid: false, error: errors[7], fen }
    }

    if (fen.slice(1, 2) !== ':') {
      return { valid: false, error: errors[1], fen }
    }

    // FEN should be 3 sections separated by colons
    const parts = fen.split(':')
    if (parts.length !== 3) {
      return { valid: false, error: errors[2], fen }
    }

    // Validate side to move
    const turnColor = parts[0]
    if (!['B', 'W', '?'].includes(turnColor)) {
      return { valid: false, error: errors[3], fen }
    }

    // Check colors of both sides
    const colors = parts[1].slice(0, 1) + parts[2].slice(0, 1)
    if (!['BW', 'WB'].includes(colors)) {
      return { valid: false, error: errors[4], fen }
    }

    // Validate pieces for both sides
    for (let k = 1; k <= 2; k++) {
      const sideString = parts[k].slice(1) // Strip color
      if (sideString.length === 0) continue
      
      const numbers = sideString.split(',')
      for (const numberStr of numbers) {
        let numSquare = numberStr
        const isKing = numSquare.slice(0, 1) === 'K'
        numSquare = isKing ? numSquare.slice(1) : numSquare
        
        const range = numSquare.split('-')
        if (range.length === 2) {
          // Validate range
          for (const rangeVal of range) {
            if (!isInteger(rangeVal)) {
              return { valid: false, error: errors[5], fen, range: rangeVal }
            }
            const num = parseInt(rangeVal, 10)
            if (num < 1 || num > 100) {
              return { valid: false, error: errors[6], fen }
            }
          }
        } else {
          // Validate single square
          if (!isInteger(numSquare)) {
            return { valid: false, error: errors[5], fen }
          }
          const num = parseInt(numSquare, 10)
          if (num < 1 || num > 100) {
            return { valid: false, error: errors[6], fen }
          }
        }
      }
    }

    return { valid: true, error_number: 0, error: errors[0] }
  }

  /**
   * Generates FEN string from current position
   * @returns {string} FEN string representing the current position
   */
  const generate_fen = () => {
    const black = []
    const white = []
    const externalPosition = convertPosition(position, 'external')
    
    for (let i = 0; i < externalPosition.length; i++) {
      const piece = externalPosition[i]
      switch (piece) {
        case 'w':
          white.push(i)
          break
        case 'W':
          white.push(`K${i}`)
          break
        case 'b':
          black.push(i)
          break
        case 'B':
          black.push(`K${i}`)
          break
        default:
          // Empty square or invalid piece
          break
      }
    }
    
    return `${turn.toUpperCase()}:W${white.join(',')}:B${black.join(',')}`
  }

  /**
   * Generates PDN (Portable Draughts Notation) string from current game
   * @param {Object} [options] - Options for PDN generation
   * @param {string} [options.newline_char='\n'] - Character to use for newlines
   * @param {number} [options.maxWidth=0] - Maximum line width (0 = no limit)
   * @returns {string} PDN string representing the game
   */
  const generatePDN = (options = {}) => {
    const { newline_char: newline = '\n', maxWidth = 0 } = options
    const result = []
    let headerExists = false

    // Add header information
    for (const [key, value] of Object.entries(header)) {
      result.push(`[${key} "${value}"]${newline}`)
      headerExists = true
    }

    if (headerExists && history.length) {
      result.push(newline)
    }

    const tempHistory = clone(history)
    const moves = []
    let moveString = ''
    let moveNum = 1

    // Process move history
    while (tempHistory.length > 0) {
      const historyEntry = tempHistory.shift()
      if (historyEntry.turn === 'W') {
        moveString += `${moveNum}. `
      }
      moveString += historyEntry.move.from
      moveString += historyEntry.move.flags === 'c' ? 'x' : '-'
      moveString += `${historyEntry.move.to} `
      moveNum++
    }

    if (moveString.length) {
      moves.push(moveString)
    }

    // Add game result if available
    if (header.Result !== undefined) {
      moves.push(header.Result)
    }

    if (maxWidth === 0) {
      return result.join('') + moves.join(' ')
    }

    // Handle line width constraints
    let currentWidth = 0
    for (let i = 0; i < moves.length; i++) {
      if (currentWidth + moves[i].length > maxWidth && i !== 0) {
        if (result[result.length - 1] === ' ') {
          result.pop()
        }
        result.push(newline)
        currentWidth = 0
      } else if (i !== 0) {
        result.push(' ')
        currentWidth++
      }
      result.push(' ')
      currentWidth += moves[i].length
    }

    return result.join('')
  }

  /**
   * Sets header properties from arguments array
   * @param {string[]} args - Array of alternating key-value pairs
   * @returns {Object<string, string>} Updated header object
   */
  const set_header = (args) => {
    for (let i = 0; i < args.length; i += 2) {
      if (typeof args[i] === 'string' && typeof args[i + 1] === 'string') {
        header[args[i]] = args[i + 1]
      }
    }
    return header
  }

  /**
   * Updates setup properties in header when board position changes
   * Only updates if no moves have been made yet
   * @param {string} fen - FEN string of current position
   * @returns {boolean|void} False if moves have been made, void otherwise
   */
  const update_setup = (fen) => {
    if (history.length > 0) {
      return false
    }
    if (fen !== DEFAULT_FEN) {
      header.SetUp = '1'
      header.FEN = fen
    } else {
      delete header.SetUp
      delete header.FEN
    }
    return true
  }

  /**
   * Parses a PDN (Portable Draughts Notation) string and loads the game
   * @param {string} pdn - PDN string to parse
   * @param {Object} [options] - Parsing options
   * @param {string} [options.newline_char='\r?\n'] - Newline character pattern
   * @returns {boolean} True if PDN was parsed successfully, false otherwise
   */
  const parsePDN = (pdn, options = {}) => {
    const { newline_char = '\r?\n' } = options
    
    /**
     * Escapes special regex characters
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    const mask = (str) => str.replace(/\\/g, '\\')
    
    const regex = new RegExp(`^(\\[(.|${mask(newline_char)})*\\])` +
      `(${mask(newline_char)})*` +
      `1.(${mask(newline_char)}|.)*$`, 'g')

    /**
     * Parses PDN header section
     * @param {string} headerStr - Header string to parse
     * @param {Object} opts - Options object
     * @returns {Object<string, string>} Parsed header object
     */
    const parsePDNHeader = (headerStr, _opts) => {
      const headerObj = {}
      const headers = headerStr.split(new RegExp(mask(newline_char)))
      
      for (const headerLine of headers) {
        const key = headerLine.replace(/^\[([A-Z][A-Za-z]*)\s.*\]$/, '$1')
        const value = headerLine.replace(/^\[[A-Za-z]+\s"(.*)"\]$/, '$1')
        if (trim(key).length > 0) {
          headerObj[key] = value
        }
      }
      return headerObj
    }

    let headerString = pdn.replace(regex, '$1')
    if (headerString[0] !== '[') {
      headerString = ''
    }

    reset()

    const headers = parsePDNHeader(headerString, options)

    // Set header properties
    for (const [key, value] of Object.entries(headers)) {
      set_header([key, value])
    }

    // Handle custom setup
    if (headers.Setup === '1') {
      if (!('FEN' in headers) || !load(headers.FEN)) {
        console.error('fen invalid')
        return false
      }
    } else {
      position = DEFAULT_POSITION_INTERNAL
    }

    // Extract moves from PDN
    let moveStr = pdn.replace(headerString, '').replace(new RegExp(mask(newline_char), 'g'), ' ')

    // Clean up move string
    moveStr = moveStr
      .replace(/(\{[^}]+\})+?/g, '') // Remove comments
      .replace(/\d+\./g, '') // Remove move numbers
      .replace(/\.\.\./g, '') // Remove black-to-move indicators
    
    // Remove recursive annotation variations
    const ravRegex = /(\([^\(\)]+\))+?/g
    while (ravRegex.test(moveStr)) {
      moveStr = moveStr.replace(ravRegex, '')
    }

    // Parse moves
    let moves = trim(moveStr).split(/\s+/)
    moves = moves.join(',').replace(/,,+/g, ',').split(',')

    // Process moves
    for (let halfMove = 0; halfMove < moves.length - 1; halfMove++) {
      const move = getMoveObject(moves[halfMove])
      if (!move) {
        return false
      }
      makeMove(move)
    }

    // Handle final move or result
    const lastEntry = moves[moves.length - 1]
    if (POSSIBLE_RESULTS.includes(lastEntry)) {
      if (headers.Result === undefined) {
        set_header(['Result', lastEntry])
      }
    } else {
      const move = getMoveObject(lastEntry)
      if (!move) {
        return false
      }
      makeMove(move)
    }
    
    return true
  }

  /**
   * Creates a move object from algebraic notation
   * @param {string} move - Move in algebraic notation (e.g., '1-5' or '1x10')
   * @returns {MoveObject|false} Move object if valid, false otherwise
   */
  const getMoveObject = (move) => {
    const tempMove = {}
    const matches = move.split(/[x|-]/)
    tempMove.from = parseInt(matches[0], 10)
    tempMove.to = parseInt(matches[1], 10)
    
    const moveTypeMatch = move.match(/[x|-]/)
    if (!moveTypeMatch) return false
    
    const moveType = moveTypeMatch[0]
    tempMove.flags = moveType === '-' ? FLAGS.NORMAL : FLAGS.CAPTURE
    tempMove.piece = position.charAt(convertNumber(tempMove.from, 'internal'))
    
    const legalMoves = convertMoves(getLegalMoves(tempMove.from), 'external')
    
    // Find matching legal move
    for (const legalMove of legalMoves) {
      if (tempMove.to === legalMove.to && tempMove.from === legalMove.from) {
        if (legalMove.takes.length > 0) {
          tempMove.flags = FLAGS.CAPTURE
          tempMove.captures = legalMove.takes
          tempMove.takes = legalMove.takes
          tempMove.piecesCaptured = legalMove.piecesTaken
        }
        return tempMove
      }
    }
    
    console.log(legalMoves, tempMove)
    return false
  }

  /**
   * Executes a move on the board
   * @param {MoveObject} move - Move object to execute
   * @returns {void}
   */
  const makeMove = (move) => {
    move.piece = position.charAt(convertNumber(move.from, 'internal'))
    position = setCharAt(position, convertNumber(move.to, 'internal'), move.piece)
    position = setCharAt(position, convertNumber(move.from, 'internal'), 0)
    move.flags = FLAGS.NORMAL
    
    // Handle captures
    if (move.takes && move.takes.length) {
      move.flags = FLAGS.CAPTURE
      move.captures = move.takes
      move.piecesCaptured = move.piecesTaken
      for (const captureSquare of move.takes) {
        position = setCharAt(position, convertNumber(captureSquare, 'internal'), 0)
      }
    }
    
    // Handle promotions
    const isWhitePromotion = move.to <= 5 && move.piece === 'w'
    const isBlackPromotion = move.to >= 46 && move.piece === 'b'
    
    if (isWhitePromotion || isBlackPromotion) {
      move.flags = FLAGS.PROMOTION
      position = setCharAt(position, convertNumber(move.to, 'internal'), move.piece.toUpperCase())
    }
    
    push(move)
    if (turn === BLACK) {
      moveNumber += 1
    }
    turn = swap_color(turn)
  }

  /**
   * Gets the piece at a given square
   * @param {number} square - Square number (1-50)
   * @returns {string} Piece at square ('b', 'B', 'w', 'W', '0' for empty)
   */
  const get = (square) => {
    return position.charAt(convertNumber(square, 'internal'))
  }

  /**
   * Places a piece on a square
   * @param {string} piece - Piece to place ('b', 'B', 'w', 'W')
   * @param {number} square - Square number (1-50)
   * @returns {boolean} True if piece was placed successfully, false otherwise
   */
  const put = (piece, square) => {
    // Validate piece
    if (!SYMBOLS.includes(piece)) {
      return false
    }

    // Validate square
    if (outsideBoard(convertNumber(square, 'internal'))) {
      return false
    }
    
    position = setCharAt(position, convertNumber(square, 'internal'), piece)
    update_setup(generate_fen())
    return true
  }

  /**
   * Removes a piece from a square
   * @param {number} square - Square number (1-50)
   * @returns {string} The piece that was removed
   */
  const remove = (square) => {
    const piece = get(square)
    position = setCharAt(position, convertNumber(square, 'internal'), 0)
    update_setup(generate_fen())
    return piece
  }

  /**
   * Builds a move object with given parameters
   * @param {Object} board - Board representation
   * @param {number} from - Source square
   * @param {number} to - Destination square
   * @param {number} flags - Move flags (BITS constants)
   * @param {boolean} promotion - Whether this is a promotion
   * @returns {MoveObject} Constructed move object
   */
  const _build_move = (board, from, to, flags, promotion) => {
    const move = {
      color: turn,
      from,
      to,
      flags,
      piece: board[from].type
    }

    if (promotion) {
      move.flags |= BITS.PROMOTION
    }

    if (board[to]) {
      move.captured = board[to].type
    } else if (flags & BITS.CAPTURE) {
      move.captured = MAN
    }
    
    return move
  }

  /**
   * Generates all legal moves for current position or specific square
   * @param {number} [square] - Optional specific square to get moves for
   * @returns {MoveObject[]} Array of legal move objects
   */
  const generate_moves = (square) => {
    let moves = []

    if (square) {
      moves = getLegalMoves(square)
    } else {
      const captures = getCaptures()
      // Captures are mandatory - if available, return only captures
      if (captures.length) {
        return captures.map(capture => ({
          ...capture,
          flags: FLAGS.CAPTURE,
          captures: capture.jumps,
          piecesCaptured: capture.piecesTaken
        }))
      }
      moves = getMoves()
    }
    
    // Flatten nested arrays
    return moves.flat()
  }

  /**
   * Gets all legal moves for a specific square
   * @param {number} index - Square number (external notation 1-50)
   * @returns {MoveObject[]} Array of legal moves from the square
   */
  const getLegalMoves = (index) => {
    let legalMoves = []
    const squareNum = parseInt(index, 10)
    
    if (!Number.isNaN(squareNum)) {
      const internalIndex = convertNumber(squareNum, 'internal')
      const captureState = { position, dirFrom: '' }
      const captureObj = { jumps: [internalIndex], takes: [], piecesTaken: [] }
      
      let captures = capturesAtSquare(internalIndex, captureState, captureObj)
      captures = longestCapture(captures)
      
      // Captures are mandatory if available
      legalMoves = captures.length > 0 ? captures : movesAtSquare(internalIndex)
    }
    
    return convertMoves(legalMoves, 'external')
  }

  /**
   * Gets all legal moves for the current player
   * @param {number} [index] - Optional square index (unused parameter)
   * @returns {MoveObject[]} Array of all legal moves for current player
   */
  const getMoves = (_index) => {
    const moves = []
    const currentPlayer = turn

    for (let i = 1; i < position.length; i++) {
      const piece = position[i]
      if (piece === currentPlayer || piece === currentPlayer.toLowerCase()) {
        const squareMoves = movesAtSquare(i)
        if (squareMoves.length) {
          moves.push(...convertMoves(squareMoves, 'external'))
        }
      }
    }
    
    return moves
  }

  /**
   * Sets character at specific index in position string
   * @param {string} posStr - Position string to modify
   * @param {number} idx - Index to modify
   * @param {string|number} chr - Character to set
   * @returns {string} Modified position string
   */
  const setCharAt = (posStr, idx, chr) => {
    const index = parseInt(idx, 10)
    if (index > posStr.length - 1) {
      return posStr.toString()
    }
    return `${posStr.slice(0, index)}${chr}${posStr.slice(index + 1)}`
  }

  /**
   * Gets all possible moves from a specific square
   * @param {number} square - Internal square index
   * @returns {MoveObject[]} Array of possible moves from the square
   */
  const movesAtSquare = (square) => {
    const moves = []
    const piece = position.charAt(square)
    
    switch (piece) {
      case 'b':
      case 'w': {
        // Regular pieces (men) can only move one square diagonally
        const dirStrings = directionStrings(position, square, 2)
        
        for (const [dir, str] of Object.entries(dirStrings)) {
          const matchArray = str.match(/^[bw]0/) // piece followed by empty square
          if (matchArray && validDir(piece, dir)) {
            const posTo = square + STEPS[dir]
            moves.push({ from: square, to: posTo, takes: [], jumps: [] })
          }
        }
        break
      }
      
      case 'W':
      case 'B': {
        // Kings can move multiple squares diagonally
        const dirStrings = directionStrings(position, square, 2)
        
        for (const [dir, str] of Object.entries(dirStrings)) {
          const matchArray = str.match(/^[BW]0+/) // king followed by empty squares
          if (matchArray) {
            // Can move to any empty square in this direction
            for (let i = 1; i < matchArray[0].length; i++) {
              const posTo = square + (i * STEPS[dir])
              moves.push({ from: square, to: posTo, takes: [], jumps: [] })
            }
          }
        }
        break
      }
      
      default:
        // Invalid piece or empty square
        break
    }
    
    return moves
  }

  /**
   * Gets all possible captures for the current player
   * @returns {MoveObject[]} Array of capture moves
   */
  const getCaptures = () => {
    const currentPlayer = turn
    const captures = []
    
    for (let i = 0; i < position.length; i++) {
      const piece = position[i]
      if (piece === currentPlayer || piece === currentPlayer.toLowerCase()) {
        const state = { position, dirFrom: '' }
        const captureObj = {
          jumps: [i],
          takes: [],
          from: i,
          to: '',
          piecesTaken: []
        }
        
        const squareCaptures = capturesAtSquare(i, state, captureObj)
        if (squareCaptures.length) {
          captures.push(...convertMoves(squareCaptures, 'external'))
        }
      }
    }
    
    return longestCapture(captures)
  }

  /**
   * Recursively finds all possible captures from a given square
   * @param {number} posFrom - Starting position (internal notation)
   * @param {CaptureState} state - Current board state
   * @param {Object} capture - Current capture sequence
   * @returns {MoveObject[]} Array of possible capture sequences
   */
  const capturesAtSquare = (posFrom, state, capture) => {
    const piece = state.position.charAt(posFrom)
    if (!['b', 'w', 'B', 'W'].includes(piece)) {
      return [capture]
    }
    
    // Get direction strings based on piece type
    const dirString = (piece === 'b' || piece === 'w') 
      ? directionStrings(state.position, posFrom, 3)
      : directionStrings(state.position, posFrom)
    
    let finished = true
    const captureArrayForDir = {}
    
    for (const [dir, str] of Object.entries(dirString)) {
      // Skip the direction we came from
      if (dir === state.dirFrom) continue
      
      switch (piece) {
        case 'b':
        case 'w': {
          // Regular pieces: look for enemy piece followed by empty square
          const matchArray = str.match(/^b[wW]0|^w[bB]0/)
          if (matchArray) {
            const posTo = posFrom + (2 * STEPS[dir])
            const posTake = posFrom + STEPS[dir]
            
            // Can't capture the same piece twice
            if (capture.takes.includes(posTake)) continue
            
            const updateCapture = { ...clone(capture) }
            updateCapture.to = posTo
            updateCapture.jumps.push(posTo)
            updateCapture.takes.push(posTake)
            updateCapture.piecesTaken.push(position.charAt(posTake))
            updateCapture.from = posFrom
            
            const updateState = { ...clone(state) }
            updateState.dirFrom = oppositeDir(dir)
            const pieceCode = updateState.position.charAt(posFrom)
            updateState.position = setCharAt(updateState.position, posFrom, 0)
            updateState.position = setCharAt(updateState.position, posTo, pieceCode)
            
            finished = false
            captureArrayForDir[dir] = capturesAtSquare(posTo, updateState, updateCapture)
          }
          break
        }
        
        case 'B':
        case 'W': {
          // Kings: look for enemy piece with empty squares after it
          const matchArray = str.match(/^B0*[wW]0+|^W0*[bB]0+/)
          if (matchArray) {
            const matchStr = matchArray[0]
            const matchArraySubstr = matchStr.match(/[wW]0+$|[bB]0+$/)
            const matchSubstr = matchArraySubstr[0]
            const takeIndex = matchStr.length - matchSubstr.length
            const posTake = posFrom + (takeIndex * STEPS[dir])
            
            // Can't capture the same piece twice
            if (capture.takes.includes(posTake)) continue
            
            // King can land on any empty square after the captured piece
            for (let i = 1; i < matchSubstr.length; i++) {
              const posTo = posFrom + ((takeIndex + i) * STEPS[dir])
              const updateCapture = { ...clone(capture) }
              updateCapture.jumps.push(posTo)
              updateCapture.to = posTo
              updateCapture.takes.push(posTake)
              updateCapture.piecesTaken.push(position.charAt(posTake))
              updateCapture.posFrom = posFrom
              
              const updateState = { ...clone(state) }
              updateState.dirFrom = oppositeDir(dir)
              const pieceCode = updateState.position.charAt(posFrom)
              updateState.position = setCharAt(updateState.position, posFrom, 0)
              updateState.position = setCharAt(updateState.position, posTo, pieceCode)
              
              finished = false
              const dirIndex = `${dir}${i}`
              captureArrayForDir[dirIndex] = capturesAtSquare(posTo, updateState, updateCapture)
            }
          }
          break
        }
        
        default:
          break
      }
    }
    
    // Collect all capture sequences
    let captureArray = []
    if (finished && capture.takes.length) {
      // No more captures possible, finalize this sequence
      capture.from = capture.jumps[0]
      captureArray = [capture]
    } else {
      // Continue with further captures
      for (const sequences of Object.values(captureArrayForDir)) {
        captureArray.push(...sequences)
      }
    }
    
    return captureArray
  }

  /**
   * Adds a move to the game history
   * @param {MoveObject} move - Move to add to history
   * @returns {void}
   */
  const push = (move) => {
    history.push({
      move,
      turn,
      moveNumber
    })
  }

  /**
   * Undoes the last move made
   * @returns {MoveObject|null} The undone move object, or null if no moves to undo
   */
  const undoMove = () => {
    const lastEntry = history.pop()
    if (!lastEntry) {
      return null
    }

    const { move, turn: oldTurn, moveNumber: oldMoveNumber } = lastEntry
    turn = oldTurn
    moveNumber = oldMoveNumber

    // Restore piece to original position
    position = setCharAt(position, convertNumber(move.from, 'internal'), move.piece)
    position = setCharAt(position, convertNumber(move.to, 'internal'), 0)
    
    if (move.flags === 'c') {
      // Restore captured pieces
      for (let i = 0; i < move.captures.length; i++) {
        const capturePos = convertNumber(move.captures[i], 'internal')
        position = setCharAt(position, capturePos, move.piecesCaptured[i])
      }
    } else if (move.flags === 'p') {
      // Handle promotion undo
      if (move.captures) {
        for (let i = 0; i < move.captures.length; i++) {
          const capturePos = convertNumber(move.captures[i], 'internal')
          position = setCharAt(position, capturePos, move.piecesCaptured[i])
        }
      }
      // Demote the piece back to regular piece
      position = setCharAt(position, convertNumber(move.from, 'internal'), move.piece.toLowerCase())
    }
    
    return move
  }

  /**
   * Gets disambiguator for a move (placeholder function)
   * @param {MoveObject} move - Move to get disambiguator for
   * @returns {void} Currently not implemented
   */
  const _get_disambiguator = (_move) => {
    // TODO: Implementation needed
  }

  /**
   * Swaps the color from white to black or vice versa
   * @param {string} c - Color to swap ('W' or 'B')
   * @returns {string} Opposite color
   */
  const swap_color = (c) => c === WHITE ? BLACK : WHITE

  /**
   * Checks if a value is an integer
   * @param {*} int - Value to check
   * @returns {boolean} True if the value is an integer string
   */
  const isInteger = (int) => /^\d+$/.test(int)

  /**
   * Filters captures to only include the longest sequences (mandatory capture rule)
   * @param {MoveObject[]} captures - Array of capture moves
   * @returns {MoveObject[]} Array of longest capture moves only
   */
  const longestCapture = (captures) => {
    if (captures.length === 0) return []
    
    // Find the maximum number of jumps in any capture sequence
    const maxJumpCount = Math.max(...captures.map(capture => capture.jumps.length))
    
    // Must be at least 2 jumps to be a capture (from -> to)
    if (maxJumpCount < 2) {
      return []
    }

    // Return only captures with the maximum number of jumps
    return captures.filter(capture => capture.jumps.length === maxJumpCount)
  }

  /**
   * Converts moves between internal and external notation
   * @param {MoveObject[]} moves - Array of moves to convert
   * @param {string} type - Target notation ('internal' or 'external')
   * @returns {MoveObject[]} Array of converted moves
   */
  const convertMoves = (moves, type) => {
    if (!type || moves.length === 0) {
      return []
    }
    
    return moves.map(move => ({
      jumps: move.jumps.map(jump => convertNumber(jump, type)),
      takes: move.takes.map(take => convertNumber(take, type)),
      from: convertNumber(move.from, type),
      to: convertNumber(move.to, type),
      piecesTaken: move.piecesTaken
    }))
  }

  /**
   * Converts between internal and external square numbering systems
   * @param {number} number - Square number to convert
   * @param {string} notation - Target notation ('internal' or 'external')
   * @returns {number} Converted square number
   */
  const convertNumber = (number, notation) => {
    const num = parseInt(number, 10)
    
    switch (notation) {
      case 'internal':
        return num + Math.floor((num - 1) / 10)
      case 'external':
        return num - Math.floor((num - 1) / 11)
      default:
        return num
    }
  }

  /**
   * Converts position between internal and external representations
   * @param {string} pos - Position string to convert
   * @param {string} notation - Target notation ('internal' or 'external')
   * @returns {string} Converted position string
   */
  const convertPosition = (pos, notation) => {
    switch (notation) {
      case 'internal': {
        const sub1 = pos.slice(1, 11)
        const sub2 = pos.slice(11, 21)
        const sub3 = pos.slice(21, 31)
        const sub4 = pos.slice(31, 41)
        const sub5 = pos.slice(41, 51)
        return `-${sub1}-${sub2}-${sub3}-${sub4}-${sub5}-`
      }
      
      case 'external': {
        const sub1 = pos.slice(1, 11)
        const sub2 = pos.slice(12, 22)
        const sub3 = pos.slice(23, 33)
        const sub4 = pos.slice(34, 44)
        const sub5 = pos.slice(45, 55)
        return `?${sub1}${sub2}${sub3}${sub4}${sub5}`
      }
      
      default:
        return pos
    }
  }

  /**
   * Checks if a square is outside the board (internal notation only)
   * @param {number} square - Square number to check
   * @returns {boolean} True if square is outside the board
   */
  const outsideBoard = (square) => {
    const n = parseInt(square, 10)
    return !(n >= 0 && n <= 55 && (n % 11) !== 0)
  }

  /**
   * Creates direction strings for a square showing pieces in each direction
   * @param {string} tempPosition - Position string to analyze
   * @param {number} square - Square to get directions from (internal notation)
   * @param {number} [maxLength=100] - Maximum length of direction strings
   * @returns {DirectionStrings|number} Object with direction strings or error code
   */
  const directionStrings = (tempPosition, square, maxLength = 100) => {
    if (outsideBoard(square)) {
      return 334 // Error code for outside board
    }

    const dirStrings = {}
    
    for (const [dir, step] of Object.entries(STEPS)) {
      const dirArray = []
      let i = 0
      let index = square
      
      do {
        dirArray[i] = tempPosition.charAt(index)
        i++
        index = square + (i * step)
      } while (!outsideBoard(index) && i < maxLength)

      dirStrings[dir] = dirArray.join('')
    }

    return dirStrings
  }

  /**
   * Gets the opposite direction
   * @param {string} direction - Direction ('NE', 'SE', 'SW', 'NW')
   * @returns {string} Opposite direction
   */
  const oppositeDir = (direction) => {
    const opposites = { NE: 'SW', SE: 'NW', SW: 'NE', NW: 'SE' }
    return opposites[direction]
  }

  /**
   * Checks if a direction is valid for a piece type
   * @param {string} piece - Piece type ('w' for white, 'b' for black)
   * @param {string} dir - Direction to check ('NE', 'SE', 'SW', 'NW')
   * @returns {boolean} True if direction is valid for the piece
   */
  const validDir = (piece, dir) => {
    const validDirs = {
      w: { NE: true, SE: false, SW: false, NW: true },
      b: { NE: false, SE: true, SW: true, NW: false }
    }
    return validDirs[piece]?.[dir] ?? false
  }

  /**
   * Generates ASCII representation of the current board position
   * @param {boolean} [unicode=false] - Whether to use Unicode symbols for pieces
   * @returns {string} ASCII board representation
   */
  const ascii = (unicode = false) => {
    const extPosition = convertPosition(position, 'external')
    let board = '\n+-------------------------------+\n'
    let squareIndex = 1
    
    for (let row = 1; row <= 10; row++) {
      board += '|\t'
      
      // Add leading spaces for odd rows
      if (row % 2 !== 0) {
        board += '  '
      }
      
      for (let col = 1; col <= 10; col++) {
        if (col % 2 === 0) {
          board += '  '
          squareIndex++
        } else {
          const piece = extPosition[squareIndex]
          board += unicode ? ` ${UNICODES[piece]}` : ` ${piece}`
        }
      }
      
      // Add trailing spaces for even rows
      if (row % 2 === 0) {
        board += '  '
      }
      
      board += '\t|\n'
    }
    
    return `${board}+-------------------------------+\n`
  }

  /**
   * Checks if the game is over (no moves available or no pieces left)
   * @returns {boolean} True if game is over
   */
  const gameOver = () => {
    // Check if current player has any pieces left
    let hasPlayerPieces = false
    for (let i = 0; i < position.length; i++) {
      if (position[i].toLowerCase() === turn.toLowerCase()) {
        hasPlayerPieces = true
        break
      }
    }
    
    if (!hasPlayerPieces) {
      return true
    }
    
    // Check if current player has any legal moves
    return generate_moves().length === 0
  }

  /**
   * Gets the move history in various formats
   * @param {Object} [options] - Options for history format
   * @param {boolean} [options.verbose=false] - Whether to return detailed move objects
   * @returns {(string[]|Object[])} Array of moves in requested format
   */
  const getHistory = (options = {}) => {
    const tempHistory = clone(history)
    const moveHistory = []
    const { verbose = false } = options
    
    while (tempHistory.length > 0) {
      const historyEntry = tempHistory.shift()
      if (verbose) {
        moveHistory.push(makePretty(historyEntry))
      } else {
        const { move } = historyEntry
        moveHistory.push(`${move.from}${SIGNS[move.flags]}${move.to}`)
      }
    }

    return moveHistory
  }

  /**
   * Gets the current board position in external notation
   * @returns {string} Position string in external notation
   */
  const getPosition = () => convertPosition(position, 'external')

  /**
   * Formats a history entry into a prettier move object
   * @param {HistoryEntry} uglyMove - Raw history entry
   * @returns {Object} Formatted move object
   */
  const makePretty = (uglyMove) => {
    const { move, moveNumber } = uglyMove
    const prettyMove = {
      from: move.from,
      to: move.to,
      flags: move.flags,
      moveNumber,
      piece: move.piece
    }
    
    if (move.flags === 'c' && move.captures) {
      prettyMove.captures = move.captures.join(',')
    }
    
    return prettyMove
  }

  /**
   * Creates a deep clone of an object
   * @param {*} obj - Object to clone
   * @returns {*} Deep clone of the object
   */
  const clone = (obj) => JSON.parse(JSON.stringify(obj))

  /**
   * Trims whitespace from both ends of a string
   * @param {string} str - String to trim
   * @returns {string} Trimmed string
   */
  const trim = (str) => str.replace(/^\s+|\s+$/g, '')

  /**
   * Performance test function - counts nodes at given depth
   * @param {number} depth - Search depth
   * @returns {number} Number of nodes at the given depth
   */
  const perft = (depth) => {
    const moves = generate_moves({ legal: false })
    let nodes = 0

    for (const move of moves) {
      makeMove(move)
      if (depth - 1 > 0) {
        nodes += perft(depth - 1)
      } else {
        nodes++
      }
      undoMove()
    }

    return nodes
  }

  // Assign methods to this instance
  Object.assign(this, {
    // Constants
    WHITE,
    BLACK,
    MAN,
    KING,
    FLAGS,
    SQUARES: 'A8',

    // Game setup methods
    load: (fen) => load(fen),
    reset: () => reset(),
    clear: () => clear(),

    // Move generation and validation
    moves: generate_moves,
    getMoves,
    getLegalMoves,
    captures: getCaptures,

    // Game state methods
    gameOver,
    inDraw: () => false,
    turn: () => turn.toLowerCase(),

    // Move execution
    move: (moveObj) => {
      if (typeof moveObj.to === 'undefined' && typeof moveObj.from === 'undefined') {
        return false
      }
      
      const move = {
        to: parseInt(moveObj.to, 10),
        from: parseInt(moveObj.from, 10)
      }
      
      const legalMoves = generate_moves()
      const matchingMove = legalMoves.find(legalMove => 
        move.to === legalMove.to && move.from === legalMove.from
      )
      
      if (matchingMove) {
        makeMove(matchingMove)
        return matchingMove
      }
      
      return false
    },
    
    undo: () => undoMove() || null,

    // Board manipulation
    put: (piece, square) => put(piece, square),
    get: (square) => get(square),
    remove: (square) => remove(square),
    position: getPosition,

    // FEN and PDN support
    validate_fen,
    fen: generate_fen,
    pdn: generatePDN,
    load_pdn: (_pdn, _options) => {}, // TODO: Implementation needed
    parsePDN,
    header: (...args) => set_header(args),

    // History and display
    history: getHistory,
    ascii,

    // Utility functions
    convertMoves,
    convertNumber,
    convertPosition,
    outsideBoard,
    directionStrings,
    oppositeDir,
    validDir,
    clone,
    makePretty,
    
    // Performance testing
    perft: (depth) => perft(depth)
  })

  // Initialize game position after all functions are defined
  if (!fen) {
    position = DEFAULT_POSITION_INTERNAL
    load(DEFAULT_FEN)
  } else {
    position = DEFAULT_POSITION_INTERNAL
    load(fen)
  }
}

// Module exports for different environments
if (typeof exports !== 'undefined') {
  // CommonJS
  exports.Draughts = Draughts
  module.exports = Draughts
  module.exports.Draughts = Draughts
}

if (typeof define !== 'undefined') {
  // AMD
  define(() => Draughts)
}

// For ES6 modules, uncomment the following line when using .mjs extension:
// export default Draughts
