/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname157, $loadname160, $loadname160, $call162, $loadname163, $loadname166, $loadname166, $lattr167,
            $loadname170, $loadname170, $lattr171, $loadname172, $loadname173, $loadname172, $loadname173, $lattr174,
            $loadname172, $loadname173, $lattr174, $lattr175;
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
            $loadname157 = susp.$tmps.$loadname157;
            $loadname160 = susp.$tmps.$loadname160;
            $call162 = susp.$tmps.$call162;
            $loadname163 = susp.$tmps.$loadname163;
            $loadname166 = susp.$tmps.$loadname166;
            $lattr167 = susp.$tmps.$lattr167;
            $loadname170 = susp.$tmps.$loadname170;
            $lattr171 = susp.$tmps.$lattr171;
            $loadname172 = susp.$tmps.$loadname172;
            $loadname173 = susp.$tmps.$loadname173;
            $lattr174 = susp.$tmps.$lattr174;
            $lattr175 = susp.$tmps.$lattr175;
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
                "$loadname157": $loadname157,
                "$loadname160": $loadname160,
                "$call162": $call162,
                "$loadname163": $loadname163,
                "$loadname166": $loadname166,
                "$lattr167": $lattr167,
                "$loadname170": $loadname170,
                "$lattr171": $lattr171,
                "$loadname172": $loadname172,
                "$loadname173": $loadname173,
                "$lattr174": $lattr174,
                "$lattr175": $lattr175
            };
            return susp;
        };
        var $gbl = $forcegbl || {}, $blk = 0, $exc = [], $loc = $gbl, $cell = {}, $err = undefined;
        $loc.__file__ = new Sk.builtins.str('<stdin>.py');
        var $ret = undefined, $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope146.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
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
                        /*     4 */ // class Test1:
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('Test1');
                        $ret = Sk.misceval.buildClass($gbl, $scope147, 'Test1', [], $cell);
                        $loc.Test1 = window.currentPythonRunner.reportValue($ret, 'Test1');
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
                        /*    13 */ // class Test2:
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 5;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        $scope152.co_name = new Sk.builtins['str']('Test2');
                        $ret = Sk.misceval.buildClass($gbl, $scope152, 'Test2', [], $cell);
                        $loc.Test2 = window.currentPythonRunner.reportValue($ret, 'Test2');
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
                        /*    22 */ // test = Test1(2)
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 9;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $loadname157 = $loc.Test1 !== undefined ? $loc.Test1 : Sk.misceval.loadname('Test1', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname157, [$scope146.$const158]);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 9, 7);
                        }
                        var $call159 = $ret;
                        /*    29 */ //
                        /*    30 */ // line 9:
                        /*    31 */ // test = Test1(2)
                        /*    32 */ //        ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 9;
                        /*    35 */
                        $currColNo = 7;
                        /*    36 */
                        /*    37 */
                        $loc.test = window.currentPythonRunner.reportValue($call159, 'test');
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 10 --- */
                        /*    38 */ //
                        /*    39 */ // line 10:
                        /*    40 */ // test.a = Test2("test")
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 10;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $loadname160 = $loc.Test2 !== undefined ? $loc.Test2 : Sk.misceval.loadname('Test2', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname160, [$scope146.$const161]);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 9);
                        }
                        var $call162 = $ret;
                        /*    47 */ //
                        /*    48 */ // line 10:
                        /*    49 */ // test.a = Test2("test")
                        /*    50 */ //          ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 10;
                        /*    53 */
                        $currColNo = 9;
                        /*    54 */
                        /*    55 */
                        var $loadname163 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log($loadname163);
                        $loadname163 = $loadname163.clone();
                        console.log($loadname163);
                        $ret = Sk.abstr.sattr($loadname163, $scope146.$const164, $call162, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 11, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 11 --- */
                        /*    56 */ //
                        /*    57 */ // line 11:
                        /*    58 */ // test.a.c = 41
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 11;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $loadname166 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname166, $scope146.$const164, true);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        var $lattr167 = $ret;
                        console.log($lattr167);
                        $lattr167 = $lattr167.clone();
                        console.log($lattr167);
                        $ret = Sk.abstr.sattr($lattr167, $scope146.$const168, $scope146.$const165, true);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 12, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 0);
                            $susp.$blk = 11;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 12 --- */
                        /*    65 */ //
                        /*    66 */ // line 12:
                        /*    67 */ // test.a.c = 42
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 12;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        var $loadname170 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname170, $scope146.$const164, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        var $lattr171 = $ret;
                        console.log($lattr171);
                        $lattr171 = $lattr171.clone();
                        console.log($lattr171);
                        $ret = Sk.abstr.sattr($lattr171, $scope146.$const168, $scope146.$const169, true);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 13, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 0);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 13 --- */
                        /*    74 */ //
                        /*    75 */ // line 13:
                        /*    76 */ // print(test.a.c)
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 13;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $loadname172 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname173 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname173, $scope146.$const164, true);
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 6);
                        }
                        var $lattr174 = $ret;
                        $ret = Sk.abstr.gattr($lattr174, $scope146.$const168, true);
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 6);
                        }
                        var $lattr175 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname172, [$lattr175]);
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
                        }
                        var $call176 = $ret;
                        /*    83 */ //
                        /*    84 */ // line 13:
                        /*    85 */ // print(test.a.c)
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 13;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        if (Sk.breakpoints('<stdin>.py', 15, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 15, 0);
                            $susp.$blk = 18;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- debug breakpoint for line 15 --- */
                        /*    92 */ //
                        /*    93 */ // line 15:
                        /*    94 */ // pass
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 15;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
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
    $scope146.$const158 = new Sk.builtin.int_(2);
    $scope146.$const161 = new Sk.builtin.str('test');
    $scope146.$const164 = new Sk.builtin.str('a');
    $scope146.$const165 = new Sk.builtin.int_(41);
    $scope146.$const168 = new Sk.builtin.str('c');
    $scope146.$const169 = new Sk.builtin.int_(42);
    var $scope147 = (function $Test1$class_outer($globals, $locals, $cell) {
        var $gbl = $globals, $loc = $locals;
        $free = $globals;
        (function $Test1$_closure($cell) {
            var $blk = 0, $exc = [], $ret = undefined, $postfinally = undefined, $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0: /* --- class entry --- */
                            /*   101 */ //
                            /*   102 */ // line 2:
                            /*   103 */ //     def __init__(self, a):
                            /*   104 */ //     ^
                            /*   105 */ //
                            /*   106 */
                            $currLineNo = 2;
                            /*   107 */
                            $currColNo = 4;
                            /*   108 */
                            /*   109 */
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a'];
                            var $funcobj151 = new Sk.builtins['function']($scope148, $gbl);
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj151, '__init__');
                            return;
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
        }).call(null, $cell);
    });
    var $scope148 = (function $__init__149$(self, a) {
        var a, a, self, self;
        var $wakeFromSuspension = function () {
            var susp = $scope148.$wakingSuspension;
            $scope148.$wakingSuspension = undefined;
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
            self = susp.$tmps.self;
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
                $scope148.$wakingSuspension = susp;
                return $scope148();
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
            susp._name = '__init__';
            susp._argnames = ["self", "a"];
            susp._scopename = '$scope148';
            susp.$tmps = {"a": a, "self": self};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope148.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test1;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   110 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   111 */
                        if (Sk.breakpoints('<stdin>.py', 3, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 3 --- */
                        /*   112 */ //
                        /*   113 */ // line 3:
                        /*   114 */ //         self.a = a
                        /*   115 */ //         ^
                        /*   116 */ //
                        /*   117 */
                        $currLineNo = 3;
                        /*   118 */
                        $currColNo = 8;
                        /*   119 */
                        /*   120 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   121 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   122 */
                        console.log(self);
                        self = self.clone();
                        console.log(self);
                        $ret = Sk.abstr.sattr(self, $scope148.$const150, a, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 3, 8);
                        }
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
    $scope148.$const150 = new Sk.builtin.str('a');
    var $scope152 = (function $Test2$class_outer($globals, $locals, $cell) {
        var $gbl = $globals, $loc = $locals;
        $free = $globals;
        (function $Test2$_closure($cell) {
            var $blk = 0, $exc = [], $ret = undefined, $postfinally = undefined, $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0: /* --- class entry --- */
                            /*   123 */ //
                            /*   124 */ // line 6:
                            /*   125 */ //     def __init__(self, b):
                            /*   126 */ //     ^
                            /*   127 */ //
                            /*   128 */
                            $currLineNo = 6;
                            /*   129 */
                            $currColNo = 4;
                            /*   130 */
                            /*   131 */
                            $scope153.co_name = new Sk.builtins['str']('__init__');
                            $scope153.co_varnames = ['self', 'b'];
                            var $funcobj156 = new Sk.builtins['function']($scope153, $gbl);
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj156, '__init__');
                            return;
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
        }).call(null, $cell);
    });
    var $scope153 = (function $__init__154$(self, b) {
        var b, b, self, self;
        var $wakeFromSuspension = function () {
            var susp = $scope153.$wakingSuspension;
            $scope153.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            b = susp.$tmps.b;
            self = susp.$tmps.self;
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
                $scope153.$wakingSuspension = susp;
                return $scope153();
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
            susp._name = '__init__';
            susp._argnames = ["self", "b"];
            susp._scopename = '$scope153';
            susp.$tmps = {"b": b, "self": self};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope153.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test2;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   132 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   133 */
                        if (Sk.breakpoints('<stdin>.py', 7, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 7 --- */
                        /*   134 */ //
                        /*   135 */ // line 7:
                        /*   136 */ //         self.b = b
                        /*   137 */ //         ^
                        /*   138 */ //
                        /*   139 */
                        $currLineNo = 7;
                        /*   140 */
                        $currColNo = 8;
                        /*   141 */
                        /*   142 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   143 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   144 */
                        console.log(self);
                        self = self.clone();
                        console.log(self);
                        $ret = Sk.abstr.sattr(self, $scope153.$const155, b, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 7, 8);
                        }
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
    $scope153.$const155 = new Sk.builtin.str('b');
    /*   145 */
    return $scope146;
}();