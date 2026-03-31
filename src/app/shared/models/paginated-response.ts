/**
 * Generic interface representing a paginated response structure.
 *
 * This model is typically used to encapsulate server responses that return
 * paginated data sets, including metadata required for pagination controls.
 *
 * @template T - The type of items contained in the paginated response.
 */
export interface PaginatedResponse<T = Datum> {
	/**
	 * The actual content of the current page.
	 * An array of elements of type `T`.
	 */
	content: T[];

	/**
	 * The total number of elements across all pages.
	 */
	totalElements: number;

	/**
	 * The total number of pages available.
	 */
	totalPages: number;

	/**
	 * Indicates whether the current page is the last one.
	 */
	last?: boolean;

	/**
	 * The number of elements per page (i.e., page size).
	 */
	size: number;

	/**
	 * The index of the current page (zero-based).
	 */
	page: number;

	/**
	 * The number of elements present on the current page.
	 */
	numberOfElements: number;

	/**
	 * Indicates whether the current page is the first one.
	 */
	first?: boolean;

	/**
	 * Indicates whether the current page has no elements.
	 */
	empty?: boolean;
}

/**
 * Generic fallback type used when no specific generic type is provided.
 */
interface Datum {
	[key: string]: any;
}
