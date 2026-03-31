import { PaginatedResponse } from './paginated-response';

/**
 * Kanban board response containing an array of columns with their paginated data.
 * @template T Type of the entity contained in each card
 */
export type BoardResponse<T = any> = Array<ColumnResponse<T>>;

/**
 * Represents a Kanban board column with its configuration and paginated data.
 * @template T Type of the entity contained in the cards of this column
 */
export interface ColumnResponse<T = any> {
	/** Unique identifier of the column */
	id: number;
	/** Value/name of the column (e.g., "TODO", "IN_PROGRESS", "DONE") */
	value: string;
	/** Position of the column in the board (visual order) */
	position: number;
	/** Indicates whether the column is hidden */
	hidden: boolean;
	/** Identifier of the Kanban board this column belongs to */
	kanbanId: number;
	/** Paginated data of the cards contained in this column */
	data: ColumnDataResponse<T>;
}

/**
 * Paginated data of the cards in a column.
 * Extends PaginatedResponse by adding the array of cards with their entities.
 * @template T Type of the entity contained in each card
 */
export type ColumnCardEntity<T = any> = {
	/** Card data in the Kanban board */
	card: {
		/** Unique identifier of the card */
		id: number;
		/** Reference to the associated entity's id */
		refId: number | string;
		/** Weight/order of the card within the column */
		weight: number;
		/** Identifier of the column this card belongs to */
		columnId: number;
	};
	/** Entity associated with the card */
	entity: T;
};

/**
 * Paginated cards with their associated entities for a column.
 */
export type ColumnDataResponse<T = any> = PaginatedResponse<ColumnCardEntity<T>> & {
	/** Array of cards with their positioning data and associated entity */
	content: Array<ColumnCardEntity<T>>;
};
