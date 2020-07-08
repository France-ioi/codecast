/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname169, $loadname181, $loadname183, $loadname185, $loadname186, $loadname185, $loadname186, $lattr188,
            $loadname185, $loadname186, $lattr188, $call189, $loadname191, $loadname192, $loadname191, $loadname192,
            $lattr194, $loadname191, $loadname192, $lattr194, $call195;
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
            $loadname169 = susp.$tmps.$loadname169;
            $loadname181 = susp.$tmps.$loadname181;
            $loadname183 = susp.$tmps.$loadname183;
            $loadname185 = susp.$tmps.$loadname185;
            $loadname186 = susp.$tmps.$loadname186;
            $lattr188 = susp.$tmps.$lattr188;
            $call189 = susp.$tmps.$call189;
            $loadname191 = susp.$tmps.$loadname191;
            $loadname192 = susp.$tmps.$loadname192;
            $lattr194 = susp.$tmps.$lattr194;
            $call195 = susp.$tmps.$call195;
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
                "$loadname169": $loadname169,
                "$loadname181": $loadname181,
                "$loadname183": $loadname183,
                "$loadname185": $loadname185,
                "$loadname186": $loadname186,
                "$lattr188": $lattr188,
                "$call189": $call189,
                "$loadname191": $loadname191,
                "$loadname192": $loadname192,
                "$lattr194": $lattr194,
                "$call195": $call195
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
                        /*     4 */ // class Test:
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('Test');
                        $ret = Sk.misceval.buildClass($gbl, $scope147, 'Test', [], $cell);
                        $loc.Test = window.currentPythonRunner.reportValue($ret, 'Test');
                        if (Sk.breakpoints('<stdin>.py', 14, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 14 --- */
                        /*    11 */ //
                        /*    12 */ // line 14:
                        /*    13 */ // test = Test(41, 1, "Bonjour")
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 14;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loadname169 = $loc.Test !== undefined ? $loc.Test : Sk.misceval.loadname('Test', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname169, [$scope146.$const170, $scope146.$const171, $scope146.$const172]);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 7);
                        }
                        var $call173 = $ret;
                        /*    20 */ //
                        /*    21 */ // line 14:
                        /*    22 */ // test = Test(41, 1, "Bonjour")
                        /*    23 */ //        ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 14;
                        /*    26 */
                        $currColNo = 7;
                        /*    27 */
                        /*    28 */
                        $loc.test = window.currentPythonRunner.reportValue($call173, 'test');
                        if (Sk.breakpoints('<stdin>.py', 15, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 15, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 15 --- */
                        /*    29 */ //
                        /*    30 */ // line 15:
                        /*    31 */ // i = 0
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 15;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const174, 'i');
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 16 --- */
                        /*    38 */ //
                        /*    39 */ // line 16:
                        /*    40 */ // i = 1
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 16;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const171, 'i');
                        if (Sk.breakpoints('<stdin>.py', 17, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 17, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 17 --- */
                        /*    47 */ //
                        /*    48 */ // line 17:
                        /*    49 */ // tel = {'name': "John", 'number': "0123456789"}
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 17;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        var $loaddict179 = new Sk.builtins['dict']([$scope146.$const176, $scope146.$const175, $scope146.$const178, $scope146.$const177]);
                        $loc.tel = window.currentPythonRunner.reportValue($loaddict179, 'tel');
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 18 --- */
                        /*    56 */ //
                        /*    57 */ // line 18:
                        /*    58 */ // tel['number'] = "0987654321"
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 18;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $loadname181 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$loadname181 = $loadname181.clone();
                        $ret = Sk.abstr.objectSetItem($loadname181, $scope146.$const178, $scope146.$const180, true);
                        $loc.tel = $loadname181;
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 19, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 19, 0);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 19 --- */
                        /*    65 */ //
                        /*    66 */ // line 19:
                        /*    67 */ // test.b = 10
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 19;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        var $loadname183 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.sattr($loadname183, $scope146.$const184, $scope146.$const182, true);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 20, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 20, 0);
                            $susp.$blk = 11;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 20 --- */
                        /*    74 */ //
                        /*    75 */ // line 20:
                        /*    76 */ // print(test.sum())
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 20;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $loadname185 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname186 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname186, $scope146.$const187, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 20, 6);
                        }
                        var $lattr188 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr188);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 20, 6);
                        }
                        var $call189 = $ret;
                        /*    83 */ //
                        /*    84 */ // line 20:
                        /*    85 */ // print(test.sum())
                        /*    86 */ //       ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 20;
                        /*    89 */
                        $currColNo = 6;
                        /*    90 */
                        /*    91 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname185, [$call189]);
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 20, 0);
                        }
                        var $call190 = $ret;
                        /*    92 */ //
                        /*    93 */ // line 20:
                        /*    94 */ // print(test.sum())
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 20;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        if (Sk.breakpoints('<stdin>.py', 21, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 21, 0);
                            $susp.$blk = 15;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- debug breakpoint for line 21 --- */
                        /*   101 */ //
                        /*   102 */ // line 21:
                        /*   103 */ // print(test.getM())
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 21;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        var $loadname191 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname192 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname192, $scope146.$const193, true);
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 21, 6);
                        }
                        var $lattr194 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr194);
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 21, 6);
                        }
                        var $call195 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 21:
                        /*   112 */ // print(test.getM())
                        /*   113 */ //       ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 21;
                        /*   116 */
                        $currColNo = 6;
                        /*   117 */
                        /*   118 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname191, [$call195]);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 21, 0);
                        }
                        var $call196 = $ret;
                        /*   119 */ //
                        /*   120 */ // line 21:
                        /*   121 */ // print(test.getM())
                        /*   122 */ // ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 21;
                        /*   125 */
                        $currColNo = 0;
                        /*   126 */
                        /*   127 */
                        if (Sk.breakpoints('<stdin>.py', 23, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 23, 0);
                            $susp.$blk = 19;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- debug breakpoint for line 23 --- */
                        /*   128 */ //
                        /*   129 */ // line 23:
                        /*   130 */ // pass
                        /*   131 */ // ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 23;
                        /*   134 */
                        $currColNo = 0;
                        /*   135 */
                        /*   136 */
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
    $scope146.$const170 = new Sk.builtin.int_(41);
    $scope146.$const171 = new Sk.builtin.int_(1);
    $scope146.$const172 = new Sk.builtin.str('Bonjour');
    $scope146.$const174 = new Sk.builtin.int_(0);
    $scope146.$const175 = new Sk.builtin.str('John');
    $scope146.$const176 = new Sk.builtin.str('name');
    $scope146.$const177 = new Sk.builtin.str('0123456789');
    $scope146.$const178 = new Sk.builtin.str('number');
    $scope146.$const180 = new Sk.builtin.str('0987654321');
    $scope146.$const182 = new Sk.builtin.int_(10);
    $scope146.$const184 = new Sk.builtin.str('b');
    $scope146.$const187 = new Sk.builtin.str('sum');
    $scope146.$const193 = new Sk.builtin.str('getM');
    var $scope147 = (function $Test$class_outer($globals, $locals, $cell) {
        var $gbl = $globals, $loc = $locals;
        $free = $globals;
        (function $Test$_closure($cell) {
            var $blk = 0, $exc = [], $ret = undefined, $postfinally = undefined, $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0: /* --- class entry --- */
                            /*   137 */ //
                            /*   138 */ // line 2:
                            /*   139 */ //     def __init__(self, a, b, m):
                            /*   140 */ //     ^
                            /*   141 */ //
                            /*   142 */
                            $currLineNo = 2;
                            /*   143 */
                            $currColNo = 4;
                            /*   144 */
                            /*   145 */
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a', 'b', 'm'];
                            var $funcobj153 = new Sk.builtins['function']($scope148, $gbl);
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj153, '__init__');
                            /*   146 */ //
                            /*   147 */ // line 7:
                            /*   148 */ //     def sum(self):
                            /*   149 */ //     ^
                            /*   150 */ //
                            /*   151 */
                            $currLineNo = 7;
                            /*   152 */
                            $currColNo = 4;
                            /*   153 */
                            /*   154 */
                            $scope154.co_name = new Sk.builtins['str']('sum');
                            $scope154.co_varnames = ['self'];
                            var $funcobj163 = new Sk.builtins['function']($scope154, $gbl);
                            $loc.sum = window.currentPythonRunner.reportValue($funcobj163, 'sum');
                            /*   155 */ //
                            /*   156 */ // line 11:
                            /*   157 */ //     def getM(self):
                            /*   158 */ //     ^
                            /*   159 */ //
                            /*   160 */
                            $currLineNo = 11;
                            /*   161 */
                            $currColNo = 4;
                            /*   162 */
                            /*   163 */
                            $scope164.co_name = new Sk.builtins['str']('getM');
                            $scope164.co_varnames = ['self'];
                            var $funcobj168 = new Sk.builtins['function']($scope164, $gbl);
                            $loc.getM = window.currentPythonRunner.reportValue($funcobj168, 'getM');
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
    var $scope148 = (function $__init__149$(self, a, b, m) {
        var a, a, b, b, m, m, self, self, self, self;
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
            b = susp.$tmps.b;
            m = susp.$tmps.m;
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
            susp._argnames = ["self", "a", "b", "m"];
            susp._scopename = '$scope148';
            susp.$tmps = {"a": a, "b": b, "m": m, "self": self};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope148.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   164 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   165 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   166 */
                        if (m === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'m\' referenced before assignment');
                        }
                        /*   167 */
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
                        /*   168 */ //
                        /*   169 */ // line 3:
                        /*   170 */ //         self.a = a
                        /*   171 */ //         ^
                        /*   172 */ //
                        /*   173 */
                        $currLineNo = 3;
                        /*   174 */
                        $currColNo = 8;
                        /*   175 */
                        /*   176 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   177 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   178 */
                        $ret = Sk.abstr.sattr(self, $scope148.$const150, a, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 3, 8);
                        }
                        if (Sk.breakpoints('<stdin>.py', 4, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 8);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 4 --- */
                        /*   179 */ //
                        /*   180 */ // line 4:
                        /*   181 */ //         self.b = b
                        /*   182 */ //         ^
                        /*   183 */ //
                        /*   184 */
                        $currLineNo = 4;
                        /*   185 */
                        $currColNo = 8;
                        /*   186 */
                        /*   187 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   188 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   189 */
                        $ret = Sk.abstr.sattr(self, $scope148.$const151, b, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 4, 8);
                        }
                        if (Sk.breakpoints('<stdin>.py', 5, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 8);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 5 --- */
                        /*   190 */ //
                        /*   191 */ // line 5:
                        /*   192 */ //         self.m = m
                        /*   193 */ //         ^
                        /*   194 */ //
                        /*   195 */
                        $currLineNo = 5;
                        /*   196 */
                        $currColNo = 8;
                        /*   197 */
                        /*   198 */
                        if (m === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'m\' referenced before assignment');
                        }
                        /*   199 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   200 */
                        $ret = Sk.abstr.sattr(self, $scope148.$const152, m, true);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 5, 8);
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
    $scope148.$const151 = new Sk.builtin.str('b');
    $scope148.$const152 = new Sk.builtin.str('m');
    var $scope154 = (function $sum155$(self) {
        var self, self, self, self, $lattr159;
        var $wakeFromSuspension = function () {
            var susp = $scope154.$wakingSuspension;
            $scope154.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            self = susp.$tmps.self;
            $lattr159 = susp.$tmps.$lattr159;
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
                $scope154.$wakingSuspension = susp;
                return $scope154();
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
            susp._name = 'sum';
            susp._argnames = ["self"];
            susp._scopename = '$scope154';
            susp.$tmps = {"self": self, "$lattr159": $lattr159};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope154.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   201 */
                        if (Sk.breakpoints('<stdin>.py', 8, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 8 --- */
                        /*   202 */ //
                        /*   203 */ // line 8:
                        /*   204 */ //         self.m = "newmessage"
                        /*   205 */ //         ^
                        /*   206 */ //
                        /*   207 */
                        $currLineNo = 8;
                        /*   208 */
                        $currColNo = 8;
                        /*   209 */
                        /*   210 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   211 */
                        $ret = Sk.abstr.sattr(self, $scope154.$const157, $scope154.$const156, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 8, 8);
                        }
                        if (Sk.breakpoints('<stdin>.py', 9, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 8);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 9 --- */
                        /*   212 */ //
                        /*   213 */ // line 9:
                        /*   214 */ //         return self.a + self.b
                        /*   215 */ //         ^
                        /*   216 */ //
                        /*   217 */
                        $currLineNo = 9;
                        /*   218 */
                        $currColNo = 8;
                        /*   219 */
                        /*   220 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   221 */
                        $ret = Sk.abstr.gattr(self, $scope154.$const158, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 9, 15);
                        }
                        var $lattr159 = $ret;
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   222 */
                        $ret = Sk.abstr.gattr(self, $scope154.$const160, true);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 9, 24);
                        }
                        var $lattr161 = $ret;
                        var $binop162 = Sk.abstr.numberBinOp($lattr159, $lattr161, 'Add');
                        return $binop162;
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
    $scope154.$const156 = new Sk.builtin.str('newmessage');
    $scope154.$const157 = new Sk.builtin.str('m');
    $scope154.$const158 = new Sk.builtin.str('a');
    $scope154.$const160 = new Sk.builtin.str('b');
    var $scope164 = (function $getM165$(self) {
        var self, self;
        var $wakeFromSuspension = function () {
            var susp = $scope164.$wakingSuspension;
            $scope164.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
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
                $scope164.$wakingSuspension = susp;
                return $scope164();
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
            susp._name = 'getM';
            susp._argnames = ["self"];
            susp._scopename = '$scope164';
            susp.$tmps = {"self": self};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope164.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   223 */
                        if (Sk.breakpoints('<stdin>.py', 12, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 12 --- */
                        /*   224 */ //
                        /*   225 */ // line 12:
                        /*   226 */ //         return self.m
                        /*   227 */ //         ^
                        /*   228 */ //
                        /*   229 */
                        $currLineNo = 12;
                        /*   230 */
                        $currColNo = 8;
                        /*   231 */
                        /*   232 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   233 */
                        $ret = Sk.abstr.gattr(self, $scope164.$const166, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 15);
                        }
                        var $lattr167 = $ret;
                        return $lattr167;
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
    $scope164.$const166 = new Sk.builtin.str('m');
    /*   234 */
    return $scope146;
}();