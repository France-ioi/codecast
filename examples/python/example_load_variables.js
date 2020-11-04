/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
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
            susp.$tmps = {"__refs__": $__tmpsReferences__};
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
                        /*     4 */ // i = 0
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        var $__loaded_references = {};
                        if ($scope146.$const147.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const147._uuid)) {
                                $loc.__refs__[$scope146.$const147._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const147._uuid].push("i");
                        }
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const147, 'i');
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
                        /*    13 */ // i = 1
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 2;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $__loaded_references = {};
                        if ($scope146.$const148.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const148._uuid)) {
                                $loc.__refs__[$scope146.$const148._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const148._uuid].push("i");
                        }
                        $loc.i = window.currentPythonRunner.reportValue($scope146.$const148, 'i');
                        if (Sk.breakpoints('<stdin>.py', 4, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 4 --- */
                        /*    20 */ //
                        /*    21 */ // line 4:
                        /*    22 */ // j = 2
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 4;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $__loaded_references = {};
                        if ($scope146.$const149.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const149._uuid)) {
                                $loc.__refs__[$scope146.$const149._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const149._uuid].push("j");
                        }
                        $loc.j = window.currentPythonRunner.reportValue($scope146.$const149, 'j');
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- debug breakpoint for line 5 --- */
                        /*    29 */ //
                        /*    30 */ // line 5:
                        /*    31 */ // j = j + 1 # load j
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 5;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        var $__loaded_references = {};
                        var $loadname150 = $loc.j !== undefined ? $loc.j : Sk.misceval.loadname('j', $gbl);
                        ;
                        if (typeof $loadname150 !== 'undefined') {
                            if ($loadname150.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname150._uuid] = true;
                                if ($loadname150.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname150.$d._uuid] = true;
                                }
                            }
                        }
                        var $binop151 = Sk.abstr.numberBinOp($loadname150, $scope146.$const148, 'Add');
                        if ($binop151.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($binop151._uuid)) {
                                $loc.__refs__[$binop151._uuid] = [];
                            }
                            $loc.__refs__[$binop151._uuid].push("j");
                        }
                        $loc.j = window.currentPythonRunner.reportValue($binop151, 'j');
                        if (Sk.breakpoints('<stdin>.py', 6, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 6 --- */
                        /*    38 */ //
                        /*    39 */ // line 6:
                        /*    40 */ // j = 0
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 6;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $__loaded_references = {};
                        if ($scope146.$const147.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const147._uuid)) {
                                $loc.__refs__[$scope146.$const147._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const147._uuid].push("j");
                        }
                        $loc.j = window.currentPythonRunner.reportValue($scope146.$const147, 'j');
                        if (Sk.breakpoints('<stdin>.py', 7, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 7 --- */
                        /*    47 */ //
                        /*    48 */ // line 7:
                        /*    49 */ // j = i # load i
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 7;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        var $__loaded_references = {};
                        var $loadname152 = $loc.i !== undefined ? $loc.i : Sk.misceval.loadname('i', $gbl);
                        ;
                        if (typeof $loadname152 !== 'undefined') {
                            if ($loadname152.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname152._uuid] = true;
                                if ($loadname152.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname152.$d._uuid] = true;
                                }
                            }
                        }
                        if ($loadname152.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadname152._uuid)) {
                                $loc.__refs__[$loadname152._uuid] = [];
                            }
                            $loc.__refs__[$loadname152._uuid].push("j");
                        }
                        $loc.j = window.currentPythonRunner.reportValue($loadname152, 'j');
                        if (Sk.breakpoints('<stdin>.py', 8, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 0);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 8 --- */
                        /*    56 */ //
                        /*    57 */ // line 8:
                        /*    58 */ // j = 0
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 8;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        var $__loaded_references = {};
                        if ($scope146.$const147.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const147._uuid)) {
                                $loc.__refs__[$scope146.$const147._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const147._uuid].push("j");
                        }
                        $loc.j = window.currentPythonRunner.reportValue($scope146.$const147, 'j');
                        if (Sk.breakpoints('<stdin>.py', 9, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 9, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 9 --- */
                        /*    65 */ //
                        /*    66 */ // line 9:
                        /*    67 */ // i = i + j # load i && j
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 9;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
                        var $__loaded_references = {};
                        var $loadname153 = $loc.i !== undefined ? $loc.i : Sk.misceval.loadname('i', $gbl);
                        ;
                        if (typeof $loadname153 !== 'undefined') {
                            if ($loadname153.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname153._uuid] = true;
                                if ($loadname153.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname153.$d._uuid] = true;
                                }
                            }
                        }
                        var $loadname154 = $loc.j !== undefined ? $loc.j : Sk.misceval.loadname('j', $gbl);
                        ;
                        if (typeof $loadname154 !== 'undefined') {
                            if ($loadname154.hasOwnProperty('_uuid')) {
                                $__loaded_references[$loadname154._uuid] = true;
                                if ($loadname154.hasOwnProperty('$d')) {
                                    $__loaded_references[$loadname154.$d._uuid] = true;
                                }
                            }
                        }
                        var $binop155 = Sk.abstr.numberBinOp($loadname153, $loadname154, 'Add');
                        if ($binop155.hasOwnProperty('_uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($binop155._uuid)) {
                                $loc.__refs__[$binop155._uuid] = [];
                            }
                            $loc.__refs__[$binop155._uuid].push("i");
                        }
                        $loc.i = window.currentPythonRunner.reportValue($binop155, 'i');
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 9;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- debug breakpoint for line 10 --- */
                        /*    74 */ //
                        /*    75 */ // line 10:
                        /*    76 */ // pass
                        /*    77 */ // ^
                        /*    78 */ //
                        /*    79 */
                        $currLineNo = 10;
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
    $scope146.$const147 = new Sk.builtin.int_(0);
    $scope146.$const148 = new Sk.builtin.int_(1);
    $scope146.$const149 = new Sk.builtin.int_(2);
    /*    83 */
    return $scope146;
}();