import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, firstValueFrom, map, Observable, of } from 'rxjs';
import { PagedDataRequestParam } from '../models/paged-data-request-param';
import { PaginatedResponse } from './../models';
// import { Filter } from './../models/filter';
import { PaginatedData } from './../models/paginated-data';
import { GeneralSearch, QueryParams } from './../models/query-params';
import { removeEmptyProperties } from './../utils/object';
import { environment } from '../../../environments/environment';

/**
 * Abstract base service providing standard CRUD and pagination operations
 * for a REST API collection of type T.
 *
 * @export
 * @abstract
 * @class GenericCollectionService
 * @template T
 */
export abstract class GenericCollectionService<T> {
	protected http: HttpClient = inject(HttpClient);

	/**
	 * The URL path segment used in all HTTP requests for this resource.
	 *
	 * @type {string}
	 */
	protected abstract path: string;

	/**
	 * Fetches a paginated list via GET.
	 *
	 * @deprecated Use `paginate()` instead.
	 */
	get(
		params: Partial<QueryParams> = {},
		endpoint = 'advanced-search'
	): Observable<PaginatedResponse<T>> {
		const { filters: _, searchKeys: __, ...scalars } = params;
		removeEmptyProperties(scalars as Record<string, unknown>);
		return this.http.get<PaginatedResponse<T>>(
			`${environment.apiUrl}/${this.path}/${endpoint}`,
			{ params: scalars as Record<string, string | number | boolean> }
		);
	}

	/**
	 * Fetches a single item by id.
	 *
	 * @param id The id of the item to fetch.
	 * @returns Observable wrapping the item of type T.
	 */
	find(id: number | string): Observable<T> {
		return this.http.get<T>(`${environment.apiUrl}/${this.path}/${id}`);
	}

	/**
	 * Returns all items as a flat array by requesting a very large page.
	 *
	 * @param request Optional pagination/filter parameters.
	 * @returns Observable of T[].
	 */
	list(
		request: Partial<PagedDataRequestParam & { filters: Array<any> }> = {}
	): Observable<T[]> {
		return this.paginate({ perPage: 10_000, page: 1, ...request }).pipe(
			map((result) => result.data ?? [])
		);
	}

	/**
	 * Fetches a paginated, filtered, and sorted page of items via POST to
	 * the `advanced-search` endpoint.
	 *
	 * @param request Pagination, sort, filter, and search configuration.
	 * @returns Observable of PaginatedData<T>. Emits an empty page on error.
	 */
	paginate(
		request: Partial<PagedDataRequestParam> = {}
	): Observable<PaginatedData<T>> {
		const {
			perPage: size = 20,
			page = 1,
			ordination: { direction: sort = null, property: sortField = null } = {},
			filters,
			searchTerm
		} = request;

		const urlParams: Record<string, string | number> = {
			size,
			page: page - 1
		};
		if (sort) urlParams['sort'] = sort;
		if (sortField) urlParams['sortField'] = sortField;

		let httpParams = new HttpParams();
		Object.entries(urlParams).forEach(([key, value]) => {
			httpParams = httpParams.set(key, value.toString());
		});

		const query: {
			where: any[];
			sort?: string;
			sortField?: string;
			generalSearch?: GeneralSearch;
		} = { where: filters ?? [] };

		if (sort) query.sort = sort;
		if (sortField) query.sortField = sortField;
		if (searchTerm && request.searchKeys?.length) {
			query.generalSearch = {
				value: searchTerm.trim(),
				fields: request.searchKeys
			};
		}

		return this.http
			.post<PaginatedResponse<T>>(
				`${environment.apiUrl}/${this.path}/advanced-search`,
				query,
				{ params: httpParams }
			)
			.pipe(
				map((response) => ({
					data: response.content,
					currentPage: response.page + 1,
					lastPage: response.totalPages,
					total: response.totalElements,
					perPage: response.size
				})),
				catchError(() =>
					of<PaginatedData<T>>({
						data: [],
						currentPage: 1,
						lastPage: 0,
						total: 0,
						perPage: size
					})
				)
			);
	}

	/**
	 * Creates a new record via POST.
	 *
	 * @param data The data for the new record.
	 * @returns Promise resolving to the created item of type T.
	 */
	create(data: Partial<T>): Promise<T> {
		return firstValueFrom(
			this.http.post<T>(`${environment.apiUrl}/${this.path}`, data)
		);
	}

	/**
	 * Updates an existing record via PUT.
	 *
	 * @param id The id of the record to update.
	 * @param data The updated fields.
	 * @returns Promise resolving to the updated item of type T.
	 */
	update(id: number | string, data: Partial<T>): Promise<T> {
		return firstValueFrom(
			this.http.put<T>(`${environment.apiUrl}/${this.path}/${id}`, data)
		);
	}

	/**
	 * Deletes a record by id via DELETE.
	 *
	 * @param id The id of the record to delete.
	 * @returns Promise that resolves when the deletion completes.
	 */
	delete(id: number | string): Promise<void> {
		return firstValueFrom(
			this.http.delete<void>(`${environment.apiUrl}/${this.path}/${id}`)
		);
	}

	/**
	 * Creates or updates a record depending on whether `value.id` is present.
	 * Delegates to `create()` or `update()`.
	 *
	 * @param value The record data. If `id` is present, performs an update; otherwise creates.
	 * @returns Promise resolving to the saved item of type T.
	 */
	updateOrCreate(value: Partial<T> & { id?: number | string }): Promise<T> {
		const { id, ...data } = value as { id?: number | string } & Record<string, unknown>;
		return id ? this.update(id, data as Partial<T>) : this.create(data as Partial<T>);
	}
}
