export default function(elems, sep) {
    if (elems.length === 0) {
        return [];
    }
    const f = function(xs, x, i) {
        return xs.concat([sep, x]);
    };
    return elems.slice(1).reduce(f, [elems[0]]);
};
