/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname159, $loadname159, $call161, $loadname159, $call161;
        var $wakeFromSuspension = function () {
            console.log('WWAAAAAAKKKEEEEEEEEEEEEE');
            var susp = $scope146.$wakingSuspension;
            $scope146.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = {...susp.$loc};
            $gbl = {...susp.$gbl};
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            $loadname159 = susp.$tmps.$loadname159;
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
            susp._argnames = [];
            susp._scopename = '$scope146';
            susp.$tmps = {"$loadname159": $loadname159, "$call161": $call161};
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
                        /*     4 */ // def plop(a):
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('plop');
                        $scope147.co_varnames = ['a'];
                        var $funcobj158 = new Sk.builtins['function']($scope147, $gbl);
                        $loc.plop = window.currentPythonRunner.reportValue($funcobj158, '$loc.plop');
                        if (Sk.breakpoints('<stdin>.py', 6, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 6 --- */
                        /*    11 */ //
                        /*    12 */ // line 6:
                        /*    13 */ // print plop(5)
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 6;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loadname159 = $loc.plop !== undefined ? $loc.plop : Sk.misceval.loadname('plop', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname159, [$scope146.$const160]);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        $loc.plop = $loadname159;
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 6, 6);
                        }
                        var $call161 = $ret;
                        /*    20 */ //
                        /*    21 */ // line 6:
                        /*    22 */ // print plop(5)
                        /*    23 */ //       ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 6;
                        /*    26 */
                        $currColNo = 6;
                        /*    27 */
                        /*    28 */
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($call161).v);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 6, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 6, 0);
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
    $scope146.$const160 = new Sk.builtin.int_(5);
    var $scope147 = (function $plop148$(a) {
        var a, a, a, a, $compareres149, $loadgbl153, $binop155;
        var $wakeFromSuspension = function () {
            console.log('WWAAAAAAKKKEEEEEEEEEEEEE');
            var susp = $scope147.$wakingSuspension;
            $scope147.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = {...susp.$loc};
            $gbl = {...susp.$gbl};
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            a = susp.$tmps.a;
            $compareres149 = susp.$tmps.$compareres149;
            $loadgbl153 = susp.$tmps.$loadgbl153;
            $binop155 = susp.$tmps.$binop155;
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
            susp._name = 'plop';
            susp._argnames = ["a"];
            susp._scopename = '$scope147';
            susp.$tmps = {"a": a, "$compareres149": $compareres149, "$loadgbl153": $loadgbl153, "$binop155": $binop155};
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
                        /*    29 */
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
                        /*    30 */ //
                        /*    31 */ // line 2:
                        /*    32 */ //     if (a == 0):
                        /*    33 */ //     ^
                        /*    34 */ //
                        /*    35 */
                        $currLineNo = 2;
                        /*    36 */
                        $currColNo = 4;
                        /*    37 */
                        /*    38 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    39 */
                        var $compareres149 = null;
                        $ret = Sk.builtin.bool(Sk.misceval.richCompareBool(a, $scope147.$const150, 'Eq', true));
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 2, 8);
                        }
                        $compareres149 = $ret;
                        var $jfalse151 = ($ret === false || !Sk.misceval.isTrue($ret));
                        if ($jfalse151) {/*test failed */
                            $blk = 3;
                            continue;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- done --- */
                        var $jfalse152 = ($compareres149 === false || !Sk.misceval.isTrue($compareres149));
                        if ($jfalse152) {/*test failed */
                            $blk = 2;
                            continue;
                        }
                        if (Sk.breakpoints('<stdin>.py', 3, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 8);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 3 --- */
                        /*    40 */ //
                        /*    41 */ // line 3:
                        /*    42 */ //         return 0
                        /*    43 */ //         ^
                        /*    44 */ //
                        /*    45 */
                        $currLineNo = 3;
                        /*    46 */
                        $currColNo = 8;
                        /*    47 */
                        /*    48 */
                        console.log('astnode return');
                        return $scope147.$const150;
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- end of if --- */
                        if (Sk.breakpoints('<stdin>.py', 4, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 4);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 4 --- */
                        /*    49 */ //
                        /*    50 */ // line 4:
                        /*    51 */ //     return a + plop(a - 1)
                        /*    52 */ //     ^
                        /*    53 */ //
                        /*    54 */
                        $currLineNo = 4;
                        /*    55 */
                        $currColNo = 4;
                        /*    56 */
                        /*    57 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    58 */
                        var $loadgbl153 = Sk.misceval.loadname('plop', $gbl);
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    59 */
                        var $binop155 = Sk.abstr.numberBinOp(a, $scope147.$const154, 'Sub');
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl153, [$binop155]);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 4, 15);
                        }
                        var $call156 = $ret;
                        /*    60 */ //
                        /*    61 */ // line 4:
                        /*    62 */ //     return a + plop(a - 1)
                        /*    63 */ //                ^
                        /*    64 */ //
                        /*    65 */
                        $currLineNo = 4;
                        /*    66 */
                        $currColNo = 15;
                        /*    67 */
                        /*    68 */
                        var $binop157 = Sk.abstr.numberBinOp(a, $call156, 'Add');
                        console.log('astnode return');
                        return $binop157;
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
    $scope147.$const150 = new Sk.builtin.int_(0);
    $scope147.$const154 = new Sk.builtin.int_(1);
    /*    69 */
    return $scope146;
}();