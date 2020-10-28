/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname177, $loadname177, $lsubscr179, $loadname177, $lsubscr179, $lsubscr181, $loadname177, $lsubscr179,
            $lsubscr181, $lsubscr182, $loadname183, $binop184, $binop186, $loadname187, $loadname177, $lsubscr179,
            $lsubscr181, $lsubscr182, $loadname183, $binop184, $binop186, $loadname187, $lsubscr188, $loadname177,
            $lsubscr179, $lsubscr181, $lsubscr182, $loadname183, $binop184, $binop186, $loadname187, $lsubscr188,
            $lsubscr189;
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
            $lsubscr179 = susp.$tmps.$lsubscr179;
            $lsubscr181 = susp.$tmps.$lsubscr181;
            $lsubscr182 = susp.$tmps.$lsubscr182;
            $loadname183 = susp.$tmps.$loadname183;
            $binop184 = susp.$tmps.$binop184;
            $binop186 = susp.$tmps.$binop186;
            $loadname187 = susp.$tmps.$loadname187;
            $lsubscr188 = susp.$tmps.$lsubscr188;
            $lsubscr189 = susp.$tmps.$lsubscr189;
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
            if ($lsubscr179 && $lsubscr179.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr179._uuid)) {
                    $__tmpsReferences__[$lsubscr179._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr179._uuid].push("$lsubscr179");
            }
            if ($lsubscr181 && $lsubscr181.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr181._uuid)) {
                    $__tmpsReferences__[$lsubscr181._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr181._uuid].push("$lsubscr181");
            }
            if ($lsubscr182 && $lsubscr182.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr182._uuid)) {
                    $__tmpsReferences__[$lsubscr182._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr182._uuid].push("$lsubscr182");
            }
            if ($loadname183 && $loadname183.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname183._uuid)) {
                    $__tmpsReferences__[$loadname183._uuid] = [];
                }
                $__tmpsReferences__[$loadname183._uuid].push("$loadname183");
            }
            if ($binop184 && $binop184.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($binop184._uuid)) {
                    $__tmpsReferences__[$binop184._uuid] = [];
                }
                $__tmpsReferences__[$binop184._uuid].push("$binop184");
            }
            if ($binop186 && $binop186.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($binop186._uuid)) {
                    $__tmpsReferences__[$binop186._uuid] = [];
                }
                $__tmpsReferences__[$binop186._uuid].push("$binop186");
            }
            if ($loadname187 && $loadname187.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname187._uuid)) {
                    $__tmpsReferences__[$loadname187._uuid] = [];
                }
                $__tmpsReferences__[$loadname187._uuid].push("$loadname187");
            }
            if ($lsubscr188 && $lsubscr188.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr188._uuid)) {
                    $__tmpsReferences__[$lsubscr188._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr188._uuid].push("$lsubscr188");
            }
            if ($lsubscr189 && $lsubscr189.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr189._uuid)) {
                    $__tmpsReferences__[$lsubscr189._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr189._uuid].push("$lsubscr189");
            }
            susp.$tmps = {
                "$loadname177": $loadname177,
                "$lsubscr179": $lsubscr179,
                "$lsubscr181": $lsubscr181,
                "$lsubscr182": $lsubscr182,
                "$loadname183": $loadname183,
                "$binop184": $binop184,
                "$binop186": $binop186,
                "$loadname187": $loadname187,
                "$lsubscr188": $lsubscr188,
                "$lsubscr189": $lsubscr189,
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
                        /*     4 */ // Array3D = [[[10, 11], [12, 13]], [[14, 15], [16, 17]]]
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
                        if ($loadlist175.hasOwnProperty('._uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist175.hasOwnProperty('_uuid'))) {
                                $loc.__refs__[$loadlist175._uuid] = [];
                            }
                            $loc.__refs__[$loadlist175._uuid].push("Array3D");
                        }
                        $loc.Array3D = window.currentPythonRunner.reportValue($loadlist175, 'Array3D');
                        if (Sk.breakpoints('<stdin>.py', 3, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 3 --- */
                        /*    11 */ //
                        /*    12 */ // line 3:
                        /*    13 */ // v = 42
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 3;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $__loaded_references = {};
                        if ($scope146.$const176.hasOwnProperty('._uuid')) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($scope146.$const176.hasOwnProperty('_uuid'))) {
                                $loc.__refs__[$scope146.$const176._uuid] = [];
                            }
                            $loc.__refs__[$scope146.$const176._uuid].push("v");
                        }
                        $loc.v = window.currentPythonRunner.reportValue($scope146.$const176, 'v');
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
                        /*    22 */ // Array3D[0][1][0] = Array3D[0][1][1] + v + 100
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 4;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $__loaded_references = {};
                        var $loadname177 = $loc.Array3D !== undefined ? $loc.Array3D : Sk.misceval.loadname('Array3D', $gbl);
                        ;
                        if ($loadname177.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname177._uuid] = true;
                        } else if ($loadname177.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname177._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.objectGetItem($loadname177, $scope146.$const178, true);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr179 = $ret;
                        if ($ret.hasOwnProperty('_uuid')) {
                            $__loaded_references[$ret._uuid] = true;
                        } else if ($ret.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$ret._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.objectGetItem($lsubscr179, $scope146.$const180, true);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr181 = $ret;
                        if ($ret.hasOwnProperty('_uuid')) {
                            $__loaded_references[$ret._uuid] = true;
                        } else if ($ret.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$ret._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.objectGetItem($lsubscr181, $scope146.$const180, true);
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr182 = $ret;
                        if ($ret.hasOwnProperty('_uuid')) {
                            $__loaded_references[$ret._uuid] = true;
                        } else if ($ret.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$ret._scalar_uuid] = true;
                        }
                        var $loadname183 = $loc.v !== undefined ? $loc.v : Sk.misceval.loadname('v', $gbl);
                        ;
                        if ($loadname183.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname183._uuid] = true;
                        } else if ($loadname183.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname183._scalar_uuid] = true;
                        }
                        var $binop184 = Sk.abstr.numberBinOp($lsubscr182, $loadname183, 'Add');
                        var $binop186 = Sk.abstr.numberBinOp($binop184, $scope146.$const185, 'Add');
                        var $loadname187 = $loc.Array3D !== undefined ? $loc.Array3D : Sk.misceval.loadname('Array3D', $gbl);
                        ;
                        if ($loadname187.hasOwnProperty('_uuid')) {
                            $__loaded_references[$loadname187._uuid] = true;
                        } else if ($loadname187.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$loadname187._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.objectGetItem($loadname187, $scope146.$const178, true);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr188 = $ret;
                        if ($ret.hasOwnProperty('_uuid')) {
                            $__loaded_references[$ret._uuid] = true;
                        } else if ($ret.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$ret._scalar_uuid] = true;
                        }
                        $ret = Sk.abstr.objectGetItem($lsubscr188, $scope146.$const180, true);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr189 = $ret;
                        if ($ret.hasOwnProperty('_uuid')) {
                            $__loaded_references[$ret._uuid] = true;
                        } else if ($ret.hasOwnProperty('_scalar_uuid')) {
                            $__loaded_references[$ret._scalar_uuid] = true;
                        }
                        $lsubscr189 = $lsubscr189.clone($binop186);
                        var $__cloned_references = {};
                        $__cloned_references[$lsubscr189._uuid] = $lsubscr189;
                        if ($lsubscr189.hasOwnProperty('$d')) {
                            $__cloned_references[$lsubscr189.$d._uuid] = $lsubscr189.$d;
                        }
                        $ret = Sk.abstr.objectSetItem($lsubscr189, $scope146.$const178, $binop186, true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr189);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                while ($__cur_suspension__) {
                                    if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr189);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr189);
                                        Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr189);
                                    }
                                    $__cur_suspension__ = $__cur_suspension__.child;
                                }
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr189);
                        window.currentPythonRunner._debugger.updatePromiseReference($lsubscr189);
                        $lsubscr189.updateReferencesInside($__cloned_references);
                        $blk = 9;/* allowing case fallthrough */
                    case 9: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 10;
                            $susp.optional = true;
                            if ($__loaded_references) {
                                $susp.$loaded_references = $__loaded_references;
                            }
                            return $susp;
                        }
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- debug breakpoint for line 5 --- */
                        /*    29 */ //
                        /*    30 */ // line 5:
                        /*    31 */ // pass
                        /*    32 */ // ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 5;
                        /*    35 */
                        $currColNo = 0;
                        /*    36 */
                        /*    37 */
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
    $scope146.$const147 = new Sk.builtin.int_(10);
    $scope146.$const149 = new Sk.builtin.int_(11);
    $scope146.$const153 = new Sk.builtin.int_(12);
    $scope146.$const155 = new Sk.builtin.int_(13);
    $scope146.$const161 = new Sk.builtin.int_(14);
    $scope146.$const163 = new Sk.builtin.int_(15);
    $scope146.$const167 = new Sk.builtin.int_(16);
    $scope146.$const169 = new Sk.builtin.int_(17);
    $scope146.$const176 = new Sk.builtin.int_(42);
    $scope146.$const178 = new Sk.builtin.int_(0);
    $scope146.$const180 = new Sk.builtin.int_(1);
    $scope146.$const185 = new Sk.builtin.int_(100);
    /*    38 */
    return $scope146;
}();