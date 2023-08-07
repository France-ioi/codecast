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

export function shuffleArray(arrayOriginal) {
    const array = [...arrayOriginal];

    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
}
