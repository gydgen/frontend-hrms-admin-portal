import { FormGroup } from '@angular/forms';
import { extractValues } from './object';



export function camelize(value: string) {
	return value
		.replace(/\s(.)/g, function ($1) {
			return $1.toUpperCase();
		})
		.replace(/\s/g, '')
		.replace(/^(.)/, function ($1) {
			return $1.toLowerCase();
		});
}

/**
 Returns the Capitalized form of a string

 ```javascript
 'innerHTML'.capitalize()         // 'InnerHTML'
 'action_name'.capitalize()       // 'Action_name'
 'css-class-name'.capitalize()    // 'Css-class-name'
 'my favorite items'.capitalize() // 'My favorite items'
 ```

 @method capitalize
 @param {String} str The string to capitalize.
 @return {String} The capitalized string.
 */
export function capitalize(str: string): string {
	return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 Returns the UpperCamelCase form of a string.

 @example
 ```javascript
 'innerHTML'.classify();          // 'InnerHTML'
 'action_name'.classify();        // 'ActionName'
 'css-class-name'.classify();     // 'CssClassName'
 'my favorite items'.classify();  // 'MyFavoriteItems'
 'app.component'.classify();      // 'AppComponent'
 ```
 @method classify
 @param {String} str the string to classify
 @return {String} the classified string
 */
export function classify(str: string) {
	try {
		return str
			.split('.')
			.map((part) => capitalize(camelize(part)))
			.join('');
	} catch (error) {
		console.error('classify', str);
		return 'errorrrr';
	}
}


/**
 * Determines whether a given URL is absolute or relative.
 *
 * @param {string} url The URL to check
 * @return {*}  {boolean}
 */
export function isAbsoluteUrl(url: string): boolean {
	// Create a regular expression to check if the URL starts with "http", "https", or "//"
	const regex = /^https?:\/\//i;

	// If the URL starts with "http", "https", or "//", then it's an absolute URL
	if (regex.test(url)) {
		return true;
	}

	// If the URL starts with a single "/", then it's a relative URL
	if (url.startsWith('/')) {
		return false;
	}

	// If the URL starts with any other text, then it's a relative URL
	return false;
}

/**
 * The function checks if a value is a number.
 *
 * @param {string | number} [value] - The `value` parameter can be either a string or a number.
 * @returns a boolean value.
 */
export function isNumber(value?: string | number): boolean {
	return !isNaN(parseFloat(value as any)) && isFinite(value as any);
}

export function interpolate(
	inputString: string,
	variables: { [key: string]: any }
): string {
	const regex = /\[(.*?)\]/g;
	return inputString
		.replace(regex, (match, key) => {
			return variables[key] !== undefined ? `.${variables[key]}` : match;
		})
		.replace('>', '.');
}



const regex = /\{([^}]+)index\}/g;

/**
 * Transforms a string into a number (if needed).
 */
export function strToNumber(value: number | string): number {
	// Convert strings to numbers
	if (
		typeof value === 'string' &&
		!isNaN(Number(value) - parseFloat(value))
	) {
		return Number(value);
	}
	if (typeof value !== 'number') {
		throw new Error(`${value} is not a number`);
	}
	return value;
}

export function upperFirst(value: string) {
	return value.charAt(0).toUpperCase() + value.slice(1);
}
