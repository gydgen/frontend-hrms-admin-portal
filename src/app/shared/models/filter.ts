// import { LogicOperators, MatchModes } from '../../core/types/operators';
// import { FormulaOption } from '../services';

// /**
//  * List of filters, optionally grouped in nested arrays to express precedence.
//  * Each entry is either a single {@link Filter} or an array of sibling filters.
//  */
// export type Filters = Array<Filter | Array<Filter>>;

// /**
//  * Supported sources for assigning values to filter operands.
//  *
//  * - `STATIC`: A literal provided value.
//  * - `SYSTEM_VAR`: A platform/system variable value.
//  * - `SESSION_VAR`: A value stored in the current session.
//  * - `FORMULA`: A value calculated through a formula.
//  * - `CONTROL`: A value taken from a UI control.
//  * - `PARAM`: A value passed as a parameter.
//  * - `QUERY_PARAM`: A value read from the URL query string.
//  * - `VARIABLE`: Internal mapping value (reserved for internal use).
//  */
// export enum AssignmentTypes {
// 	STATIC = 'static',
// 	SYSTEM_VAR = 'systemVar',
// 	SESSION_VAR = 'sessionVar',
// 	FORMULA = 'formula',
// 	CONTROL = 'control',
// 	PARAM = 'param',
// 	QUERY_PARAM = 'queryParam',
// 	VARIABLE = 'variable'
// }

// /**
//  * Definition of a filter used to build query conditions.
//  */
// export interface Filter {
// 	/**
// 	 * Left-hand operand of the comparison.
// 	 */
// 	leftHand: {
// 		/** Source describing where the operand value comes from. */
// 		type: `${AssignmentTypes}`;
// 		/** Field identifier or literal value on the left-hand side. */
// 		value: string | number;
// 	};
// 	/**
// 	 * Comparison operator applied between the left and right hands.
// 	 */
// 	matchMode: `${MatchModes}`;
// 	/**
// 	 * Optional right-hand operand of the comparison.
// 	 */
// 	rightHand?: {
// 		/** Source describing where the operand value comes from. */
// 		type: `${AssignmentTypes}`;
// 		/** Value used for the comparison, including multi-select lists. */
// 		value: string | number | Array<string> | Array<number>;
// 	};
// 	/**
// 	 * Logical operator used to chain this filter with the next one.
// 	 */
// 	operator?: `${LogicOperators}`;
// }

// /**
//  * Assignment definition used to map values from one side to another.
//  */
// export interface Assignment {
// 	/**
// 	 * Destination operand receiving the value.
// 	 */
// 	leftHand: {
// 		/** Source describing where the operand value comes from. */
// 		type: `${AssignmentTypes}`;
// 		/** Field identifier or literal value on the left-hand side. */
// 		value: string | number;
// 	};
// 	/**
// 	 * Optional origin operand providing the value.
// 	 */
// 	rightHand?: {
// 		/** Source describing where the operand value comes from. */
// 		type: `${AssignmentTypes}`;
// 		/** Value mapped to the left-hand side. */
// 		value:
// 			| string
// 			| number
// 			| Array<string>
// 			| Array<number>
// 			| Array<FormulaOption>;
// 	};
// }

// /**
//  * List of assignment definitions.
//  */
// export type Assignments = Array<Assignment>;

// /**
//  * Configuration describing how a filter control relates to a data source.
//  */
// export interface FilterControl {
// 	/** Unique identifier of the field. */
// 	fieldId: number;
// 	/** Identifier of the data source that owns the field. */
// 	dataSourceId?: number;
// 	/** Path of relationship identifiers leading to the field. */
// 	relationshipIdsPath?: Array<number>;
// 	/** Path of relationship technical names leading to the field. */
// 	relationshipPath?: Array<string>;
// 	/** Path of relationship display names leading to the field. */
// 	relationshipNamesPath?: Array<string>;
// 	/** Display name of the field. */
// 	fieldName: string;
// 	/** Full path string pointing to the field, when available. */
// 	path?: string;
// 	/** Additional metadata keyed by arbitrary property names. */
// 	[key: string]: any;
// }
