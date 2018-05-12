
function Node (left, key, right) {
  this.left = left;
  this.key = key;
  this.right = right;
}

function Leaf (value) {
  this.value = value;
}

function split (tree, key) {
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

function get (tree, key) {
  let start = 0, end = Infinity;
  while (tree instanceof Node) {
    if (key <= tree.key) {
      end = tree.key;
      tree = tree.left;
    } else {
      start = tree.key;
      tree = tree.right;
    }
  }
  return {value: tree.value, start, end};
}

function set (tree, key, value) {
  if (tree instanceof Leaf) {
    return new Leaf(value);
  }
  if (key <= tree.key) {
    return new Node(set(tree.left, key, value), tree.key, tree.right);
  } else {
    return new Node(tree.left, tree.key, set(tree.right, key, value));
  }
}

function mergeLeft (tree, key) {
  if (tree instanceof Node) {
    if (key < tree.key) {
      if (tree.left instanceof Node) {
        const left = mergeLeft(tree.left, key);
        return new Node(left, tree.key, tree.right);
      }
    } else if (key > tree.key) {
      if (tree.right instanceof Node) {
        const right = mergeLeft(tree.right, key);
        return new Node(tree.left, tree.key, right);
      }
    } else {
      if (tree.left instanceof Leaf) {
        return tree.right;
      }
      const {left, node} = hoistRightmost(tree.left);
      return new Node(left, node.key, tree.right);
    }
  }
  return tree;
}

function hoistRightmost (tree) {
  if (tree instanceof Node) {
    if (tree.right instanceof Leaf) {
      return {left: tree.left, node: tree};
    } else {
      const {left, node} = hoistRightmost(tree.right);
      return {left: new Node(tree.left, tree.key, left), node};
    }
  }
}

function keys (tree) {
  const stack = [];
  function push (tree) {
    if (tree instanceof Node) {
      stack.push({type: 'node', arg: tree.right});
      stack.push({type: 'key', arg: tree.key});
      stack.push({type: 'node', arg: tree.left});
    }
  }
  push(tree);
  return {
    next: function () {
      while (stack.length > 0) {
        const {type, arg} = stack.pop();
        switch (type) {
          case 'node': push(arg); break;
          case 'key': return {value: arg};
        }
      }
      return {done: true};
    }
  };
}

function intervals (tree) {
  let start = 0, nextValue = null;
  const stack = [];
  function push (tree) {
    if (tree instanceof Leaf) {
      stack.push({type: 'value', arg: tree.value});
    } else {
      stack.push({type: 'node', arg: tree.right});
      stack.push({type: 'key', arg: tree.key});
      stack.push({type: 'node', arg: tree.left});
    }
  }
  push(tree);
  return {
    next: function () {
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
      return {done: true};
    }
  };
}

class IntervalTree {
  constructor (root) {
    this.root = root;
  }
  toString () {
    return JSON.stringify(Array.from(this.intervals()));
  }
  split (key) {
    return new IntervalTree(split(this.root, key));
  }
  mergeLeft (key) {
    return new IntervalTree(mergeLeft(this.root, key));
  }
  get (key) {
    return get(this.root, key);
  }
  set (key, value) {
    return new IntervalTree(set(this.root, key, value));
  }
  keys () {
    return {[Symbol.iterator]: () => keys(this.root)};
  }
  intervals () {
    return {[Symbol.iterator]: () => intervals(this.root)};
  }
}

export default function intervalTree (initialValue) {
  return new IntervalTree(new Leaf(initialValue))
}

/*

var tree = intervalTree('a').split(1000).set(1500, 'b').split(1500).set(2000, 'c').set(1200, 'B');
for (let it of tree.intervals()) { console.log(it); }
> {value: "a", start: 0, end: 1000}
> {value: "B", start: 1000, end: 1500}
> {value: "c", start: 1500, end: Infinity}

*/
