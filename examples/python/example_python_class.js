/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname169, $loadname175, $loadname190, $loadname192, $loadname192, $lsubscr193, $loaddict196,
            $loadname197, $loadname198, $loadname199, $loadname198, $loadname199, $lattr201, $loadname198, $loadname199,
            $lattr201, $call202, $loadname204, $loadname205, $loadname204, $loadname205, $lattr207, $loadname204,
            $loadname205, $lattr207, $call208;
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
            $loadname175 = susp.$tmps.$loadname175;
            $loadname190 = susp.$tmps.$loadname190;
            $loadname192 = susp.$tmps.$loadname192;
            $lsubscr193 = susp.$tmps.$lsubscr193;
            $loaddict196 = susp.$tmps.$loaddict196;
            $loadname197 = susp.$tmps.$loadname197;
            $loadname198 = susp.$tmps.$loadname198;
            $loadname199 = susp.$tmps.$loadname199;
            $lattr201 = susp.$tmps.$lattr201;
            $call202 = susp.$tmps.$call202;
            $loadname204 = susp.$tmps.$loadname204;
            $loadname205 = susp.$tmps.$loadname205;
            $lattr207 = susp.$tmps.$lattr207;
            $call208 = susp.$tmps.$call208;
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
                "$loadname175": $loadname175,
                "$loadname190": $loadname190,
                "$loadname192": $loadname192,
                "$lsubscr193": $lsubscr193,
                "$loaddict196": $loaddict196,
                "$loadname197": $loadname197,
                "$loadname198": $loadname198,
                "$loadname199": $loadname199,
                "$lattr201": $lattr201,
                "$call202": $call202,
                "$loadname204": $loadname204,
                "$loadname205": $loadname205,
                "$lattr207": $lattr207,
                "$call208": $call208
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
                        console.log('test1', '$loc.Test', 'Test');
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
                        /*    31 */ // test.b = 10
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 15;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        console.log('test1', '$loc.test', 'test');
                        var $loadname175 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log($loadname175);
                        $loadname175 = $loadname175.clone();
                        console.log($loadname175);
                        $ret = Sk.abstr.sattr($loadname175, $scope146.$const176, $scope146.$const174, true);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 15, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 16 --- */
                        /*    38 */ //
                        /*    39 */ // line 16:
                        /*    40 */ // i = 0
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 16;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const177, 'i');
                        if (Sk.breakpoints('<stdin>.py', 17, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 17, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 17 --- */
                        /*    47 */ //
                        /*    48 */ // line 17:
                        /*    49 */ // i = 1
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 17;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const171, 'i');
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 18 --- */
                        /*    56 */ //
                        /*    57 */ // line 18:
                        /*    58 */ // tel = {'name': "John", 'number': "0123456789", 'inside': {'a': "val", 'c': "test"}}
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 18;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $loaddict186 = new Sk.builtins['dict']([$scope146.$const183, $scope146.$const182, $scope146.$const185, $scope146.$const184]);
                        var $loaddict188 = new Sk.builtins['dict']([$scope146.$const179, $scope146.$const178, $scope146.$const181, $scope146.$const180, $scope146.$const187, $loaddict186]);
                        $loc.tel = window.currentPythonRunner.reportValue($loaddict188, 'tel');
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
                        /*    67 */ // tel['number'] = "0987654321"
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 19;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        console.log('test1', '$loc.tel', 'tel');
                        var $loadname190 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$loadname190 = $loadname190.clone();
                        $ret = Sk.abstr.objectSetItem($loadname190, $scope146.$const181, $scope146.$const189, true);
                        $loc.tel = $loadname190;
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
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
                        /*    76 */ // tel['inside']['a'] = "newval"
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 20;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        console.log('test1', '$loc.tel', 'tel');
                        var $loadname192 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname192, $scope146.$const187, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr193 = $ret;
                        $lsubscr193 = $lsubscr193.clone();
                        $ret = Sk.abstr.objectSetItem($lsubscr193, $scope146.$const183, $scope146.$const191, true);
                        $loadname192 = $loadname192.clone();
                        Sk.abstr.objectSetItem($loadname192, $scope146.$const187, $lsubscr193, true);
                        $loc.tel = $loadname192;
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 21, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 21, 0);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 21 --- */
                        /*    83 */ //
                        /*    84 */ // line 21:
                        /*    85 */ // tel['inside'] = {'a': "vala", 'b': "valb"}
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 21;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        var $loaddict196 = new Sk.builtins['dict']([$scope146.$const183, $scope146.$const194, $scope146.$const176, $scope146.$const195]);
                        console.log('test1', '$loc.tel', 'tel');
                        var $loadname197 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$loadname197 = $loadname197.clone();
                        $ret = Sk.abstr.objectSetItem($loadname197, $scope146.$const187, $loaddict196, true);
                        $loc.tel = $loadname197;
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 22, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 22, 0);
                            $susp.$blk = 16;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- debug breakpoint for line 22 --- */
                        /*    92 */ //
                        /*    93 */ // line 22:
                        /*    94 */ // print(test.sum())
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 22;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname198 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.test', 'test');
                        var $loadname199 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname199, $scope146.$const200, true);
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 22, 6);
                        }
                        var $lattr201 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr201);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 22, 6);
                        }
                        var $call202 = $ret;
                        /*   101 */ //
                        /*   102 */ // line 22:
                        /*   103 */ // print(test.sum())
                        /*   104 */ //       ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 22;
                        /*   107 */
                        $currColNo = 6;
                        /*   108 */
                        /*   109 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname198, [$call202]);
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 22, 0);
                        }
                        var $call203 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 22:
                        /*   112 */ // print(test.sum())
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 22;
                        /*   116 */
                        $currColNo = 0;
                        /*   117 */
                        /*   118 */
                        if (Sk.breakpoints('<stdin>.py', 23, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 23, 0);
                            $susp.$blk = 20;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- debug breakpoint for line 23 --- */
                        /*   119 */ //
                        /*   120 */ // line 23:
                        /*   121 */ // print(test.getM())
                        /*   122 */ // ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 23;
                        /*   125 */
                        $currColNo = 0;
                        /*   126 */
                        /*   127 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname204 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.test', 'test');
                        var $loadname205 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname205, $scope146.$const206, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 23, 6);
                        }
                        var $lattr207 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr207);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 23, 6);
                        }
                        var $call208 = $ret;
                        /*   128 */ //
                        /*   129 */ // line 23:
                        /*   130 */ // print(test.getM())
                        /*   131 */ //       ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 23;
                        /*   134 */
                        $currColNo = 6;
                        /*   135 */
                        /*   136 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname204, [$call208]);
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 23, 0);
                        }
                        var $call209 = $ret;
                        /*   137 */ //
                        /*   138 */ // line 23:
                        /*   139 */ // print(test.getM())
                        /*   140 */ // ^
                        /*   141 */ //
                        /*   142 */
                        $currLineNo = 23;
                        /*   143 */
                        $currColNo = 0;
                        /*   144 */
                        /*   145 */
                        if (Sk.breakpoints('<stdin>.py', 25, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 25, 0);
                            $susp.$blk = 24;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 24;/* allowing case fallthrough */
                    case 24: /* --- debug breakpoint for line 25 --- */
                        /*   146 */ //
                        /*   147 */ // line 25:
                        /*   148 */ // pass
                        /*   149 */ // ^
                        /*   150 */ //
                        /*   151 */
                        $currLineNo = 25;
                        /*   152 */
                        $currColNo = 0;
                        /*   153 */
                        /*   154 */
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
    $scope146.$const174 = new Sk.builtin.int_(10);
    $scope146.$const176 = new Sk.builtin.str('b');
    $scope146.$const177 = new Sk.builtin.int_(0);
    $scope146.$const178 = new Sk.builtin.str('John');
    $scope146.$const179 = new Sk.builtin.str('name');
    $scope146.$const180 = new Sk.builtin.str('0123456789');
    $scope146.$const181 = new Sk.builtin.str('number');
    $scope146.$const182 = new Sk.builtin.str('val');
    $scope146.$const183 = new Sk.builtin.str('a');
    $scope146.$const184 = new Sk.builtin.str('test');
    $scope146.$const185 = new Sk.builtin.str('c');
    $scope146.$const187 = new Sk.builtin.str('inside');
    $scope146.$const189 = new Sk.builtin.str('0987654321');
    $scope146.$const191 = new Sk.builtin.str('newval');
    $scope146.$const194 = new Sk.builtin.str('vala');
    $scope146.$const195 = new Sk.builtin.str('valb');
    $scope146.$const200 = new Sk.builtin.str('sum');
    $scope146.$const206 = new Sk.builtin.str('getM');
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
                            /*   155 */ //
                            /*   156 */ // line 2:
                            /*   157 */ //     def __init__(self, a, b, m):
                            /*   158 */ //     ^
                            /*   159 */ //
                            /*   160 */
                            $currLineNo = 2;
                            /*   161 */
                            $currColNo = 4;
                            /*   162 */
                            /*   163 */
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a', 'b', 'm'];
                            var $funcobj153 = new Sk.builtins['function']($scope148, $gbl);
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj153, '__init__');
                            /*   164 */ //
                            /*   165 */ // line 7:
                            /*   166 */ //     def sum(self):
                            /*   167 */ //     ^
                            /*   168 */ //
                            /*   169 */
                            $currLineNo = 7;
                            /*   170 */
                            $currColNo = 4;
                            /*   171 */
                            /*   172 */
                            $scope154.co_name = new Sk.builtins['str']('sum');
                            $scope154.co_varnames = ['self'];
                            var $funcobj163 = new Sk.builtins['function']($scope154, $gbl);
                            $loc.sum = window.currentPythonRunner.reportValue($funcobj163, 'sum');
                            /*   173 */ //
                            /*   174 */ // line 11:
                            /*   175 */ //     def getM(self):
                            /*   176 */ //     ^
                            /*   177 */ //
                            /*   178 */
                            $currLineNo = 11;
                            /*   179 */
                            $currColNo = 4;
                            /*   180 */
                            /*   181 */
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
                        /*   182 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   183 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   184 */
                        if (m === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'m\' referenced before assignment');
                        }
                        /*   185 */
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
                        /*   186 */ //
                        /*   187 */ // line 3:
                        /*   188 */ //         self.a = a
                        /*   189 */ //         ^
                        /*   190 */ //
                        /*   191 */
                        $currLineNo = 3;
                        /*   192 */
                        $currColNo = 8;
                        /*   193 */
                        /*   194 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   195 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   196 */
                        console.log(self);
                        self = self.clone();
                        console.log(self);
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
                        /*   197 */ //
                        /*   198 */ // line 4:
                        /*   199 */ //         self.b = b
                        /*   200 */ //         ^
                        /*   201 */ //
                        /*   202 */
                        $currLineNo = 4;
                        /*   203 */
                        $currColNo = 8;
                        /*   204 */
                        /*   205 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   206 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   207 */
                        console.log(self);
                        self = self.clone();
                        console.log(self);
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
                        /*   208 */ //
                        /*   209 */ // line 5:
                        /*   210 */ //         self.m = m
                        /*   211 */ //         ^
                        /*   212 */ //
                        /*   213 */
                        $currLineNo = 5;
                        /*   214 */
                        $currColNo = 8;
                        /*   215 */
                        /*   216 */
                        if (m === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'m\' referenced before assignment');
                        }
                        /*   217 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   218 */
                        console.log(self);
                        self = self.clone();
                        console.log(self);
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
                        /*   219 */
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
                        /*   220 */ //
                        /*   221 */ // line 8:
                        /*   222 */ //         self.m = "newmessage"
                        /*   223 */ //         ^
                        /*   224 */ //
                        /*   225 */
                        $currLineNo = 8;
                        /*   226 */
                        $currColNo = 8;
                        /*   227 */
                        /*   228 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   229 */
                        console.log(self);
                        self = self.clone();
                        console.log(self);
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
                        /*   230 */ //
                        /*   231 */ // line 9:
                        /*   232 */ //         return self.a + self.b
                        /*   233 */ //         ^
                        /*   234 */ //
                        /*   235 */
                        $currLineNo = 9;
                        /*   236 */
                        $currColNo = 8;
                        /*   237 */
                        /*   238 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   239 */
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
                        /*   240 */
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
                        /*   241 */
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
                        /*   242 */ //
                        /*   243 */ // line 12:
                        /*   244 */ //         return self.m
                        /*   245 */ //         ^
                        /*   246 */ //
                        /*   247 */
                        $currLineNo = 12;
                        /*   248 */
                        $currColNo = 8;
                        /*   249 */
                        /*   250 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   251 */
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
    /*   252 */
    return $scope146;
}();