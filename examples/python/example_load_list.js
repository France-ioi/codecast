/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname158, $iter160, $loadname158, $call159, $iter160, $loadname162, $loadname163, $binop164,
            $loadname162, $loadname163, $binop164, $lsubscr165, $binop166, $loadname167, $loadname168;
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
            $loadname158 = susp.$tmps.$loadname158;
            $iter160 = susp.$tmps.$iter160;
            $call159 = susp.$tmps.$call159;
            $loadname162 = susp.$tmps.$loadname162;
            $loadname163 = susp.$tmps.$loadname163;
            $binop164 = susp.$tmps.$binop164;
            $lsubscr165 = susp.$tmps.$lsubscr165;
            $binop166 = susp.$tmps.$binop166;
            $loadname167 = susp.$tmps.$loadname167;
            $loadname168 = susp.$tmps.$loadname168;
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
            if ($loadname158 && $loadname158.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname158._uuid)) {
                    $__tmpsReferences__[$loadname158._uuid] = [];
                }
                $__tmpsReferences__[$loadname158._uuid].push("$loadname158");
            }
            if ($iter160 && $iter160.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($iter160._uuid)) {
                    $__tmpsReferences__[$iter160._uuid] = [];
                }
                $__tmpsReferences__[$iter160._uuid].push("$iter160");
            }
            if ($call159 && $call159.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call159._uuid)) {
                    $__tmpsReferences__[$call159._uuid] = [];
                }
                $__tmpsReferences__[$call159._uuid].push("$call159");
            }
            if ($loadname162 && $loadname162.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname162._uuid)) {
                    $__tmpsReferences__[$loadname162._uuid] = [];
                }
                $__tmpsReferences__[$loadname162._uuid].push("$loadname162");
            }
            if ($loadname163 && $loadname163.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname163._uuid)) {
                    $__tmpsReferences__[$loadname163._uuid] = [];
                }
                $__tmpsReferences__[$loadname163._uuid].push("$loadname163");
            }
            if ($binop164 && $binop164.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($binop164._uuid)) {
                    $__tmpsReferences__[$binop164._uuid] = [];
                }
                $__tmpsReferences__[$binop164._uuid].push("$binop164");
            }
            if ($lsubscr165 && $lsubscr165.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr165._uuid)) {
                    $__tmpsReferences__[$lsubscr165._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr165._uuid].push("$lsubscr165");
            }
            if ($binop166 && $binop166.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($binop166._uuid)) {
                    $__tmpsReferences__[$binop166._uuid] = [];
                }
                $__tmpsReferences__[$binop166._uuid].push("$binop166");
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
            susp.$tmps = {
                "$loadname158": $loadname158,
                "$iter160": $iter160,
                "$call159": $call159,
                "$loadname162": $loadname162,
                "$loadname163": $loadname163,
                "$binop164": $binop164,
                "$lsubscr165": $lsubscr165,
                "$binop166": $binop166,
                "$loadname167": $loadname167,
                "$loadname168": $loadname168,
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
                        /*     4 */ // t = [1, 2, 3, 4, 5]
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $__loaded_references = {};
                        var $elem148 = $scope146.$const147;
                        var $elem150 = $scope146.$const149;
                        var $elem152 = $scope146.$const151;
                        var $elem154 = $scope146.$const153;
                        var $elem156 = $scope146.$const155;
                        var $loadlist157 = new Sk.builtins['list']([$elem148, $elem150, $elem152, $elem154, $elem156]);
                        if ($loadlist157.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist157._uuid)) {
                                $loc.__refs__[$loadlist157._uuid] = [];
                            }
                            $loc.__refs__[$loadlist157._uuid].push("t");
                        }
                        $loc.t = window.currentPythonRunner.reportValue($loadlist157, 't');
                        if (Sk.breakpoints('<stdin>.py', 2, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 2, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 2 --- */
                        /*    11 */ //
                        /*    12 */ // line 2:
                        /*    13 */ // for i in range(1, 4):
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 2;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $__loaded_references = {};
                        var $loadname158 = $loc.range !== undefined ? $loc.range : Sk.misceval.loadname('range', $gbl);
                        ;$__loaded_references['range'] = true;
                        if (typeof $loadname158 !== 'undefined') {
                            if ($loadname158.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname158._uuid] = true;
                                if ($loadname158.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname158.$d._uuid] = true;
                                }
                            }
                        }
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname158, [$scope146.$const147, $scope146.$const153]);
                        Sk.builtin.registerPromiseReference($ret);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 2, 9);
                        }
                        var $call159 = $ret;
                        /*    20 */ //
                        /*    21 */ // line 2:
                        /*    22 */ // for i in range(1, 4):
                        /*    23 */ //          ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 2;
                        /*    26 */
                        $currColNo = 9;
                        /*    27 */
                        /*    28 */
                        var $__loaded_references = {};
                        var $iter160 = Sk.abstr.iter($call159);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- for start --- */
                        $ret = Sk.abstr.iternext($iter160, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 2, 0);
                        }
                        var $next161 = $ret;
                        if ($next161 === undefined) {
                            $blk = 4;
                            continue;
                        }
                        if ($next161.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($next161._uuid)) {
                                $loc.__refs__[$next161._uuid] = [];
                            }
                            $loc.__refs__[$next161._uuid].push("i");
                        }
                        $loc.i = window.currentPythonRunner.reportValue($next161, 'i');
                        if (Sk.breakpoints('<stdin>.py', 2, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.delay'}, resume: function () {
                                }
                            }, '<stdin>.py', 2, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 2 --- */
                        if (Sk.breakpoints('<stdin>.py', 3, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 4);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 3 --- */
                        /*    29 */ //
                        /*    30 */ // line 3:
                        /*    31 */ //     t[i] = t[i - 1] * 2
                        /*    32 */ //     ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 3;
                        /*    35 */
                        $currColNo = 4;
                        /*    36 */
                        /*    37 */
                        var $__loaded_references = {};
                        var $loadname162 = $loc.t !== undefined ? $loc.t : Sk.misceval.loadname('t', $gbl);
                        ;$__loaded_references['t'] = true;
                        if (typeof $loadname162 !== 'undefined') {
                            if ($loadname162.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname162._uuid] = true;
                                if ($loadname162.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname162.$d._uuid] = true;
                                }
                            }
                        }
                        var $loadname163 = $loc.i !== undefined ? $loc.i : Sk.misceval.loadname('i', $gbl);
                        ;$__loaded_references['i'] = true;
                        if (typeof $loadname163 !== 'undefined') {
                            if ($loadname163.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname163._uuid] = true;
                                if ($loadname163.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname163.$d._uuid] = true;
                                }
                            }
                        }
                        var $binop164 = Sk.abstr.numberBinOp($loadname163, $scope146.$const147, 'Sub');
                        $ret = Sk.abstr.objectGetItem($loadname162, $binop164, true);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr165 = $ret;
                        if (typeof $ret !== 'undefined') {
                            if ($ret.hasOwnProperty('_uuid')) {
                                $__loaded_references[$ret._uuid] = true;
                                if ($ret.hasOwnProperty('$d')) {
                                    $__loaded_references[$ret.$d._uuid] = true;
                                }
                            }
                        }
                        var $binop166 = Sk.abstr.numberBinOp($lsubscr165, $scope146.$const149, 'Mult');
                        var $loadname167 = $loc.t !== undefined ? $loc.t : Sk.misceval.loadname('t', $gbl);
                        ;$__loaded_references['t'] = true;
                        if (typeof $loadname167 !== 'undefined') {
                            if ($loadname167.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname167._uuid] = true;
                                if ($loadname167.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname167.$d._uuid] = true;
                                }
                            }
                        }
                        var $loadname168 = $loc.i !== undefined ? $loc.i : Sk.misceval.loadname('i', $gbl);
                        ;$__loaded_references['i'] = true;
                        if (typeof $loadname168 !== 'undefined') {
                            if ($loadname168.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname168._uuid] = true;
                                if ($loadname168.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname168.$d._uuid] = true;
                                }
                            }
                        }
                        $loadname167 = $loadname167.clone($binop166);
                        var $__cloned_references = {};
                        $__cloned_references[$loadname167._uuid] = $loadname167;
                        if ($loadname167.hasOwnProperty('$d')) {
                            $__cloned_references[$loadname167.$d._uuid] = $loadname167.$d;
                        }
                        $ret = Sk.abstr.objectSetItem($loadname167, $loadname168, $binop166, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $loadname167);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $loadname167);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $loadname167);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $loadname167);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $loadname167);
                        window.currentPythonRunner._debugger.updatePromiseReference($loadname167);
                        $loadname167.updateReferencesInside($__cloned_references);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        $blk = 3;/* jump */
                        continue;
                    case 4: /* --- for cleanup --- */
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- for end --- */
                        if (Sk.breakpoints('<stdin>.py', 4, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 0);
                            $susp.$blk = 12;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- debug breakpoint for line 4 --- */
                        /*    38 */ //
                        /*    39 */ // line 4:
                        /*    40 */ // pass
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 4;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
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
    $scope146.$const147 = new Sk.builtin.int_(1);
    $scope146.$const149 = new Sk.builtin.int_(2);
    $scope146.$const151 = new Sk.builtin.int_(3);
    $scope146.$const153 = new Sk.builtin.int_(4);
    $scope146.$const155 = new Sk.builtin.int_(5);
    /*    47 */
    return $scope146;
}();