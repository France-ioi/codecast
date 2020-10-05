/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname147, $loadname165, $loadname166, $loadname167, $loadname168, $loadname170, $loadname171,
            $loadname173, $loadname174;
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
            $loadname165 = susp.$tmps.$loadname165;
            $loadname166 = susp.$tmps.$loadname166;
            $loadname167 = susp.$tmps.$loadname167;
            $loadname168 = susp.$tmps.$loadname168;
            $loadname170 = susp.$tmps.$loadname170;
            $loadname171 = susp.$tmps.$loadname171;
            $loadname173 = susp.$tmps.$loadname173;
            $loadname174 = susp.$tmps.$loadname174;
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
            if ($loadname147 && $loadname147.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname147._uuid)) {
                    $__tmpsReferences__[$loadname147._uuid] = [];
                }
                $__tmpsReferences__[$loadname147._uuid].push("$loadname147");
            }
            if ($loadname165 && $loadname165.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname165._uuid)) {
                    $__tmpsReferences__[$loadname165._uuid] = [];
                }
                $__tmpsReferences__[$loadname165._uuid].push("$loadname165");
            }
            if ($loadname166 && $loadname166.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname166._uuid)) {
                    $__tmpsReferences__[$loadname166._uuid] = [];
                }
                $__tmpsReferences__[$loadname166._uuid].push("$loadname166");
            }
            if ($loadname167 && $loadname167.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname167._uuid)) {
                    $__tmpsReferences__[$loadname167._uuid] = [];
                }
                $__tmpsReferences__[$loadname167._uuid].push("$loadname167");
            }
            if ($loadname168 && $loadname168.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname168._uuid)) {
                    $__tmpsReferences__[$loadname168._uuid] = [];
                }
                $__tmpsReferences__[$loadname168._uuid].push("$loadname168");
            }
            if ($loadname170 && $loadname170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname170._uuid)) {
                    $__tmpsReferences__[$loadname170._uuid] = [];
                }
                $__tmpsReferences__[$loadname170._uuid].push("$loadname170");
            }
            if ($loadname171 && $loadname171.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname171._uuid)) {
                    $__tmpsReferences__[$loadname171._uuid] = [];
                }
                $__tmpsReferences__[$loadname171._uuid].push("$loadname171");
            }
            if ($loadname173 && $loadname173.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname173._uuid)) {
                    $__tmpsReferences__[$loadname173._uuid] = [];
                }
                $__tmpsReferences__[$loadname173._uuid].push("$loadname173");
            }
            if ($loadname174 && $loadname174.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname174._uuid)) {
                    $__tmpsReferences__[$loadname174._uuid] = [];
                }
                $__tmpsReferences__[$loadname174._uuid].push("$loadname174");
            }
            susp.$tmps = {
                "$loadname147": $loadname147,
                "$loadname165": $loadname165,
                "$loadname166": $loadname166,
                "$loadname167": $loadname167,
                "$loadname168": $loadname168,
                "$loadname170": $loadname170,
                "$loadname171": $loadname171,
                "$loadname173": $loadname173,
                "$loadname174": $loadname174,
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
                        /*     4 */ // print("cycle 2")
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname147 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname147, [$scope146.$const148]);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 1, 0);
                        }
                        var $call149 = $ret;
                        /*    11 */ //
                        /*    12 */ // line 1:
                        /*    13 */ // print("cycle 2")
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 1;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
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
                        /*    22 */ // a0 = [0, 1]
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 2;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $elem151 = $scope146.$const150;
                        var $elem153 = $scope146.$const152;
                        var $loadlist154 = new Sk.builtins['list']([$elem151, $elem153]);
                        if ($loadlist154._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist154._uuid)) {
                                $loc.__refs__[$loadlist154._uuid] = [];
                            }
                            $loc.__refs__[$loadlist154._uuid].push("a0");
                        }
                        $loc.a0 = window.currentPythonRunner.reportValue($loadlist154, 'a0');
                        if (Sk.breakpoints('<stdin>.py', 3, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 3 --- */
                        /*    29 */ //
                        /*    30 */ // line 3:
                        /*    31 */ // b0 = [a0, 3]
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 3;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        console.log('test1', '$loc.a0', 'a0');
                        var $loadname155 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;var $elem156 = $loadname155;
                        var $elem158 = $scope146.$const157;
                        var $loadlist159 = new Sk.builtins['list']([$elem156, $elem158]);
                        if ($loadlist159._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist159._uuid)) {
                                $loc.__refs__[$loadlist159._uuid] = [];
                            }
                            $loc.__refs__[$loadlist159._uuid].push("b0");
                        }
                        $loc.b0 = window.currentPythonRunner.reportValue($loadlist159, 'b0');
                        if (Sk.breakpoints('<stdin>.py', 4, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 4 --- */
                        /*    38 */ //
                        /*    39 */ // line 4:
                        /*    40 */ // c0 = [b0, 4]
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 4;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        console.log('test1', '$loc.b0', 'b0');
                        var $loadname160 = $loc.b0 !== undefined ? $loc.b0 : Sk.misceval.loadname('b0', $gbl);
                        ;var $elem161 = $loadname160;
                        var $elem163 = $scope146.$const162;
                        var $loadlist164 = new Sk.builtins['list']([$elem161, $elem163]);
                        if ($loadlist164._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist164._uuid)) {
                                $loc.__refs__[$loadlist164._uuid] = [];
                            }
                            $loc.__refs__[$loadlist164._uuid].push("c0");
                        }
                        $loc.c0 = window.currentPythonRunner.reportValue($loadlist164, 'c0');
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 5 --- */
                        /*    47 */ //
                        /*    48 */ // line 5:
                        /*    49 */ // a0[1] = c0
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 5;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        console.log('test1', '$loc.c0', 'c0');
                        var $loadname165 = $loc.c0 !== undefined ? $loc.c0 : Sk.misceval.loadname('c0', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname166 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;
                        if ($loadname165.hasOwnProperty('_uuid') && $loadname166._uuid === $loadname165._uuid) {
                            $loadname166 = $loadname166.clone($loadname166);
                            $loadname165 = $loadname166;
                        } else {
                            $loadname166 = $loadname166.clone($loadname165);
                        }
                        var $__cloned_references = {};
                        $__cloned_references[$loadname166._uuid] = $loadname166;
                        $ret = Sk.abstr.objectSetItem($loadname166, $scope146.$const152, $loadname165, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname166);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname166);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname166);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname166);
                            }
                        }
                        var $__correspondences__ = Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname166);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 8, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 8 --- */
                        /*    56 */ //
                        /*    57 */ // line 8:
                        /*    58 */ // print(a0)
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 8;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname167 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.a0', 'a0');
                        var $loadname168 = $loc.a0 !== undefined ? $loc.a0 : Sk.misceval.loadname('a0', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname167, [$loadname168]);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 8, 0);
                        }
                        var $call169 = $ret;
                        /*    65 */ //
                        /*    66 */ // line 8:
                        /*    67 */ // print(a0)
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
                            $susp.$blk = 10;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- debug breakpoint for line 10 --- */
                        /*    74 */ //
                        /*    75 */ // line 10:
                        /*    76 */ // print(b0)
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 10;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname170 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.b0', 'b0');
                        var $loadname171 = $loc.b0 !== undefined ? $loc.b0 : Sk.misceval.loadname('b0', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname170, [$loadname171]);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 0);
                        }
                        var $call172 = $ret;
                        /*    83 */ //
                        /*    84 */ // line 10:
                        /*    85 */ // print(b0)
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 10;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        if (Sk.breakpoints('<stdin>.py', 12, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 0);
                            $susp.$blk = 12;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- debug breakpoint for line 12 --- */
                        /*    92 */ //
                        /*    93 */ // line 12:
                        /*    94 */ // print(c0)
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 12;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname173 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.c0', 'c0');
                        var $loadname174 = $loc.c0 !== undefined ? $loc.c0 : Sk.misceval.loadname('c0', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname173, [$loadname174]);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        var $call175 = $ret;
                        /*   101 */ //
                        /*   102 */ // line 12:
                        /*   103 */ // print(c0)
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 12;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        if (Sk.breakpoints('<stdin>.py', 14, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 0);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 14 --- */
                        /*   110 */ //
                        /*   111 */ // line 14:
                        /*   112 */ // pass
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 14;
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
    $scope146.$const148 = new Sk.builtin.str('cycle 2');
    $scope146.$const150 = new Sk.builtin.int_(0);
    $scope146.$const152 = new Sk.builtin.int_(1);
    $scope146.$const157 = new Sk.builtin.int_(3);
    $scope146.$const162 = new Sk.builtin.int_(4);
    /*   119 */
    return $scope146;
}();