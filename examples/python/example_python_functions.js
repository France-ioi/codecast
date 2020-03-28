/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname158, $loadname158, $loadname159, $loadname160, $loadname159, $loadname160, $call161, $loadname159,
            $loadname160, $call161;
        var $wakeFromSuspension = function () {
            var susp = $scope146.$wakingSuspension;
            $scope146.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            $loadname158 = susp.$tmps.$loadname158;
            $loadname159 = susp.$tmps.$loadname159;
            $loadname160 = susp.$tmps.$loadname160;
            $call161 = susp.$tmps.$call161;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '<stdin>.py'});
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                } else {
                    throw err;
                }
            }
        };
        var $saveSuspension = function ($child, $filename, $lineno, $colno) {
            var susp = new Sk.misceval.Suspension();
            susp.child = $child;
            susp.resume = function () {
                $scope146.$wakingSuspension = susp;
                return $scope146();
            };
            susp.data = susp.child.data;
            susp.$blk = $blk;
            susp.$loc = $loc;
            susp.$gbl = $gbl;
            susp.$exc = $exc;
            susp.$err = $err;
            susp.$postfinally = $postfinally;
            susp.$filename = $filename;
            susp.$lineno = $lineno;
            susp.$colno = $colno;
            susp.optional = susp.child.optional;
            susp._name = '<module>';
            susp._localNames = [];
            susp.$tmps = {
                "$loadname158": $loadname158,
                "$loadname159": $loadname159,
                "$loadname160": $loadname160,
                "$call161": $call161
            };
            return susp;
        };
        var $gbl = $forcegbl || {}, $blk = 0, $exc = [], $loc = $gbl, $cell = {}, $err = undefined;
        $loc.__file__ = new Sk.builtins.str('<stdin>.py');
        var $ret = undefined, $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope146.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        }
        if (Sk.retainGlobals) {
            if (Sk.globals) {
                $gbl = Sk.globals;
                Sk.globals = $gbl;
                $loc = $gbl;
            }
            if (Sk.globals) {
                $gbl = Sk.globals;
                Sk.globals = $gbl;
                $loc = $gbl;
                $loc.__file__ = new Sk.builtins.str('<stdin>.py');
            } else {
                Sk.globals = $gbl;
            }
        } else {
            Sk.globals = $gbl;
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- module entry --- */
                        if (Sk.breakpoints('<stdin>.py', 1, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 1, 0);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 1 --- */
                        /*     2 */ //
                        /*     3 */ // line 1:
                        /*     4 */ // def lother(test, v):
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('lother');
                        $scope147.co_varnames = ['test', 'v'];
                        var $funcobj150 = new Sk.builtins['function']($scope147, $gbl);
                        console.log('$funcobj150 =', $funcobj150);
                        $loc.lother = window.currentPythonRunner.reportValue($funcobj150, '$loc.lother');
                        if (Sk.breakpoints('<stdin>.py', 4, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 4 --- */
                        /*    11 */ //
                        /*    12 */ // line 4:
                        /*    13 */ // def bilo(param):
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 4;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        $scope151.co_name = new Sk.builtins['str']('bilo');
                        $scope151.co_varnames = ['param'];
                        var $funcobj155 = new Sk.builtins['function']($scope151, $gbl);
                        console.log('$funcobj155 =', $funcobj155);
                        $loc.bilo = window.currentPythonRunner.reportValue($funcobj155, '$loc.bilo');
                        if (Sk.breakpoints('<stdin>.py', 8, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 8 --- */
                        /*    20 */ //
                        /*    21 */ // line 8:
                        /*    22 */ // a = 'Teest'
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 8;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        $loc.a = window.currentPythonRunner.reportValue($scope146.$const156, '$loc.a');
                        if (Sk.breakpoints('<stdin>.py', 9, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 9 --- */
                        /*    29 */ //
                        /*    30 */ // line 9:
                        /*    31 */ // g = 22
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 9;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        $loc.g = window.currentPythonRunner.reportValue($scope146.$const157, '$loc.g');
                        if (Sk.breakpoints('<stdin>.py', 11, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 11 --- */
                        /*    38 */ //
                        /*    39 */ // line 11:
                        /*    40 */ // print(a)
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 11;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $loadname158 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;console.log('$loadname158 =', $loadname158);
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($loadname158).v);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 12, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 12 --- */
                        /*    47 */ //
                        /*    48 */ // line 12:
                        /*    49 */ // print(bilo(a))
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 12;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        var $loadname159 = $loc.bilo !== undefined ? $loc.bilo : Sk.misceval.loadname('bilo', $gbl);
                        ;console.log('$loadname159 =', $loadname159);
                        var $loadname160 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;console.log('$loadname160 =', $loadname160);
                        console.log('ENTER callsimOrSuspendArray', '$loadname159', $loadname159, [$loadname160]);
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname159, [$loadname160]);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 12, 6);
                        }
                        var $call161 = $ret;
                        console.log('$call161 =', $call161);
                        /*    56 */ //
                        /*    57 */ // line 12:
                        /*    58 */ // print(bilo(a))
                        /*    59 */ //       ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 12;
                        /*    62 */
                        $currColNo = 6;
                        /*    63 */
                        /*    64 */
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($call161).v);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        console.log('cmod ast return');
                        return $loc;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '<stdin>.py'});
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                    continue;
                } else {
                    throw err;
                }
            }
        }
    });
    $scope146.$const156 = new Sk.builtin.str('Teest');
    $scope146.$const157 = new Sk.builtin.int_(22);
    var $scope147 = (function $lother148$(test, v) {
        var test, v;
        var $wakeFromSuspension = function () {
            var susp = $scope147.$wakingSuspension;
            $scope147.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            test = susp.$tmps.test;
            v = susp.$tmps.v;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '<stdin>.py'});
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                } else {
                    throw err;
                }
            }
        };
        var $saveSuspension = function ($child, $filename, $lineno, $colno) {
            var susp = new Sk.misceval.Suspension();
            susp.child = $child;
            susp.resume = function () {
                $scope147.$wakingSuspension = susp;
                return $scope147();
            };
            susp.data = susp.child.data;
            susp.$blk = $blk;
            susp.$loc = $loc;
            susp.$gbl = $gbl;
            susp.$exc = $exc;
            susp.$err = $err;
            susp.$postfinally = $postfinally;
            susp.$filename = $filename;
            susp.$lineno = $lineno;
            susp.$colno = $colno;
            susp.optional = susp.child.optional;
            susp._name = 'lother';
            susp._localNames = ["test", "v"];
            susp.$tmps = {"test": test, "v": v};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope147.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (test === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'test\' referenced before assignment');
                        }
                        /*    65 */
                        if (v === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'v\' referenced before assignment');
                        }
                        /*    66 */
                        if (Sk.breakpoints('<stdin>.py', 2, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 2, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 2 --- */
                        /*    67 */ //
                        /*    68 */ // line 2:
                        /*    69 */ //     return 4
                        /*    70 */ //     ^
                        /*    71 */ //
                        /*    72 */
                        $currLineNo = 2;
                        /*    73 */
                        $currColNo = 4;
                        /*    74 */
                        /*    75 */
                        console.log('astnode return');
                        return $scope147.$const149;
                        return Sk.builtin.none.none$;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '<stdin>.py'});
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                    continue;
                } else {
                    throw err;
                }
            }
        }
    });
    $scope147.$const149 = new Sk.builtin.int_(4);
    var $scope151 = (function $bilo152$(param) {
        var d; /* locals */
        var d, d, param, param;
        var $wakeFromSuspension = function () {
            var susp = $scope151.$wakingSuspension;
            $scope151.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            d = susp.$tmps.d;
            param = susp.$tmps.param;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '<stdin>.py'});
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                } else {
                    throw err;
                }
            }
        };
        var $saveSuspension = function ($child, $filename, $lineno, $colno) {
            var susp = new Sk.misceval.Suspension();
            susp.child = $child;
            susp.resume = function () {
                $scope151.$wakingSuspension = susp;
                return $scope151();
            };
            susp.data = susp.child.data;
            susp.$blk = $blk;
            susp.$loc = $loc;
            susp.$gbl = $gbl;
            susp.$exc = $exc;
            susp.$err = $err;
            susp.$postfinally = $postfinally;
            susp.$filename = $filename;
            susp.$lineno = $lineno;
            susp.$colno = $colno;
            susp.optional = susp.child.optional;
            susp._name = 'bilo';
            susp._localNames = ["d", "param"];
            susp.$tmps = {"d": d, "param": param};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope151.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (param === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'param\' referenced before assignment');
                        }
                        /*    76 */
                        if (Sk.breakpoints('<stdin>.py', 5, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 5 --- */
                        /*    77 */ //
                        /*    78 */ // line 5:
                        /*    79 */ //     d = 32
                        /*    80 */ //     ^
                        /*    81 */ //
                        /*    82 */
                        $currLineNo = 5;
                        /*    83 */
                        $currColNo = 4;
                        /*    84 */
                        /*    85 */
                        d = window.currentPythonRunner.reportValue($scope151.$const153, 'd');
                        if (Sk.breakpoints('<stdin>.py', 6, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 4);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 6 --- */
                        /*    86 */ //
                        /*    87 */ // line 6:
                        /*    88 */ //     return d + param
                        /*    89 */ //     ^
                        /*    90 */ //
                        /*    91 */
                        $currLineNo = 6;
                        /*    92 */
                        $currColNo = 4;
                        /*    93 */
                        /*    94 */
                        if (d === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'d\' referenced before assignment');
                        }
                        /*    95 */
                        if (param === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'param\' referenced before assignment');
                        }
                        /*    96 */
                        var $binop154 = Sk.abstr.numberBinOp(d, param, 'Add');
                        console.log('$binop154 =', $binop154);
                        console.log('astnode return');
                        return $binop154;
                        return Sk.builtin.none.none$;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: '<stdin>.py'});
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                    continue;
                } else {
                    throw err;
                }
            }
        }
    });
    $scope151.$const153 = new Sk.builtin.int_(32);
    /*    97 */
    return $scope146;
}();