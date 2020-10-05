/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname181, $loadname187, $loadname202, $loadname204, $loadname204, $lsubscr205, $loaddict208,
            $loadname209, $loadname210, $loadname211, $loadname210, $loadname211, $lattr213, $loadname210, $loadname211,
            $lattr213, $call214, $loadname216, $loadname216, $lattr218, $loadname220, $loadname221, $loadname220,
            $loadname221, $lattr223, $loadname220, $loadname221, $lattr223, $call224;
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
            $loadname181 = susp.$tmps.$loadname181;
            $loadname187 = susp.$tmps.$loadname187;
            $loadname202 = susp.$tmps.$loadname202;
            $loadname204 = susp.$tmps.$loadname204;
            $lsubscr205 = susp.$tmps.$lsubscr205;
            $loaddict208 = susp.$tmps.$loaddict208;
            $loadname209 = susp.$tmps.$loadname209;
            $loadname210 = susp.$tmps.$loadname210;
            $loadname211 = susp.$tmps.$loadname211;
            $lattr213 = susp.$tmps.$lattr213;
            $call214 = susp.$tmps.$call214;
            $loadname216 = susp.$tmps.$loadname216;
            $lattr218 = susp.$tmps.$lattr218;
            $loadname220 = susp.$tmps.$loadname220;
            $loadname221 = susp.$tmps.$loadname221;
            $lattr223 = susp.$tmps.$lattr223;
            $call224 = susp.$tmps.$call224;
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
            if ($loadname181 && $loadname181.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname181._uuid)) {
                    $__tmpsReferences__[$loadname181._uuid] = [];
                }
                $__tmpsReferences__[$loadname181._uuid].push("$loadname181");
            }
            if ($loadname187 && $loadname187.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname187._uuid)) {
                    $__tmpsReferences__[$loadname187._uuid] = [];
                }
                $__tmpsReferences__[$loadname187._uuid].push("$loadname187");
            }
            if ($loadname202 && $loadname202.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname202._uuid)) {
                    $__tmpsReferences__[$loadname202._uuid] = [];
                }
                $__tmpsReferences__[$loadname202._uuid].push("$loadname202");
            }
            if ($loadname204 && $loadname204.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname204._uuid)) {
                    $__tmpsReferences__[$loadname204._uuid] = [];
                }
                $__tmpsReferences__[$loadname204._uuid].push("$loadname204");
            }
            if ($lsubscr205 && $lsubscr205.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr205._uuid)) {
                    $__tmpsReferences__[$lsubscr205._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr205._uuid].push("$lsubscr205");
            }
            if ($loaddict208 && $loaddict208.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loaddict208._uuid)) {
                    $__tmpsReferences__[$loaddict208._uuid] = [];
                }
                $__tmpsReferences__[$loaddict208._uuid].push("$loaddict208");
            }
            if ($loadname209 && $loadname209.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname209._uuid)) {
                    $__tmpsReferences__[$loadname209._uuid] = [];
                }
                $__tmpsReferences__[$loadname209._uuid].push("$loadname209");
            }
            if ($loadname210 && $loadname210.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname210._uuid)) {
                    $__tmpsReferences__[$loadname210._uuid] = [];
                }
                $__tmpsReferences__[$loadname210._uuid].push("$loadname210");
            }
            if ($loadname211 && $loadname211.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname211._uuid)) {
                    $__tmpsReferences__[$loadname211._uuid] = [];
                }
                $__tmpsReferences__[$loadname211._uuid].push("$loadname211");
            }
            if ($lattr213 && $lattr213.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr213._uuid)) {
                    $__tmpsReferences__[$lattr213._uuid] = [];
                }
                $__tmpsReferences__[$lattr213._uuid].push("$lattr213");
            }
            if ($call214 && $call214.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call214._uuid)) {
                    $__tmpsReferences__[$call214._uuid] = [];
                }
                $__tmpsReferences__[$call214._uuid].push("$call214");
            }
            if ($loadname216 && $loadname216.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname216._uuid)) {
                    $__tmpsReferences__[$loadname216._uuid] = [];
                }
                $__tmpsReferences__[$loadname216._uuid].push("$loadname216");
            }
            if ($lattr218 && $lattr218.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr218._uuid)) {
                    $__tmpsReferences__[$lattr218._uuid] = [];
                }
                $__tmpsReferences__[$lattr218._uuid].push("$lattr218");
            }
            if ($loadname220 && $loadname220.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname220._uuid)) {
                    $__tmpsReferences__[$loadname220._uuid] = [];
                }
                $__tmpsReferences__[$loadname220._uuid].push("$loadname220");
            }
            if ($loadname221 && $loadname221.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname221._uuid)) {
                    $__tmpsReferences__[$loadname221._uuid] = [];
                }
                $__tmpsReferences__[$loadname221._uuid].push("$loadname221");
            }
            if ($lattr223 && $lattr223.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr223._uuid)) {
                    $__tmpsReferences__[$lattr223._uuid] = [];
                }
                $__tmpsReferences__[$lattr223._uuid].push("$lattr223");
            }
            if ($call224 && $call224.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call224._uuid)) {
                    $__tmpsReferences__[$call224._uuid] = [];
                }
                $__tmpsReferences__[$call224._uuid].push("$call224");
            }
            susp.$tmps = {
                "$loadname181": $loadname181,
                "$loadname187": $loadname187,
                "$loadname202": $loadname202,
                "$loadname204": $loadname204,
                "$lsubscr205": $lsubscr205,
                "$loaddict208": $loaddict208,
                "$loadname209": $loadname209,
                "$loadname210": $loadname210,
                "$loadname211": $loadname211,
                "$lattr213": $lattr213,
                "$call214": $call214,
                "$loadname216": $loadname216,
                "$lattr218": $lattr218,
                "$loadname220": $loadname220,
                "$loadname221": $loadname221,
                "$lattr223": $lattr223,
                "$call224": $call224,
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
                        if ($ret._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($ret._uuid)) {
                                $loc.__refs__[$ret._uuid] = [];
                            }
                            $loc.__refs__[$ret._uuid].push("Test");
                        }
                        $loc.Test = window.currentPythonRunner.reportValue($ret, 'Test');
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 18 --- */
                        /*    11 */ //
                        /*    12 */ // line 18:
                        /*    13 */ // test = Test(41, 1, "Bonjour")
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 18;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loadname181 = $loc.Test !== undefined ? $loc.Test : Sk.misceval.loadname('Test', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname181, [$scope146.$const182, $scope146.$const183, $scope146.$const184]);
                        debugger;
                        if ($ret && $ret.child && $ret.child.$tmps && $ret.child.$tmps.test && $ret.child.$tmps.test._uuid) {
                            window.currentPythonRunner._debugger.registerPromiseReference($ret.child.$tmps.test);
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 7);
                        }
                        var $call185 = $ret;
                        /*    20 */ //
                        /*    21 */ // line 18:
                        /*    22 */ // test = Test(41, 1, "Bonjour")
                        /*    23 */ //        ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 18;
                        /*    26 */
                        $currColNo = 7;
                        /*    27 */
                        /*    28 */
                        if ($call185._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($call185._uuid)) {
                                $loc.__refs__[$call185._uuid] = [];
                            }
                            $loc.__refs__[$call185._uuid].push("test");
                        }
                        $loc.test = window.currentPythonRunner.reportValue($call185, 'test');
                        if (Sk.breakpoints('<stdin>.py', 19, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 19, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 19 --- */
                        /*    29 */ //
                        /*    30 */ // line 19:
                        /*    31 */ // test.b = 10
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 19;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        var $loadname187 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log($loadname187);
                        $loadname187 = $loadname187.clone($scope146.$const186);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname187._uuid] = $loadname187;
                        $ret = Sk.abstr.sattr($loadname187, $scope146.$const188, $scope146.$const186, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname187);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname187);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname187);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname187);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname187);
                        window.currentPythonRunner._debugger.updatePromiseReference($loadname187);
                        $loadname187.updateReferencesInside($__cloned_references);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 20, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 20, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 20 --- */
                        /*    38 */ //
                        /*    39 */ // line 20:
                        /*    40 */ // i = 0
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 20;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        if ($scope146.$const189._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const189._uuid)) {
                                $loc.__refs__[$scope146.$const189._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const189._uuid].push("i");
                        }
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const189, 'i');
                        if (Sk.breakpoints('<stdin>.py', 21, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 21, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 21 --- */
                        /*    47 */ //
                        /*    48 */ // line 21:
                        /*    49 */ // i = 1
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 21;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        if ($scope146.$const183._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const183._uuid)) {
                                $loc.__refs__[$scope146.$const183._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const183._uuid].push("i");
                        }
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const183, 'i');
                        if (Sk.breakpoints('<stdin>.py', 22, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 22, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 22 --- */
                        /*    56 */ //
                        /*    57 */ // line 22:
                        /*    58 */ // tel = {'name': "John", 'number': "0123456789", 'inside': {'a': "val", 'c': "test"}}
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 22;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $loaddict198 = new Sk.builtins['dict']([$scope146.$const195, $scope146.$const194, $scope146.$const197, $scope146.$const196]);
                        var $loaddict200 = new Sk.builtins['dict']([$scope146.$const191, $scope146.$const190, $scope146.$const193, $scope146.$const192, $scope146.$const199, $loaddict198]);
                        if ($loaddict200._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loaddict200._uuid)) {
                                $loc.__refs__[$loaddict200._uuid] = [];
                            }
                            $loc.__refs__[$loaddict200._uuid].push("tel");
                        }
                        $loc.tel = window.currentPythonRunner.reportValue($loaddict200, 'tel');
                        if (Sk.breakpoints('<stdin>.py', 23, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 23, 0);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 23 --- */
                        /*    65 */ //
                        /*    66 */ // line 23:
                        /*    67 */ // tel['number'] = "0987654321"
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 23;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        var $loadname202 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$loadname202 = $loadname202.clone($scope146.$const201);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname202._uuid] = $loadname202;
                        $ret = Sk.abstr.objectSetItem($loadname202, $scope146.$const193, $scope146.$const201, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname202);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname202);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname202);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname202);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname202);
                        window.currentPythonRunner._debugger.updatePromiseReference($loadname202);
                        $loadname202.updateReferencesInside($__cloned_references);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 24, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 24, 0);
                            $susp.$blk = 11;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 24 --- */
                        /*    74 */ //
                        /*    75 */ // line 24:
                        /*    76 */ // tel['inside']['a'] = "newval"
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 24;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $loadname204 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname204, $scope146.$const199, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr205 = $ret;
                        $lsubscr205 = $lsubscr205.clone($scope146.$const203);
                        var $__cloned_references = {};
                        $__cloned_references[$lsubscr205._uuid] = $lsubscr205;
                        $ret = Sk.abstr.objectSetItem($lsubscr205, $scope146.$const195, $scope146.$const203, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr205);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr205);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr205);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr205);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr205);
                        window.currentPythonRunner._debugger.updatePromiseReference($lsubscr205);
                        $lsubscr205.updateReferencesInside($__cloned_references);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 25, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 25, 0);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 25 --- */
                        /*    83 */ //
                        /*    84 */ // line 25:
                        /*    85 */ // tel['inside'] = {'a': "vala", 'b': "valb"}
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 25;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        var $loaddict208 = new Sk.builtins['dict']([$scope146.$const195, $scope146.$const206, $scope146.$const188, $scope146.$const207]);
                        var $loadname209 = $loc.tel !== undefined ? $loc.tel : Sk.misceval.loadname('tel', $gbl);
                        ;$loadname209 = $loadname209.clone($loaddict208);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname209._uuid] = $loadname209;
                        $ret = Sk.abstr.objectSetItem($loadname209, $scope146.$const199, $loaddict208, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname209);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname209);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname209);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname209);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname209);
                        window.currentPythonRunner._debugger.updatePromiseReference($loadname209);
                        $loadname209.updateReferencesInside($__cloned_references);
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 26, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 26, 0);
                            $susp.$blk = 16;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- debug breakpoint for line 26 --- */
                        /*    92 */ //
                        /*    93 */ // line 26:
                        /*    94 */ // print(test.sum())
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 26;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        var $loadname210 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname211 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname211, $scope146.$const212, true);
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 26, 6);
                        }
                        var $lattr213 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr213);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 26, 6);
                        }
                        var $call214 = $ret;
                        /*   101 */ //
                        /*   102 */ // line 26:
                        /*   103 */ // print(test.sum())
                        /*   104 */ //       ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 26;
                        /*   107 */
                        $currColNo = 6;
                        /*   108 */
                        /*   109 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname210, [$call214]);
                        debugger;
                        if ($ret && $ret.child && $ret.child.$tmps && $ret.child.$tmps.test && $ret.child.$tmps.test._uuid) {
                            window.currentPythonRunner._debugger.registerPromiseReference($ret.child.$tmps.test);
                        }
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 26, 0);
                        }
                        var $call215 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 26:
                        /*   112 */ // print(test.sum())
                        /*   113 */ // ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 26;
                        /*   116 */
                        $currColNo = 0;
                        /*   117 */
                        /*   118 */
                        if (Sk.breakpoints('<stdin>.py', 27, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 27, 0);
                            $susp.$blk = 20;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- debug breakpoint for line 27 --- */
                        /*   119 */ //
                        /*   120 */ // line 27:
                        /*   121 */ // test.sum2()
                        /*   122 */ // ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 27;
                        /*   125 */
                        $currColNo = 0;
                        /*   126 */
                        /*   127 */
                        var $loadname216 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname216, $scope146.$const217, true);
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 27, 0);
                        }
                        var $lattr218 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr218);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 27, 0);
                        }
                        var $call219 = $ret;
                        /*   128 */ //
                        /*   129 */ // line 27:
                        /*   130 */ // test.sum2()
                        /*   131 */ // ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 27;
                        /*   134 */
                        $currColNo = 0;
                        /*   135 */
                        /*   136 */
                        if (Sk.breakpoints('<stdin>.py', 28, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 28, 0);
                            $susp.$blk = 23;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- debug breakpoint for line 28 --- */
                        /*   137 */ //
                        /*   138 */ // line 28:
                        /*   139 */ // print(test.getM())
                        /*   140 */ // ^
                        /*   141 */ //
                        /*   142 */
                        $currLineNo = 28;
                        /*   143 */
                        $currColNo = 0;
                        /*   144 */
                        /*   145 */
                        var $loadname220 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname221 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname221, $scope146.$const222, true);
                        $blk = 24;/* allowing case fallthrough */
                    case 24: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 28, 6);
                        }
                        var $lattr223 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr223);
                        $blk = 25;/* allowing case fallthrough */
                    case 25: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 28, 6);
                        }
                        var $call224 = $ret;
                        /*   146 */ //
                        /*   147 */ // line 28:
                        /*   148 */ // print(test.getM())
                        /*   149 */ //       ^
                        /*   150 */ //
                        /*   151 */
                        $currLineNo = 28;
                        /*   152 */
                        $currColNo = 6;
                        /*   153 */
                        /*   154 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname220, [$call224]);
                        debugger;
                        if ($ret && $ret.child && $ret.child.$tmps && $ret.child.$tmps.test && $ret.child.$tmps.test._uuid) {
                            window.currentPythonRunner._debugger.registerPromiseReference($ret.child.$tmps.test);
                        }
                        $blk = 26;/* allowing case fallthrough */
                    case 26: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 28, 0);
                        }
                        var $call225 = $ret;
                        /*   155 */ //
                        /*   156 */ // line 28:
                        /*   157 */ // print(test.getM())
                        /*   158 */ // ^
                        /*   159 */ //
                        /*   160 */
                        $currLineNo = 28;
                        /*   161 */
                        $currColNo = 0;
                        /*   162 */
                        /*   163 */
                        if (Sk.breakpoints('<stdin>.py', 29, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 29, 0);
                            $susp.$blk = 27;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 27;/* allowing case fallthrough */
                    case 27: /* --- debug breakpoint for line 29 --- */
                        /*   164 */ //
                        /*   165 */ // line 29:
                        /*   166 */ // pass
                        /*   167 */ // ^
                        /*   168 */ //
                        /*   169 */
                        $currLineNo = 29;
                        /*   170 */
                        $currColNo = 0;
                        /*   171 */
                        /*   172 */
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
    $scope146.$const182 = new Sk.builtin.int_(41);
    $scope146.$const183 = new Sk.builtin.int_(1);
    $scope146.$const184 = new Sk.builtin.str('Bonjour');
    $scope146.$const186 = new Sk.builtin.int_(10);
    $scope146.$const188 = new Sk.builtin.str('b');
    $scope146.$const189 = new Sk.builtin.int_(0);
    $scope146.$const190 = new Sk.builtin.str('John');
    $scope146.$const191 = new Sk.builtin.str('name');
    $scope146.$const192 = new Sk.builtin.str('0123456789');
    $scope146.$const193 = new Sk.builtin.str('number');
    $scope146.$const194 = new Sk.builtin.str('val');
    $scope146.$const195 = new Sk.builtin.str('a');
    $scope146.$const196 = new Sk.builtin.str('test');
    $scope146.$const197 = new Sk.builtin.str('c');
    $scope146.$const199 = new Sk.builtin.str('inside');
    $scope146.$const201 = new Sk.builtin.str('0987654321');
    $scope146.$const203 = new Sk.builtin.str('newval');
    $scope146.$const206 = new Sk.builtin.str('vala');
    $scope146.$const207 = new Sk.builtin.str('valb');
    $scope146.$const212 = new Sk.builtin.str('sum');
    $scope146.$const217 = new Sk.builtin.str('sum2');
    $scope146.$const222 = new Sk.builtin.str('getM');
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
                            /*   173 */ //
                            /*   174 */ // line 2:
                            /*   175 */ //     def __init__(self, a, b, m):
                            /*   176 */ //     ^
                            /*   177 */ //
                            /*   178 */
                            $currLineNo = 2;
                            /*   179 */
                            $currColNo = 4;
                            /*   180 */
                            /*   181 */
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a', 'b', 'm'];
                            var $funcobj153 = new Sk.builtins['function']($scope148, $gbl);
                            if ($funcobj153._uuid) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj153._uuid)) {
                                    $loc.__refs__[$funcobj153._uuid] = [];
                                }
                                $loc.__refs__[$funcobj153._uuid].push("__init__");
                            }
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj153, '__init__');
                            /*   182 */ //
                            /*   183 */ // line 7:
                            /*   184 */ //     def sum(self):
                            /*   185 */ //     ^
                            /*   186 */ //
                            /*   187 */
                            $currLineNo = 7;
                            /*   188 */
                            $currColNo = 4;
                            /*   189 */
                            /*   190 */
                            $scope154.co_name = new Sk.builtins['str']('sum');
                            $scope154.co_varnames = ['self'];
                            var $funcobj163 = new Sk.builtins['function']($scope154, $gbl);
                            if ($funcobj163._uuid) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj163._uuid)) {
                                    $loc.__refs__[$funcobj163._uuid] = [];
                                }
                                $loc.__refs__[$funcobj163._uuid].push("sum");
                            }
                            $loc.sum = window.currentPythonRunner.reportValue($funcobj163, 'sum');
                            /*   191 */ //
                            /*   192 */ // line 11:
                            /*   193 */ //     def sum2(obj):
                            /*   194 */ //     ^
                            /*   195 */ //
                            /*   196 */
                            $currLineNo = 11;
                            /*   197 */
                            $currColNo = 4;
                            /*   198 */
                            /*   199 */
                            $scope164.co_name = new Sk.builtins['str']('sum2');
                            $scope164.co_varnames = ['obj'];
                            var $funcobj175 = new Sk.builtins['function']($scope164, $gbl);
                            if ($funcobj175._uuid) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj175._uuid)) {
                                    $loc.__refs__[$funcobj175._uuid] = [];
                                }
                                $loc.__refs__[$funcobj175._uuid].push("sum2");
                            }
                            $loc.sum2 = window.currentPythonRunner.reportValue($funcobj175, 'sum2');
                            /*   200 */ //
                            /*   201 */ // line 15:
                            /*   202 */ //     def getM(self):
                            /*   203 */ //     ^
                            /*   204 */ //
                            /*   205 */
                            $currLineNo = 15;
                            /*   206 */
                            $currColNo = 4;
                            /*   207 */
                            /*   208 */
                            $scope176.co_name = new Sk.builtins['str']('getM');
                            $scope176.co_varnames = ['self'];
                            var $funcobj180 = new Sk.builtins['function']($scope176, $gbl);
                            if ($funcobj180._uuid) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj180._uuid)) {
                                    $loc.__refs__[$funcobj180._uuid] = [];
                                }
                                $loc.__refs__[$funcobj180._uuid].push("getM");
                            }
                            $loc.getM = window.currentPythonRunner.reportValue($funcobj180, 'getM');
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
            var $__tmpsReferences__ = {};
            if (a && a.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(a._uuid)) {
                    $__tmpsReferences__[a._uuid] = [];
                }
                $__tmpsReferences__[a._uuid].push("a");
            }
            if (b && b.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(b._uuid)) {
                    $__tmpsReferences__[b._uuid] = [];
                }
                $__tmpsReferences__[b._uuid].push("b");
            }
            if (m && m.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(m._uuid)) {
                    $__tmpsReferences__[m._uuid] = [];
                }
                $__tmpsReferences__[m._uuid].push("m");
            }
            if (self && self.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(self._uuid)) {
                    $__tmpsReferences__[self._uuid] = [];
                }
                $__tmpsReferences__[self._uuid].push("self");
            }
            susp.$tmps = {"a": a, "b": b, "m": m, "self": self, "__refs__": $__tmpsReferences__};
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
                        /*   209 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   210 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   211 */
                        if (m === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'m\' referenced before assignment');
                        }
                        /*   212 */
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
                        /*   213 */ //
                        /*   214 */ // line 3:
                        /*   215 */ //         self.a = a
                        /*   216 */ //         ^
                        /*   217 */ //
                        /*   218 */
                        $currLineNo = 3;
                        /*   219 */
                        $currColNo = 8;
                        /*   220 */
                        /*   221 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   222 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   223 */
                        console.log(self);
                        self = self.clone(a);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        $ret = Sk.abstr.sattr(self, $scope148.$const150, a, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, self);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, self);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, self);
                        window.currentPythonRunner._debugger.updatePromiseReference(self);
                        self.updateReferencesInside($__cloned_references);
                        if (self && self.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(self._uuid)) {
                            self = $__cloned_references[self._uuid];
                        }
                        if (a && a.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(a._uuid)) {
                            a = $__cloned_references[a._uuid];
                        }
                        if (b && b.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(b._uuid)) {
                            b = $__cloned_references[b._uuid];
                        }
                        if (m && m.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(m._uuid)) {
                            m = $__cloned_references[m._uuid];
                        }
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
                        /*   224 */ //
                        /*   225 */ // line 4:
                        /*   226 */ //         self.b = b
                        /*   227 */ //         ^
                        /*   228 */ //
                        /*   229 */
                        $currLineNo = 4;
                        /*   230 */
                        $currColNo = 8;
                        /*   231 */
                        /*   232 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   233 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   234 */
                        console.log(self);
                        self = self.clone(b);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        $ret = Sk.abstr.sattr(self, $scope148.$const151, b, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, self);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, self);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, self);
                        window.currentPythonRunner._debugger.updatePromiseReference(self);
                        self.updateReferencesInside($__cloned_references);
                        if (self && self.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(self._uuid)) {
                            self = $__cloned_references[self._uuid];
                        }
                        if (a && a.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(a._uuid)) {
                            a = $__cloned_references[a._uuid];
                        }
                        if (b && b.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(b._uuid)) {
                            b = $__cloned_references[b._uuid];
                        }
                        if (m && m.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(m._uuid)) {
                            m = $__cloned_references[m._uuid];
                        }
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
                        /*   235 */ //
                        /*   236 */ // line 5:
                        /*   237 */ //         self.m = m
                        /*   238 */ //         ^
                        /*   239 */ //
                        /*   240 */
                        $currLineNo = 5;
                        /*   241 */
                        $currColNo = 8;
                        /*   242 */
                        /*   243 */
                        if (m === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'m\' referenced before assignment');
                        }
                        /*   244 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   245 */
                        console.log(self);
                        self = self.clone(m);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        $ret = Sk.abstr.sattr(self, $scope148.$const152, m, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, self);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, self);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, self);
                        window.currentPythonRunner._debugger.updatePromiseReference(self);
                        self.updateReferencesInside($__cloned_references);
                        if (self && self.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(self._uuid)) {
                            self = $__cloned_references[self._uuid];
                        }
                        if (a && a.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(a._uuid)) {
                            a = $__cloned_references[a._uuid];
                        }
                        if (b && b.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(b._uuid)) {
                            b = $__cloned_references[b._uuid];
                        }
                        if (m && m.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(m._uuid)) {
                            m = $__cloned_references[m._uuid];
                        }
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
            var $__tmpsReferences__ = {};
            if (self && self.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(self._uuid)) {
                    $__tmpsReferences__[self._uuid] = [];
                }
                $__tmpsReferences__[self._uuid].push("self");
            }
            if ($lattr159 && $lattr159.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr159._uuid)) {
                    $__tmpsReferences__[$lattr159._uuid] = [];
                }
                $__tmpsReferences__[$lattr159._uuid].push("$lattr159");
            }
            susp.$tmps = {"self": self, "$lattr159": $lattr159, "__refs__": $__tmpsReferences__};
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
                        /*   246 */
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
                        /*   247 */ //
                        /*   248 */ // line 8:
                        /*   249 */ //         self.m = "newmessage"
                        /*   250 */ //         ^
                        /*   251 */ //
                        /*   252 */
                        $currLineNo = 8;
                        /*   253 */
                        $currColNo = 8;
                        /*   254 */
                        /*   255 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   256 */
                        console.log(self);
                        self = self.clone($scope154.$const156);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        $ret = Sk.abstr.sattr(self, $scope154.$const157, $scope154.$const156, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, self);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, self);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, self);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, self);
                        window.currentPythonRunner._debugger.updatePromiseReference(self);
                        self.updateReferencesInside($__cloned_references);
                        if (self && self.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(self._uuid)) {
                            self = $__cloned_references[self._uuid];
                        }
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
                        /*   257 */ //
                        /*   258 */ // line 9:
                        /*   259 */ //         return self.a + self.b
                        /*   260 */ //         ^
                        /*   261 */ //
                        /*   262 */
                        $currLineNo = 9;
                        /*   263 */
                        $currColNo = 8;
                        /*   264 */
                        /*   265 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   266 */
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
                        /*   267 */
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
    var $scope164 = (function $sum2165$(obj) {
        var obj, obj, $loadgbl168, $loadgbl168, $lattr170, $loadgbl171;
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
            obj = susp.$tmps.obj;
            $loadgbl168 = susp.$tmps.$loadgbl168;
            $lattr170 = susp.$tmps.$lattr170;
            $loadgbl171 = susp.$tmps.$loadgbl171;
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
            susp._name = 'sum2';
            susp._argnames = ["obj"];
            susp._scopename = '$scope164';
            var $__tmpsReferences__ = {};
            if (obj && obj.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(obj._uuid)) {
                    $__tmpsReferences__[obj._uuid] = [];
                }
                $__tmpsReferences__[obj._uuid].push("obj");
            }
            if ($loadgbl168 && $loadgbl168.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl168._uuid)) {
                    $__tmpsReferences__[$loadgbl168._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl168._uuid].push("$loadgbl168");
            }
            if ($lattr170 && $lattr170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr170._uuid)) {
                    $__tmpsReferences__[$lattr170._uuid] = [];
                }
                $__tmpsReferences__[$lattr170._uuid].push("$lattr170");
            }
            if ($loadgbl171 && $loadgbl171.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl171._uuid)) {
                    $__tmpsReferences__[$loadgbl171._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl171._uuid].push("$loadgbl171");
            }
            susp.$tmps = {
                "obj": obj,
                "$loadgbl168": $loadgbl168,
                "$lattr170": $lattr170,
                "$loadgbl171": $loadgbl171,
                "__refs__": $__tmpsReferences__
            };
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
                        if (obj === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'obj\' referenced before assignment');
                        }
                        /*   268 */
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
                        /*   269 */ //
                        /*   270 */ // line 12:
                        /*   271 */ //         obj.m = "newmessage obj"
                        /*   272 */ //         ^
                        /*   273 */ //
                        /*   274 */
                        $currLineNo = 12;
                        /*   275 */
                        $currColNo = 8;
                        /*   276 */
                        /*   277 */
                        if (obj === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'obj\' referenced before assignment');
                        }
                        /*   278 */
                        console.log(obj);
                        obj = obj.clone($scope164.$const166);
                        var $__cloned_references = {};
                        $__cloned_references[obj._uuid] = obj;
                        $ret = Sk.abstr.sattr(obj, $scope164.$const167, $scope164.$const166, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, obj);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, obj);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, obj);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, obj);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, obj);
                        window.currentPythonRunner._debugger.updatePromiseReference(obj);
                        obj.updateReferencesInside($__cloned_references);
                        if (obj && obj.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(obj._uuid)) {
                            obj = $__cloned_references[obj._uuid];
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 8);
                        }
                        if (Sk.breakpoints('<stdin>.py', 13, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 8);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 13 --- */
                        /*   279 */ //
                        /*   280 */ // line 13:
                        /*   281 */ //         return self.a + self.b
                        /*   282 */ //         ^
                        /*   283 */ //
                        /*   284 */
                        $currLineNo = 13;
                        /*   285 */
                        $currColNo = 8;
                        /*   286 */
                        /*   287 */
                        console.log('test2', 'self');
                        var $loadgbl168 = Sk.misceval.loadname('self', $gbl);
                        $ret = Sk.abstr.gattr($loadgbl168, $scope164.$const169, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 15);
                        }
                        var $lattr170 = $ret;
                        console.log('test2', 'self');
                        var $loadgbl171 = Sk.misceval.loadname('self', $gbl);
                        $ret = Sk.abstr.gattr($loadgbl171, $scope164.$const172, true);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 24);
                        }
                        var $lattr173 = $ret;
                        var $binop174 = Sk.abstr.numberBinOp($lattr170, $lattr173, 'Add');
                        return $binop174;
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
    $scope164.$const166 = new Sk.builtin.str('newmessage obj');
    $scope164.$const167 = new Sk.builtin.str('m');
    $scope164.$const169 = new Sk.builtin.str('a');
    $scope164.$const172 = new Sk.builtin.str('b');
    var $scope176 = (function $getM177$(self) {
        var self, self;
        var $wakeFromSuspension = function () {
            var susp = $scope176.$wakingSuspension;
            $scope176.$wakingSuspension = undefined;
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
                $scope176.$wakingSuspension = susp;
                return $scope176();
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
            susp._scopename = '$scope176';
            var $__tmpsReferences__ = {};
            if (self && self.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(self._uuid)) {
                    $__tmpsReferences__[self._uuid] = [];
                }
                $__tmpsReferences__[self._uuid].push("self");
            }
            susp.$tmps = {"self": self, "__refs__": $__tmpsReferences__};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope176.$wakingSuspension !== undefined) {
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
                        /*   288 */
                        if (Sk.breakpoints('<stdin>.py', 16, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 16 --- */
                        /*   289 */ //
                        /*   290 */ // line 16:
                        /*   291 */ //         return self.m
                        /*   292 */ //         ^
                        /*   293 */ //
                        /*   294 */
                        $currLineNo = 16;
                        /*   295 */
                        $currColNo = 8;
                        /*   296 */
                        /*   297 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   298 */
                        $ret = Sk.abstr.gattr(self, $scope176.$const178, true);
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 16, 15);
                        }
                        var $lattr179 = $ret;
                        return $lattr179;
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
    $scope176.$const178 = new Sk.builtin.str('m');
    /*   299 */
    return $scope146;
}();