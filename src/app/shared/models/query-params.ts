// import { Filters } from './filter';

/**
 * Represents the query parameters used for data retrieval operations.
 * Provides comprehensive configuration for pagination, sorting, filtering, and searching
 * across any data collection or API endpoint.
 *
 * This interface is commonly used for table views, lists, and any paginated data display
 * where users need to sort, filter, or search through large datasets.
 *
 * @example
 * ```typescript
 * const params: QueryParams = {
 *   page: 1,
 *   size: 20,
 *   sortField: 'createdAt',
 *   sort: 'DESC',
 *   search: 'john doe',
 *   searchKeys: ['name', 'email'],
 *   filters: [
 *     { property: 'status', value: 'active', operator: LogicOperators.EQUALS }
 *   ]
 * };
 * ```
 */
export interface QueryParams {
	/**
	 * The field name to use for sorting the results.
	 * Typically corresponds to a property name in the data model.
	 *
	 * @example 'createdAt', 'name', 'id'
	 */
	sortField?: string;

	/**
	 * The sort direction for ordering the results.
	 * - ASC: Ascending order (A-Z, 0-9, oldest to newest)
	 * - DESC: Descending order (Z-A, 9-0, newest to oldest)
	 */
	sort?: 'ASC' | 'DESC';

	/**
	 * Array of filter conditions to apply to the query.
	 * Each filter specifies a property, operator, and value to match.
	 *
	 * @see {@link Filters}
	 */
	filters?: Array<any>;

	/**
	 * Global search term to match across specified fields.
	 * Used in conjunction with searchKeys to perform full-text search.
	 *
	 * @example 'john doe', 'active user', 'report-2024'
	 */
	search?: string;

	/**
	 * Array of field names to include in the search operation.
	 * Defines which properties should be searched when using the search term.
	 *
	 * @example ['name', 'email', 'description']
	 */
	searchKeys?: Array<string>;

	/**
	 * The page number to retrieve (zero-based or one-based depending on backend implementation).
	 * Used for pagination to fetch a specific slice of the result set.
	 *
	 * @example 0, 1, 2
	 */
	page?: number;

	/**
	 * The number of items to return per page.
	 * Defines the page size for pagination.
	 *
	 * @example 10, 20, 50, 100
	 */
	size?: number;
}

/**
 * General search configuration with search value and target fields
 */
export interface GeneralSearch {
	value: string;
	fields: string[];
}
