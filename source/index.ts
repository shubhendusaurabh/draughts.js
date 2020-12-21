import gameTypes from "./gameTypes"
import Draughts from "./types"

const playerMap = new Map([
	["B", "Black"],
	["W", "White"]
])

const getPieceLocations = (board: Draughts.Board, player: Draughts.Player) => board
	.filter(({player: currentPlayer}) => currentPlayer === player)
	.map(({isKing}, index) => isKing ? `K${index + 1}` : index + 1)

class Draughts {
	public readonly size: number

	public board: Draughts.Board

	public currentTurn = "white"

	private readonly game: {
		size: number,
		getMovesForPiece(board: Draughts.Board, location: number): Array<number>,
		move(board: Draughts.Board, startLocation: number, endLocation: number): void
	}

	constructor({fen, gameType = "english"}: {fen?: string, gameType?: keyof typeof gameTypes} = {}) {
		this.game = gameTypes[gameType]
		this.size = this.game.size

		if (!Number.isInteger(this.size) || this.size % 2 !== 0 || this.size < 4) {
			throw new TypeError("The size must be an even integer larger than 3.")
		}

		const totalBlackSquares = this.size * this.size / 2

		this.board = new Array(totalBlackSquares)

		if (fen) {
			const [currentTurn, ...players] = fen.split(":")

			this.currentTurn = playerMap.get(currentTurn)

			for (const player of players) {
				const playerName = playerMap.get(player[0]) as Draughts.Player

				for (const piece of player.slice(1).split(",")) {
					if (piece.startsWith("K")) {
						this.board[Number(piece.slice(1)) - 1] = {
							player: playerName,
							isKing: true
						}
					} else {
						this.board[Number(piece) - 1] = {
							player: playerName,
							isKing: false
						}
					}
				}
			}
		} else {
			const blackSquaresPerRow = this.size / 2
			const startingRows = (this.size - 2) / 2

			this.board
				.fill({
					player: "black",
					isKing: false
				}, 0, blackSquaresPerRow * startingRows)
				.fill({
					player: "white",
					isKing: false
				}, (blackSquaresPerRow * (startingRows + 2)), totalBlackSquares)
		}
	}

	get fen(): string {
		return `${this.currentTurn === "black" ? "B" : "W"}:B${getPieceLocations(this.board, "black").join(",")}:W${getPieceLocations(this.board, "white").join(",")}`
	}

	getMovesForPiece(location: number) {
		return this.game.getMovesForPiece(this.board, location)
	}

	get allPossibleMoves() {
		return [...new Array(this.board.length)].flatMap((_, index) => this.getMovesForPiece(index + 1).map(location => [index + 1, location]))
	}

	move(startLocation: number, endLocation: number) {
		if (!this.getMovesForPiece(startLocation).includes(endLocation)) {
			throw new Error("Move is invalid")
		}

		this.game.move(this.board, startLocation, endLocation)
	}
}

export = Draughts