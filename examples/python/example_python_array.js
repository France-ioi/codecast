/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname155, $loadname157, $loadname157, $lsubscr158, $loadname157, $lsubscr158, $iter160, $loadname159,
            $iter160, $loadname162, $loadname162;
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
            $loadname155 = susp.$tmps.$loadname155;
            $loadname157 = susp.$tmps.$loadname157;
            $lsubscr158 = susp.$tmps.$lsubscr158;
            $iter160 = susp.$tmps.$iter160;
            $loadname159 = susp.$tmps.$loadname159;
            $loadname162 = susp.$tmps.$loadname162;
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
                "$loadname155": $loadname155,
                "$loadname157": $loadname157,
                "$lsubscr158": $lsubscr158,
                "$iter160": $iter160,
                "$loadname159": $loadname159,
                "$loadname162": $loadname162
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
                        /*     4 */ // tab = [4, 10, 21]
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $elem148 = $scope146.$const147;
                        var $elem150 = $scope146.$const149;
                        var $elem152 = $scope146.$const151;
                        var $loadlist153 = new Sk.builtins['list']([$elem148, $elem150, $elem152]);
                        $loc.tab = window.currentPythonRunner.reportValue($loadlist153, '$loc.tab');
                        if (Sk.breakpoints('<stdin>.py', 3, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 3 --- */
                        /*    11 */ //
                        /*    12 */ // line 3:
                        /*    13 */ // tab[1] = 28
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 3;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loadname155 = $loc.tab !== undefined ? $loc.tab : Sk.misceval.loadname('tab', $gbl);
                        ;$loadname155 = $loadname155.clone();
                        $ret = Sk.abstr.objectSetItem($loadname155, $scope146.$const156, $scope146.$const154, true);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        $loc.tab = $loadname155;
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 5 --- */
                        /*    20 */ //
                        /*    21 */ // line 5:
                        /*    22 */ // print tab[1]
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 5;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $loadname157 = $loc.tab !== undefined ? $loc.tab : Sk.misceval.loadname('tab', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname157, $scope146.$const156, true);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        $loc.tab = $loadname157;
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr158 = $ret;
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($lsubscr158).v);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 5, 0);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 5, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 7, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 7 --- */
                        /*    29 */ //
                        /*    30 */ // line 7:
                        /*    31 */ // for num in tab:
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 7;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        var $loadname159 = $loc.tab !== undefined ? $loc.tab : Sk.misceval.loadname('tab', $gbl);
                        ;var $iter160 = Sk.abstr.iter($loadname159);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- for start --- */
                        $ret = Sk.abstr.iternext($iter160, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        $loc.tab = $loadname159;
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 7, 0);
                        }
                        var $next161 = $ret;
                        if ($next161 === undefined) {
                            $blk = 10;
                            continue;
                        }
                        $loc.num = window.currentPythonRunner.reportValue($next161, '$loc.num');
                        if (Sk.breakpoints('<stdin>.py', 7, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.delay'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 0);
                            $susp.$blk = 13;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- debug breakpoint for line 7 --- */
                        if (Sk.breakpoints('<stdin>.py', 8, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 4);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 8 --- */
                        /*    38 */ //
                        /*    39 */ // line 8:
                        /*    40 */ //     print num
                        /*    41 */ //     ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 8;
                        /*    44 */
                        $currColNo = 4;
                        /*    45 */
                        /*    46 */
                        var $loadname162 = $loc.num !== undefined ? $loc.num : Sk.misceval.loadname('num', $gbl);
                        ;$ret = Sk.misceval.print_(new Sk.builtins['str']($loadname162).v);
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        $loc.num = $loadname162;
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 8, 4);
                        }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            console.log('saveSuspension');
                            return $saveSuspension($ret, '<stdin>.py', 8, 4);
                        }
                        $blk = 9;/* jump */
                        continue;
                    case 10: /* --- for cleanup --- */
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- for end --- */
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
    $scope146.$const147 = new Sk.builtin.int_(4);
    $scope146.$const149 = new Sk.builtin.int_(10);
    $scope146.$const151 = new Sk.builtin.int_(21);
    $scope146.$const154 = new Sk.builtin.int_(28);
    $scope146.$const156 = new Sk.builtin.int_(1);
    /*    47 */
    return $scope146;
}();