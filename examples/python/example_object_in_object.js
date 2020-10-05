/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname157, $loadname160, $loadname160, $call162, $loadname163, $loadname166, $loadname166, $lattr167,
            $loadname170, $loadname170, $lattr171, $loadname174, $loadname174, $lattr175, $loadname176, $loadname177,
            $loadname176, $loadname177, $lattr178, $loadname176, $loadname177, $lattr178, $lattr179, $loadname181,
            $loadname181, $call183, $elem184, $loadname185, $loadname189, $loadname190, $loadname189, $loadname190,
            $lattr191, $loadname193, $loadname193, $lattr194, $loadname193, $lattr194, $lattr195, $loadname193,
            $lattr194, $lattr195, $lsubscr196, $loadname197, $loadname198, $loadname197, $loadname198, $lattr199,
            $loadname197, $loadname198, $lattr199, $lattr200, $loadname197, $loadname198, $lattr199, $lattr200,
            $lsubscr201, $loadname197, $loadname198, $lattr199, $lattr200, $lsubscr201, $lattr202;
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
            $loadname170 = susp.$tmps.$loadname170;
            $lattr171 = susp.$tmps.$lattr171;
            $loadname174 = susp.$tmps.$loadname174;
            $lattr175 = susp.$tmps.$lattr175;
            $loadname176 = susp.$tmps.$loadname176;
            $loadname177 = susp.$tmps.$loadname177;
            $lattr178 = susp.$tmps.$lattr178;
            $lattr179 = susp.$tmps.$lattr179;
            $loadname181 = susp.$tmps.$loadname181;
            $call183 = susp.$tmps.$call183;
            $elem184 = susp.$tmps.$elem184;
            $loadname185 = susp.$tmps.$loadname185;
            $loadname189 = susp.$tmps.$loadname189;
            $loadname190 = susp.$tmps.$loadname190;
            $lattr191 = susp.$tmps.$lattr191;
            $loadname193 = susp.$tmps.$loadname193;
            $lattr194 = susp.$tmps.$lattr194;
            $lattr195 = susp.$tmps.$lattr195;
            $lsubscr196 = susp.$tmps.$lsubscr196;
            $loadname197 = susp.$tmps.$loadname197;
            $loadname198 = susp.$tmps.$loadname198;
            $lattr199 = susp.$tmps.$lattr199;
            $lattr200 = susp.$tmps.$lattr200;
            $lsubscr201 = susp.$tmps.$lsubscr201;
            $lattr202 = susp.$tmps.$lattr202;
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
            if ($loadname170 && $loadname170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname170._uuid)) {
                    $__tmpsReferences__[$loadname170._uuid] = [];
                }
                $__tmpsReferences__[$loadname170._uuid].push("$loadname170");
            }
            if ($lattr171 && $lattr171.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr171._uuid)) {
                    $__tmpsReferences__[$lattr171._uuid] = [];
                }
                $__tmpsReferences__[$lattr171._uuid].push("$lattr171");
            }
            if ($loadname174 && $loadname174.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname174._uuid)) {
                    $__tmpsReferences__[$loadname174._uuid] = [];
                }
                $__tmpsReferences__[$loadname174._uuid].push("$loadname174");
            }
            if ($lattr175 && $lattr175.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr175._uuid)) {
                    $__tmpsReferences__[$lattr175._uuid] = [];
                }
                $__tmpsReferences__[$lattr175._uuid].push("$lattr175");
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
            if ($lattr178 && $lattr178.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr178._uuid)) {
                    $__tmpsReferences__[$lattr178._uuid] = [];
                }
                $__tmpsReferences__[$lattr178._uuid].push("$lattr178");
            }
            if ($lattr179 && $lattr179.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr179._uuid)) {
                    $__tmpsReferences__[$lattr179._uuid] = [];
                }
                $__tmpsReferences__[$lattr179._uuid].push("$lattr179");
            }
            if ($loadname181 && $loadname181.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname181._uuid)) {
                    $__tmpsReferences__[$loadname181._uuid] = [];
                }
                $__tmpsReferences__[$loadname181._uuid].push("$loadname181");
            }
            if ($call183 && $call183.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call183._uuid)) {
                    $__tmpsReferences__[$call183._uuid] = [];
                }
                $__tmpsReferences__[$call183._uuid].push("$call183");
            }
            if ($elem184 && $elem184.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($elem184._uuid)) {
                    $__tmpsReferences__[$elem184._uuid] = [];
                }
                $__tmpsReferences__[$elem184._uuid].push("$elem184");
            }
            if ($loadname185 && $loadname185.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname185._uuid)) {
                    $__tmpsReferences__[$loadname185._uuid] = [];
                }
                $__tmpsReferences__[$loadname185._uuid].push("$loadname185");
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
            if ($lattr191 && $lattr191.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr191._uuid)) {
                    $__tmpsReferences__[$lattr191._uuid] = [];
                }
                $__tmpsReferences__[$lattr191._uuid].push("$lattr191");
            }
            if ($loadname193 && $loadname193.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname193._uuid)) {
                    $__tmpsReferences__[$loadname193._uuid] = [];
                }
                $__tmpsReferences__[$loadname193._uuid].push("$loadname193");
            }
            if ($lattr194 && $lattr194.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr194._uuid)) {
                    $__tmpsReferences__[$lattr194._uuid] = [];
                }
                $__tmpsReferences__[$lattr194._uuid].push("$lattr194");
            }
            if ($lattr195 && $lattr195.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr195._uuid)) {
                    $__tmpsReferences__[$lattr195._uuid] = [];
                }
                $__tmpsReferences__[$lattr195._uuid].push("$lattr195");
            }
            if ($lsubscr196 && $lsubscr196.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr196._uuid)) {
                    $__tmpsReferences__[$lsubscr196._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr196._uuid].push("$lsubscr196");
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
            if ($lattr199 && $lattr199.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr199._uuid)) {
                    $__tmpsReferences__[$lattr199._uuid] = [];
                }
                $__tmpsReferences__[$lattr199._uuid].push("$lattr199");
            }
            if ($lattr200 && $lattr200.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr200._uuid)) {
                    $__tmpsReferences__[$lattr200._uuid] = [];
                }
                $__tmpsReferences__[$lattr200._uuid].push("$lattr200");
            }
            if ($lsubscr201 && $lsubscr201.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr201._uuid)) {
                    $__tmpsReferences__[$lsubscr201._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr201._uuid].push("$lsubscr201");
            }
            if ($lattr202 && $lattr202.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lattr202._uuid)) {
                    $__tmpsReferences__[$lattr202._uuid] = [];
                }
                $__tmpsReferences__[$lattr202._uuid].push("$lattr202");
            }
            susp.$tmps = {
                "$loadname157": $loadname157,
                "$loadname160": $loadname160,
                "$call162": $call162,
                "$loadname163": $loadname163,
                "$loadname166": $loadname166,
                "$lattr167": $lattr167,
                "$loadname170": $loadname170,
                "$lattr171": $lattr171,
                "$loadname174": $loadname174,
                "$lattr175": $lattr175,
                "$loadname176": $loadname176,
                "$loadname177": $loadname177,
                "$lattr178": $lattr178,
                "$lattr179": $lattr179,
                "$loadname181": $loadname181,
                "$call183": $call183,
                "$elem184": $elem184,
                "$loadname185": $loadname185,
                "$loadname189": $loadname189,
                "$loadname190": $loadname190,
                "$lattr191": $lattr191,
                "$loadname193": $loadname193,
                "$lattr194": $lattr194,
                "$lattr195": $lattr195,
                "$lsubscr196": $lsubscr196,
                "$loadname197": $loadname197,
                "$loadname198": $loadname198,
                "$lattr199": $lattr199,
                "$lattr200": $lattr200,
                "$lsubscr201": $lsubscr201,
                "$lattr202": $lattr202,
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
                        /*     4 */ // class Test1:
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('Test1');
                        $ret = Sk.misceval.buildClass($gbl, $scope147, 'Test1', [], $cell);
                        if ($ret._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($ret._uuid)) {
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
                        $scope152.co_name = new Sk.builtins['str']('Test2');
                        $ret = Sk.misceval.buildClass($gbl, $scope152, 'Test2', [], $cell);
                        if ($ret._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($ret._uuid)) {
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
                        var $loadname157 = $loc.Test1 !== undefined ? $loc.Test1 : Sk.misceval.loadname('Test1', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname157, [$scope146.$const158]);
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
                        if ($call159._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($call159._uuid)) {
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
                        var $loadname160 = $loc.Test2 !== undefined ? $loc.Test2 : Sk.misceval.loadname('Test2', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname160, [$scope146.$const161]);
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
                        var $loadname163 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;console.log($loadname163);
                        $loadname163 = $loadname163.clone($call162);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname163._uuid] = $loadname163;
                        if ($loadname163.hasOwnProperty('$d')) {
                            $__cloned_references[$loadname163.$d._uuid] = $loadname163.$d;
                        }
                        $ret = Sk.abstr.sattr($loadname163, $scope146.$const164, $call162, true);
                        debugger;
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
                        var $loadname166 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname166, $scope146.$const164, true);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 11, 0);
                        }
                        var $lattr167 = $ret;
                        console.log($lattr167);
                        $lattr167 = $lattr167.clone($scope146.$const165);
                        var $__cloned_references = {};
                        $__cloned_references[$lattr167._uuid] = $lattr167;
                        if ($lattr167.hasOwnProperty('$d')) {
                            $__cloned_references[$lattr167.$d._uuid] = $lattr167.$d;
                        }
                        $ret = Sk.abstr.sattr($lattr167, $scope146.$const168, $scope146.$const165, true);
                        debugger;
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
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 12 --- */
                        /*    65 */ //
                        /*    66 */ // line 12:
                        /*    67 */ // test.a.c = 41
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 12;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        var $loadname170 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname170, $scope146.$const164, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
                        var $lattr171 = $ret;
                        console.log($lattr171);
                        $lattr171 = $lattr171.clone($scope146.$const169);
                        var $__cloned_references = {};
                        $__cloned_references[$lattr171._uuid] = $lattr171;
                        if ($lattr171.hasOwnProperty('$d')) {
                            $__cloned_references[$lattr171.$d._uuid] = $lattr171.$d;
                        }
                        $ret = Sk.abstr.sattr($lattr171, $scope146.$const172, $scope146.$const169, true);
                        debugger;
                        Sk.builtin.registerParentReferenceInChild($lattr171, $scope146.$const169);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lattr171);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lattr171);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lattr171);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lattr171);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lattr171);
                        window.currentPythonRunner._debugger.updatePromiseReference($lattr171);
                        $lattr171.updateReferencesInside($__cloned_references);
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 12, 0);
                        }
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
                        /*    74 */ //
                        /*    75 */ // line 13:
                        /*    76 */ // test.a.c = 42
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 13;
                        /*    80 */
                        $currColNo = 0;
                        /*    81 */
                        /*    82 */
                        var $loadname174 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname174, $scope146.$const164, true);
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
                        }
                        var $lattr175 = $ret;
                        console.log($lattr175);
                        $lattr175 = $lattr175.clone($scope146.$const173);
                        var $__cloned_references = {};
                        $__cloned_references[$lattr175._uuid] = $lattr175;
                        if ($lattr175.hasOwnProperty('$d')) {
                            $__cloned_references[$lattr175.$d._uuid] = $lattr175.$d;
                        }
                        $ret = Sk.abstr.sattr($lattr175, $scope146.$const172, $scope146.$const173, true);
                        debugger;
                        Sk.builtin.registerParentReferenceInChild($lattr175, $scope146.$const173);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lattr175);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lattr175);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lattr175);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lattr175);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lattr175);
                        window.currentPythonRunner._debugger.updatePromiseReference($lattr175);
                        $lattr175.updateReferencesInside($__cloned_references);
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 14, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 0);
                            $susp.$blk = 17;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- debug breakpoint for line 14 --- */
                        /*    83 */ //
                        /*    84 */ // line 14:
                        /*    85 */ // print(test.a.c)
                        /*    86 */ // ^
                        /*    87 */ //
                        /*    88 */
                        $currLineNo = 14;
                        /*    89 */
                        $currColNo = 0;
                        /*    90 */
                        /*    91 */
                        var $loadname176 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname177 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname177, $scope146.$const164, true);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 6);
                        }
                        var $lattr178 = $ret;
                        $ret = Sk.abstr.gattr($lattr178, $scope146.$const172, true);
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 6);
                        }
                        var $lattr179 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname176, [$lattr179]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 0);
                        }
                        var $call180 = $ret;
                        /*    92 */ //
                        /*    93 */ // line 14:
                        /*    94 */ // print(test.a.c)
                        /*    95 */ // ^
                        /*    96 */ //
                        /*    97 */
                        $currLineNo = 14;
                        /*    98 */
                        $currColNo = 0;
                        /*    99 */
                        /*   100 */
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 21;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- debug breakpoint for line 16 --- */
                        /*   101 */ //
                        /*   102 */ // line 16:
                        /*   103 */ // tab = [Test1(1), Test2(2)]
                        /*   104 */ // ^
                        /*   105 */ //
                        /*   106 */
                        $currLineNo = 16;
                        /*   107 */
                        $currColNo = 0;
                        /*   108 */
                        /*   109 */
                        var $loadname181 = $loc.Test1 !== undefined ? $loc.Test1 : Sk.misceval.loadname('Test1', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname181, [$scope146.$const182]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 16, 7);
                        }
                        var $call183 = $ret;
                        /*   110 */ //
                        /*   111 */ // line 16:
                        /*   112 */ // tab = [Test1(1), Test2(2)]
                        /*   113 */ //        ^
                        /*   114 */ //
                        /*   115 */
                        $currLineNo = 16;
                        /*   116 */
                        $currColNo = 7;
                        /*   117 */
                        /*   118 */
                        var $elem184 = $call183;
                        var $loadname185 = $loc.Test2 !== undefined ? $loc.Test2 : Sk.misceval.loadname('Test2', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname185, [$scope146.$const158]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 16, 17);
                        }
                        var $call186 = $ret;
                        /*   119 */ //
                        /*   120 */ // line 16:
                        /*   121 */ // tab = [Test1(1), Test2(2)]
                        /*   122 */ //                  ^
                        /*   123 */ //
                        /*   124 */
                        $currLineNo = 16;
                        /*   125 */
                        $currColNo = 17;
                        /*   126 */
                        /*   127 */
                        var $elem187 = $call186;
                        var $loadlist188 = new Sk.builtins['list']([$elem184, $elem187]);
                        if ($loadlist188._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist188._uuid)) {
                                $loc.__refs__[$loadlist188._uuid] = [];
                            }
                            $loc.__refs__[$loadlist188._uuid].push("tab");
                        }
                        $loc.tab = window.currentPythonRunner.reportValue($loadlist188, 'tab');
                        if (Sk.breakpoints('<stdin>.py', 17, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 17, 0);
                            $susp.$blk = 24;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 24;/* allowing case fallthrough */
                    case 24: /* --- debug breakpoint for line 17 --- */
                        /*   128 */ //
                        /*   129 */ // line 17:
                        /*   130 */ // test.a.tab = tab
                        /*   131 */ // ^
                        /*   132 */ //
                        /*   133 */
                        $currLineNo = 17;
                        /*   134 */
                        $currColNo = 0;
                        /*   135 */
                        /*   136 */
                        var $loadname189 = $loc.tab !== undefined ? $loc.tab : Sk.misceval.loadname('tab', $gbl);
                        ;var $loadname190 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname190, $scope146.$const164, true);
                        $blk = 25;/* allowing case fallthrough */
                    case 25: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 17, 0);
                        }
                        var $lattr191 = $ret;
                        console.log($lattr191);
                        $lattr191 = $lattr191.clone($loadname189);
                        var $__cloned_references = {};
                        $__cloned_references[$lattr191._uuid] = $lattr191;
                        if ($lattr191.hasOwnProperty('$d')) {
                            $__cloned_references[$lattr191.$d._uuid] = $lattr191.$d;
                        }
                        $ret = Sk.abstr.sattr($lattr191, $scope146.$const192, $loadname189, true);
                        debugger;
                        Sk.builtin.registerParentReferenceInChild($lattr191, $loadname189);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lattr191);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lattr191);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lattr191);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lattr191);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lattr191);
                        window.currentPythonRunner._debugger.updatePromiseReference($lattr191);
                        $lattr191.updateReferencesInside($__cloned_references);
                        $blk = 26;/* allowing case fallthrough */
                    case 26: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 17, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 27;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 27;/* allowing case fallthrough */
                    case 27: /* --- debug breakpoint for line 18 --- */
                        /*   137 */ //
                        /*   138 */ // line 18:
                        /*   139 */ // test.a.tab[1].a = 42
                        /*   140 */ // ^
                        /*   141 */ //
                        /*   142 */
                        $currLineNo = 18;
                        /*   143 */
                        $currColNo = 0;
                        /*   144 */
                        /*   145 */
                        var $loadname193 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname193, $scope146.$const164, true);
                        $blk = 28;/* allowing case fallthrough */
                    case 28: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 0);
                        }
                        var $lattr194 = $ret;
                        $ret = Sk.abstr.gattr($lattr194, $scope146.$const192, true);
                        $blk = 29;/* allowing case fallthrough */
                    case 29: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 0);
                        }
                        var $lattr195 = $ret;
                        $ret = Sk.abstr.objectGetItem($lattr195, $scope146.$const182, true);
                        $blk = 30;/* allowing case fallthrough */
                    case 30: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr196 = $ret;
                        console.log($lsubscr196);
                        $lsubscr196 = $lsubscr196.clone($scope146.$const173);
                        var $__cloned_references = {};
                        $__cloned_references[$lsubscr196._uuid] = $lsubscr196;
                        if ($lsubscr196.hasOwnProperty('$d')) {
                            $__cloned_references[$lsubscr196.$d._uuid] = $lsubscr196.$d;
                        }
                        $ret = Sk.abstr.sattr($lsubscr196, $scope146.$const164, $scope146.$const173, true);
                        debugger;
                        Sk.builtin.registerParentReferenceInChild($lsubscr196, $scope146.$const173);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr196);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr196);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr196);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr196);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr196);
                        window.currentPythonRunner._debugger.updatePromiseReference($lsubscr196);
                        $lsubscr196.updateReferencesInside($__cloned_references);
                        $blk = 31;/* allowing case fallthrough */
                    case 31: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 0);
                        }
                        if (Sk.breakpoints('<stdin>.py', 19, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 19, 0);
                            $susp.$blk = 32;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 32;/* allowing case fallthrough */
                    case 32: /* --- debug breakpoint for line 19 --- */
                        /*   146 */ //
                        /*   147 */ // line 19:
                        /*   148 */ // print(test.a.tab[1].a)
                        /*   149 */ // ^
                        /*   150 */ //
                        /*   151 */
                        $currLineNo = 19;
                        /*   152 */
                        $currColNo = 0;
                        /*   153 */
                        /*   154 */
                        var $loadname197 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname198 = $loc.test !== undefined ? $loc.test : Sk.misceval.loadname('test', $gbl);
                        ;$ret = Sk.abstr.gattr($loadname198, $scope146.$const164, true);
                        $blk = 33;/* allowing case fallthrough */
                    case 33: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 6);
                        }
                        var $lattr199 = $ret;
                        $ret = Sk.abstr.gattr($lattr199, $scope146.$const192, true);
                        $blk = 34;/* allowing case fallthrough */
                    case 34: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 6);
                        }
                        var $lattr200 = $ret;
                        $ret = Sk.abstr.objectGetItem($lattr200, $scope146.$const182, true);
                        $blk = 35;/* allowing case fallthrough */
                    case 35: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr201 = $ret;
                        $ret = Sk.abstr.gattr($lsubscr201, $scope146.$const164, true);
                        $blk = 36;/* allowing case fallthrough */
                    case 36: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 6);
                        }
                        var $lattr202 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname197, [$lattr202]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 37;/* allowing case fallthrough */
                    case 37: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 19, 0);
                        }
                        var $call203 = $ret;
                        /*   155 */ //
                        /*   156 */ // line 19:
                        /*   157 */ // print(test.a.tab[1].a)
                        /*   158 */ // ^
                        /*   159 */ //
                        /*   160 */
                        $currLineNo = 19;
                        /*   161 */
                        $currColNo = 0;
                        /*   162 */
                        /*   163 */
                        if (Sk.breakpoints('<stdin>.py', 20, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 20, 0);
                            $susp.$blk = 38;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 38;/* allowing case fallthrough */
                    case 38: /* --- debug breakpoint for line 20 --- */
                        /*   164 */ //
                        /*   165 */ // line 20:
                        /*   166 */ // pass
                        /*   167 */ // ^
                        /*   168 */ //
                        /*   169 */
                        $currLineNo = 20;
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
    $scope146.$const158 = new Sk.builtin.int_(2);
    $scope146.$const161 = new Sk.builtin.str('test');
    $scope146.$const164 = new Sk.builtin.str('a');
    $scope146.$const165 = new Sk.builtin.str('plop');
    $scope146.$const168 = new Sk.builtin.str('b');
    $scope146.$const169 = new Sk.builtin.int_(41);
    $scope146.$const172 = new Sk.builtin.str('c');
    $scope146.$const173 = new Sk.builtin.int_(42);
    $scope146.$const182 = new Sk.builtin.int_(1);
    $scope146.$const192 = new Sk.builtin.str('tab');
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
                            /*   173 */ //
                            /*   174 */ // line 2:
                            /*   175 */ //     def __init__(self, a):
                            /*   176 */ //     ^
                            /*   177 */ //
                            /*   178 */
                            $currLineNo = 2;
                            /*   179 */
                            $currColNo = 4;
                            /*   180 */
                            /*   181 */
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a'];
                            var $funcobj151 = new Sk.builtins['function']($scope148, $gbl);
                            if ($funcobj151._uuid) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj151._uuid)) {
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
                        /*   182 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   183 */
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
                        /*   184 */ //
                        /*   185 */ // line 3:
                        /*   186 */ //         self.a = a
                        /*   187 */ //         ^
                        /*   188 */ //
                        /*   189 */
                        $currLineNo = 3;
                        /*   190 */
                        $currColNo = 8;
                        /*   191 */
                        /*   192 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*   193 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   194 */
                        console.log(self);
                        self = self.clone(a);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        if (self.hasOwnProperty('$d')) {
                            $__cloned_references[self.$d._uuid] = self.$d;
                        }
                        $ret = Sk.abstr.sattr(self, $scope148.$const150, a, true);
                        debugger;
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
                            /*   195 */ //
                            /*   196 */ // line 6:
                            /*   197 */ //     def __init__(self, b):
                            /*   198 */ //     ^
                            /*   199 */ //
                            /*   200 */
                            $currLineNo = 6;
                            /*   201 */
                            $currColNo = 4;
                            /*   202 */
                            /*   203 */
                            $scope153.co_name = new Sk.builtins['str']('__init__');
                            $scope153.co_varnames = ['self', 'b'];
                            var $funcobj156 = new Sk.builtins['function']($scope153, $gbl);
                            if ($funcobj156._uuid) {
                                $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                                if (!$loc.__refs__.hasOwnProperty($funcobj156._uuid)) {
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
                        /*   204 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   205 */
                        if (Sk.breakpoints('<stdin>.py', 7, 8)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 7 --- */
                        /*   206 */ //
                        /*   207 */ // line 7:
                        /*   208 */ //         self.b = b
                        /*   209 */ //         ^
                        /*   210 */ //
                        /*   211 */
                        $currLineNo = 7;
                        /*   212 */
                        $currColNo = 8;
                        /*   213 */
                        /*   214 */
                        if (b === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'b\' referenced before assignment');
                        }
                        /*   215 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   216 */
                        console.log(self);
                        self = self.clone(b);
                        var $__cloned_references = {};
                        $__cloned_references[self._uuid] = self;
                        if (self.hasOwnProperty('$d')) {
                            $__cloned_references[self.$d._uuid] = self.$d;
                        }
                        $ret = Sk.abstr.sattr(self, $scope153.$const155, b, true);
                        debugger;
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
    /*   217 */
    return $scope146;
}();