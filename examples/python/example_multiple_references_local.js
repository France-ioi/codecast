/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname177, $loadname179, $loadname180, $loadname179, $loadname180, $lsubscr181, $loadname183,
            $loadname184, $loadname186, $loadname187, $loadname186, $loadname187, $lsubscr188;
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
            $loadname177 = susp.$tmps.$loadname177;
            $loadname179 = susp.$tmps.$loadname179;
            $loadname180 = susp.$tmps.$loadname180;
            $lsubscr181 = susp.$tmps.$lsubscr181;
            $loadname183 = susp.$tmps.$loadname183;
            $loadname184 = susp.$tmps.$loadname184;
            $loadname186 = susp.$tmps.$loadname186;
            $loadname187 = susp.$tmps.$loadname187;
            $lsubscr188 = susp.$tmps.$lsubscr188;
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
                "$loadname177": $loadname177,
                "$loadname179": $loadname179,
                "$loadname180": $loadname180,
                "$lsubscr181": $lsubscr181,
                "$loadname183": $loadname183,
                "$loadname184": $loadname184,
                "$loadname186": $loadname186,
                "$loadname187": $loadname187,
                "$lsubscr188": $lsubscr188
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
                        /*     4 */ // a0 = [0, 1]
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
                            $loc.__refs__[$loadlist151._uuid] = 'a0';
                        }
                        $loc.a0 = window.currentPythonRunner.reportValue($loadlist151, 'a0');
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
                        /*    13 */ // b0 = [2, 3]
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
                            $loc.__refs__[$loadlist156._uuid] = 'b0';
                        }
                        $loc.b0 = window.currentPythonRunner.reportValue($loadlist156, 'b0');
                        if (Sk.breakpoints('<stdin>.py', 4, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 4 --- */
                        /*    20 */ //
                        /*    21 */ // line 4:
                        /*    22 */ // def test():
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 4;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        $scope157.co_name = new Sk.builtins['str']('test');
                        $scope157.co_varnames = [];
                        var $funcobj169 = new Sk.builtins['function']($scope157, $gbl);
                        if ($funcobj169._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            $loc.__refs__[$funcobj169._uuid] = 'test';
                        }
                        $loc.test = window.currentPythonRunner.reportValue($funcobj169, 'test');
                        if (Sk.breakpoints('<stdin>.py', 9, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 9 --- */
                        /*    29 */ //
                        /*    30 */ // line 9:
                        /*    31 */ // def test2(a0):
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 9;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        $scope170.co_name = new Sk.builtins['str']('test2');
                        $scope170.co_varnames = ['a0'];
                        var $funcobj176 = new Sk.builtins['function']($scope170, $gbl);
                        if ($funcobj176._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            $loc.__refs__[$funcobj176._uuid] = 'test2';
                        }
                        $loc.test2 = window.currentPythonRunner.reportValue($funcobj176, 'test2');
                        if (Sk.breakpoints('<stdin>.py', 14, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 14 --- */
                        /*    38 */ //
                        /*    39 */ // line 14:
                        /*    40 */ // test()
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 14;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        console.log('test1', '$loc.test', 'test');
                        var $loadname177 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname177);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 0);
                        }
                        var $call178 = $ret;
                        /*    47 */ //
                        /*    48 */ // line 14:
                        /*    49 */ // test()
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 14;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 16 --- */
                        /*    56 */ //
                        /*    57 */ // line 16:
                        /*    58 */ // print(a0[0])
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 16;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname179 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname180 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname180, $scope146.$const147, true);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr181 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname179, [$lsubscr181]);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 16, 0);
                        }
                        var $call182 = $ret;
                        /*    65 */ //
                        /*    66 */ // line 16:
                        /*    67 */ // print(a0[0])
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 16;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 10;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- debug breakpoint for line 18 --- */
                        /*    74 */ //
                        /*    75 */ // line 18:
                        /*    76 */ // test2(a0)
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 18;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        console.log('test1', '$loc.test2', 'test2');
                        var $loadname183 = $loc.test2 !== undefined ? $loc.test2 : Sk.misceval.loadname('test2', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname184 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname183, [$loadname184]);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 0);
                        }
                        var $call185 = $ret;
                        /*    83 */ //
                        /*    84 */ // line 18:
                        /*    85 */ // test2(a0)
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 18;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        if (Sk.breakpoints('<stdin>.py', 20, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 20, 0);
                            $susp.$blk = 12;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- debug breakpoint for line 20 --- */
                        /*    92 */ //
                        /*    93 */ // line 20:
                        /*    94 */ // print(a0[0])
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 20;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname186 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname187 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname187, $scope146.$const147, true);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr188 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname186, [$lsubscr188]);
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 20, 0);
                        }
                        var $call189 = $ret;
                        /*   101 */ //
                        /*   102 */ // line 20:
                        /*   103 */ // print(a0[0])
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 20;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        if (Sk.breakpoints('<stdin>.py', 22, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 22, 0);
                            $susp.$blk = 15;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- debug breakpoint for line 22 --- */
                        /*   110 */ //
                        /*   111 */ // line 22:
                        /*   112 */ // pass
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 22;
                        /*   116 */
                        $currColNo = 0;
                        /*   117 */
                        /*   118 */
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
    var $scope157 = (function $test158$() {
        var c0, v; /* locals */
        var c0, c0, v, v, $lsubscr167;
        var $wakeFromSuspension = function () {
            var susp = $scope157.$wakingSuspension;
            $scope157.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            c0 = susp.$tmps.c0;
            v = susp.$tmps.v;
            $lsubscr167 = susp.$tmps.$lsubscr167;
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
                $scope157.$wakingSuspension = susp;
                return $scope157();
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
            susp._argnames = [];
            susp._scopename = '$scope157';
            susp.$tmps = {"c0": c0, "v": v, "$lsubscr167": $lsubscr167};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope157.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (Sk.breakpoints('<stdin>.py', 5, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 5 --- */
                        /*   119 */ //
                        /*   120 */ // line 5:
                        /*   121 */ //     v = "test1"
                        /*   122 */ //     ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 5;
                        /*   125 */
                        $currColNo = 4;
                        /*   126 */
                        /*   127 */
                        v = $scope157.$const159;
                        if (Sk.breakpoints('<stdin>.py', 6, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 4);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 6 --- */
                        /*   128 */ //
                        /*   129 */ // line 6:
                        /*   130 */ //     c0 = [a0, b0]
                        /*   131 */ //     ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 6;
                        /*   134 */
                        $currColNo = 4;
                        /*   135 */
                        /*   136 */
                        console.log('test2', 'a0');
                        var $loadgbl160 = Sk.misceval.loadname('a0', $gbl);
                        var $elem161 = $loadgbl160;
                        console.log('test2', 'b0');
                        var $loadgbl162 = Sk.misceval.loadname('b0', $gbl);
                        var $elem163 = $loadgbl162;
                        var $loadlist164 = new Sk.builtins['list']([$elem161, $elem163]);
                        c0 = $loadlist164;
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
                        /*   137 */ //
                        /*   138 */ // line 7:
                        /*   139 */ //     c0[0][0] = 42
                        /*   140 */ //     ^
                        /*   141 */ //
                        /*   142 */
                        $currLineNo = 7;
                        /*   143 */
                        $currColNo = 4;
                        /*   144 */
                        /*   145 */
                        if (c0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c0\' referenced before assignment');
                        }
                        /*   146 */
                        $ret = Sk.abstr.objectGetItem(c0, $scope157.$const166, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr167 = $ret;
                        $lsubscr167 = $lsubscr167.clone($scope157.$const165);
                        $ret = Sk.abstr.objectSetItem($lsubscr167, $scope157.$const166, $scope157.$const165, true);
                        Sk.builtin.changeReferences($loc, $lsubscr167);
                        var $__correspondences__ = Sk.builtin.changeReferences($gbl, $lsubscr167);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 8, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 4);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 8 --- */
                        /*   147 */ //
                        /*   148 */ // line 8:
                        /*   149 */ //     v = "test"
                        /*   150 */ //     ^
                        /*   151 */ //
                        /*   152 */
                        $currLineNo = 8;
                        /*   153 */
                        $currColNo = 4;
                        /*   154 */
                        /*   155 */
                        v = $scope157.$const168;
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
    $scope157.$const159 = new Sk.builtin.str('test1');
    $scope157.$const165 = new Sk.builtin.int_(42);
    $scope157.$const166 = new Sk.builtin.int_(0);
    $scope157.$const168 = new Sk.builtin.str('test');
    var $scope170 = (function $test2171$(a0) {
        var v; /* locals */
        var a0, a0, v, v;
        var $wakeFromSuspension = function () {
            var susp = $scope170.$wakingSuspension;
            $scope170.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            a0 = susp.$tmps.a0;
            v = susp.$tmps.v;
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
                $scope170.$wakingSuspension = susp;
                return $scope170();
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
            susp._name = 'test2';
            susp._argnames = ["a0"];
            susp._scopename = '$scope170';
            susp.$tmps = {"a0": a0, "v": v};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope170.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*   156 */
                        if (Sk.breakpoints('<stdin>.py', 10, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 10 --- */
                        /*   157 */ //
                        /*   158 */ // line 10:
                        /*   159 */ //     v = "test1"
                        /*   160 */ //     ^
                        /*   161 */ //
                        /*   162 */
                        $currLineNo = 10;
                        /*   163 */
                        $currColNo = 4;
                        /*   164 */
                        /*   165 */
                        v = $scope170.$const172;
                        if (Sk.breakpoints('<stdin>.py', 11, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 4);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 11 --- */
                        /*   166 */ //
                        /*   167 */ // line 11:
                        /*   168 */ //     a0[0] = 45
                        /*   169 */ //     ^
                        /*   170 */ //
                        /*   171 */
                        $currLineNo = 11;
                        /*   172 */
                        $currColNo = 4;
                        /*   173 */
                        /*   174 */
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*   175 */
                        a0 = a0.clone($scope170.$const173);
                        $ret = Sk.abstr.objectSetItem(a0, $scope170.$const174, $scope170.$const173, true);
                        Sk.builtin.changeReferences($loc, a0);
                        var $__correspondences__ = Sk.builtin.changeReferences($gbl, a0);
                        if (a0 && a0.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(a0._uuid)) {
                            a0 = $__correspondences__[a0._uuid];
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 12, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 4);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 12 --- */
                        /*   176 */ //
                        /*   177 */ // line 12:
                        /*   178 */ //     v = "test"
                        /*   179 */ //     ^
                        /*   180 */ //
                        /*   181 */
                        $currLineNo = 12;
                        /*   182 */
                        $currColNo = 4;
                        /*   183 */
                        /*   184 */
                        v = $scope170.$const175;
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
    $scope170.$const172 = new Sk.builtin.str('test1');
    $scope170.$const173 = new Sk.builtin.int_(45);
    $scope170.$const174 = new Sk.builtin.int_(0);
    $scope170.$const175 = new Sk.builtin.str('test');
    /*   185 */
    return $scope146;
}();