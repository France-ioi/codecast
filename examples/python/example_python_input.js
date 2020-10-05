/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname147, $loadname149, $loadname149;
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
            $loadname147 = susp.$tmps.$loadname147;
            $loadname149 = susp.$tmps.$loadname149;
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
            susp.$tmps = {"$loadname147": $loadname147, "$loadname149": $loadname149};
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
                        /*     4 */ // a = input()
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $loadname147 = $loc.input !== undefined ? $loc.input : Sk.misceval.loadname('input', $gbl);
                        ;console.log('$loadname147 =', $loadname147);
                        console.log('ENTEER callsimOrSuspendArray', '$loadname147', $loadname147);
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname147);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension', $ret);
                            return $saveSuspension($ret, '<stdin>.py', 1, 4);
                        }
                        var $call148 = $ret;
                        console.log('$call148 =', $call148);
                        /*    11 */ //
                        /*    12 */ // line 1:
                        /*    13 */ // a = input()
                        /*    14 */ //     ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 1;
                        /*    17 */
                        $currColNo = 4;
                        /*    18 */
                        /*    19 */
                        $loc.a = window.currentPythonRunner.reportValue($call148, '$loc.a');
                        if (Sk.breakpoints('<stdin>.py', 2, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 2, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 2 --- */
                        /*    20 */ //
                        /*    21 */ // line 2:
                        /*    22 */ // print a
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 2;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $loadname149 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;console.log('$loadname149 =', $loadname149);
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($loadname149).v);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 2, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 2, 0);
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
    /*    29 */
    return $scope146;
}();