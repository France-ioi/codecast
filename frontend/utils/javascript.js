/**
 * Whether a given value is an empty object.
 *
 * @param value The value to test.
 *
 * @returns {boolean}
 */
export function isEmptyObject(value) {
    return (Object.keys(value).length === 0 && value.constructor === Object);
}
