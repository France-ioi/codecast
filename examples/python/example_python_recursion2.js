/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname165, $loadname165, $call167, $loadname165, $call167;
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
            $loadname165 = susp.$tmps.$loadname165;
            $call167 = susp.$tmps.$call167;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
            susp.$tmps = {
                "$loadname165": $loadname165,
                "$call167": $call167
            };
            return susp;
        };
        var $gbl = $forcegbl || {},
            $blk = 0,
            $exc = [],
            $loc = $gbl,
            $cell = {},
            $err = undefined;
        $loc.__file__ = new Sk.builtins.str('<stdin>.py');
        var $ret = undefined,
            $postfinally = undefined,
            $currLineNo = undefined,
            $currColNo = undefined;
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
                    case 0:
                        /* --- module entry --- */
                        if (Sk.breakpoints('<stdin>.py', 1, 0)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 1, 0);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1; /* allowing case fallthrough */
                    case 1:
                        /* --- debug breakpoint for line 1 --- */
                        /*     2 */ //
                        /*     3 */ // line 1:
                        /*     4 */ // def plop(a, b):
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('plop');
                        $scope147.co_varnames = ['a', 'b'];
                        var $funcobj164 = new Sk.builtins['function']($scope147, $gbl);
                        console.log('$funcobj164 =', $funcobj164);
                        $loc.plop = window.currentPythonRunner.reportValue($funcobj164, '$loc.plop');
                        if (Sk.breakpoints('<stdin>.py', 8, 0)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 8, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2; /* allowing case fallthrough */
                    case 2:
                        /* --- debug breakpoint for line 8 --- */
                        /*    11 */ //
                        /*    12 */ // line 8:
                        /*    13 */ // print plop(3, 3)
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 8;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loadname165 = $loc.plop !== undefined ? $loc.plop : Sk.misceval.loadname('plop', $gbl);
                        ;
                        console.log('$loadname165 =', $loadname165);
                        console.log('ENTER callsimOrSuspendArray', '$loadname165', $loadname165, [$scope146.$const166, $scope146.$const166]);
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname165, [$scope146.$const166, $scope146.$const166]);
                        $blk = 3; /* allowing case fallthrough */
                    case 3:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 8, 6);
                        }
                        var $call167 = $ret;
                        console.log('$call167 =', $call167);
                        /*    20 */ //
                        /*    21 */ // line 8:
                        /*    22 */ // print plop(3, 3)
                        /*    23 */ //       ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 8;
                        /*    26 */
                        $currColNo = 6;
                        /*    27 */
                        /*    28 */
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($call167).v);
                        $blk = 4; /* allowing case fallthrough */
                    case 4:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 8, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 5; /* allowing case fallthrough */
                    case 5:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 8, 0);
                        }
                        console.log('cmod ast return');
                        return $loc;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
    $scope146.$const166 = new Sk.builtin.int_(3);
    var $scope147 = (function $plop148$(a, b) {
        var a, a, a, a, a, b, b, b, $compareres149, $compareres153, $loadgbl156, $binop158, $loadgbl160, $binop161;
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
            $compareres149 = susp.$tmps.$compareres149;
            $compareres153 = susp.$tmps.$compareres153;
            $loadgbl156 = susp.$tmps.$loadgbl156;
            $binop158 = susp.$tmps.$binop158;
            $loadgbl160 = susp.$tmps.$loadgbl160;
            $binop161 = susp.$tmps.$binop161;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
            susp.$tmps = {
                "a": a,
                "b": b,
                "$compareres149": $compareres149,
                "$compareres153": $compareres153,
                "$loadgbl156": $loadgbl156,
                "$binop158": $binop158,
                "$loadgbl160": $loadgbl160,
                "$binop161": $binop161
            };
            return susp;
        };
        var $blk = 0,
            $exc = [],
            $loc = {},
            $cell = {},
            $gbl = this,
            $err = undefined,
            $ret = undefined,
            $postfinally = undefined,
            $currLineNo = undefined,
            $currColNo = undefined;
        if ($scope147.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0:
                        /* --- codeobj entry --- */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    29 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*    30 */
                        if (Sk.breakpoints('<stdin>.py', 2, 4)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 2, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1; /* allowing case fallthrough */
                    case 1:
                        /* --- debug breakpoint for line 2 --- */
                        /*    31 */ //
                        /*    32 */ // line 2:
                        /*    33 */ //     if (a == 0):
                        /*    34 */ //     ^
                        /*    35 */ //
                        /*    36 */
                        $currLineNo = 2;
                        /*    37 */
                        $currColNo = 4;
                        /*    38 */
                        /*    39 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    40 */
                        var $compareres149 = null;
                        console.log('$compareres149 =', $compareres149);
                        $ret = Sk.builtin.bool(Sk.misceval.richCompareBool(a, $scope147.$const150, 'Eq', true));
                        $blk = 4; /* allowing case fallthrough */
                    case 4:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 2, 8);
                        }
                        $compareres149 = $ret;
                        var $jfalse151 = ($ret === false || !Sk.misceval.isTrue($ret));
                        console.log('$jfalse151 =', $jfalse151);
                        if ($jfalse151) {
                            /*test failed */
                            $blk = 3;
                            continue;
                        }
                        $blk = 3; /* allowing case fallthrough */
                    case 3:
                        /* --- done --- */
                        var $jfalse152 = ($compareres149 === false || !Sk.misceval.isTrue($compareres149));
                        console.log('$jfalse152 =', $jfalse152);
                        if ($jfalse152) {
                            /*test failed */
                            $blk = 2;
                            continue;
                        }
                        if (Sk.breakpoints('<stdin>.py', 3, 8)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 3, 8);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5; /* allowing case fallthrough */
                    case 5:
                        /* --- debug breakpoint for line 3 --- */
                        /*    41 */ //
                        /*    42 */ // line 3:
                        /*    43 */ //         return 0
                        /*    44 */ //         ^
                        /*    45 */ //
                        /*    46 */
                        $currLineNo = 3;
                        /*    47 */
                        $currColNo = 8;
                        /*    48 */
                        /*    49 */
                        console.log('astnode return');
                        return $scope147.$const150;
                        $blk = 2; /* allowing case fallthrough */
                    case 2:
                        /* --- end of if --- */
                        if (Sk.breakpoints('<stdin>.py', 4, 4)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 4, 4);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6; /* allowing case fallthrough */
                    case 6:
                        /* --- debug breakpoint for line 4 --- */
                        /*    50 */ //
                        /*    51 */ // line 4:
                        /*    52 */ //     if (b == 0):
                        /*    53 */ //     ^
                        /*    54 */ //
                        /*    55 */
                        $currLineNo = 4;
                        /*    56 */
                        $currColNo = 4;
                        /*    57 */
                        /*    58 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*    59 */
                        var $compareres153 = null;
                        console.log('$compareres153 =', $compareres153);
                        $ret = Sk.builtin.bool(Sk.misceval.richCompareBool(b, $scope147.$const150, 'Eq', true));
                        $blk = 9; /* allowing case fallthrough */
                    case 9:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 4, 8);
                        }
                        $compareres153 = $ret;
                        var $jfalse154 = ($ret === false || !Sk.misceval.isTrue($ret));
                        console.log('$jfalse154 =', $jfalse154);
                        if ($jfalse154) {
                            /*test failed */
                            $blk = 8;
                            continue;
                        }
                        $blk = 8; /* allowing case fallthrough */
                    case 8:
                        /* --- done --- */
                        var $jfalse155 = ($compareres153 === false || !Sk.misceval.isTrue($compareres153));
                        console.log('$jfalse155 =', $jfalse155);
                        if ($jfalse155) {
                            /*test failed */
                            $blk = 7;
                            continue;
                        }
                        if (Sk.breakpoints('<stdin>.py', 5, 8)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 5, 8);
                            $susp.$blk = 10;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 10; /* allowing case fallthrough */
                    case 10:
                        /* --- debug breakpoint for line 5 --- */
                        /*    60 */ //
                        /*    61 */ // line 5:
                        /*    62 */ //         return plop(a - 1, a)
                        /*    63 */ //         ^
                        /*    64 */ //
                        /*    65 */
                        $currLineNo = 5;
                        /*    66 */
                        $currColNo = 8;
                        /*    67 */
                        /*    68 */
                        var $loadgbl156 = Sk.misceval.loadname('plop', $gbl);
                        console.log('$loadgbl156 =', $loadgbl156);
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    69 */
                        var $binop158 = Sk.abstr.numberBinOp(a, $scope147.$const157, 'Sub');
                        console.log('$binop158 =', $binop158);
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    70 */
                        console.log('ENTER callsimOrSuspendArray', '$loadgbl156', $loadgbl156, [$binop158, a]);
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl156, [$binop158, a]);
                        $blk = 11; /* allowing case fallthrough */
                    case 11:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 5, 15);
                        }
                        var $call159 = $ret;
                        console.log('$call159 =', $call159);
                        /*    71 */ //
                        /*    72 */ // line 5:
                        /*    73 */ //         return plop(a - 1, a)
                        /*    74 */ //                ^
                        /*    75 */ //
                        /*    76 */
                        $currLineNo = 5;
                        /*    77 */
                        $currColNo = 15;
                        /*    78 */
                        /*    79 */
                        console.log('astnode return');
                        return $call159;
                        $blk = 7; /* allowing case fallthrough */
                    case 7:
                        /* --- end of if --- */
                        if (Sk.breakpoints('<stdin>.py', 6, 4)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function () {
                                }
                            }, '<stdin>.py', 6, 4);
                            $susp.$blk = 12;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 12; /* allowing case fallthrough */
                    case 12:
                        /* --- debug breakpoint for line 6 --- */
                        /*    80 */ //
                        /*    81 */ // line 6:
                        /*    82 */ //     return 1 + plop(a, b - 1)
                        /*    83 */ //     ^
                        /*    84 */ //
                        /*    85 */
                        $currLineNo = 6;
                        /*    86 */
                        $currColNo = 4;
                        /*    87 */
                        /*    88 */
                        var $loadgbl160 = Sk.misceval.loadname('plop', $gbl);
                        console.log('$loadgbl160 =', $loadgbl160);
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    89 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*    90 */
                        var $binop161 = Sk.abstr.numberBinOp(b, $scope147.$const157, 'Sub');
                        console.log('$binop161 =', $binop161);
                        console.log('ENTER callsimOrSuspendArray', '$loadgbl160', $loadgbl160, [a, $binop161]);
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl160, [a, $binop161]);
                        $blk = 13; /* allowing case fallthrough */
                    case 13:
                        /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 6, 15);
                        }
                        var $call162 = $ret;
                        console.log('$call162 =', $call162);
                        /*    91 */ //
                        /*    92 */ // line 6:
                        /*    93 */ //     return 1 + plop(a, b - 1)
                        /*    94 */ //                ^
                        /*    95 */ //
                        /*    96 */
                        $currLineNo = 6;
                        /*    97 */
                        $currColNo = 15;
                        /*    98 */
                        /*    99 */
                        var $binop163 = Sk.abstr.numberBinOp($scope147.$const157, $call162, 'Add');
                        console.log('$binop163 =', $binop163);
                        console.log('astnode return');
                        return $binop163;
                        return Sk.builtin.none.none$;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
    $scope147.$const150 = new Sk.builtin.int_(0);
    $scope147.$const157 = new Sk.builtin.int_(1);
    /*   100 */
    return $scope146;
}();