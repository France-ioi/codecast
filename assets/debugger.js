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

var DEBUG_DEBUGGER = false;
var debuggerLog = function () {
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

Sk.Breakpoint = function (filename, lineno, colno) {
    this.filename = filename;
    this.lineno = lineno;
    this.colno = colno;
    this.enabled = true;
    this.ignore_count = 0;
};

Sk.Debugger = function (filename, output_callback) {
    this.dbg_breakpoints = {};
    this.tmp_breakpoints = {};
    this.suspension_stack = [];
    this.current_suspension = -1;
    this.eval_callback = null;
    this.suspension = null;
    this.output_callback = output_callback;
    this.step_mode = false;
    this.filename = filename;

    /**
     * Contains the last references of objects that will be retrieved by Skulpt's promises.
     *
     * This is required because the way Skulpt handles classes is so as it stores the reference of
     * the class before calling a method, and then retrieves it after. Since the codecast implementation
     * modify the references each time something is modified into an object, we need to get the updated
     * object, hence the last reference of that object when we want to get the result of the promise.
     *
     * Storing references of objects would disable the garbage collector to clear those objects when necessary,
     * so we also want to clean those references when there are not needed anymore.
     * Since it's possible to have a method of an object that calls another, or itself recursively, we store
     * the number of use of the reference, so we know when we can safely clear the reference.
     *
     * {
     *     UUID_OBJ_1 : {
     *         reference: The object 1,
     *         nb: The number of use
     *     },
     *     UUID_OBJ_2 : {
     *         reference: The object 2,
     *         nb: The number of use
     *     }
     * }
     *
     * When nb becomes 0, we can remove the reference as we don't need it anymore.
     */
    this._promise_references = {};
};

/**
 * Add a reference of an object that will be retrieved later using a Skulpt promise, and which
 * may later have a new reference.
 *
 * @param object The object.
 */
Sk.Debugger.prototype.registerPromiseReference = function (object) {
    if (object.hasOwnProperty('_uuid')) {
        if (!this._promise_references.hasOwnProperty(object._uuid)) {
            this._promise_references[object._uuid] = {
                reference: object,
                nb: 0
            }
        }

        this._promise_references[object._uuid].nb++;
    }
};

/**
 * Updates the promise reference of an object if it exists.
 *
 * @param object The new object reference.
 */
Sk.Debugger.prototype.updatePromiseReference = function (object) {
    if (object.hasOwnProperty('_uuid') && this._promise_references.hasOwnProperty(object._uuid)) {
        this._promise_references[object._uuid].reference = object;
    }
};

Sk.Debugger.prototype.print = function (txt) {
    if (this.output_callback != null) {
        this.output_callback.print(txt + "\n");
    }
};

Sk.Debugger.prototype.get_source_line = function (lineno) {
    if (this.output_callback != null) {
        return this.output_callback.get_source_line(lineno);
    }

    return "";
};

Sk.Debugger.prototype.move_up_the_stack = function () {
    this.current_suspension = Math.min(this.current_suspension + 1, this.suspension_stack.length - 1);
};

Sk.Debugger.prototype.move_down_the_stack = function () {
    this.current_suspension = Math.max(this.current_suspension - 1, 0);
};

Sk.Debugger.prototype.enable_step_mode = function () {
    this.step_mode = true;
};

Sk.Debugger.prototype.disable_step_mode = function () {
    this.step_mode = false;
};

Sk.Debugger.prototype.get_suspension_stack = function () {
    return this.suspension_stack;
};

Sk.Debugger.prototype.get_active_suspension = function () {
    if (this.suspension_stack.length === 0) {
        return null;
    }

    return this.suspension_stack[this.current_suspension];
};

Sk.Debugger.prototype.generate_breakpoint_key = function (filename, lineno, colno) {
    var key = filename + "-" + lineno;
    return key;
};

Sk.Debugger.prototype.check_breakpoints = function (filename, lineno, colno, globals, locals) {
    // debuggerLog('check_breakpoints', filename, lineno, colno, globals, locals);

    // If Step mode is enabled then ignore breakpoints since we will just break
    // at every line.
    return true;
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

Sk.Debugger.prototype.get_breakpoints_list = function () {
    return this.dbg_breakpoints;
};

Sk.Debugger.prototype.disable_breakpoint = function (filename, lineno, colno) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);

    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        this.dbg_breakpoints[key].enabled = false;
    }
};

Sk.Debugger.prototype.enable_breakpoint = function (filename, lineno, colno) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);

    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        this.dbg_breakpoints[key].enabled = true;
    }
};

Sk.Debugger.prototype.clear_breakpoint = function (filename, lineno, colno) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        delete this.dbg_breakpoints[key];
        return null;
    } else {
        return "Invalid breakpoint specified: " + filename + " line: " + lineno;
    }
};

Sk.Debugger.prototype.clear_all_breakpoints = function () {
    this.dbg_breakpoints = {};
    this.tmp_breakpoints = {};
};

Sk.Debugger.prototype.set_ignore_count = function (filename, lineno, colno, count) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    if (debuggerHasOwnProperty(this.dbg_breakpoints, key)) {
        var bp = this.dbg_breakpoints[key];
        bp.ignore_count = count;
    }
};

