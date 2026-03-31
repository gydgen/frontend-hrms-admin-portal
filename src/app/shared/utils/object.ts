import { isNumber } from './strings';

export function isObject(value: any): boolean {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

/**
 * Modifies the object passed as a parameter by removing empty properties
 *
 * @export
 * @param {object} obj
 */
export function removeEmptyProperties(obj: Record<string, unknown>): void {
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const element = obj[key];
			if (element === null || element === '') {
				delete obj[key];
			}
		}
	}
}

/**
 * Deletes the empty properties and the 0 size arrays of the object passed as a
 * parameter and returns a copy of it
 *
 * @export
 * @param {object} obj
 * @return a copy of the object without empty properties or 0 size arrays
 */
export function clean(obj: any) {
	if (!obj) {
		return undefined;
	}

	Object.keys(obj).forEach((key) =>
		!obj[key] || obj[key].length === 0 ? delete obj[key] : {}
	);
	return obj;
}


/**
 * Extracts values from an object or array based on a given path string.
 *
 * @param {string} path - The `path` parameter is a string that represents the path to the value you want to extract from the
 * `value` object. It uses dot notation to navigate through nested properties of the object.
 * @param {any} value - The `value` parameter is the object from which you want to extract values. It can be any JavaScript object
 * or array.
 * @param options - The `options` parameter is an object
 *
 * @returns the value extracted from the given path in the provided object.
 */
export function extractValues(
	path: string,
	value: any,
	options: { pathGlue: string }
) {
	const splittedPath: string[] = path.split(options.pathGlue ?? '.');
	return splittedPath.reduce((acc, c) => {
		if (typeof acc === 'object' && !Array.isArray(acc)) {
			acc = acc[c];
			return acc;
		}
		if (c === 'i' || c.includes('Index') || isNumber(c)) {
			return acc;
		} else if (Array.isArray(acc)) {
			acc = acc.map((o) => o[c]);
			return acc;
		}
	}, value);
}

/**
 * Calculates the maximum depth of an object by recursively traversing its properties.
 *
 * @param {any} obj - is the object for which we want to calculate the depth.
 *
 * @returns the depth of the given object.
 */
export function getDepth(obj: any): number {
	if (typeof obj !== 'object' || obj === null) {
		return 0;
	}

	let maxDepth = 0;

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const depth = getDepth(obj[key]);
			if (depth > maxDepth) {
				maxDepth = depth;
			}
		}
	}

	return 1 + maxDepth;
}

/**
 * Checks if a value is defined and not null.
 *
 * @param {any} value - The value parameter is of type any, which means it can accept any data type.
 *
 * @returns returns a boolean value.
 */
export function isDefined(value: any): boolean {
	return value !== undefined && value !== null;
}

/**
 * Determines if two objects or two values are equivalent.
 *
 * Two objects or values are considered equivalent if at least one of the following is true:
 *
 * * Both objects or values pass `===` comparison.
 * * Both objects or values are of the same type and all of their properties are equal by
 *   comparing them with `equals`.
 *
 * @param o1 Object or value to compare.
 * @param o2 Object or value to compare.
 * @returns true if arguments are equal.
 */
export function equals(o1: any, o2: any): boolean {
	if (o1 === o2) {
		return true;
	}
	if (o1 === null || o2 === null) {
		return false;
	}
	if (o1 !== o1 && o2 !== o2) {
		return true;
	} // NaN === NaN
	let t1 = typeof o1,
		t2 = typeof o2,
		length: number,
		key: any,
		keySet: any;
	if (t1 == t2 && t1 == 'object') {
		if (Array.isArray(o1)) {
			if (!Array.isArray(o2)) {
				return false;
			}
			if ((length = o1.length) == o2.length) {
				for (key = 0; key < length; key++) {
					if (!equals(o1[key], o2[key])) {
						return false;
					}
				}
				return true;
			}
		} else {
			if (Array.isArray(o2)) {
				return false;
			}
			keySet = Object.create(null);
			for (key in o1) {
				if (!equals(o1[key], o2[key])) {
					return false;
				}
				keySet[key] = true;
			}
			for (key in o2) {
				if (!(key in keySet) && typeof o2[key] !== 'undefined') {
					return false;
				}
			}
			return true;
		}
	}
	return false;
}

