/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname160, $loadname161, $loadname163, $loadname164, $loadname166, $loadname166;
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
            $loadname160 = susp.$tmps.$loadname160;
            $loadname161 = susp.$tmps.$loadname161;
            $loadname163 = susp.$tmps.$loadname163;
            $loadname164 = susp.$tmps.$loadname164;
            $loadname166 = susp.$tmps.$loadname166;
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
            susp._argnames = [];
            susp._scopename = '$scope146';
            susp.$tmps = {
                "$loadname160": $loadname160,
                "$loadname161": $loadname161,
                "$loadname163": $loadname163,
                "$loadname164": $loadname164,
                "$loadname166": $loadname166
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
                        /*     4 */ // def ret(a):
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('ret');
                        $scope147.co_varnames = ['a'];
                        var $funcobj150 = new Sk.builtins['function']($scope147, $gbl);
                        $loc.ret = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy($loc.ret, $funcobj150), '$loc.ret');
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 5 --- */
                        /*    11 */ //
                        /*    12 */ // line 5:
                        /*    13 */ // def test(a):
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 5;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        $scope151.co_name = new Sk.builtins['str']('test');
                        $scope151.co_varnames = ['a'];
                        var $funcobj157 = new Sk.builtins['function']($scope151, $gbl);
                        $loc.test = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy($loc.test, $funcobj157), '$loc.test');
                        if (Sk.breakpoints('<stdin>.py', 9, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 9 --- */
                        /*    20 */ //
                        /*    21 */ // line 9:
                        /*    22 */ // c = 'a'
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 9;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        $loc.c = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy($loc.c, $scope146.$const158), '$loc.c');
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 10 --- */
                        /*    29 */ //
                        /*    30 */ // line 10:
                        /*    31 */ // c = 'b'
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 10;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        $loc.c = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy($loc.c, $scope146.$const159), '$loc.c');
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
                        /*    40 */ // d = ret(c)
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 11;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $loadname160 = $loc.ret !== undefined ? $loc.ret : Sk.misceval.loadname('ret', $gbl);
                        ;var $loadname161 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname160, [$loadname161]);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 11, 4);
                        }
                        var $call162 = $ret;
                        /*    47 */ //
                        /*    48 */ // line 11:
                        /*    49 */ // d = ret(c)
                        /*    50 */ //     ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 11;
                        /*    53 */
                        $currColNo = 4;
                        /*    54 */
                        /*    55 */
                        $loc.d = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy($loc.d, $call162), '$loc.d');
                        if (Sk.breakpoints('<stdin>.py', 12, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 12 --- */
                        /*    56 */ //
                        /*    57 */ // line 12:
                        /*    58 */ // e = test(d)
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 12;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $loadname163 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;var $loadname164 = $loc.d !== undefined ? $loc.d : Sk.misceval.loadname('d', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname163, [$loadname164]);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 12, 4);
                        }
                        var $call165 = $ret;
                        /*    65 */ //
                        /*    66 */ // line 12:
                        /*    67 */ // e = test(d)
                        /*    68 */ //     ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 12;
                        /*    71 */
                        $currColNo = 4;
                        /*    72 */
                        /*    73 */
                        $loc.e = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy($loc.e, $call165), '$loc.e');
                        if (Sk.breakpoints('<stdin>.py', 13, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 0);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 13 --- */
                        /*    74 */ //
                        /*    75 */ // line 13:
                        /*    76 */ // print(e)
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 13;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $loadname166 = $loc.e !== undefined ? $loc.e : Sk.misceval.loadname('e', $gbl);
                        ;$ret = Sk.misceval.print_(new Sk.builtins['str']($loadname166).v);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
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
    $scope146.$const158 = new Sk.builtin.str('a');
    $scope146.$const159 = new Sk.builtin.str('b');
    var $scope147 = (function $ret148$(a) {
        var b; /* locals */
        var a, a, a, b, b;
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
            a = susp.$tmps.a;
            b = susp.$tmps.b;
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
            susp._name = 'ret';
            susp._argnames = ["a"];
            susp._scopename = '$scope147';
            susp.$tmps = {"a": a, "b": b};
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
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    83 */
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
                        /*    84 */ //
                        /*    85 */ // line 2:
                        /*    86 */ //     b = a + a
                        /*    87 */ //     ^
                        /*    88 */ //
                        /*    89 */
                        $currLineNo = 2;
                        /*    90 */
                        $currColNo = 4;
                        /*    91 */
                        /*    92 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    93 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    94 */
                        var $binop149 = Sk.abstr.numberBinOp(a, a, 'Add');
                        b = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy(b, $binop149), 'b');
                        if (Sk.breakpoints('<stdin>.py', 3, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 4);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 3 --- */
                        /*    95 */ //
                        /*    96 */ // line 3:
                        /*    97 */ //     return b
                        /*    98 */ //     ^
                        /*    99 */ //
                        /*   100 */
                        $currLineNo = 3;
                        /*   101 */
                        $currColNo = 4;
                        /*   102 */
                        /*   103 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   104 */
                        console.log('astnode return');
                        return b;
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
    var $scope151 = (function $test152$(a) {
        var v; /* locals */
        var a, a, v, v, $loadgbl153;
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
            a = susp.$tmps.a;
            v = susp.$tmps.v;
            $loadgbl153 = susp.$tmps.$loadgbl153;
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
            susp._name = 'test';
            susp._argnames = ["a"];
            susp._scopename = '$scope151';
            susp.$tmps = {"a": a, "v": v, "$loadgbl153": $loadgbl153};
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
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   105 */
                        if (Sk.breakpoints('<stdin>.py', 6, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 6 --- */
                        /*   106 */ //
                        /*   107 */ // line 6:
                        /*   108 */ //     v = ret(a)
                        /*   109 */ //     ^
                        /*   110 */ //
                        /*   111 */
                        $currLineNo = 6;
                        /*   112 */
                        $currColNo = 4;
                        /*   113 */
                        /*   114 */
                        var $loadgbl153 = Sk.misceval.loadname('ret', $gbl);
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   115 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl153, [a]);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 6, 8);
                        }
                        var $call154 = $ret;
                        /*   116 */ //
                        /*   117 */ // line 6:
                        /*   118 */ //     v = ret(a)
                        /*   119 */ //         ^
                        /*   120 */ //
                        /*   121 */
                        $currLineNo = 6;
                        /*   122 */
                        $currColNo = 8;
                        /*   123 */
                        /*   124 */
                        v = window.currentPythonRunner.reportValue(Sk.builtin.persistentCopy(v, $call154), 'v');
                        if (Sk.breakpoints('<stdin>.py', 7, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 4);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 7 --- */
                        /*   125 */ //
                        /*   126 */ // line 7:
                        /*   127 */ //     return v + 'c'
                        /*   128 */ //     ^
                        /*   129 */ //
                        /*   130 */
                        $currLineNo = 7;
                        /*   131 */
                        $currColNo = 4;
                        /*   132 */
                        /*   133 */
                        if (v === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'v\' referenced before assignment');
                        }
                        /*   134 */
                        var $binop156 = Sk.abstr.numberBinOp(v, $scope151.$const155, 'Add');
                        console.log('astnode return');
                        return $binop156;
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
    $scope151.$const155 = new Sk.builtin.str('c');
    /*   135 */
    return $scope146;
}();