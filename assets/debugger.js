/**
 * Debugger support for skulpt module
 */

var Sk = Sk || {}; //jshint ignore:line

/**
 * Changes :
 *
 * - Suspension.colno -> Suspension.$colno
 * - Suspension.lineno -> Suspension.$lineno
 * - Suspension.filename -> Suspension.$filename
 *
 * Modification on hasOwnProperty (or skulpt crash).
 * Internal call to hasOwnProperty here moved to debuggerHasOwnProperty (origninal of hasOwnProperty).
 *
 * goog.exportSymbol -> Sk.exportSymbol
 *
 * Add :
 * - this.output_callback._onStepError(e);
 * - this.output_callback._onStepSuccess(e);
 */

var DEBUG_DEBUGGER = true;
var debuggerLog = function() {
    if (DEBUG_DEBUGGER) {
        // 1. Convert args to a normal array
        var args = Array.prototype.slice.call(arguments);

        // 2. Prepend log prefix log string
        args.unshift("[debugger.js] ");

        // 3. Pass along arguments to console.log
        console.log.apply(console, args);
    }
};

function hasOwnProperty(prop) {
    var obj = this;
    var proto = obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

function debuggerHasOwnProperty(obj, prop) {
    var proto = obj.constructor.prototype;
    return (prop in obj) &&
        (!(prop in proto) || proto[prop] !== obj[prop]);
}

Sk.Breakpoint = function(filename, lineno, colno) {
    this.filename = filename;
    this.lineno = lineno;
    this.colno = colno;
    this.enabled = true;
    this.ignore_count = 0;
};

Sk.Debugger = function(filename, output_callback) {
    this.dbg_breakpoints = {};
    this.tmp_breakpoints = {};
    this.suspension_stack = [];
    this.current_suspension = -1;
    this.eval_callback = null;
    this.suspension = null;
    this.output_callback = output_callback;
    this.step_mode = false;
    this.filename = filename;
};

Sk.Debugger.prototype.print = function(txt) {
    if (this.output_callback != null) {
        this.output_callback.print(txt + "\n");
    }
};

Sk.Debugger.prototype.get_source_line = function(lineno) {
    if (this.output_callback != null) {
        return this.output_callback.get_source_line(lineno);
    }

    return "";
};

Sk.Debugger.prototype.move_up_the_stack = function() {
    this.current_suspension = Math.min(this.current_suspension + 1, this.suspension_stack.length - 1);
};

Sk.Debugger.prototype.move_down_the_stack = function() {
    this.current_suspension = Math.max(this.current_suspension - 1, 0);
};

Sk.Debugger.prototype.enable_step_mode = function() {
    this.step_mode = true;
};

Sk.Debugger.prototype.disable_step_mode = function() {
    this.step_mode = false;
};

Sk.Debugger.prototype.get_suspension_stack = function() {
    return this.suspension_stack;
};

Sk.Debugger.prototype.get_active_suspension = function() {
    if (this.suspension_stack.length === 0) {
        return null;
    }

    console.log('get_active_suspension');
    console.log(this.suspension_stack);
    console.log(this.current_suspension);
    return this.suspension_stack[this.current_suspension];
};

Sk.Debugger.prototype.generate_breakpoint_key = function(filename, lineno, colno) {
    var key = filename + "-" + lineno;
    return key;
};

Sk.Debugger.prototype.check_breakpoints = function(filename, lineno, colno, globals, locals) {
    debuggerLog('check_breakpoints', filename, lineno, colno, globals, locals);

    // If Step mode is enabled then ignore breakpoints since we will just break
    // at every line.
    if (this.step_mode === true) {
        return true;
    }

    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (debuggerHasOwnProperty(this.dbg_breakpoints, key) &&
        this.dbg_breakpoints[key].enabled === true) {
        var bp = null;
        if (debuggerHasOwnProperty(this.tmp_breakpoints, key)) {
            delete this.dbg_breakpoints[key];
            delete this.tmp_breakpoints[key];
            return true;
        }

        this.dbg_breakpoints[key].ignore_count -= 1;
        this.dbg_breakpoints[key].ignore_count = Math.max(0, this.dbg_breakpoints[key].ignore_count);

        bp = this.dbg_breakpoints[key];
        if (bp.ignore_count === 0) {
            return true;
        } else {
            return false;
        }
    }
    return false;
};

Sk.Debugger.prototype.get_breakpoints_list = function() {
    return this.dbg_breakpoints;
};

Sk.Debugger.prototype.disable_breakpoint = function(filename, lineno, colno) {
    debuggerLog('disable_breakpoint', filename, lineno, colno);

    var key = this.generate_breakpoint_key(filename, lineno, colno);

    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        this.dbg_breakpoints[key].enabled = false;
    }
};

Sk.Debugger.prototype.enable_breakpoint = function(filename, lineno, colno) {
    debuggerLog('enable_breakpoint', filename, lineno, colno);

    var key = this.generate_breakpoint_key(filename, lineno, colno);

    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        this.dbg_breakpoints[key].enabled = true;
    }
};

Sk.Debugger.prototype.clear_breakpoint = function(filename, lineno, colno) {
    debuggerLog('clear_breakpoint', filename, lineno, colno);

    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        delete this.dbg_breakpoints[key];
        return null;
    } else {
        return "Invalid breakpoint specified: " + filename + " line: " + lineno;
    }
};

Sk.Debugger.prototype.clear_all_breakpoints = function() {
    this.dbg_breakpoints = {};
    this.tmp_breakpoints = {};
};

