/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname157, $loadname160, $loadname160, $call162, $loadname163, $loadname166, $loadname166, $lattr167,
            $loadname169, $loadname169, $lattr170, $loadname169, $lattr170, $lattr171, $loadname172;
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
            $loadname157 = susp.$tmps.$loadname157;
            $loadname160 = susp.$tmps.$loadname160;
            $call162 = susp.$tmps.$call162;
            $loadname163 = susp.$tmps.$loadname163;
            $loadname166 = susp.$tmps.$loadname166;
            $lattr167 = susp.$tmps.$lattr167;
            $loadname169 = susp.$tmps.$loadname169;
            $lattr170 = susp.$tmps.$lattr170;
            $lattr171 = susp.$tmps.$lattr171;
            $loadname172 = susp.$tmps.$loadname172;
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
            if ($loadname157 && $loadname157.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname157._uuid)) {
                    $__tmpsReferences__[$loadname157._uuid] = [];
                }
                $__tmpsReferences__[$loadname157._uuid].push("$loadname157");
            }
            if ($loadname160 && $loadname160.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname160._uuid)) {
                    $__tmpsReferences__[$loadname160._uuid] = [];
                }
                $__tmpsReferences__[$loadname160._uuid].push("$loadname160");
            }
            if ($call162 && $call162.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call162._uuid)) {
                    $__tmpsReferences__[$call162._uuid] = [];
                }
                $__tmpsReferences__[$call162._uuid].push("$call162");
            }
            if ($loadname163 && $loadname163.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname163._uuid)) {
                    $__tmpsReferences__[$loadname163._uuid] = [];
                }
                $__tmpsReferences__[$loadname163._uuid].push("$loadname163");
            }
            if ($loadname166 && $loadname166.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname166._uuid)) {
                    $__tmpsReferences__[$loadname166._uuid] = [];
                }
                $__tmpsReferences__[$loadname166._uuid].push("$loadname166");
            }
            if ($lattr167 && $lattr167.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr167._uuid)) {
                    $__tmpsReferences__[$lattr167._uuid] = [];
                }
                $__tmpsReferences__[$lattr167._uuid].push("$lattr167");
            }
            if ($loadname169 && $loadname169.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname169._uuid)) {
                    $__tmpsReferences__[$loadname169._uuid] = [];
                }
                $__tmpsReferences__[$loadname169._uuid].push("$loadname169");
            }
            if ($lattr170 && $lattr170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr170._uuid)) {
                    $__tmpsReferences__[$lattr170._uuid] = [];
                }
                $__tmpsReferences__[$lattr170._uuid].push("$lattr170");
            }
            if ($lattr171 && $lattr171.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr171._uuid)) {
                    $__tmpsReferences__[$lattr171._uuid] = [];
                }
                $__tmpsReferences__[$lattr171._uuid].push("$lattr171");
            }
            if ($loadname172 && $loadname172.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname172._uuid)) {
                    $__tmpsReferences__[$loadname172._uuid] = [];
                }
                $__tmpsReferences__[$loadname172._uuid].push("$loadname172");
            }
            susp.$tmps = {
                "$loadname157": $loadname157,
                "$loadname160": $loadname160,
                "$call162": $call162,
                "$loadname163": $loadname163,
                "$loadname166": $loadname166,
                "$lattr167": $lattr167,
                "$loadname169": $loadname169,
                "$lattr170": $lattr170,
                "$lattr171": $lattr171,
                "$loadname172": $loadname172,
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
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 1 --- */
                        /*     2 */ //
                        /*     3 */ // line 1:
                        /*     4 */ // class Test1:
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $__loaded_references = {};
                        $scope147.co_name = new Sk.builtins['str']('Test1');
                        $ret = Sk.misceval.buildClass($gbl, $scope147, 'Test1', [], $cell);
                        if ($ret.hasOwnProperty('._uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($ret.hasOwnProperty('_uuid'))) {
                                $loc.__refs__[$ret._uuid] = [];
                            }
                            $loc.__refs__[$ret._uuid].push("Test1");
                        }
                        $loc.Test1 = window.currentPythonRunner.reportValue($ret, 'Test1');
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 5 --- */
                        /*    11 */ //
                        /*    12 */ // line 5:
                        /*    13 */ // class Test2:
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 5;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $__loaded_references = {};
                        $scope152.co_name = new Sk.builtins['str']('Test2');
                        $ret = Sk.misceval.buildClass($gbl, $scope152, 'Test2', [], $cell);
                        if ($ret.hasOwnProperty('._uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($ret.hasOwnProperty('_uuid'))) {
                                $loc.__refs__[$ret._uuid] = [];
                            }
                            $loc.__refs__[$ret._uuid].push("Test2");
                        }
                        $loc.Test2 = window.currentPythonRunner.reportValue($ret, 'Test2');
                        if (Sk.breakpoints('<stdin>.py', 9, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 9 --- */
                        /*    20 */ //
                        /*    21 */ // line 9:
                        /*    22 */ // test = Test1(2)
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 9;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $__loaded_references = {};
                        var $loadname157 = $loc.Test1 !== undefined ? $loc.Test1 : Sk.misceval.loadname('Test1', $gbl);
                        ;
                        if ($loadname157.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname157._uuid] = true;
                        } else if ($loadname157.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname157._scalar_uuid] = true;
                        }
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname157, [$scope146.$const158]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 9, 7);
                        }
                        var $call159 = $ret;
                        /*    29 */ //
                        /*    30 */ // line 9:
                        /*    31 */ // test = Test1(2)
                        /*    32 */ //        ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 9;
                        /*    35 */
                        $currColNo = 7;
                        /*    36 */
                        /*    37 */
                        var $__loaded_references = {};
                        if ($call159.hasOwnProperty('._uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($call159.hasOwnProperty('_uuid'))) {
                                $loc.__refs__[$call159._uuid] = [];
                            }
                            $loc.__refs__[$call159._uuid].push("test");
                        }
                        $loc.test = window.currentPythonRunner.reportValue($call159, 'test');
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 10 --- */
                        /*    38 */ //
                        /*    39 */ // line 10:
                        /*    40 */ // test.a = Test2("test")
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 10;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $__loaded_references = {};
                        var $loadname160 = $loc.Test2 !== undefined ? $loc.Test2 : Sk.misceval.loadname('Test2', $gbl);
                        ;
                        if ($loadname160.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname160._uuid] = true;
                        } else if ($loadname160.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname160._scalar_uuid] = true;
                        }
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname160, [$scope146.$const161]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 9);
                        }
                        var $call162 = $ret;
                        /*    47 */ //
                        /*    48 */ // line 10:
                        /*    49 */ // test.a = Test2("test")
                        /*    50 */ //          ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 10;
                        /*    53 */
                        $currColNo = 9;
                        /*    54 */
                        /*    55 */
                        var $__loaded_references = {};
                        var $loadname163 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;
                        if ($loadname163.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname163._uuid] = true;
                        } else if ($loadname163.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname163._scalar_uuid] = true;
                        }
                        $loadname163 = $loadname163.clone($call162);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname163._uuid] = $loadname163;
                        if ($loadname163.hasOwnProperty('$d')) {
                            $__cloned_references[$loadname163.$d._uuid] = $loadname163.$d;
                        }
                        $ret = Sk.abstr.sattr($loadname163, $scope146.$const164, $call162, true);
                        Sk.builtin.registerParentReferenceInChild($loadname163, $call162);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname163);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname163);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname163);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname163);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname163);
                        window.currentPythonRunner._debugger.updatePromiseReference($loadname163);
                        $loadname163.updateReferencesInside($__cloned_references);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 10, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 11, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 11 --- */
                        /*    56 */ //
                        /*    57 */ // line 11:
                        /*    58 */ // test.a.b = "plop"
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 11;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $__loaded_references = {};
                        var $loadname166 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;
                        if ($loadname166.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname166._uuid] = true;
                        } else if ($loadname166.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname166._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.gattr($loadname166, $scope146.$const164, true);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        var $lattr167 = $ret;
                        $lattr167 = $lattr167.clone($scope146.$const165);
                        var $__cloned_references = {};
                        $__cloned_references[$lattr167._uuid] = $lattr167;
                        if ($lattr167.hasOwnProperty('$d')) {
                            $__cloned_references[$lattr167.$d._uuid] = $lattr167.$d;
                        }
                        $ret = Sk.abstr.sattr($lattr167, $scope146.$const168, $scope146.$const165, true);
                        Sk.builtin.registerParentReferenceInChild($lattr167, $scope146.$const165);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lattr167);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lattr167);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lattr167);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lattr167);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lattr167);
                        window.currentPythonRunner._debugger.updatePromiseReference($lattr167);
                        $lattr167.updateReferencesInside($__cloned_references);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 12, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 12, 0);
                            $susp.$blk = 11;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 12 --- */
                        /*    65 */ //
                        /*    66 */ // line 12:
                        /*    67 */ // test.v = test.a.b
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 12;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        var $__loaded_references = {};
                        var $loadname169 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;
                        if ($loadname169.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname169._uuid] = true;
                        } else if ($loadname169.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname169._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.gattr($loadname169, $scope146.$const164, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 9);
                        }
                        var $lattr170 = $ret;
                        $ret = Sk.abstr.gattr($lattr170, $scope146.$const168, true);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 9);
                        }
                        var $lattr171 = $ret;
                        var $loadname172 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;
                        if ($loadname172.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname172._uuid] = true;
                        } else if ($loadname172.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname172._scalar_uuid] = true;
                        }
                        $loadname172 = $loadname172.clone($lattr171);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname172._uuid] = $loadname172;
                        if ($loadname172.hasOwnProperty('$d')) {
                            $__cloned_references[$loadname172.$d._uuid] = $loadname172.$d;
                        }
                        $ret = Sk.abstr.sattr($loadname172, $scope146.$const173, $lattr171, true);
                        Sk.builtin.registerParentReferenceInChild($loadname172, $lattr171);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname172);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname172);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname172);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname172);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname172);
                        window.currentPythonRunner._debugger.updatePromiseReference($loadname172);
                        $loadname172.updateReferencesInside($__cloned_references);
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 13, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 0);
                            $susp.$blk = 15;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- debug breakpoint for line 13 --- */
                        /*    74 */ //
                        /*    75 */ // line 13:
                        /*    76 */ // pass
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 13;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $__loaded_references = {};
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
    $scope146.$const158 = new Sk.builtin.int_(2);
    $scope146.$const161 = new Sk.builtin.str('test');
    $scope146.$const164 = new Sk.builtin.str('a');
    $scope146.$const165 = new Sk.builtin.str('plop');
    $scope146.$const168 = new Sk.builtin.str('b');
    $scope146.$const173 = new Sk.builtin.str('v');
    var $scope147 = (function $Test1$class_outer($globals, $locals, $cell) {
        var $gbl = $globals, $loc = $locals;
        $free = $globals;
        (function $Test1$_closure($cell) {
            var $blk = 0, $exc = [], $ret = undefined, $postfinally = undefined, $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0: /* --- class entry --- */
                            /*    83 */ //
                            /*    84 */ // line 2:
                            /*    85 */ //     def __init__(self, a):
                            /*    86 */ //     ^
                            /*    87 */ //
                            /*    88 */
                            $currLineNo = 2;
                            /*    89 */
                            $currColNo = 4;
                            /*    90 */
                            /*    91 */
                            var $__loaded_references = {};
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a'];
                            var $funcobj151 = new Sk.builtins['function']($scope148, $gbl);
                            if ($funcobj151.hasOwnProperty('._uuid')) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj151.hasOwnProperty('_uuid'))) {
                                    $loc.__refs__[$funcobj151._uuid] = [];
                                }
                                $loc.__refs__[$funcobj151._uuid].push("__init__");
                            }
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj151, '__init__');
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
    var $scope148 = (function $__init__149$(self, a) {
        var a, a, self, self;
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
            susp._argnames = ["self", "a"];
            susp._scopename = '$scope148';
            var $__tmpsReferences__ = {};
            if (a && a.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(a._uuid)) {
                    $__tmpsReferences__[a._uuid] = [];
                }
                $__tmpsReferences__[a._uuid].push("a");
            }
            if (self && self.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(self._uuid)) {
                    $__tmpsReferences__[self._uuid] = [];
                }
                $__tmpsReferences__[self._uuid].push("self");
            }
            susp.$tmps = {"a": a, "self": self, "__refs__": $__tmpsReferences__};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope148.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test1;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*    92 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    93 */
                        if (Sk.breakpoints('<stdin>.py', 3, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 3 --- */
                        /*    94 */ //
                        /*    95 */ // line 3:
                        /*    96 */ //         self.a = a
                        /*    97 */ //         ^
                        /*    98 */ //
                        /*    99 */
                        $currLineNo = 3;
                        /*   100 */
                        $currColNo = 8;
                        /*   101 */
                        /*   102 */
                        var $__loaded_references = {};
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   103 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   104 */
                        self = self.clone(a);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        if (self.hasOwnProperty('$d')) {
                            $__cloned_references[self.$d._uuid] = self.$d;
                        }
                        $ret = Sk.abstr.sattr(self, $scope148.$const150, a, true);
                        Sk.builtin.registerParentReferenceInChild(self, a);
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
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 3, 8);
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
    var $scope152 = (function $Test2$class_outer($globals, $locals, $cell) {
        var $gbl = $globals, $loc = $locals;
        $free = $globals;
        (function $Test2$_closure($cell) {
            var $blk = 0, $exc = [], $ret = undefined, $postfinally = undefined, $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0: /* --- class entry --- */
                            /*   105 */ //
                            /*   106 */ // line 6:
                            /*   107 */ //     def __init__(self, b):
                            /*   108 */ //     ^
                            /*   109 */ //
                            /*   110 */
                            $currLineNo = 6;
                            /*   111 */
                            $currColNo = 4;
                            /*   112 */
                            /*   113 */
                            var $__loaded_references = {};
                            $scope153.co_name = new Sk.builtins['str']('__init__');
                            $scope153.co_varnames = ['self', 'b'];
                            var $funcobj156 = new Sk.builtins['function']($scope153, $gbl);
                            if ($funcobj156.hasOwnProperty('._uuid')) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj156.hasOwnProperty('_uuid'))) {
                                    $loc.__refs__[$funcobj156._uuid] = [];
                                }
                                $loc.__refs__[$funcobj156._uuid].push("__init__");
                            }
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj156, '__init__');
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
    var $scope153 = (function $__init__154$(self, b) {
        var b, b, self, self;
        var $wakeFromSuspension = function () {
            var susp = $scope153.$wakingSuspension;
            $scope153.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            b = susp.$tmps.b;
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
                $scope153.$wakingSuspension = susp;
                return $scope153();
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
            susp._argnames = ["self", "b"];
            susp._scopename = '$scope153';
            var $__tmpsReferences__ = {};
            if (b && b.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(b._uuid)) {
                    $__tmpsReferences__[b._uuid] = [];
                }
                $__tmpsReferences__[b._uuid].push("b");
            }
            if (self && self.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(self._uuid)) {
                    $__tmpsReferences__[self._uuid] = [];
                }
                $__tmpsReferences__[self._uuid].push("self");
            }
            susp.$tmps = {"b": b, "self": self, "__refs__": $__tmpsReferences__};
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope153.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        $gbl.__class__ = this.Test2;
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   114 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   115 */
                        if (Sk.breakpoints('<stdin>.py', 7, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 7 --- */
                        /*   116 */ //
                        /*   117 */ // line 7:
                        /*   118 */ //         self.b = b
                        /*   119 */ //         ^
                        /*   120 */ //
                        /*   121 */
                        $currLineNo = 7;
                        /*   122 */
                        $currColNo = 8;
                        /*   123 */
                        /*   124 */
                        var $__loaded_references = {};
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   125 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   126 */
                        self = self.clone(b);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        if (self.hasOwnProperty('$d')) {
                            $__cloned_references[self.$d._uuid] = self.$d;
                        }
                        $ret = Sk.abstr.sattr(self, $scope153.$const155, b, true);
                        Sk.builtin.registerParentReferenceInChild(self, b);
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
                        if (b && b.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(b._uuid)) {
                            b = $__cloned_references[b._uuid];
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 7, 8);
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
    $scope153.$const155 = new Sk.builtin.str('b');
    /*   127 */
    return $scope146;
}();