/**
 * Performs a deep comparison between two values to determine if they are equivalent.
 *
 * This function compares primitive values, arrays, and plain objects recursively.
 * It handles:
 * - Strict equality for primitives.
 * - Deep comparison of arrays (same order and nested elements).
 * - Deep comparison of objects (same keys and nested values).
 *
 * @param {any} first - The first value to compare.
 * @param {any} second - The second value to compare.
 * @returns {boolean} `true` if both values are deeply equal, otherwise `false`.
 *
 * @example
 * isEqual(1, 1); // true
 * isEqual([1, 2], [1, 2]); // true
 * isEqual({ a: 1 }, { a: 1 }); // true
 * isEqual({ a: 1 }, { a: 2 }); // false
 * isEqual({ a: [1, 2] }, { a: [1, 2] }); // true
 * isEqual({ a: [1, 2] }, { a: [2, 1] }); // false
 */
export function isEqual(first: any, second: any): boolean {
	if (first === second) {
		return true;
	}
	if (
		(first === undefined ||
			second === undefined ||
			first === null ||
			second === null) &&
		(first || second)
	) {
		return false;
	}
	const firstType = first?.constructor.name;
	const secondType = second?.constructor.name;
	if (firstType !== secondType) {
		return false;
	}
	if (firstType === 'Array') {
		if (first.length !== second.length) {
			return false;
		}
		let equal = true;
		for (let i = 0; i < first.length; i++) {
			if (!isEqual(first[i], second[i])) {
				equal = false;
				break;
			}
		}
		return equal;
	}
	if (firstType === 'Object') {
		let equal = true;
		const fKeys = Object.keys(first);
		const sKeys = Object.keys(second);
		if (fKeys.length !== sKeys.length) {
			return false;
		}
		for (let i = 0; i < fKeys.length; i++) {
			if (first[fKeys[i]] && second[fKeys[i]]) {
				if (first[fKeys[i]] === second[fKeys[i]]) {
					continue; // eslint-disable-line
				}
				if (
					first[fKeys[i]] &&
					(first[fKeys[i]].constructor.name === 'Array' ||
						first[fKeys[i]].constructor.name === 'Object')
				) {
					equal = isEqual(first[fKeys[i]], second[fKeys[i]]);
					if (!equal) {
						break;
					}
				} else if (first[fKeys[i]] !== second[fKeys[i]]) {
					equal = false;
					break;
				}
			} else if (
				(first[fKeys[i]] && !second[fKeys[i]]) ||
				(!first[fKeys[i]] && second[fKeys[i]])
			) {
				equal = false;
				break;
			}
		}
		return equal;
	}
	return first === second;
}

/**
 * Retrieves a value from an object by specifying the path to the desired property.
 *
 * @param obj The object from which to retrieve the value.
 * @param path The path to the desired property, represented as a string of properties separated by dots.
 * @param fallback (Optional) The fallback value to return if the specified path is not found in the object.
 * @returns The value at the specified path in the object, or the fallback value if the path is not found.
 */
export function get<T extends object, R>(
	obj: T,
	path: string,
	fallback?: R
): R | undefined {
	const dot = path.indexOf('.');

	if (obj === undefined) {
		return fallback;
	}

	if (dot === -1) {
		if (path.length && path in obj) {
			return (obj as any)[path] as R;
		}
		return fallback;
	}

	const subPath = path.substr(0, dot);
	const remainingPath = path.substr(dot + 1);
	const nestedObj = (obj as any)[subPath];

	return get(nestedObj, remainingPath, fallback);
}