Sk.Debugger.prototype.set_ignore_count = function(filename, lineno, colno, count) {
    debuggerLog('set_ignore_count', filename, lineno, colno, count);

    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        var bp = this.dbg_breakpoints[key];
        bp.ignore_count = count;
    }
};

Sk.Debugger.prototype.set_condition = function(filename, lineno, colno, lhs, cond, rhs) {
    debuggerLog('set_condition', filename, lineno, colno, lhs, cond, rhs);

    var key = this.generate_breakpoint_key(filename, lineno, colno);
    var bp;
    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        // Set a new condition
        bp = this.dbg_breakpoints[key];
    } else {
        bp = new Sk.Breakpoint(filename, lineno, colno);
    }

    bp.condition = new Sk.Condition(lhs, cond, rhs);
    this.dbg_breakpoints[key] = bp;
};

Sk.Debugger.prototype.print_suspension_info = function(suspension) {
    var filename = suspension.$filename;
    var lineno = suspension.$lineno;
    var colno = suspension.$colno;
    console.log("Hit Breakpoint at <" + filename + "> at line: " + lineno + " column: " + colno + "\n");
    console.log("----------------------------------------------------------------------------------\n");
    console.log(" ==> " + this.get_source_line(lineno - 1) + "\n");
    console.log("----------------------------------------------------------------------------------\n");
    console.log(suspension);
};

Sk.Debugger.prototype.set_suspension = function(suspension) {
    debuggerLog('set_suspension', suspension);

    var parent = null;
    if (!debuggerHasOwnProperty(suspension, "$filename") && suspension.child instanceof Sk.misceval.Suspension) {
        suspension = suspension.child;
    }

    // Pop the last suspension of the stack if there is more than 0
    if (this.suspension_stack.length > 0) {
        this.suspension_stack.pop();
        this.current_suspension -= 1;
    }

    // Unroll the stack to get each suspension.
    while (suspension instanceof Sk.misceval.Suspension) {
        parent = suspension;
        this.suspension_stack.push(parent);
        this.current_suspension += 1;
        suspension = suspension.child;
    }

    suspension = parent;

    console.log('STACK SIZE IS ' + this.suspension_stack.length);
    console.log(this.suspension_stack);

    this.print_suspension_info(suspension);
};

Sk.Debugger.prototype.add_breakpoint = function(filename, lineno, colno, temporary) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    this.dbg_breakpoints[key] = new Sk.Breakpoint(filename, lineno, colno);
    if (temporary) {
        this.tmp_breakpoints[key] = true;
    }
};

Sk.Debugger.prototype.suspension_handler = function(susp) {
    return new Promise(function(resolve, reject) {
        try {
            resolve(susp.resume());
        } catch(e) {
            reject(e);
        }
    });
};

Sk.Debugger.prototype.resume = function() {
    debuggerLog('resume');

    // Reset the suspension stack to the topmost
    this.current_suspension = this.suspension_stack.length - 1;

    if (this.suspension_stack.length === 0) {
        this.print("No running program");
    } else {
        var promise = this.suspension_handler(this.get_active_suspension());
        console.log('promise', promise);
        promise.then(this.success.bind(this), this.error.bind(this));
    }
};

Sk.Debugger.prototype.pop_suspension_stack = function() {
    this.suspension_stack.pop();
    this.current_suspension -= 1;
};

Sk.Debugger.prototype.success = function(r) {
    debuggerLog('success', r);

    if (r instanceof Sk.misceval.Suspension) {
        this.set_suspension(r);
        if (this.output_callback != null) {
            this.output_callback._onStepSuccess();
        }
    } else {
        if (this.suspension_stack.length > 0) {
            // Current suspension needs to be popped of the stack
            this.pop_suspension_stack();

            if (this.suspension_stack.length === 0) {
                this.print("Program execution complete");
                return;
            }

            var parent_suspension = this.get_active_suspension();
            // The child has completed the execution. So override the child's resume
            // so we can continue the execution.
            parent_suspension.child.resume = function() {
                return r;
            };
            this.resume();
        } else {
            this.print("Program execution complete");
        }
    }
};

Sk.Debugger.prototype.error = function(e) {
    if (this.output_callback != null) {
        this.output_callback._onStepError(e);
    }
    this.print("Traceback (most recent call last):");
    for (var idx = 0; idx < e.traceback.length; ++idx) {
        this.print("  File \"" + e.traceback[idx].filename + "\", line " + e.traceback[idx].lineno + ", in <module>");
        var code = this.get_source_line(e.traceback[idx].lineno - 1);
        code = code.trim();
        code = "    " + code;
        this.print(code);
    }

    var err_ty = e.constructor.tp$name;
    for (idx = 0; idx < e.args.v.length; ++idx) {
        this.print(err_ty + ": " + e.args.v[idx].v);
    }
};

Sk.Debugger.prototype.asyncToPromise = function(suspendablefn, suspHandlers, debugger_obj) {
    return new Promise(function(resolve, reject) {
        try {
            var r = suspendablefn();

            (function handleResponse (r) {
                try {
                    while (r instanceof Sk.misceval.Suspension) {
                        debugger_obj.set_suspension(r);
                        return;
                    }

                    resolve(r);
                } catch(e) {
                    reject(e);
                }
            })(r);

        } catch (e) {
            reject(e);
        }
    });
};

Sk.Debugger.prototype.execute = function(suspendablefn, suspHandlers) {
    var r = suspendablefn();

    if (r instanceof Sk.misceval.Suspension) {
        this.suspensions.concat(r);
        this.eval_callback(r);
    }
};

Sk.exportSymbol("Sk.Debugger", Sk.Debugger);
