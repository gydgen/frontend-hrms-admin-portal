/**
 * Interface for move card request body
 * Used when moving cards between or within columns
 */
export interface MoveCardRequest {
	/**
	 * Unique identifier of the card to move
	 */
	id: number;

	/**
	 * Weight/position of the card in the target column
	 * Used for manual sorting when no backend ordination is configured
	 */
	weight: number;

	/**
	 * Target column ID where the card should be moved
	 */
	columnId: number;
}