Sk.Debugger.prototype.set_condition = function (filename, lineno, colno, lhs, cond, rhs) {
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

Sk.Debugger.prototype.print_suspension_info = function (suspension) {
    var filename = suspension.$filename;
    var lineno = suspension.$lineno;
    var colno = suspension.$colno;
    if (DEBUG_DEBUGGER) {
        console.log("Hit Breakpoint at <" + filename + "> at line: " + lineno + " column: " + colno + "\n");
        console.log("----------------------------------------------------------------------------------\n");
        console.log(" ==> " + this.get_source_line(lineno - 1) + "\n");
        console.log("----------------------------------------------------------------------------------\n");
        console.log(suspension);
    }
};

Sk.Debugger.prototype.set_suspension = function (suspension) {
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

    this.print_suspension_info(suspension);
};

Sk.Debugger.prototype.add_breakpoint = function (filename, lineno, colno, temporary) {
    var key = this.generate_breakpoint_key(filename, lineno, colno);
    this.dbg_breakpoints[key] = new Sk.Breakpoint(filename, lineno, colno);
    if (temporary) {
        this.tmp_breakpoints[key] = true;
    }
};

Sk.Debugger.prototype.suspension_handler = function (susp) {
    return new Promise(function (resolve, reject) {
        try {
            resolve(susp.resume());
        } catch (e) {
            reject(e);
        }
    });
};

Sk.Debugger.prototype.resume = function (resolve, reject) {
    debuggerLog('resume');

    // Reset the suspension stack to the topmost
    this.current_suspension = this.suspension_stack.length - 1;

    if (this.suspension_stack.length === 0) {
        this.print("No running program");

        if (typeof resolve === 'function') {
            resolve();
        }
    } else {
        var promise = this.suspension_handler(this.get_active_suspension());
        var self = this;
        promise.then(function (value) {
            if (value.data && value.data.promise) {
                // If waiting for input, wait that it has resolved too before continuing.
                value.data.promise.then((inputValue) => {
                    // Skulpt is taking the value into the result parameter, so let's put it in !
                    value.data.result = inputValue;

                    self.success(value, resolve, reject);
                });
            } else if (value.hasOwnProperty('_uuid')) {
                /**
                 * In the case the value is a class, its reference may have changed since the
                 * creation of the Promise, which is done before the call to a method.
                 * We want to get its last reference.
                 */
                value = self._promise_references[value._uuid].reference;
                self._promise_references[value._uuid].nb--;
                if (self._promise_references[value._uuid].nb < 1) {
                    delete self._promise_references[value._uuid];
                }

                self.success(value, resolve, reject);
            } else {
                self.success(value, resolve, reject);
            }
        }, function (error) {
            /**
             * Note : We call resolve and not reject in case of error because resolve throws an Exception
             * and breaks the player which stops when there is an exception.
             */
            self.error(error, resolve);
        });
    }
};

Sk.Debugger.prototype.pop_suspension_stack = function () {
    this.suspension_stack.pop();
    this.current_suspension -= 1;
};

Sk.Debugger.prototype.success = function (r, resolve, reject) {
    debuggerLog('success', r, resolve);

    if (r instanceof Sk.misceval.Suspension) {
        debuggerLog('success suspension');
        this.set_suspension(r);
        if (this.output_callback != null) {
            this.output_callback._onStepSuccess(resolve);
        }
    } else {
        if (this.suspension_stack.length > 0) {
            // Current suspension needs to be popped of the stack
            this.pop_suspension_stack();

            if (this.suspension_stack.length === 0) {
                debuggerLog('success complete');

                this.print("Program execution complete");

                if (typeof resolve === 'function') {
                    resolve();
                }

                return;
            }

            debuggerLog('here we are');

            var parent_suspension = this.get_active_suspension();
            // The child has completed the execution. So override the child's resume
            // so we can continue the execution.
            parent_suspension.child.resume = function () {
                return r;
            };

            this.resume(resolve, reject);
        } else {
            debuggerLog('success complete 2');

            this.print("Program execution complete");

            if (typeof resolve === 'function') {
                resolve();
            }
        }
    }
};

Sk.Debugger.prototype.error = function (e, reject) {
    debuggerLog('error', e);

    if (this.output_callback != null) {
        this.output_callback._onStepError(e, reject);
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

    if (typeof reject === 'function') {
        reject();
    }
};

Sk.Debugger.prototype.asyncToPromise = function (suspendablefn, suspHandlers, debugger_obj) {
    return new Promise(function (resolve, reject) {
        try {
            var r = suspendablefn();

            (function handleResponse(r) {
                try {
                    while (r instanceof Sk.misceval.Suspension) {
                        debugger_obj.set_suspension(r);
                        return;
                    }

                    resolve(r);
                } catch (e) {
                    reject(e);
                }
            })(r);

        } catch (e) {
            reject(e);
        }
    });
};

Sk.Debugger.prototype.execute = function (suspendablefn, suspHandlers) {
    var r = suspendablefn();

    if (r instanceof Sk.misceval.Suspension) {
        this.suspensions.concat(r);
        this.eval_callback(r);
    }
};

Sk.exportSymbol("Sk.Debugger", Sk.Debugger);
