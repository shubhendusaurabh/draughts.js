declare namespace Draughts {
	export type Player = "white" | "black"

	export type Board = Array<undefined | {
		player: Draughts.Player,
		isKing: boolean
	}>

	export interface BoardType {
		size: number,
		getMovesForPiece(board: Draughts.Board, location: number): Array<number>
	}
}

export = Draughts
