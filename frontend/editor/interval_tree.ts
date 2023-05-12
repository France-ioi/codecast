import {immerable} from "immer";

export interface TrimInterval {
    value: {skip: boolean, mute: boolean},
    start: number,
    end: number,
}

function Node(left, key, right) {
    this.left = left;
    this.key = key;
    this.right = right;
}

function Leaf(value) {
    this.value = value;
}

function split(tree, key) {
    if (tree instanceof Leaf) {
        return new Node(tree, key, tree);
    }
    if (key < tree.key) {
        return new Node(split(tree.left, key), tree.key, tree.right);
    }
    if (key > tree.key) {
        return new Node(tree.left, tree.key, split(tree.right, key));
    }
    return tree;
}

function get(tree, key): TrimInterval {
    let start = 0, end = Infinity;
    while (tree instanceof Node) {
        // @ts-ignore
        if (key <= tree.key) {
            // @ts-ignore
            end = tree.key;
            // @ts-ignore
            tree = tree.left;
        } else {
            // @ts-ignore
            start = tree.key;
            // @ts-ignore
            tree = tree.right;
        }
    }

    return {value: tree.value, start, end};
}

function set(tree, key, value) {
    if (tree instanceof Leaf) {
        return new Leaf(value);
    }
    if (key <= tree.key) {
        return new Node(set(tree.left, key, value), tree.key, tree.right);
    } else {
        return new Node(tree.left, tree.key, set(tree.right, key, value));
    }
}

function mergeLeft(tree, key) {
    if (tree instanceof Node) {
        // @ts-ignore
        if (key < tree.key) {
            // @ts-ignore
            if (tree.left instanceof Node) {
                // @ts-ignore
                const left = mergeLeft(tree.left, key);
                // @ts-ignore
                return new Node(left, tree.key, tree.right);
            }
            // @ts-ignore
        } else if (key > tree.key) {
            // @ts-ignore
            if (tree.right instanceof Node) {
                // @ts-ignore
                const right = mergeLeft(tree.right, key);
                // @ts-ignore
                return new Node(tree.left, tree.key, right);
            }
        } else {
            // @ts-ignore
            if (tree.left instanceof Leaf) {
                // @ts-ignore
                return tree.right;
            }
            // @ts-ignore
            const {left, node} = hoistRightmost(tree.left);
            // @ts-ignore
            return new Node(left, node.key, tree.right);
        }
    }
    return tree;
}

function hoistRightmost(tree) {
    if (tree instanceof Node) {
        // @ts-ignore
        if (tree.right instanceof Leaf) {
            // @ts-ignore
            return {left: tree.left, node: tree};
        } else {
            // @ts-ignore
            const {left, node} = hoistRightmost(tree.right);
            // @ts-ignore
            return {left: new Node(tree.left, tree.key, left), node};
        }
    }
}

function keys(tree) {
    const stack = [];

    function push(tree) {
        if (tree instanceof Node) {
            // @ts-ignore
            stack.push({type: 'node', arg: tree.right});
            // @ts-ignore
            stack.push({type: 'key', arg: tree.key});
            // @ts-ignore
            stack.push({type: 'node', arg: tree.left});
        }
    }

    push(tree);
    return {
        next: function() {
            while (stack.length > 0) {
                const {type, arg} = stack.pop();
                switch (type) {
                    case 'node':
                        push(arg);
                        break;
                    case 'key':
                        return {value: arg};
                }
            }
            return {done: true};
        }
    };
}

function intervals(tree): Iterator<TrimInterval> {
    let start = 0, nextValue = null;
    const stack = [];

    function push(tree) {
        if (tree instanceof Leaf) {
            // @ts-ignore
            stack.push({type: 'value', arg: tree.value});
        } else {
            stack.push({type: 'node', arg: tree.right});
            stack.push({type: 'key', arg: tree.key});
            stack.push({type: 'node', arg: tree.left});
        }
    }

    push(tree);
    return {
        next: function() {
            let result;
            while (stack.length > 0) {
                const {type, arg} = stack.pop();
                switch (type) {
                    case 'value':
                        nextValue = arg;
                        break;
                    case 'key':
                        result = {value: nextValue, start: start, end: arg};
                        start = arg;
                        return {value: result};
                    case 'node':
                        push(arg);
                        break;
                }
            }
            if (start < +Infinity) {
                result = {value: nextValue, start: start, end: +Infinity};
                start = +Infinity;
                return {value: result};
            }
            return {done: true, value: null};
        }
    };
}

export class IntervalTree {
    [immerable] = true;
    [Symbol.iterator]: () => Iterator<TrimInterval>;
    keys = {[Symbol.iterator]: () => keys(this.root)};

    constructor(public root) {
        this.root = root;
    }

    toString() {
        // @ts-ignore
        return JSON.stringify(Array.from(this));
    }

    split(key) {
        return new IntervalTree(split(this.root, key));
    }

    mergeLeft(key) {
        return new IntervalTree(mergeLeft(this.root, key));
    }

    get(key) {
        return get(this.root, key);
    }

    set(key, value) {
        return new IntervalTree(set(this.root, key, value));
    }
}

/*
  As of babel 7.0.0-beta.36, the ES6 class syntax
    [Symbol.iterator]() { return intervals(this.root); }
  incorrectly defines a property named 'undefined'.  */
IntervalTree.prototype[Symbol.iterator] = function() {
    return intervals(this.root);
};

export default function intervalTree(initialValue) {
    return new IntervalTree(new Leaf(initialValue))
}

/*

var tree = intervalTree('a').split(1000).set(1500, 'b').split(1500).set(2000, 'c').set(1200, 'B');
for (let it of tree.intervals()) { console.log(it); }
> {value: "a", start: 0, end: 1000}
> {value: "B", start: 1000, end: 1500}
> {value: "c", start: 1500, end: Infinity}

*/
