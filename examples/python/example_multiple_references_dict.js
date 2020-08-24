/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname159, $loadname160, $loadname161, $loadname160, $loadname161, $lsubscr162, $loadname164,
            $loadname165, $loadname164, $loadname165, $lsubscr166, $loadname164, $loadname165, $lsubscr166, $lsubscr167,
            $loadname170, $loadname170, $lsubscr171, $loadname172, $loadname173, $loadname172, $loadname173,
            $lsubscr174, $loadname176, $loadname177, $loadname176, $loadname177, $lsubscr178, $loadname176,
            $loadname177, $lsubscr178, $lsubscr179;
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
            $loadname159 = susp.$tmps.$loadname159;
            $loadname160 = susp.$tmps.$loadname160;
            $loadname161 = susp.$tmps.$loadname161;
            $lsubscr162 = susp.$tmps.$lsubscr162;
            $loadname164 = susp.$tmps.$loadname164;
            $loadname165 = susp.$tmps.$loadname165;
            $lsubscr166 = susp.$tmps.$lsubscr166;
            $lsubscr167 = susp.$tmps.$lsubscr167;
            $loadname170 = susp.$tmps.$loadname170;
            $lsubscr171 = susp.$tmps.$lsubscr171;
            $loadname172 = susp.$tmps.$loadname172;
            $loadname173 = susp.$tmps.$loadname173;
            $lsubscr174 = susp.$tmps.$lsubscr174;
            $loadname176 = susp.$tmps.$loadname176;
            $loadname177 = susp.$tmps.$loadname177;
            $lsubscr178 = susp.$tmps.$lsubscr178;
            $lsubscr179 = susp.$tmps.$lsubscr179;
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
            if ($loadname159 && $loadname159.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname159._uuid)) {
                    $__tmpsReferences__[$loadname159._uuid] = [];
                }
                $__tmpsReferences__[$loadname159._uuid].push("$loadname159");
            }
            if ($loadname160 && $loadname160.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname160._uuid)) {
                    $__tmpsReferences__[$loadname160._uuid] = [];
                }
                $__tmpsReferences__[$loadname160._uuid].push("$loadname160");
            }
            if ($loadname161 && $loadname161.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname161._uuid)) {
                    $__tmpsReferences__[$loadname161._uuid] = [];
                }
                $__tmpsReferences__[$loadname161._uuid].push("$loadname161");
            }
            if ($lsubscr162 && $lsubscr162.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr162._uuid)) {
                    $__tmpsReferences__[$lsubscr162._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr162._uuid].push("$lsubscr162");
            }
            if ($loadname164 && $loadname164.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname164._uuid)) {
                    $__tmpsReferences__[$loadname164._uuid] = [];
                }
                $__tmpsReferences__[$loadname164._uuid].push("$loadname164");
            }
            if ($loadname165 && $loadname165.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname165._uuid)) {
                    $__tmpsReferences__[$loadname165._uuid] = [];
                }
                $__tmpsReferences__[$loadname165._uuid].push("$loadname165");
            }
            if ($lsubscr166 && $lsubscr166.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr166._uuid)) {
                    $__tmpsReferences__[$lsubscr166._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr166._uuid].push("$lsubscr166");
            }
            if ($lsubscr167 && $lsubscr167.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr167._uuid)) {
                    $__tmpsReferences__[$lsubscr167._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr167._uuid].push("$lsubscr167");
            }
            if ($loadname170 && $loadname170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname170._uuid)) {
                    $__tmpsReferences__[$loadname170._uuid] = [];
                }
                $__tmpsReferences__[$loadname170._uuid].push("$loadname170");
            }
            if ($lsubscr171 && $lsubscr171.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr171._uuid)) {
                    $__tmpsReferences__[$lsubscr171._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr171._uuid].push("$lsubscr171");
            }
            if ($loadname172 && $loadname172.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname172._uuid)) {
                    $__tmpsReferences__[$loadname172._uuid] = [];
                }
                $__tmpsReferences__[$loadname172._uuid].push("$loadname172");
            }
            if ($loadname173 && $loadname173.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname173._uuid)) {
                    $__tmpsReferences__[$loadname173._uuid] = [];
                }
                $__tmpsReferences__[$loadname173._uuid].push("$loadname173");
            }
            if ($lsubscr174 && $lsubscr174.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr174._uuid)) {
                    $__tmpsReferences__[$lsubscr174._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr174._uuid].push("$lsubscr174");
            }
            if ($loadname176 && $loadname176.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname176._uuid)) {
                    $__tmpsReferences__[$loadname176._uuid] = [];
                }
                $__tmpsReferences__[$loadname176._uuid].push("$loadname176");
            }
            if ($loadname177 && $loadname177.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname177._uuid)) {
                    $__tmpsReferences__[$loadname177._uuid] = [];
                }
                $__tmpsReferences__[$loadname177._uuid].push("$loadname177");
            }
            if ($lsubscr178 && $lsubscr178.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr178._uuid)) {
                    $__tmpsReferences__[$lsubscr178._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr178._uuid].push("$lsubscr178");
            }
            if ($lsubscr179 && $lsubscr179.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr179._uuid)) {
                    $__tmpsReferences__[$lsubscr179._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr179._uuid].push("$lsubscr179");
            }
            susp.$tmps = {
                "$loadname159": $loadname159,
                "$loadname160": $loadname160,
                "$loadname161": $loadname161,
                "$lsubscr162": $lsubscr162,
                "$loadname164": $loadname164,
                "$loadname165": $loadname165,
                "$lsubscr166": $lsubscr166,
                "$lsubscr167": $lsubscr167,
                "$loadname170": $loadname170,
                "$lsubscr171": $lsubscr171,
                "$loadname172": $loadname172,
                "$loadname173": $loadname173,
                "$lsubscr174": $lsubscr174,
                "$loadname176": $loadname176,
                "$loadname177": $loadname177,
                "$lsubscr178": $lsubscr178,
                "$lsubscr179": $lsubscr179,
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
                        /*     4 */ // a = {'a': 0, 'b': 1}
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $loaddict151 = new Sk.builtins['dict']([$scope146.$const148, $scope146.$const147, $scope146.$const150, $scope146.$const149]);
                        if ($loaddict151._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loaddict151._uuid)) {
                                $loc.__refs__[$loaddict151._uuid] = [];
                            }
                            $loc.__refs__[$loaddict151._uuid].push("a");
                        }
                        $loc.a = window.currentPythonRunner.reportValue($loaddict151, 'a');
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
                        /*    13 */ // b = {'a': 2, 'b': 3}
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 2;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loaddict154 = new Sk.builtins['dict']([$scope146.$const148, $scope146.$const152, $scope146.$const150, $scope146.$const153]);
                        if ($loaddict154._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loaddict154._uuid)) {
                                $loc.__refs__[$loaddict154._uuid] = [];
                            }
                            $loc.__refs__[$loaddict154._uuid].push("b");
                        }
                        $loc.b = window.currentPythonRunner.reportValue($loaddict154, 'b');
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
                        /*    22 */ // c = {'a': a, 'b': b}
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 3;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $loadname155 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;var $loadname156 = $loc.b !== undefined ? $loc.b : Sk.misceval.loadname('b', $gbl);
                        ;var $loaddict157 = new Sk.builtins['dict']([$scope146.$const148, $loadname155, $scope146.$const150, $loadname156]);
                        if ($loaddict157._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loaddict157._uuid)) {
                                $loc.__refs__[$loaddict157._uuid] = [];
                            }
                            $loc.__refs__[$loaddict157._uuid].push("c");
                        }
                        $loc.c = window.currentPythonRunner.reportValue($loaddict157, 'c');
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
                        /*    31 */ // a['a'] = 5
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 5;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        var $loadname159 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;
                        debugger;
                        $loadname159 = $loadname159.clone($scope146.$const158);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname159._uuid] = $loadname159;
                        $ret = Sk.abstr.objectSetItem($loadname159, $scope146.$const148, $scope146.$const158, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname159);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname159);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname159);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname159);
                            }
                        }
                        var $__correspondences__ = Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname159);
                        $loadname159.updateReferencesInside($__cloned_references);
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
                        /*    40 */ // print(a['a'])
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 7;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $loadname160 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname161 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname161, $scope146.$const148, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr162 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname160, [$lsubscr162]);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 7, 0);
                        }
                        var $call163 = $ret;
                        /*    47 */ //
                        /*    48 */ // line 7:
                        /*    49 */ // print(a['a'])
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
                        /*    58 */ // print(c['a']['a'])
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 8;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $loadname164 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname165 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname165, $scope146.$const148, true);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr166 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr166, $scope146.$const148, true);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr167 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname164, [$lsubscr167]);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 8, 0);
                        }
                        var $call168 = $ret;
                        /*    65 */ //
                        /*    66 */ // line 8:
                        /*    67 */ // print(c['a']['a'])
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
                        /*    76 */ // c['a']['a'] = 6
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 10;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $loadname170 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname170, $scope146.$const148, true);
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr171 = $ret;
                        debugger;
                        $lsubscr171 = $lsubscr171.clone($scope146.$const169);
                        var $__cloned_references = {};
                        $__cloned_references[$lsubscr171._uuid] = $lsubscr171;
                        $ret = Sk.abstr.objectSetItem($lsubscr171, $scope146.$const148, $scope146.$const169, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr171);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr171);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr171);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr171);
                            }
                        }
                        var $__correspondences__ = Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr171);
                        $lsubscr171.updateReferencesInside($__cloned_references);
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
                        /*    85 */ // print(a['a'])
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 12;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        var $loadname172 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname173 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname173, $scope146.$const148, true);
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr174 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname172, [$lsubscr174]);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        var $call175 = $ret;
                        /*    92 */ //
                        /*    93 */ // line 12:
                        /*    94 */ // print(a['a'])
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
                        /*   103 */ // print(c['a']['a'])
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 13;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        var $loadname176 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname177 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname177, $scope146.$const148, true);
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr178 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr178, $scope146.$const148, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr179 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname176, [$lsubscr179]);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
                        }
                        var $call180 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 13:
                        /*   112 */ // print(c['a']['a'])
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
    $scope146.$const148 = new Sk.builtin.str('a');
    $scope146.$const149 = new Sk.builtin.int_(1);
    $scope146.$const150 = new Sk.builtin.str('b');
    $scope146.$const152 = new Sk.builtin.int_(2);
    $scope146.$const153 = new Sk.builtin.int_(3);
    $scope146.$const158 = new Sk.builtin.int_(5);
    $scope146.$const169 = new Sk.builtin.int_(6);
    /*   128 */
    return $scope146;
}();