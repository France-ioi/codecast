/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname169, $loadname170, $loadname171, $loadname170, $loadname171, $lsubscr172, $loadname174,
            $loadname175, $loadname174, $loadname175, $lsubscr176, $loadname174, $loadname175, $lsubscr176, $lsubscr177,
            $loadname180, $loadname180, $lsubscr181, $loadname182, $loadname183, $loadname182, $loadname183,
            $lsubscr184, $loadname186, $loadname187, $loadname186, $loadname187, $lsubscr188, $loadname186,
            $loadname187, $lsubscr188, $lsubscr189, $loadname191, $loadname192, $loadname194, $loadname195,
            $loadname194, $loadname195, $lsubscr196, $loadname198, $loadname199, $loadname198, $loadname199,
            $lsubscr200, $loadname198, $loadname199, $lsubscr200, $lsubscr201;
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
            $loadname170 = susp.$tmps.$loadname170;
            $loadname171 = susp.$tmps.$loadname171;
            $lsubscr172 = susp.$tmps.$lsubscr172;
            $loadname174 = susp.$tmps.$loadname174;
            $loadname175 = susp.$tmps.$loadname175;
            $lsubscr176 = susp.$tmps.$lsubscr176;
            $lsubscr177 = susp.$tmps.$lsubscr177;
            $loadname180 = susp.$tmps.$loadname180;
            $lsubscr181 = susp.$tmps.$lsubscr181;
            $loadname182 = susp.$tmps.$loadname182;
            $loadname183 = susp.$tmps.$loadname183;
            $lsubscr184 = susp.$tmps.$lsubscr184;
            $loadname186 = susp.$tmps.$loadname186;
            $loadname187 = susp.$tmps.$loadname187;
            $lsubscr188 = susp.$tmps.$lsubscr188;
            $lsubscr189 = susp.$tmps.$lsubscr189;
            $loadname191 = susp.$tmps.$loadname191;
            $loadname192 = susp.$tmps.$loadname192;
            $loadname194 = susp.$tmps.$loadname194;
            $loadname195 = susp.$tmps.$loadname195;
            $lsubscr196 = susp.$tmps.$lsubscr196;
            $loadname198 = susp.$tmps.$loadname198;
            $loadname199 = susp.$tmps.$loadname199;
            $lsubscr200 = susp.$tmps.$lsubscr200;
            $lsubscr201 = susp.$tmps.$lsubscr201;
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
                "$loadname170": $loadname170,
                "$loadname171": $loadname171,
                "$lsubscr172": $lsubscr172,
                "$loadname174": $loadname174,
                "$loadname175": $loadname175,
                "$lsubscr176": $lsubscr176,
                "$lsubscr177": $lsubscr177,
                "$loadname180": $loadname180,
                "$lsubscr181": $lsubscr181,
                "$loadname182": $loadname182,
                "$loadname183": $loadname183,
                "$lsubscr184": $lsubscr184,
                "$loadname186": $loadname186,
                "$loadname187": $loadname187,
                "$lsubscr188": $lsubscr188,
                "$lsubscr189": $lsubscr189,
                "$loadname191": $loadname191,
                "$loadname192": $loadname192,
                "$loadname194": $loadname194,
                "$loadname195": $loadname195,
                "$lsubscr196": $lsubscr196,
                "$loadname198": $loadname198,
                "$loadname199": $loadname199,
                "$lsubscr200": $lsubscr200,
                "$lsubscr201": $lsubscr201
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
                        /*    31 */ // def test(c):
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 5;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        $scope162.co_name = new Sk.builtins['str']('test');
                        $scope162.co_varnames = ['c'];
                        var $funcobj167 = new Sk.builtins['function']($scope162, $gbl);
                        $loc.test = window.currentPythonRunner.reportValue($funcobj167, 'test');
                        if (Sk.breakpoints('<stdin>.py', 8, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 8 --- */
                        /*    38 */ //
                        /*    39 */ // line 8:
                        /*    40 */ // a[0] = 5
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 8;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        console.log('test1', '$loc.a', 'a');
                        var $loadname169 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$loadname169 = $loadname169.clone();
                        $ret = Sk.abstr.objectSetItem($loadname169, $scope146.$const147, $scope146.$const168, true);
                        $loc.a = $loadname169;
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 10 --- */
                        /*    47 */ //
                        /*    48 */ // line 10:
                        /*    49 */ // print(a[0])
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 10;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname170 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname171 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname171, $scope146.$const147, true);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr172 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname170, [$lsubscr172]);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 0);
                        }
                        var $call173 = $ret;
                        /*    56 */ //
                        /*    57 */ // line 10:
                        /*    58 */ // print(a[0])
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 10;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        if (Sk.breakpoints('<stdin>.py', 11, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 0);
                            $susp.$blk = 10;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- debug breakpoint for line 11 --- */
                        /*    65 */ //
                        /*    66 */ // line 11:
                        /*    67 */ // print(c[0][0])
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 11;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname174 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname175 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname175, $scope146.$const147, true);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr176 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr176, $scope146.$const147, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr177 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname174, [$lsubscr177]);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        var $call178 = $ret;
                        /*    74 */ //
                        /*    75 */ // line 11:
                        /*    76 */ // print(c[0][0])
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 11;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
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
                        /*    83 */ //
                        /*    84 */ // line 13:
                        /*    85 */ // c[0][0] = 6
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 13;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        console.log('test1', '$loc.c', 'c');
                        var $loadname180 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname180, $scope146.$const147, true);
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr181 = $ret;
                        $lsubscr181 = $lsubscr181.clone();
                        $ret = Sk.abstr.objectSetItem($lsubscr181, $scope146.$const147, $scope146.$const179, true);
                        $loadname180 = $loadname180.clone();
                        Sk.abstr.objectSetItem($loadname180, $scope146.$const147, $lsubscr181, true);
                        $loc.c = $loadname180;
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 15, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 15, 0);
                            $susp.$blk = 17;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- debug breakpoint for line 15 --- */
                        /*    92 */ //
                        /*    93 */ // line 15:
                        /*    94 */ // print(a[0])
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 15;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname182 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname183 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname183, $scope146.$const147, true);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr184 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname182, [$lsubscr184]);
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 15, 0);
                        }
                        var $call185 = $ret;
                        /*   101 */ //
                        /*   102 */ // line 15:
                        /*   103 */ // print(a[0])
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 15;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 20;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- debug breakpoint for line 16 --- */
                        /*   110 */ //
                        /*   111 */ // line 16:
                        /*   112 */ // print(c[0][0])
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 16;
                        /*   116 */
                        $currColNo = 0;
                        /*   117 */
                        /*   118 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname186 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname187 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname187, $scope146.$const147, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr188 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr188, $scope146.$const147, true);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr189 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname186, [$lsubscr189]);
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 16, 0);
                        }
                        var $call190 = $ret;
                        /*   119 */ //
                        /*   120 */ // line 16:
                        /*   121 */ // print(c[0][0])
                        /*   122 */ // ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 16;
                        /*   125 */
                        $currColNo = 0;
                        /*   126 */
                        /*   127 */
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 24;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 24;/* allowing case fallthrough */
                    case 24: /* --- debug breakpoint for line 18 --- */
                        /*   128 */ //
                        /*   129 */ // line 18:
                        /*   130 */ // test(c)
                        /*   131 */ // ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 18;
                        /*   134 */
                        $currColNo = 0;
                        /*   135 */
                        /*   136 */
                        console.log('test1', '$loc.test', 'test');
                        var $loadname191 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname192 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname191, [$loadname192]);
                        $blk = 25;/* allowing case fallthrough */
                    case 25: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 0);
                        }
                        var $call193 = $ret;
                        /*   137 */ //
                        /*   138 */ // line 18:
                        /*   139 */ // test(c)
                        /*   140 */ // ^
                        /*   141 */ //
                        /*   142 */
                        $currLineNo = 18;
                        /*   143 */
                        $currColNo = 0;
                        /*   144 */
                        /*   145 */
                        if (Sk.breakpoints('<stdin>.py', 20, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 20, 0);
                            $susp.$blk = 26;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 26;/* allowing case fallthrough */
                    case 26: /* --- debug breakpoint for line 20 --- */
                        /*   146 */ //
                        /*   147 */ // line 20:
                        /*   148 */ // print(a[0])
                        /*   149 */ // ^
                        /*   150 */ //
                        /*   151 */
                        $currLineNo = 20;
                        /*   152 */
                        $currColNo = 0;
                        /*   153 */
                        /*   154 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname194 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname195 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname195, $scope146.$const147, true);
                        $blk = 27;/* allowing case fallthrough */
                    case 27: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr196 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname194, [$lsubscr196]);
                        $blk = 28;/* allowing case fallthrough */
                    case 28: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 20, 0);
                        }
                        var $call197 = $ret;
                        /*   155 */ //
                        /*   156 */ // line 20:
                        /*   157 */ // print(a[0])
                        /*   158 */ // ^
                        /*   159 */ //
                        /*   160 */
                        $currLineNo = 20;
                        /*   161 */
                        $currColNo = 0;
                        /*   162 */
                        /*   163 */
                        if (Sk.breakpoints('<stdin>.py', 21, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 21, 0);
                            $susp.$blk = 29;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 29;/* allowing case fallthrough */
                    case 29: /* --- debug breakpoint for line 21 --- */
                        /*   164 */ //
                        /*   165 */ // line 21:
                        /*   166 */ // print(c[0][0])
                        /*   167 */ // ^
                        /*   168 */ //
                        /*   169 */
                        $currLineNo = 21;
                        /*   170 */
                        $currColNo = 0;
                        /*   171 */
                        /*   172 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname198 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname199 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname199, $scope146.$const147, true);
                        $blk = 30;/* allowing case fallthrough */
                    case 30: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr200 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr200, $scope146.$const147, true);
                        $blk = 31;/* allowing case fallthrough */
                    case 31: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr201 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname198, [$lsubscr201]);
                        $blk = 32;/* allowing case fallthrough */
                    case 32: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 21, 0);
                        }
                        var $call202 = $ret;
                        /*   173 */ //
                        /*   174 */ // line 21:
                        /*   175 */ // print(c[0][0])
                        /*   176 */ // ^
                        /*   177 */ //
                        /*   178 */
                        $currLineNo = 21;
                        /*   179 */
                        $currColNo = 0;
                        /*   180 */
                        /*   181 */
                        if (Sk.breakpoints('<stdin>.py', 23, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 23, 0);
                            $susp.$blk = 33;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 33;/* allowing case fallthrough */
                    case 33: /* --- debug breakpoint for line 23 --- */
                        /*   182 */ //
                        /*   183 */ // line 23:
                        /*   184 */ // pass
                        /*   185 */ // ^
                        /*   186 */ //
                        /*   187 */
                        $currLineNo = 23;
                        /*   188 */
                        $currColNo = 0;
                        /*   189 */
                        /*   190 */
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
    $scope146.$const168 = new Sk.builtin.int_(5);
    $scope146.$const179 = new Sk.builtin.int_(6);
    var $scope162 = (function $test163$(c) {
        var c, c, $lsubscr166;
        var $wakeFromSuspension = function () {
            var susp = $scope162.$wakingSuspension;
            $scope162.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            c = susp.$tmps.c;
            $lsubscr166 = susp.$tmps.$lsubscr166;
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
                $scope162.$wakingSuspension = susp;
                return $scope162();
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
            susp._argnames = ["c"];
            susp._scopename = '$scope162';
            susp.$tmps = {"c": c, "$lsubscr166": $lsubscr166};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope162.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (c === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c\' referenced before assignment');
                        }
                        /*   191 */
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
                        /*   192 */ //
                        /*   193 */ // line 6:
                        /*   194 */ //     c[0][0] = 42
                        /*   195 */ //     ^
                        /*   196 */ //
                        /*   197 */
                        $currLineNo = 6;
                        /*   198 */
                        $currColNo = 4;
                        /*   199 */
                        /*   200 */
                        if (c === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c\' referenced before assignment');
                        }
                        /*   201 */
                        $ret = Sk.abstr.objectGetItem(c, $scope162.$const165, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr166 = $ret;
                        $lsubscr166 = $lsubscr166.clone();
                        $ret = Sk.abstr.objectSetItem($lsubscr166, $scope162.$const165, $scope162.$const164, true);
                        c = c.clone();
                        Sk.abstr.objectSetItem(c, $scope162.$const165, $lsubscr166, true);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
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
    $scope162.$const164 = new Sk.builtin.int_(42);
    $scope162.$const165 = new Sk.builtin.int_(0);
    /*   202 */
    return $scope146;
}();