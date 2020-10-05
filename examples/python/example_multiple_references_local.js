/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname177, $loadname178, $loadname180, $loadname181, $loadname180, $loadname181, $lsubscr182,
            $loadname184, $loadname185, $loadname184, $loadname185, $lsubscr186, $loadname184, $loadname185,
            $lsubscr186, $lsubscr187, $loadname189, $loadname190, $loadname191, $loadname193, $loadname194,
            $loadname193, $loadname194, $lsubscr195, $loadname197, $loadname198, $loadname197, $loadname198,
            $lsubscr199, $loadname197, $loadname198, $lsubscr199, $lsubscr200;
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
            $loadname178 = susp.$tmps.$loadname178;
            $loadname180 = susp.$tmps.$loadname180;
            $loadname181 = susp.$tmps.$loadname181;
            $lsubscr182 = susp.$tmps.$lsubscr182;
            $loadname184 = susp.$tmps.$loadname184;
            $loadname185 = susp.$tmps.$loadname185;
            $lsubscr186 = susp.$tmps.$lsubscr186;
            $lsubscr187 = susp.$tmps.$lsubscr187;
            $loadname189 = susp.$tmps.$loadname189;
            $loadname190 = susp.$tmps.$loadname190;
            $loadname191 = susp.$tmps.$loadname191;
            $loadname193 = susp.$tmps.$loadname193;
            $loadname194 = susp.$tmps.$loadname194;
            $lsubscr195 = susp.$tmps.$lsubscr195;
            $loadname197 = susp.$tmps.$loadname197;
            $loadname198 = susp.$tmps.$loadname198;
            $lsubscr199 = susp.$tmps.$lsubscr199;
            $lsubscr200 = susp.$tmps.$lsubscr200;
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
            if ($loadname177 && $loadname177.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname177._uuid)) {
                    $__tmpsReferences__[$loadname177._uuid] = [];
                }
                $__tmpsReferences__[$loadname177._uuid].push("$loadname177");
            }
            if ($loadname178 && $loadname178.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname178._uuid)) {
                    $__tmpsReferences__[$loadname178._uuid] = [];
                }
                $__tmpsReferences__[$loadname178._uuid].push("$loadname178");
            }
            if ($loadname180 && $loadname180.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname180._uuid)) {
                    $__tmpsReferences__[$loadname180._uuid] = [];
                }
                $__tmpsReferences__[$loadname180._uuid].push("$loadname180");
            }
            if ($loadname181 && $loadname181.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname181._uuid)) {
                    $__tmpsReferences__[$loadname181._uuid] = [];
                }
                $__tmpsReferences__[$loadname181._uuid].push("$loadname181");
            }
            if ($lsubscr182 && $lsubscr182.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr182._uuid)) {
                    $__tmpsReferences__[$lsubscr182._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr182._uuid].push("$lsubscr182");
            }
            if ($loadname184 && $loadname184.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname184._uuid)) {
                    $__tmpsReferences__[$loadname184._uuid] = [];
                }
                $__tmpsReferences__[$loadname184._uuid].push("$loadname184");
            }
            if ($loadname185 && $loadname185.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname185._uuid)) {
                    $__tmpsReferences__[$loadname185._uuid] = [];
                }
                $__tmpsReferences__[$loadname185._uuid].push("$loadname185");
            }
            if ($lsubscr186 && $lsubscr186.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr186._uuid)) {
                    $__tmpsReferences__[$lsubscr186._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr186._uuid].push("$lsubscr186");
            }
            if ($lsubscr187 && $lsubscr187.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr187._uuid)) {
                    $__tmpsReferences__[$lsubscr187._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr187._uuid].push("$lsubscr187");
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
            if ($loadname191 && $loadname191.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname191._uuid)) {
                    $__tmpsReferences__[$loadname191._uuid] = [];
                }
                $__tmpsReferences__[$loadname191._uuid].push("$loadname191");
            }
            if ($loadname193 && $loadname193.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname193._uuid)) {
                    $__tmpsReferences__[$loadname193._uuid] = [];
                }
                $__tmpsReferences__[$loadname193._uuid].push("$loadname193");
            }
            if ($loadname194 && $loadname194.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname194._uuid)) {
                    $__tmpsReferences__[$loadname194._uuid] = [];
                }
                $__tmpsReferences__[$loadname194._uuid].push("$loadname194");
            }
            if ($lsubscr195 && $lsubscr195.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr195._uuid)) {
                    $__tmpsReferences__[$lsubscr195._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr195._uuid].push("$lsubscr195");
            }
            if ($loadname197 && $loadname197.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname197._uuid)) {
                    $__tmpsReferences__[$loadname197._uuid] = [];
                }
                $__tmpsReferences__[$loadname197._uuid].push("$loadname197");
            }
            if ($loadname198 && $loadname198.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname198._uuid)) {
                    $__tmpsReferences__[$loadname198._uuid] = [];
                }
                $__tmpsReferences__[$loadname198._uuid].push("$loadname198");
            }
            if ($lsubscr199 && $lsubscr199.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr199._uuid)) {
                    $__tmpsReferences__[$lsubscr199._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr199._uuid].push("$lsubscr199");
            }
            if ($lsubscr200 && $lsubscr200.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr200._uuid)) {
                    $__tmpsReferences__[$lsubscr200._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr200._uuid].push("$lsubscr200");
            }
            susp.$tmps = {
                "$loadname177": $loadname177,
                "$loadname178": $loadname178,
                "$loadname180": $loadname180,
                "$loadname181": $loadname181,
                "$lsubscr182": $lsubscr182,
                "$loadname184": $loadname184,
                "$loadname185": $loadname185,
                "$lsubscr186": $lsubscr186,
                "$lsubscr187": $lsubscr187,
                "$loadname189": $loadname189,
                "$loadname190": $loadname190,
                "$loadname191": $loadname191,
                "$loadname193": $loadname193,
                "$loadname194": $loadname194,
                "$lsubscr195": $lsubscr195,
                "$loadname197": $loadname197,
                "$loadname198": $loadname198,
                "$lsubscr199": $lsubscr199,
                "$lsubscr200": $lsubscr200,
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
                            if (!$loc.__refs__.hasOwnProperty($loadlist151._uuid)) {
                                $loc.__refs__[$loadlist151._uuid] = [];
                            }
                            $loc.__refs__[$loadlist151._uuid].push("a");
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
                            if (!$loc.__refs__.hasOwnProperty($loadlist156._uuid)) {
                                $loc.__refs__[$loadlist156._uuid] = [];
                            }
                            $loc.__refs__[$loadlist156._uuid].push("b");
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
                            if (!$loc.__refs__.hasOwnProperty($loadlist161._uuid)) {
                                $loc.__refs__[$loadlist161._uuid] = [];
                            }
                            $loc.__refs__[$loadlist161._uuid].push("c");
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
                        var $funcobj169 = new Sk.builtins['function']($scope162, $gbl);
                        if ($funcobj169._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($funcobj169._uuid)) {
                                $loc.__refs__[$funcobj169._uuid] = [];
                            }
                            $loc.__refs__[$funcobj169._uuid].push("test");
                        }
                        $loc.test = window.currentPythonRunner.reportValue($funcobj169, 'test');
                        if (Sk.breakpoints('<stdin>.py', 9, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 9 --- */
                        /*    38 */ //
                        /*    39 */ // line 9:
                        /*    40 */ // def test2(a, c):
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 9;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        $scope170.co_name = new Sk.builtins['str']('test2');
                        $scope170.co_varnames = ['a', 'c'];
                        var $funcobj176 = new Sk.builtins['function']($scope170, $gbl);
                        if ($funcobj176._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($funcobj176._uuid)) {
                                $loc.__refs__[$funcobj176._uuid] = [];
                            }
                            $loc.__refs__[$funcobj176._uuid].push("test2");
                        }
                        $loc.test2 = window.currentPythonRunner.reportValue($funcobj176, 'test2');
                        if (Sk.breakpoints('<stdin>.py', 14, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 14 --- */
                        /*    47 */ //
                        /*    48 */ // line 14:
                        /*    49 */ // test(c)
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 14;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        console.log('test1', '$loc.test', 'test');
                        var $loadname177 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname178 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname177, [$loadname178]);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 0);
                        }
                        var $call179 = $ret;
                        /*    56 */ //
                        /*    57 */ // line 14:
                        /*    58 */ // test(c)
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 14;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 16 --- */
                        /*    65 */ //
                        /*    66 */ // line 16:
                        /*    67 */ // print(a[0])
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 16;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname180 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname181 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname181, $scope146.$const147, true);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr182 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname180, [$lsubscr182]);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 16, 0);
                        }
                        var $call183 = $ret;
                        /*    74 */ //
                        /*    75 */ // line 16:
                        /*    76 */ // print(a[0])
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 16;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        if (Sk.breakpoints('<stdin>.py', 17, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 17, 0);
                            $susp.$blk = 11;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 17 --- */
                        /*    83 */ //
                        /*    84 */ // line 17:
                        /*    85 */ // print(c[0][0])
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 17;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname184 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname185 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname185, $scope146.$const147, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr186 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr186, $scope146.$const147, true);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr187 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname184, [$lsubscr187]);
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 17, 0);
                        }
                        var $call188 = $ret;
                        /*    92 */ //
                        /*    93 */ // line 17:
                        /*    94 */ // print(c[0][0])
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 17;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        if (Sk.breakpoints('<stdin>.py', 19, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 19, 0);
                            $susp.$blk = 15;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- debug breakpoint for line 19 --- */
                        /*   101 */ //
                        /*   102 */ // line 19:
                        /*   103 */ // test2(a, c)
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 19;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        console.log('test1', '$loc.test2', 'test2');
                        var $loadname189 = $loc.test2 !== undefined ? $loc.test2 : Sk.misceval.loadname('test2', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname190 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname191 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname189, [$loadname190, $loadname191]);
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 0);
                        }
                        var $call192 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 19:
                        /*   112 */ // test2(a, c)
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 19;
                        /*   116 */
                        $currColNo = 0;
                        /*   117 */
                        /*   118 */
                        if (Sk.breakpoints('<stdin>.py', 21, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 21, 0);
                            $susp.$blk = 17;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- debug breakpoint for line 21 --- */
                        /*   119 */ //
                        /*   120 */ // line 21:
                        /*   121 */ // print(a[0])
                        /*   122 */ // ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 21;
                        /*   125 */
                        $currColNo = 0;
                        /*   126 */
                        /*   127 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname193 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a', 'a');
                        var $loadname194 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname194, $scope146.$const147, true);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr195 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname193, [$lsubscr195]);
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 21, 0);
                        }
                        var $call196 = $ret;
                        /*   128 */ //
                        /*   129 */ // line 21:
                        /*   130 */ // print(a[0])
                        /*   131 */ // ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 21;
                        /*   134 */
                        $currColNo = 0;
                        /*   135 */
                        /*   136 */
                        if (Sk.breakpoints('<stdin>.py', 22, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 22, 0);
                            $susp.$blk = 20;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- debug breakpoint for line 22 --- */
                        /*   137 */ //
                        /*   138 */ // line 22:
                        /*   139 */ // print(c[0][0])
                        /*   140 */ // ^
                        /*   141 */ //
                        /*   142 */
                        $currLineNo = 22;
                        /*   143 */
                        $currColNo = 0;
                        /*   144 */
                        /*   145 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname197 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c', 'c');
                        var $loadname198 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname198, $scope146.$const147, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr199 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr199, $scope146.$const147, true);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr200 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname197, [$lsubscr200]);
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 22, 0);
                        }
                        var $call201 = $ret;
                        /*   146 */ //
                        /*   147 */ // line 22:
                        /*   148 */ // print(c[0][0])
                        /*   149 */ // ^
                        /*   150 */ //
                        /*   151 */
                        $currLineNo = 22;
                        /*   152 */
                        $currColNo = 0;
                        /*   153 */
                        /*   154 */
                        if (Sk.breakpoints('<stdin>.py', 23, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 23, 0);
                            $susp.$blk = 24;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 24;/* allowing case fallthrough */
                    case 24: /* --- debug breakpoint for line 23 --- */
                        /*   155 */ //
                        /*   156 */ // line 23:
                        /*   157 */ // pass
                        /*   158 */ // ^
                        /*   159 */ //
                        /*   160 */
                        $currLineNo = 23;
                        /*   161 */
                        $currColNo = 0;
                        /*   162 */
                        /*   163 */
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
    var $scope162 = (function $test163$(c) {
        var v; /* locals */
        var c, c, v, v, $lsubscr167;
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
            var $__tmpsReferences__ = {};
            if (c && c.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(c._uuid)) {
                    $__tmpsReferences__[c._uuid] = [];
                }
                $__tmpsReferences__[c._uuid].push("c");
            }
            if (v && v.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(v._uuid)) {
                    $__tmpsReferences__[v._uuid] = [];
                }
                $__tmpsReferences__[v._uuid].push("v");
            }
            if ($lsubscr167 && $lsubscr167.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr167._uuid)) {
                    $__tmpsReferences__[$lsubscr167._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr167._uuid].push("$lsubscr167");
            }
            susp.$tmps = {"c": c, "v": v, "$lsubscr167": $lsubscr167, "__refs__": $__tmpsReferences__};
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
                        /*   164 */
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
                        /*   165 */ //
                        /*   166 */ // line 6:
                        /*   167 */ //     v = "test1"
                        /*   168 */ //     ^
                        /*   169 */ //
                        /*   170 */
                        $currLineNo = 6;
                        /*   171 */
                        $currColNo = 4;
                        /*   172 */
                        /*   173 */
                        v = $scope162.$const164;
                        if (Sk.breakpoints('<stdin>.py', 7, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 4);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 7 --- */
                        /*   174 */ //
                        /*   175 */ // line 7:
                        /*   176 */ //     c[0][0] = 42
                        /*   177 */ //     ^
                        /*   178 */ //
                        /*   179 */
                        $currLineNo = 7;
                        /*   180 */
                        $currColNo = 4;
                        /*   181 */
                        /*   182 */
                        if (c === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c\' referenced before assignment');
                        }
                        /*   183 */
                        $ret = Sk.abstr.objectGetItem(c, $scope162.$const166, true);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr167 = $ret;
                        debugger;
                        $lsubscr167 = $lsubscr167.clone($scope162.$const165);
                        var $__cloned_references = {};
                        $__cloned_references[$lsubscr167._uuid] = $lsubscr167;
                        $ret = Sk.abstr.objectSetItem($lsubscr167, $scope162.$const166, $scope162.$const165, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr167);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr167);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr167);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr167);
                            }
                        }
                        var $__correspondences__ = Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr167);
                        $lsubscr167.updateReferencesInside($__cloned_references);
                        if (c && c.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(c._uuid)) {
                            c = $__correspondences__[c._uuid];
                        }
                        if (v && v.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(v._uuid)) {
                            v = $__correspondences__[v._uuid];
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 8, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 4);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 8 --- */
                        /*   184 */ //
                        /*   185 */ // line 8:
                        /*   186 */ //     v = "test"
                        /*   187 */ //     ^
                        /*   188 */ //
                        /*   189 */
                        $currLineNo = 8;
                        /*   190 */
                        $currColNo = 4;
                        /*   191 */
                        /*   192 */
                        v = $scope162.$const168;
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
    $scope162.$const164 = new Sk.builtin.str('test1');
    $scope162.$const165 = new Sk.builtin.int_(42);
    $scope162.$const166 = new Sk.builtin.int_(0);
    $scope162.$const168 = new Sk.builtin.str('test');
    var $scope170 = (function $test2171$(a, c) {
        var v; /* locals */
        var a, a, c, v, v;
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
            a = susp.$tmps.a;
            c = susp.$tmps.c;
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
            susp._argnames = ["a", "c"];
            susp._scopename = '$scope170';
            var $__tmpsReferences__ = {};
            if (a && a.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(a._uuid)) {
                    $__tmpsReferences__[a._uuid] = [];
                }
                $__tmpsReferences__[a._uuid].push("a");
            }
            if (c && c.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(c._uuid)) {
                    $__tmpsReferences__[c._uuid] = [];
                }
                $__tmpsReferences__[c._uuid].push("c");
            }
            if (v && v.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(v._uuid)) {
                    $__tmpsReferences__[v._uuid] = [];
                }
                $__tmpsReferences__[v._uuid].push("v");
            }
            susp.$tmps = {"a": a, "c": c, "v": v, "__refs__": $__tmpsReferences__};
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
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   193 */
                        if (c === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'c\' referenced before assignment');
                        }
                        /*   194 */
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
                        /*   195 */ //
                        /*   196 */ // line 10:
                        /*   197 */ //     v = "test1"
                        /*   198 */ //     ^
                        /*   199 */ //
                        /*   200 */
                        $currLineNo = 10;
                        /*   201 */
                        $currColNo = 4;
                        /*   202 */
                        /*   203 */
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
                        /*   204 */ //
                        /*   205 */ // line 11:
                        /*   206 */ //     a[0] = 45
                        /*   207 */ //     ^
                        /*   208 */ //
                        /*   209 */
                        $currLineNo = 11;
                        /*   210 */
                        $currColNo = 4;
                        /*   211 */
                        /*   212 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   213 */
                        debugger;
                        a = a.clone($scope170.$const173);
                        var $__cloned_references = {};
                        $__cloned_references[a._uuid] = a;
                        $ret = Sk.abstr.objectSetItem(a, $scope170.$const174, $scope170.$const173, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, a);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, a);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, a);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, a);
                            }
                        }
                        var $__correspondences__ = Sk.builtin.changeReferences($__cloned_references, $gbl, a);
                        a.updateReferencesInside($__cloned_references);
                        if (a && a.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(a._uuid)) {
                            a = $__correspondences__[a._uuid];
                        }
                        if (c && c.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(c._uuid)) {
                            c = $__correspondences__[c._uuid];
                        }
                        if (v && v.hasOwnProperty('_uuid') && $__correspondences__.hasOwnProperty(v._uuid)) {
                            v = $__correspondences__[v._uuid];
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
                        /*   214 */ //
                        /*   215 */ // line 12:
                        /*   216 */ //     v = "test"
                        /*   217 */ //     ^
                        /*   218 */ //
                        /*   219 */
                        $currLineNo = 12;
                        /*   220 */
                        $currColNo = 4;
                        /*   221 */
                        /*   222 */
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
    /*   223 */
    return $scope146;
}();