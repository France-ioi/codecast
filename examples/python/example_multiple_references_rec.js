/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname185, $loadname187, $loadname189, $loadname190, $loadname189, $loadname190, $lsubscr191;
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
            $loadname185 = susp.$tmps.$loadname185;
            $loadname187 = susp.$tmps.$loadname187;
            $loadname189 = susp.$tmps.$loadname189;
            $loadname190 = susp.$tmps.$loadname190;
            $lsubscr191 = susp.$tmps.$lsubscr191;
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
            var $__tmpsReferences__ = {};
            if ($loadname185 && $loadname185.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname185._uuid)) {
                    $__tmpsReferences__[$loadname185._uuid] = [];
                }
                $__tmpsReferences__[$loadname185._uuid].push("$loadname185");
            }
            if ($loadname187 && $loadname187.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname187._uuid)) {
                    $__tmpsReferences__[$loadname187._uuid] = [];
                }
                $__tmpsReferences__[$loadname187._uuid].push("$loadname187");
            }
            if ($loadname189 && $loadname189.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname189._uuid)) {
                    $__tmpsReferences__[$loadname189._uuid] = [];
                }
                $__tmpsReferences__[$loadname189._uuid].push("$loadname189");
            }
            if ($loadname190 && $loadname190.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname190._uuid)) {
                    $__tmpsReferences__[$loadname190._uuid] = [];
                }
                $__tmpsReferences__[$loadname190._uuid].push("$loadname190");
            }
            if ($lsubscr191 && $lsubscr191.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr191._uuid)) {
                    $__tmpsReferences__[$lsubscr191._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr191._uuid].push("$lsubscr191");
            }
            susp.$tmps = {
                "$loadname185": $loadname185,
                "$loadname187": $loadname187,
                "$loadname189": $loadname189,
                "$loadname190": $loadname190,
                "$lsubscr191": $lsubscr191,
                "__refs__": $__tmpsReferences__
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
                        if (Sk.breakpoints('<stdin>.py', 2, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 2, 0);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 2 --- */
                        /*     2 */ //
                        /*     3 */ // line 2:
                        /*     4 */ // a0 = [0, 1]
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 2;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $elem148 = $scope146.$const147;
                        var $elem150 = $scope146.$const149;
                        var $loadlist151 = new Sk.builtins['list']([$elem148, $elem150]);
                        if ($loadlist151._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist151._uuid)) {
                                $loc.__refs__[$loadlist151._uuid] = [];
                            }
                            $loc.__refs__[$loadlist151._uuid].push("a0");
                        }
                        $loc.a0 = window.currentPythonRunner.reportValue($loadlist151, 'a0');
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
                        /*    13 */ // b0 = [2, 3]
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 3;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $elem153 = $scope146.$const152;
                        var $elem155 = $scope146.$const154;
                        var $loadlist156 = new Sk.builtins['list']([$elem153, $elem155]);
                        if ($loadlist156._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist156._uuid)) {
                                $loc.__refs__[$loadlist156._uuid] = [];
                            }
                            $loc.__refs__[$loadlist156._uuid].push("b0");
                        }
                        $loc.b0 = window.currentPythonRunner.reportValue($loadlist156, 'b0');
                        if (Sk.breakpoints('<stdin>.py', 6, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 6 --- */
                        /*    20 */ //
                        /*    21 */ // line 6:
                        /*    22 */ // def test(n, a0):
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 6;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        $scope157.co_name = new Sk.builtins['str']('test');
                        $scope157.co_varnames = ['n', 'a0'];
                        var $funcobj184 = new Sk.builtins['function']($scope157, $gbl);
                        if ($funcobj184._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($funcobj184._uuid)) {
                                $loc.__refs__[$funcobj184._uuid] = [];
                            }
                            $loc.__refs__[$funcobj184._uuid].push("test");
                        }
                        $loc.test = window.currentPythonRunner.reportValue($funcobj184, 'test');
                        if (Sk.breakpoints('<stdin>.py', 17, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 17, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 17 --- */
                        /*    29 */ //
                        /*    30 */ // line 17:
                        /*    31 */ // test(4, a0)
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 17;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        console.log('test1', '$loc.test', 'test');
                        var $loadname185 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname187 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname185, [$scope146.$const186, $loadname187]);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 17, 0);
                        }
                        var $call188 = $ret;
                        /*    38 */ //
                        /*    39 */ // line 17:
                        /*    40 */ // test(4, a0)
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 17;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        if (Sk.breakpoints('<stdin>.py', 19, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 19, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 19 --- */
                        /*    47 */ //
                        /*    48 */ // line 19:
                        /*    49 */ // print(a0[0])
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 19;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname189 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname190 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname190, $scope146.$const147, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr191 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname189, [$lsubscr191]);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 0);
                        }
                        var $call192 = $ret;
                        /*    56 */ //
                        /*    57 */ // line 19:
                        /*    58 */ // print(a0[0])
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 19;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        if (Sk.breakpoints('<stdin>.py', 21, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 21, 0);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 21 --- */
                        /*    65 */ //
                        /*    66 */ // line 21:
                        /*    67 */ // pass
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 21;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
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
    $scope146.$const186 = new Sk.builtin.int_(4);
    var $scope157 = (function $test158$(n, a0) {
        var c0, v; /* locals */
        var a0, a0, a0, a0, a0, c0, c0, c0, n, n, n, n, v, v, $lsubscr165, $loadgbl166, $loadgbl166, $lsubscr167,
            $loadgbl169, $loadgbl169, $lsubscr170, $loadgbl169, $lsubscr170, $lsubscr171, $compareres174, $loadgbl177,
            $binop179, $loadgbl181, $loadgbl181, $lsubscr182;
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
            a0 = susp.$tmps.a0;
            c0 = susp.$tmps.c0;
            n = susp.$tmps.n;
            v = susp.$tmps.v;
            $lsubscr165 = susp.$tmps.$lsubscr165;
            $loadgbl166 = susp.$tmps.$loadgbl166;
            $lsubscr167 = susp.$tmps.$lsubscr167;
            $loadgbl169 = susp.$tmps.$loadgbl169;
            $lsubscr170 = susp.$tmps.$lsubscr170;
            $lsubscr171 = susp.$tmps.$lsubscr171;
            $compareres174 = susp.$tmps.$compareres174;
            $loadgbl177 = susp.$tmps.$loadgbl177;
            $binop179 = susp.$tmps.$binop179;
            $loadgbl181 = susp.$tmps.$loadgbl181;
            $lsubscr182 = susp.$tmps.$lsubscr182;
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
            susp._argnames = ["n", "a0"];
            susp._scopename = '$scope157';
            var $__tmpsReferences__ = {};
            if (a0 && a0.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(a0._uuid)) {
                    $__tmpsReferences__[a0._uuid] = [];
                }
                $__tmpsReferences__[a0._uuid].push("a0");
            }
            if (c0 && c0.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(c0._uuid)) {
                    $__tmpsReferences__[c0._uuid] = [];
                }
                $__tmpsReferences__[c0._uuid].push("c0");
            }
            if (n && n.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(n._uuid)) {
                    $__tmpsReferences__[n._uuid] = [];
                }
                $__tmpsReferences__[n._uuid].push("n");
            }
            if (v && v.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(v._uuid)) {
                    $__tmpsReferences__[v._uuid] = [];
                }
                $__tmpsReferences__[v._uuid].push("v");
            }
            if ($lsubscr165 && $lsubscr165.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr165._uuid)) {
                    $__tmpsReferences__[$lsubscr165._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr165._uuid].push("$lsubscr165");
            }
            if ($loadgbl166 && $loadgbl166.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl166._uuid)) {
                    $__tmpsReferences__[$loadgbl166._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl166._uuid].push("$loadgbl166");
            }
            if ($lsubscr167 && $lsubscr167.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr167._uuid)) {
                    $__tmpsReferences__[$lsubscr167._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr167._uuid].push("$lsubscr167");
            }
            if ($loadgbl169 && $loadgbl169.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl169._uuid)) {
                    $__tmpsReferences__[$loadgbl169._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl169._uuid].push("$loadgbl169");
            }
            if ($lsubscr170 && $lsubscr170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr170._uuid)) {
                    $__tmpsReferences__[$lsubscr170._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr170._uuid].push("$lsubscr170");
            }
            if ($lsubscr171 && $lsubscr171.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr171._uuid)) {
                    $__tmpsReferences__[$lsubscr171._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr171._uuid].push("$lsubscr171");
            }
            if ($compareres174 && $compareres174.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($compareres174._uuid)) {
                    $__tmpsReferences__[$compareres174._uuid] = [];
                }
                $__tmpsReferences__[$compareres174._uuid].push("$compareres174");
            }
            if ($loadgbl177 && $loadgbl177.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl177._uuid)) {
                    $__tmpsReferences__[$loadgbl177._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl177._uuid].push("$loadgbl177");
            }
            if ($binop179 && $binop179.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($binop179._uuid)) {
                    $__tmpsReferences__[$binop179._uuid] = [];
                }
                $__tmpsReferences__[$binop179._uuid].push("$binop179");
            }
            if ($loadgbl181 && $loadgbl181.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl181._uuid)) {
                    $__tmpsReferences__[$loadgbl181._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl181._uuid].push("$loadgbl181");
            }
            if ($lsubscr182 && $lsubscr182.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr182._uuid)) {
                    $__tmpsReferences__[$lsubscr182._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr182._uuid].push("$lsubscr182");
            }
            susp.$tmps = {
                "a0": a0,
                "c0": c0,
                "n": n,
                "v": v,
                "$lsubscr165": $lsubscr165,
                "$loadgbl166": $loadgbl166,
                "$lsubscr167": $lsubscr167,
                "$loadgbl169": $loadgbl169,
                "$lsubscr170": $lsubscr170,
                "$lsubscr171": $lsubscr171,
                "$compareres174": $compareres174,
                "$loadgbl177": $loadgbl177,
                "$binop179": $binop179,
                "$loadgbl181": $loadgbl181,
                "$lsubscr182": $lsubscr182,
                "__refs__": $__tmpsReferences__
            };
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
                        if (n === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'n\' referenced before assignment');
                        }
                        /*    74 */
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*    75 */
                        if (Sk.breakpoints('<stdin>.py', 7, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 4);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 7 --- */
                        /*    76 */ //
                        /*    77 */ // line 7:
                        /*    78 */ //     v = "test1"
                        /*    79 */ //     ^
                        /*    80 */ //
                        /*    81 */
                        $currLineNo = 7;
                        /*    82 */
                        $currColNo = 4;
                        /*    83 */
                        /*    84 */
                        v = $scope157.$const159;
                        if (Sk.breakpoints('<stdin>.py', 8, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 4);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 8 --- */
                        /*    85 */ //
                        /*    86 */ // line 8:
                        /*    87 */ //     c0 = [a0, b0]
                        /*    88 */ //     ^
                        /*    89 */ //
                        /*    90 */
                        $currLineNo = 8;
                        /*    91 */
                        $currColNo = 4;
                        /*    92 */
                        /*    93 */
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*    94 */
                        var $elem160 = a0;
                        console.log('test2', 'b0');
                        var $loadgbl161 = Sk.misceval.loadname('b0', $gbl);
                        var $elem162 = $loadgbl161;
                        var $loadlist163 = new Sk.builtins['list']([$elem160, $elem162]);
                        c0 = $loadlist163;
                        if (Sk.breakpoints('<stdin>.py', 9, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 4);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 9 --- */
                        /*    95 */ //
                        /*    96 */ // line 9:
                        /*    97 */ //     c0[0][0] = n
                        /*    98 */ //     ^
                        /*    99 */ //
                        /*   100 */
                        $currLineNo = 9;
                        /*   101 */
                        $currColNo = 4;
                        /*   102 */
                        /*   103 */
                        if (n === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'n\' referenced before assignment');
                        }
                        /*   104 */
                        if (c0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c0\' referenced before assignment');
                        }
                        /*   105 */
                        $ret = Sk.abstr.objectGetItem(c0, $scope157.$const164, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr165 = $ret;
                        $lsubscr165 = $lsubscr165.clone(n);
                        $ret = Sk.abstr.objectSetItem($lsubscr165, $scope157.$const164, n, true);
                        var $__cloned_references = {}
                        $__cloned_references[$lsubscr165._uuid] = $lsubscr165;
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr165);
                        debugger;
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr165);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr165);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr165);
                            }
                        }
                        var $__correspondences__ = Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr165);
                        if (n && n.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(n._uuid)) {
                            n = $__correspondences__[n._uuid];
                        }
                        if (a0 && a0.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(a0._uuid)) {
                            a0 = $__correspondences__[a0._uuid];
                        }
                        if (v && v.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(v._uuid)) {
                            v = $__correspondences__[v._uuid];
                        }
                        if (c0 && c0.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(c0._uuid)) {
                            c0 = $__correspondences__[c0._uuid];
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 10, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 4);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 10 --- */
                        /*   106 */ //
                        /*   107 */ // line 10:
                        /*   108 */ //     print(a0[0])
                        /*   109 */ //     ^
                        /*   110 */ //
                        /*   111 */
                        $currLineNo = 10;
                        /*   112 */
                        $currColNo = 4;
                        /*   113 */
                        /*   114 */
                        console.log('test2', 'print');
                        var $loadgbl166 = Sk.misceval.loadname('print', $gbl);
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*   115 */
                        $ret = Sk.abstr.objectGetItem(a0, $scope157.$const164, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr167 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl166, [$lsubscr167]);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 4);
                        }
                        var $call168 = $ret;
                        /*   116 */ //
                        /*   117 */ // line 10:
                        /*   118 */ //     print(a0[0])
                        /*   119 */ //     ^
                        /*   120 */ //
                        /*   121 */
                        $currLineNo = 10;
                        /*   122 */
                        $currColNo = 4;
                        /*   123 */
                        /*   124 */
                        if (Sk.breakpoints('<stdin>.py', 11, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 4);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 11 --- */
                        /*   125 */ //
                        /*   126 */ // line 11:
                        /*   127 */ //     print(c0[0][0])
                        /*   128 */ //     ^
                        /*   129 */ //
                        /*   130 */
                        $currLineNo = 11;
                        /*   131 */
                        $currColNo = 4;
                        /*   132 */
                        /*   133 */
                        console.log('test2', 'print');
                        var $loadgbl169 = Sk.misceval.loadname('print', $gbl);
                        if (c0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c0\' referenced before assignment');
                        }
                        /*   134 */
                        $ret = Sk.abstr.objectGetItem(c0, $scope157.$const164, true);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr170 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr170, $scope157.$const164, true);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr171 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl169, [$lsubscr171]);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 4);
                        }
                        var $call172 = $ret;
                        /*   135 */ //
                        /*   136 */ // line 11:
                        /*   137 */ //     print(c0[0][0])
                        /*   138 */ //     ^
                        /*   139 */ //
                        /*   140 */
                        $currLineNo = 11;
                        /*   141 */
                        $currColNo = 4;
                        /*   142 */
                        /*   143 */
                        if (Sk.breakpoints('<stdin>.py', 12, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 4);
                            $susp.$blk = 13;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- debug breakpoint for line 12 --- */
                        /*   144 */ //
                        /*   145 */ // line 12:
                        /*   146 */ //     v = "test"
                        /*   147 */ //     ^
                        /*   148 */ //
                        /*   149 */
                        $currLineNo = 12;
                        /*   150 */
                        $currColNo = 4;
                        /*   151 */
                        /*   152 */
                        v = $scope157.$const173;
                        if (Sk.breakpoints('<stdin>.py', 13, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 4);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 13 --- */
                        /*   153 */ //
                        /*   154 */ // line 13:
                        /*   155 */ //     if (n > 0):
                        /*   156 */ //     ^
                        /*   157 */ //
                        /*   158 */
                        $currLineNo = 13;
                        /*   159 */
                        $currColNo = 4;
                        /*   160 */
                        /*   161 */
                        if (n === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'n\' referenced before assignment');
                        }
                        /*   162 */
                        var $compareres174 = null;
                        $ret = Sk.builtin.bool(Sk.misceval.richCompareBool(n, $scope157.$const164, 'Gt', true));
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 8);
                        }
                        $compareres174 = $ret;
                        var $jfalse175 = ($ret === false || !Sk.misceval.isTrue($ret));
                        if ($jfalse175) {/*test failed */
                            $blk = 16;
                            continue;
                        }
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- done --- */
                        var $jfalse176 = ($compareres174 === false || !Sk.misceval.isTrue($compareres174));
                        if ($jfalse176) {/*test failed */
                            $blk = 15;
                            continue;
                        }
                        if (Sk.breakpoints('<stdin>.py', 14, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 8);
                            $susp.$blk = 18;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- debug breakpoint for line 14 --- */
                        /*   163 */ //
                        /*   164 */ // line 14:
                        /*   165 */ //         test(n - 1, a0)
                        /*   166 */ //         ^
                        /*   167 */ //
                        /*   168 */
                        $currLineNo = 14;
                        /*   169 */
                        $currColNo = 8;
                        /*   170 */
                        /*   171 */
                        console.log('test2', 'test');
                        var $loadgbl177 = Sk.misceval.loadname('test', $gbl);
                        if (n === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'n\' referenced before assignment');
                        }
                        /*   172 */
                        var $binop179 = Sk.abstr.numberBinOp(n, $scope157.$const178, 'Sub');
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*   173 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl177, [$binop179, a0]);
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 8);
                        }
                        var $call180 = $ret;
                        /*   174 */ //
                        /*   175 */ // line 14:
                        /*   176 */ //         test(n - 1, a0)
                        /*   177 */ //         ^
                        /*   178 */ //
                        /*   179 */
                        $currLineNo = 14;
                        /*   180 */
                        $currColNo = 8;
                        /*   181 */
                        /*   182 */
                        if (Sk.breakpoints('<stdin>.py', 15, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 15, 8);
                            $susp.$blk = 20;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- debug breakpoint for line 15 --- */
                        /*   183 */ //
                        /*   184 */ // line 15:
                        /*   185 */ //         print(a0[0])
                        /*   186 */ //         ^
                        /*   187 */ //
                        /*   188 */
                        $currLineNo = 15;
                        /*   189 */
                        $currColNo = 8;
                        /*   190 */
                        /*   191 */
                        console.log('test2', 'print');
                        var $loadgbl181 = Sk.misceval.loadname('print', $gbl);
                        if (a0 === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a0\' referenced before assignment');
                        }
                        /*   192 */
                        $ret = Sk.abstr.objectGetItem(a0, $scope157.$const164, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr182 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl181, [$lsubscr182]);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 15, 8);
                        }
                        var $call183 = $ret;
                        /*   193 */ //
                        /*   194 */ // line 15:
                        /*   195 */ //         print(a0[0])
                        /*   196 */ //         ^
                        /*   197 */ //
                        /*   198 */
                        $currLineNo = 15;
                        /*   199 */
                        $currColNo = 8;
                        /*   200 */
                        /*   201 */
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- end of if --- */
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
    $scope157.$const164 = new Sk.builtin.int_(0);
    $scope157.$const173 = new Sk.builtin.str('test');
    $scope157.$const178 = new Sk.builtin.int_(1);
    /*   202 */
    return $scope146;
}();