/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname163, $loadname164, $loadname165, $loadname164, $loadname165, $lsubscr166, $loadname168,
            $loadname169, $loadname168, $loadname169, $lsubscr170, $loadname168, $loadname169, $lsubscr170, $lsubscr171,
            $loadname174, $loadname174, $lsubscr175, $loadname176, $loadname177, $loadname176, $loadname177,
            $lsubscr178, $loadname180, $loadname181, $loadname180, $loadname181, $lsubscr182, $loadname180,
            $loadname181, $lsubscr182, $lsubscr183;
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
            $loadname163 = susp.$tmps.$loadname163;
            $loadname164 = susp.$tmps.$loadname164;
            $loadname165 = susp.$tmps.$loadname165;
            $lsubscr166 = susp.$tmps.$lsubscr166;
            $loadname168 = susp.$tmps.$loadname168;
            $loadname169 = susp.$tmps.$loadname169;
            $lsubscr170 = susp.$tmps.$lsubscr170;
            $lsubscr171 = susp.$tmps.$lsubscr171;
            $loadname174 = susp.$tmps.$loadname174;
            $lsubscr175 = susp.$tmps.$lsubscr175;
            $loadname176 = susp.$tmps.$loadname176;
            $loadname177 = susp.$tmps.$loadname177;
            $lsubscr178 = susp.$tmps.$lsubscr178;
            $loadname180 = susp.$tmps.$loadname180;
            $loadname181 = susp.$tmps.$loadname181;
            $lsubscr182 = susp.$tmps.$lsubscr182;
            $lsubscr183 = susp.$tmps.$lsubscr183;
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
                "$loadname163": $loadname163,
                "$loadname164": $loadname164,
                "$loadname165": $loadname165,
                "$lsubscr166": $lsubscr166,
                "$loadname168": $loadname168,
                "$loadname169": $loadname169,
                "$lsubscr170": $lsubscr170,
                "$lsubscr171": $lsubscr171,
                "$loadname174": $loadname174,
                "$lsubscr175": $lsubscr175,
                "$loadname176": $loadname176,
                "$loadname177": $loadname177,
                "$lsubscr178": $lsubscr178,
                "$loadname180": $loadname180,
                "$loadname181": $loadname181,
                "$lsubscr182": $lsubscr182,
                "$lsubscr183": $lsubscr183
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
                        /*     4 */ // a = [0, 1]
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
                        var $loadlist151 = new Sk.builtins['list']([$elem148, $elem150]);
                        if ($loadlist151._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            $loc.__refs__[$loadlist151._uuid] = 'a';
                        }
                        $loc.a = window.currentPythonRunner.reportValue($loadlist151, 'a');
                        if (Sk.breakpoints('<stdin>.py', 2, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 2, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 2 --- */
                        /*    11 */ //
                        /*    12 */ // line 2:
                        /*    13 */ // b = [2, 3]
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 2;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $elem153 = $scope146.$const152;
                        var $elem155 = $scope146.$const154;
                        var $loadlist156 = new Sk.builtins['list']([$elem153, $elem155]);
                        if ($loadlist156._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            $loc.__refs__[$loadlist156._uuid] = 'b';
                        }
                        $loc.b = window.currentPythonRunner.reportValue($loadlist156, 'b');
                        if (Sk.breakpoints('<stdin>.py', 3, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 3 --- */
                        /*    20 */ //
                        /*    21 */ // line 3:
                        /*    22 */ // c = [a, b]
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 3;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        console.log('test1', '$loc.a', 'a');
                        var $loadname157 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;var $elem158 = $loadname157;
                        console.log('test1', '$loc.b', 'b');
                        var $loadname159 = $loc.b !== undefined ? $loc.b : Sk.misceval.loadname('b', $gbl);
                        ;var $elem160 = $loadname159;
                        var $loadlist161 = new Sk.builtins['list']([$elem158, $elem160]);
                        if ($loadlist161._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            $loc.__refs__[$loadlist161._uuid] = 'c';
                        }
                        $loc.c = window.currentPythonRunner.reportValue($loadlist161, 'c');
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
                        /*    29 */ //
                        /*    30 */ // line 5:
                        /*    31 */ // a[0] = 5
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 5;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        console.log('test1', '$loc.a', 'a');
                        var $loadname163 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$loadname163 = $loadname163.clone($scope146.$const147, $scope146.$const162);
                        $ret = Sk.abstr.objectSetItem($loadname163, $scope146.$const147, $scope146.$const162, true);
                        Sk.builtin.changeReferences($loc, $loadname163);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 7, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 7 --- */
                        /*    38 */ //
                        /*    39 */ // line 7:
                        /*    40 */ // print(a[0])
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 7;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname164 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname165 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname165, $scope146.$const147, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr166 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname164, [$lsubscr166]);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 7, 0);
                        }
                        var $call167 = $ret;
                        /*    47 */ //
                        /*    48 */ // line 7:
                        /*    49 */ // print(a[0])
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 7;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        if (Sk.breakpoints('<stdin>.py', 8, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 0);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 8 --- */
                        /*    56 */ //
                        /*    57 */ // line 8:
                        /*    58 */ // print(c[0][0])
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 8;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname168 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname169 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname169, $scope146.$const147, true);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr170 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr170, $scope146.$const147, true);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr171 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname168, [$lsubscr171]);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 8, 0);
                        }
                        var $call172 = $ret;
                        /*    65 */ //
                        /*    66 */ // line 8:
                        /*    67 */ // print(c[0][0])
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 8;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 13;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- debug breakpoint for line 10 --- */
                        /*    74 */ //
                        /*    75 */ // line 10:
                        /*    76 */ // c[0][0] = 6
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 10;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        console.log('test1', '$loc.c', 'c');
                        var $loadname174 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname174, $scope146.$const147, true);
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr175 = $ret;
                        $lsubscr175 = $lsubscr175.clone($scope146.$const147, $scope146.$const173);
                        $ret = Sk.abstr.objectSetItem($lsubscr175, $scope146.$const147, $scope146.$const173, true);
                        Sk.builtin.changeReferences($loc, $lsubscr175);
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 12, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 0);
                            $susp.$blk = 16;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- debug breakpoint for line 12 --- */
                        /*    83 */ //
                        /*    84 */ // line 12:
                        /*    85 */ // print(a[0])
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 12;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname176 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname177 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname177, $scope146.$const147, true);
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr178 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname176, [$lsubscr178]);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        var $call179 = $ret;
                        /*    92 */ //
                        /*    93 */ // line 12:
                        /*    94 */ // print(a[0])
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 12;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        if (Sk.breakpoints('<stdin>.py', 13, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 0);
                            $susp.$blk = 19;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- debug breakpoint for line 13 --- */
                        /*   101 */ //
                        /*   102 */ // line 13:
                        /*   103 */ // print(c[0][0])
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 13;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname180 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname181 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname181, $scope146.$const147, true);
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr182 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr182, $scope146.$const147, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr183 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname180, [$lsubscr183]);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
                        }
                        var $call184 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 13:
                        /*   112 */ // print(c[0][0])
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 13;
                        /*   116 */
                        $currColNo = 0;
                        /*   117 */
                        /*   118 */
                        if (Sk.breakpoints('<stdin>.py', 14, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 0);
                            $susp.$blk = 23;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- debug breakpoint for line 14 --- */
                        /*   119 */ //
                        /*   120 */ // line 14:
                        /*   121 */ // pass
                        /*   122 */ // ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 14;
                        /*   125 */
                        $currColNo = 0;
                        /*   126 */
                        /*   127 */
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
    $scope146.$const147 = new Sk.builtin.int_(0);
    $scope146.$const149 = new Sk.builtin.int_(1);
    $scope146.$const152 = new Sk.builtin.int_(2);
    $scope146.$const154 = new Sk.builtin.int_(3);
    $scope146.$const162 = new Sk.builtin.int_(5);
    $scope146.$const173 = new Sk.builtin.int_(6);
    /*   128 */
    return $scope146;
}();