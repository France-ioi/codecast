/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname177, $loadname177, $lsubscr178, $loadname177, $lsubscr178, $lsubscr179, $loadname180, $loadname181,
            $loadname180, $loadname181, $lsubscr182, $loadname180, $loadname181, $lsubscr182, $lsubscr183, $loadname180,
            $loadname181, $lsubscr182, $lsubscr183, $lsubscr184;
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
            $lsubscr178 = susp.$tmps.$lsubscr178;
            $lsubscr179 = susp.$tmps.$lsubscr179;
            $loadname180 = susp.$tmps.$loadname180;
            $loadname181 = susp.$tmps.$loadname181;
            $lsubscr182 = susp.$tmps.$lsubscr182;
            $lsubscr183 = susp.$tmps.$lsubscr183;
            $lsubscr184 = susp.$tmps.$lsubscr184;
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
                "$lsubscr178": $lsubscr178,
                "$lsubscr179": $lsubscr179,
                "$loadname180": $loadname180,
                "$loadname181": $loadname181,
                "$lsubscr182": $lsubscr182,
                "$lsubscr183": $lsubscr183,
                "$lsubscr184": $lsubscr184
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
                        /*     4 */ // Array3D = [[[0, 1], [2, 3]], [[4, 5], [6, 7]]]
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
                        var $elem152 = $loadlist151;
                        var $elem154 = $scope146.$const153;
                        var $elem156 = $scope146.$const155;
                        var $loadlist157 = new Sk.builtins['list']([$elem154, $elem156]);
                        var $elem158 = $loadlist157;
                        var $loadlist159 = new Sk.builtins['list']([$elem152, $elem158]);
                        var $elem160 = $loadlist159;
                        var $elem162 = $scope146.$const161;
                        var $elem164 = $scope146.$const163;
                        var $loadlist165 = new Sk.builtins['list']([$elem162, $elem164]);
                        var $elem166 = $loadlist165;
                        var $elem168 = $scope146.$const167;
                        var $elem170 = $scope146.$const169;
                        var $loadlist171 = new Sk.builtins['list']([$elem168, $elem170]);
                        var $elem172 = $loadlist171;
                        var $loadlist173 = new Sk.builtins['list']([$elem166, $elem172]);
                        var $elem174 = $loadlist173;
                        var $loadlist175 = new Sk.builtins['list']([$elem160, $elem174]);
                        if ($loadlist175._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            $loc.__refs__[$loadlist175._uuid] = 'Array3D';
                        }
                        $loc.Array3D = window.currentPythonRunner.reportValue($loadlist175, 'Array3D');
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
                        /*    13 */ // Array3D[0][1][0] = 42
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 3;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        console.log('test1', '$loc.Array3D', 'Array3D');
                        var $loadname177 = $loc.Array3D !== undefined ? $loc.Array3D : Sk.misceval.loadname('Array3D', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname177, $scope146.$const147, true);
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr178 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr178, $scope146.$const149, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr179 = $ret;
                        $lsubscr179 = $lsubscr179.clone($scope146.$const176);
                        $ret = Sk.abstr.objectSetItem($lsubscr179, $scope146.$const147, $scope146.$const176, true);
                        Sk.builtin.changeReferences($loc, $lsubscr179);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 4, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 4, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 4 --- */
                        /*    20 */ //
                        /*    21 */ // line 4:
                        /*    22 */ // print(Array3D[0][1][0])
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 4;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        console.log('test1', '$loc.print', 'print');
                        var $loadname180 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;console.log('test1', '$loc.Array3D', 'Array3D');
                        var $loadname181 = $loc.Array3D !== undefined ? $loc.Array3D : Sk.misceval.loadname('Array3D', $gbl);
                        ;$ret = Sk.abstr.objectGetItem($loadname181, $scope146.$const147, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr182 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr182, $scope146.$const149, true);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr183 = $ret;
                        $ret = Sk.abstr.objectGetItem($lsubscr183, $scope146.$const147, true);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr184 = $ret;
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname180, [$lsubscr184]);
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 4, 0);
                        }
                        var $call185 = $ret;
                        /*    29 */ //
                        /*    30 */ // line 4:
                        /*    31 */ // print(Array3D[0][1][0])
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 4;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 11;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- debug breakpoint for line 5 --- */
                        /*    38 */ //
                        /*    39 */ // line 5:
                        /*    40 */ // pass
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 5;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
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
    $scope146.$const153 = new Sk.builtin.int_(2);
    $scope146.$const155 = new Sk.builtin.int_(3);
    $scope146.$const161 = new Sk.builtin.int_(4);
    $scope146.$const163 = new Sk.builtin.int_(5);
    $scope146.$const167 = new Sk.builtin.int_(6);
    $scope146.$const169 = new Sk.builtin.int_(7);
    $scope146.$const176 = new Sk.builtin.int_(42);
    /*    47 */
    return $scope146;
}();