/*     1 */
$compiledmod = function () {
    var $scope146 = (function ($forcegbl) {
        var $loadname208, $loadname209, $loadname211, $loadname212, $loadname208, $loadname209, $loadname211,
            $loadname212, $call213, $loadname215, $loadname216;
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
            $loadname208 = susp.$tmps.$loadname208;
            $loadname209 = susp.$tmps.$loadname209;
            $loadname211 = susp.$tmps.$loadname211;
            $loadname212 = susp.$tmps.$loadname212;
            $call213 = susp.$tmps.$call213;
            $loadname215 = susp.$tmps.$loadname215;
            $loadname216 = susp.$tmps.$loadname216;
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
            if ($loadname208 && $loadname208.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname208._uuid)) {
                    $__tmpsReferences__[$loadname208._uuid] = [];
                }
                $__tmpsReferences__[$loadname208._uuid].push("$loadname208");
            }
            if ($loadname209 && $loadname209.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname209._uuid)) {
                    $__tmpsReferences__[$loadname209._uuid] = [];
                }
                $__tmpsReferences__[$loadname209._uuid].push("$loadname209");
            }
            if ($loadname211 && $loadname211.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname211._uuid)) {
                    $__tmpsReferences__[$loadname211._uuid] = [];
                }
                $__tmpsReferences__[$loadname211._uuid].push("$loadname211");
            }
            if ($loadname212 && $loadname212.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname212._uuid)) {
                    $__tmpsReferences__[$loadname212._uuid] = [];
                }
                $__tmpsReferences__[$loadname212._uuid].push("$loadname212");
            }
            if ($call213 && $call213.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call213._uuid)) {
                    $__tmpsReferences__[$call213._uuid] = [];
                }
                $__tmpsReferences__[$call213._uuid].push("$call213");
            }
            if ($loadname215 && $loadname215.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname215._uuid)) {
                    $__tmpsReferences__[$loadname215._uuid] = [];
                }
                $__tmpsReferences__[$loadname215._uuid].push("$loadname215");
            }
            if ($loadname216 && $loadname216.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadname216._uuid)) {
                    $__tmpsReferences__[$loadname216._uuid] = [];
                }
                $__tmpsReferences__[$loadname216._uuid].push("$loadname216");
            }
            susp.$tmps = {
                "$loadname208": $loadname208,
                "$loadname209": $loadname209,
                "$loadname211": $loadname211,
                "$loadname212": $loadname212,
                "$call213": $call213,
                "$loadname215": $loadname215,
                "$loadname216": $loadname216,
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
                        /*     4 */ // def deplacer_bambous(hauteur, debut, fin):
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('deplacer_bambous');
                        $scope147.co_varnames = ['hauteur', 'debut', 'fin'];
                        var $funcobj176 = new Sk.builtins['function']($scope147, $gbl);
                        if ($funcobj176._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($funcobj176._uuid)) {
                                $loc.__refs__[$funcobj176._uuid] = [];
                            }
                            $loc.__refs__[$funcobj176._uuid].push("deplacer_bambous");
                        }
                        $loc.deplacer_bambous = window.currentPythonRunner.reportValue($funcobj176, 'deplacer_bambous');
                        if (Sk.breakpoints('<stdin>.py', 16, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 16, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- debug breakpoint for line 16 --- */
                        /*    11 */ //
                        /*    12 */ // line 16:
                        /*    13 */ // bambous = [14, 15, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 16;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $elem178 = $scope146.$const177;
                        var $elem180 = $scope146.$const179;
                        var $elem182 = $scope146.$const181;
                        var $elem184 = $scope146.$const183;
                        var $elem186 = $scope146.$const185;
                        var $elem188 = $scope146.$const187;
                        var $elem190 = $scope146.$const189;
                        var $elem192 = $scope146.$const191;
                        var $elem194 = $scope146.$const193;
                        var $elem196 = $scope146.$const195;
                        var $elem198 = $scope146.$const197;
                        var $elem200 = $scope146.$const199;
                        var $elem202 = $scope146.$const201;
                        var $elem204 = $scope146.$const203;
                        var $elem206 = $scope146.$const205;
                        var $loadlist207 = new Sk.builtins['list']([$elem178, $elem180, $elem182, $elem184, $elem186, $elem188, $elem190, $elem192, $elem194, $elem196, $elem198, $elem200, $elem202, $elem204, $elem206]);
                        if ($loadlist207._uuid) {
                            $loc.__refs__ = ($loc.hasOwnProperty('__refs__')) ? $loc.__refs__ : [];
                            if (!$loc.__refs__.hasOwnProperty($loadlist207._uuid)) {
                                $loc.__refs__[$loadlist207._uuid] = [];
                            }
                            $loc.__refs__[$loadlist207._uuid].push("bambous");
                        }
                        $loc.bambous = window.currentPythonRunner.reportValue($loadlist207, 'bambous');
                        if (Sk.breakpoints('<stdin>.py', 17, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 17, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- debug breakpoint for line 17 --- */
                        /*    20 */ //
                        /*    21 */ // line 17:
                        /*    22 */ // deplacer_bambous(bambous, 0, len(bambous))
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 17;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $loadname208 = $loc.deplacer_bambous !== undefined ? $loc.deplacer_bambous : Sk.misceval.loadname('deplacer_bambous', $gbl);
                        ;var $loadname209 = $loc.bambous !== undefined ? $loc.bambous : Sk.misceval.loadname('bambous', $gbl);
                        ;var $loadname211 = $loc.len !== undefined ? $loc.len : Sk.misceval.loadname('len', $gbl);
                        ;var $loadname212 = $loc.bambous !== undefined ? $loc.bambous : Sk.misceval.loadname('bambous', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname211, [$loadname212]);
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 17, 29);
                        }
                        var $call213 = $ret;
                        /*    29 */ //
                        /*    30 */ // line 17:
                        /*    31 */ // deplacer_bambous(bambous, 0, len(bambous))
                        /*    32 */ //                              ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 17;
                        /*    35 */
                        $currColNo = 29;
                        /*    36 */
                        /*    37 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname208, [$loadname209, $scope146.$const210, $call213]);
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 17, 0);
                        }
                        var $call214 = $ret;
                        /*    38 */ //
                        /*    39 */ // line 17:
                        /*    40 */ // deplacer_bambous(bambous, 0, len(bambous))
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 17;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        if (Sk.breakpoints('<stdin>.py', 18, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 18, 0);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 18 --- */
                        /*    47 */ //
                        /*    48 */ // line 18:
                        /*    49 */ // print(bambous)
                        /*    50 */ // ^
                        /*    51 */ //
                        /*    52 */
                        $currLineNo = 18;
                        /*    53 */
                        $currColNo = 0;
                        /*    54 */
                        /*    55 */
                        var $loadname215 = $loc.print !== undefined ? $loc.print : Sk.misceval.loadname('print', $gbl);
                        ;var $loadname216 = $loc.bambous !== undefined ? $loc.bambous : Sk.misceval.loadname('bambous', $gbl);
                        ;$ret = Sk.misceval.callsimOrSuspendArray($loadname215, [$loadname216]);
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 18, 0);
                        }
                        var $call217 = $ret;
                        /*    56 */ //
                        /*    57 */ // line 18:
                        /*    58 */ // print(bambous)
                        /*    59 */ // ^
                        /*    60 */ //
                        /*    61 */
                        $currLineNo = 18;
                        /*    62 */
                        $currColNo = 0;
                        /*    63 */
                        /*    64 */
                        if (Sk.breakpoints('<stdin>.py', 19, 0)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 19, 0);
                            $susp.$blk = 8;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- debug breakpoint for line 19 --- */
                        /*    65 */ //
                        /*    66 */ // line 19:
                        /*    67 */ // pass
                        /*    68 */ // ^
                        /*    69 */ //
                        /*    70 */
                        $currLineNo = 19;
                        /*    71 */
                        $currColNo = 0;
                        /*    72 */
                        /*    73 */
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
    $scope146.$const177 = new Sk.builtin.int_(14);
    $scope146.$const179 = new Sk.builtin.int_(15);
    $scope146.$const181 = new Sk.builtin.int_(13);
    $scope146.$const183 = new Sk.builtin.int_(12);
    $scope146.$const185 = new Sk.builtin.int_(11);
    $scope146.$const187 = new Sk.builtin.int_(10);
    $scope146.$const189 = new Sk.builtin.int_(9);
    $scope146.$const191 = new Sk.builtin.int_(8);
    $scope146.$const193 = new Sk.builtin.int_(7);
    $scope146.$const195 = new Sk.builtin.int_(6);
    $scope146.$const197 = new Sk.builtin.int_(5);
    $scope146.$const199 = new Sk.builtin.int_(4);
    $scope146.$const201 = new Sk.builtin.int_(3);
    $scope146.$const203 = new Sk.builtin.int_(2);
    $scope146.$const205 = new Sk.builtin.int_(1);
    $scope146.$const210 = new Sk.builtin.int_(0);
    var $scope147 = (function $deplacer_bambous148$(hauteur, debut, fin) {
        var i, maxi, milieu; /* locals */
        var debut, debut, debut, debut, debut, debut, fin, fin, fin, fin, fin, hauteur, hauteur, hauteur, hauteur,
            hauteur, hauteur, hauteur, hauteur, hauteur, i, i, i, maxi, maxi, maxi, maxi, maxi, milieu, milieu, milieu,
            milieu, milieu, $compareres149, $loadgbl152, $iter154, $loadgbl152, $call153, $iter154, $lsubscr156,
            $compareres157, $lsubscr156, $compareres157, $lsubscr158, $lsubscr164, $lsubscr164, $lsubscr165, $elem166,
            $elem167, $loadtuple168, $items169, $lsubscr164, $lsubscr165, $elem166, $elem167, $loadtuple168, $items169,
            $loadgbl170, $loadgbl172, $binop174;
        var $wakeFromSuspension = function () {
            var susp = $scope147.$wakingSuspension;
            $scope147.$wakingSuspension = undefined;
            $blk = susp.$blk;
            $loc = susp.$loc;
            $gbl = susp.$gbl;
            $exc = susp.$exc;
            $err = susp.$err;
            $postfinally = susp.$postfinally;
            $currLineNo = susp.$lineno;
            $currColNo = susp.$colno;
            Sk.lastYield = Date.now();
            debut = susp.$tmps.debut;
            fin = susp.$tmps.fin;
            hauteur = susp.$tmps.hauteur;
            i = susp.$tmps.i;
            maxi = susp.$tmps.maxi;
            milieu = susp.$tmps.milieu;
            $compareres149 = susp.$tmps.$compareres149;
            $loadgbl152 = susp.$tmps.$loadgbl152;
            $iter154 = susp.$tmps.$iter154;
            $call153 = susp.$tmps.$call153;
            $lsubscr156 = susp.$tmps.$lsubscr156;
            $compareres157 = susp.$tmps.$compareres157;
            $lsubscr158 = susp.$tmps.$lsubscr158;
            $lsubscr164 = susp.$tmps.$lsubscr164;
            $lsubscr165 = susp.$tmps.$lsubscr165;
            $elem166 = susp.$tmps.$elem166;
            $elem167 = susp.$tmps.$elem167;
            $loadtuple168 = susp.$tmps.$loadtuple168;
            $items169 = susp.$tmps.$items169;
            $loadgbl170 = susp.$tmps.$loadgbl170;
            $loadgbl172 = susp.$tmps.$loadgbl172;
            $binop174 = susp.$tmps.$binop174;
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
                $scope147.$wakingSuspension = susp;
                return $scope147();
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
            susp._name = 'deplacer_bambous';
            susp._argnames = ["hauteur", "debut", "fin"];
            susp._scopename = '$scope147';
            var $__tmpsReferences__ = {};
            if (debut && debut.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(debut._uuid)) {
                    $__tmpsReferences__[debut._uuid] = [];
                }
                $__tmpsReferences__[debut._uuid].push("debut");
            }
            if (fin && fin.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(fin._uuid)) {
                    $__tmpsReferences__[fin._uuid] = [];
                }
                $__tmpsReferences__[fin._uuid].push("fin");
            }
            if (hauteur && hauteur.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(hauteur._uuid)) {
                    $__tmpsReferences__[hauteur._uuid] = [];
                }
                $__tmpsReferences__[hauteur._uuid].push("hauteur");
            }
            if (i && i.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(i._uuid)) {
                    $__tmpsReferences__[i._uuid] = [];
                }
                $__tmpsReferences__[i._uuid].push("i");
            }
            if (maxi && maxi.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(maxi._uuid)) {
                    $__tmpsReferences__[maxi._uuid] = [];
                }
                $__tmpsReferences__[maxi._uuid].push("maxi");
            }
            if (milieu && milieu.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty(milieu._uuid)) {
                    $__tmpsReferences__[milieu._uuid] = [];
                }
                $__tmpsReferences__[milieu._uuid].push("milieu");
            }
            if ($compareres149 && $compareres149.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($compareres149._uuid)) {
                    $__tmpsReferences__[$compareres149._uuid] = [];
                }
                $__tmpsReferences__[$compareres149._uuid].push("$compareres149");
            }
            if ($loadgbl152 && $loadgbl152.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl152._uuid)) {
                    $__tmpsReferences__[$loadgbl152._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl152._uuid].push("$loadgbl152");
            }
            if ($iter154 && $iter154.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($iter154._uuid)) {
                    $__tmpsReferences__[$iter154._uuid] = [];
                }
                $__tmpsReferences__[$iter154._uuid].push("$iter154");
            }
            if ($call153 && $call153.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($call153._uuid)) {
                    $__tmpsReferences__[$call153._uuid] = [];
                }
                $__tmpsReferences__[$call153._uuid].push("$call153");
            }
            if ($lsubscr156 && $lsubscr156.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr156._uuid)) {
                    $__tmpsReferences__[$lsubscr156._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr156._uuid].push("$lsubscr156");
            }
            if ($compareres157 && $compareres157.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($compareres157._uuid)) {
                    $__tmpsReferences__[$compareres157._uuid] = [];
                }
                $__tmpsReferences__[$compareres157._uuid].push("$compareres157");
            }
            if ($lsubscr158 && $lsubscr158.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr158._uuid)) {
                    $__tmpsReferences__[$lsubscr158._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr158._uuid].push("$lsubscr158");
            }
            if ($lsubscr164 && $lsubscr164.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr164._uuid)) {
                    $__tmpsReferences__[$lsubscr164._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr164._uuid].push("$lsubscr164");
            }
            if ($lsubscr165 && $lsubscr165.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($lsubscr165._uuid)) {
                    $__tmpsReferences__[$lsubscr165._uuid] = [];
                }
                $__tmpsReferences__[$lsubscr165._uuid].push("$lsubscr165");
            }
            if ($elem166 && $elem166.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($elem166._uuid)) {
                    $__tmpsReferences__[$elem166._uuid] = [];
                }
                $__tmpsReferences__[$elem166._uuid].push("$elem166");
            }
            if ($elem167 && $elem167.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($elem167._uuid)) {
                    $__tmpsReferences__[$elem167._uuid] = [];
                }
                $__tmpsReferences__[$elem167._uuid].push("$elem167");
            }
            if ($loadtuple168 && $loadtuple168.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadtuple168._uuid)) {
                    $__tmpsReferences__[$loadtuple168._uuid] = [];
                }
                $__tmpsReferences__[$loadtuple168._uuid].push("$loadtuple168");
            }
            if ($items169 && $items169.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($items169._uuid)) {
                    $__tmpsReferences__[$items169._uuid] = [];
                }
                $__tmpsReferences__[$items169._uuid].push("$items169");
            }
            if ($loadgbl170 && $loadgbl170.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl170._uuid)) {
                    $__tmpsReferences__[$loadgbl170._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl170._uuid].push("$loadgbl170");
            }
            if ($loadgbl172 && $loadgbl172.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($loadgbl172._uuid)) {
                    $__tmpsReferences__[$loadgbl172._uuid] = [];
                }
                $__tmpsReferences__[$loadgbl172._uuid].push("$loadgbl172");
            }
            if ($binop174 && $binop174.hasOwnProperty('_uuid')) {
                if (!$__tmpsReferences__.hasOwnProperty($binop174._uuid)) {
                    $__tmpsReferences__[$binop174._uuid] = [];
                }
                $__tmpsReferences__[$binop174._uuid].push("$binop174");
            }
            susp.$tmps = {
                "debut": debut,
                "fin": fin,
                "hauteur": hauteur,
                "i": i,
                "maxi": maxi,
                "milieu": milieu,
                "$compareres149": $compareres149,
                "$loadgbl152": $loadgbl152,
                "$iter154": $iter154,
                "$call153": $call153,
                "$lsubscr156": $lsubscr156,
                "$compareres157": $compareres157,
                "$lsubscr158": $lsubscr158,
                "$lsubscr164": $lsubscr164,
                "$lsubscr165": $lsubscr165,
                "$elem166": $elem166,
                "$elem167": $elem167,
                "$loadtuple168": $loadtuple168,
                "$items169": $items169,
                "$loadgbl170": $loadgbl170,
                "$loadgbl172": $loadgbl172,
                "$binop174": $binop174,
                "__refs__": $__tmpsReferences__
            };
            return susp;
        };
        var $blk = 0, $exc = [], $loc = {}, $cell = {}, $gbl = this, $err = undefined, $ret = undefined,
            $postfinally = undefined, $currLineNo = undefined, $currColNo = undefined;
        if ($scope147.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0: /* --- codeobj entry --- */
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*    74 */
                        if (debut === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'debut\' referenced before assignment');
                        }
                        /*    75 */
                        if (fin === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'fin\' referenced before assignment');
                        }
                        /*    76 */
                        if (Sk.breakpoints('<stdin>.py', 3, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 2);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1;/* allowing case fallthrough */
                    case 1: /* --- debug breakpoint for line 3 --- */
                        /*    77 */ //
                        /*    78 */ // line 3:
                        /*    79 */ //   if debut == fin: return
                        /*    80 */ //   ^
                        /*    81 */ //
                        /*    82 */
                        $currLineNo = 3;
                        /*    83 */
                        $currColNo = 2;
                        /*    84 */
                        /*    85 */
                        if (debut === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'debut\' referenced before assignment');
                        }
                        /*    86 */
                        var $compareres149 = null;
                        if (fin === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'fin\' referenced before assignment');
                        }
                        /*    87 */
                        $ret = Sk.builtin.bool(Sk.misceval.richCompareBool(debut, fin, 'Eq', true));
                        $blk = 4;/* allowing case fallthrough */
                    case 4: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 3, 5);
                        }
                        $compareres149 = $ret;
                        var $jfalse150 = ($ret === false || !Sk.misceval.isTrue($ret));
                        if ($jfalse150) {/*test failed */
                            $blk = 3;
                            continue;
                        }
                        $blk = 3;/* allowing case fallthrough */
                    case 3: /* --- done --- */
                        var $jfalse151 = ($compareres149 === false || !Sk.misceval.isTrue($compareres149));
                        if ($jfalse151) {/*test failed */
                            $blk = 2;
                            continue;
                        }
                        if (Sk.breakpoints('<stdin>.py', 3, 19)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 3, 19);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5;/* allowing case fallthrough */
                    case 5: /* --- debug breakpoint for line 3 --- */
                        /*    88 */ //
                        /*    89 */ // line 3:
                        /*    90 */ //   if debut == fin: return
                        /*    91 */ //                    ^
                        /*    92 */ //
                        /*    93 */
                        $currLineNo = 3;
                        /*    94 */
                        $currColNo = 19;
                        /*    95 */
                        /*    96 */
                        return Sk.builtin.none.none$;
                        $blk = 2;/* allowing case fallthrough */
                    case 2: /* --- end of if --- */
                        if (Sk.breakpoints('<stdin>.py', 5, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 5, 2);
                            $susp.$blk = 6;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 6;/* allowing case fallthrough */
                    case 6: /* --- debug breakpoint for line 5 --- */
                        /*    97 */ //
                        /*    98 */ // line 5:
                        /*    99 */ //   maxi = debut
                        /*   100 */ //   ^
                        /*   101 */ //
                        /*   102 */
                        $currLineNo = 5;
                        /*   103 */
                        $currColNo = 2;
                        /*   104 */
                        /*   105 */
                        if (debut === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'debut\' referenced before assignment');
                        }
                        /*   106 */
                        maxi = debut;
                        if (Sk.breakpoints('<stdin>.py', 6, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 2);
                            $susp.$blk = 7;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 7;/* allowing case fallthrough */
                    case 7: /* --- debug breakpoint for line 6 --- */
                        /*   107 */ //
                        /*   108 */ // line 6:
                        /*   109 */ //   for i in range(debut, fin):
                        /*   110 */ //   ^
                        /*   111 */ //
                        /*   112 */
                        $currLineNo = 6;
                        /*   113 */
                        $currColNo = 2;
                        /*   114 */
                        /*   115 */
                        console.log('test2', 'range');
                        var $loadgbl152 = Sk.misceval.loadname('range', $gbl);
                        if (debut === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'debut\' referenced before assignment');
                        }
                        /*   116 */
                        if (fin === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'fin\' referenced before assignment');
                        }
                        /*   117 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl152, [debut, fin]);
                        $blk = 11;/* allowing case fallthrough */
                    case 11: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 6, 11);
                        }
                        var $call153 = $ret;
                        /*   118 */ //
                        /*   119 */ // line 6:
                        /*   120 */ //   for i in range(debut, fin):
                        /*   121 */ //            ^
                        /*   122 */ //
                        /*   123 */
                        $currLineNo = 6;
                        /*   124 */
                        $currColNo = 11;
                        /*   125 */
                        /*   126 */
                        var $iter154 = Sk.abstr.iter($call153);
                        $blk = 8;/* allowing case fallthrough */
                    case 8: /* --- for start --- */
                        $ret = Sk.abstr.iternext($iter154, true);
                        $blk = 12;/* allowing case fallthrough */
                    case 12: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 6, 2);
                        }
                        var $next155 = $ret;
                        if ($next155 === undefined) {
                            $blk = 9;
                            continue;
                        }
                        i = $next155;
                        if (Sk.breakpoints('<stdin>.py', 6, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.delay'}, resume: function () {
                                }
                            }, '<stdin>.py', 6, 2);
                            $susp.$blk = 13;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 13;/* allowing case fallthrough */
                    case 13: /* --- debug breakpoint for line 6 --- */
                        if (Sk.breakpoints('<stdin>.py', 7, 4)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 7, 4);
                            $susp.$blk = 14;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 14;/* allowing case fallthrough */
                    case 14: /* --- debug breakpoint for line 7 --- */
                        /*   127 */ //
                        /*   128 */ // line 7:
                        /*   129 */ //     if hauteur[maxi] < hauteur[i]:
                        /*   130 */ //     ^
                        /*   131 */ //
                        /*   132 */
                        $currLineNo = 7;
                        /*   133 */
                        $currColNo = 4;
                        /*   134 */
                        /*   135 */
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   136 */
                        if (maxi === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'maxi\' referenced before assignment');
                        }
                        /*   137 */
                        $ret = Sk.abstr.objectGetItem(hauteur, maxi, true);
                        $blk = 16;/* allowing case fallthrough */
                    case 16: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr156 = $ret;
                        var $compareres157 = null;
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   138 */
                        if (i === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'i\' referenced before assignment');
                        }
                        /*   139 */
                        $ret = Sk.abstr.objectGetItem(hauteur, i, true);
                        $blk = 18;/* allowing case fallthrough */
                    case 18: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr158 = $ret;
                        $ret = Sk.builtin.bool(Sk.misceval.richCompareBool($lsubscr156, $lsubscr158, 'Lt', true));
                        $blk = 19;/* allowing case fallthrough */
                    case 19: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 7, 7);
                        }
                        $compareres157 = $ret;
                        var $jfalse159 = ($ret === false || !Sk.misceval.isTrue($ret));
                        if ($jfalse159) {/*test failed */
                            $blk = 17;
                            continue;
                        }
                        $blk = 17;/* allowing case fallthrough */
                    case 17: /* --- done --- */
                        var $jfalse160 = ($compareres157 === false || !Sk.misceval.isTrue($compareres157));
                        if ($jfalse160) {/*test failed */
                            $blk = 15;
                            continue;
                        }
                        if (Sk.breakpoints('<stdin>.py', 8, 6)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 8, 6);
                            $susp.$blk = 20;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 20;/* allowing case fallthrough */
                    case 20: /* --- debug breakpoint for line 8 --- */
                        /*   140 */ //
                        /*   141 */ // line 8:
                        /*   142 */ //       maxi = i
                        /*   143 */ //       ^
                        /*   144 */ //
                        /*   145 */
                        $currLineNo = 8;
                        /*   146 */
                        $currColNo = 6;
                        /*   147 */
                        /*   148 */
                        if (i === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'i\' referenced before assignment');
                        }
                        /*   149 */
                        maxi = i;
                        $blk = 15;/* allowing case fallthrough */
                    case 15: /* --- end of if --- */
                        $blk = 8;/* jump */
                        continue;
                    case 9: /* --- for cleanup --- */
                        $blk = 10;/* allowing case fallthrough */
                    case 10: /* --- for end --- */
                        if (Sk.breakpoints('<stdin>.py', 10, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 10, 2);
                            $susp.$blk = 21;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 21;/* allowing case fallthrough */
                    case 21: /* --- debug breakpoint for line 10 --- */
                        /*   150 */ //
                        /*   151 */ // line 10:
                        /*   152 */ //   milieu = (debut + fin) // 2
                        /*   153 */ //   ^
                        /*   154 */ //
                        /*   155 */
                        $currLineNo = 10;
                        /*   156 */
                        $currColNo = 2;
                        /*   157 */
                        /*   158 */
                        if (debut === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'debut\' referenced before assignment');
                        }
                        /*   159 */
                        if (fin === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'fin\' referenced before assignment');
                        }
                        /*   160 */
                        var $binop161 = Sk.abstr.numberBinOp(debut, fin, 'Add');
                        var $binop163 = Sk.abstr.numberBinOp($binop161, $scope147.$const162, 'FloorDiv');
                        milieu = $binop163;
                        if (Sk.breakpoints('<stdin>.py', 11, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 11, 2);
                            $susp.$blk = 22;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 22;/* allowing case fallthrough */
                    case 22: /* --- debug breakpoint for line 11 --- */
                        /*   161 */ //
                        /*   162 */ // line 11:
                        /*   163 */ //   hauteur[milieu], hauteur[maxi] = hauteur[maxi], hauteur[milieu]
                        /*   164 */ //   ^
                        /*   165 */ //
                        /*   166 */
                        $currLineNo = 11;
                        /*   167 */
                        $currColNo = 2;
                        /*   168 */
                        /*   169 */
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   170 */
                        if (maxi === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'maxi\' referenced before assignment');
                        }
                        /*   171 */
                        $ret = Sk.abstr.objectGetItem(hauteur, maxi, true);
                        $blk = 23;/* allowing case fallthrough */
                    case 23: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr164 = $ret;
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   172 */
                        if (milieu === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'milieu\' referenced before assignment');
                        }
                        /*   173 */
                        $ret = Sk.abstr.objectGetItem(hauteur, milieu, true);
                        $blk = 24;/* allowing case fallthrough */
                    case 24: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        var $lsubscr165 = $ret;
                        var $elem166 = $lsubscr164;
                        var $elem167 = $lsubscr165;
                        var $loadtuple168 = new Sk.builtins['tuple']([$elem166, $elem167]);
                        var $items169 = Sk.abstr.sequenceUnpack($loadtuple168, 2);
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   174 */
                        if (milieu === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'milieu\' referenced before assignment');
                        }
                        /*   175 */
                        hauteur = hauteur.clone($items169[0]);
                        var $__cloned_references = {};
                        $__cloned_references[hauteur._uuid] = hauteur;
                        $ret = Sk.abstr.objectSetItem(hauteur, milieu, $items169[0], true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, hauteur);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, hauteur);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, hauteur);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, hauteur);
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, hauteur);
                        hauteur.updateReferencesInside($__cloned_references);
                        if (hauteur && hauteur.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(hauteur._uuid)) {
                            hauteur = $__cloned_references[hauteur._uuid];
                        }
                        if (debut && debut.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(debut._uuid)) {
                            debut = $__cloned_references[debut._uuid];
                        }
                        if (fin && fin.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(fin._uuid)) {
                            fin = $__cloned_references[fin._uuid];
                        }
                        if (maxi && maxi.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(maxi._uuid)) {
                            maxi = $__cloned_references[maxi._uuid];
                        }
                        if (i && i.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(i._uuid)) {
                            i = $__cloned_references[i._uuid];
                        }
                        if (milieu && milieu.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(milieu._uuid)) {
                            milieu = $__cloned_references[milieu._uuid];
                        }
                        $blk = 25;/* allowing case fallthrough */
                    case 25: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   176 */
                        if (maxi === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'maxi\' referenced before assignment');
                        }
                        /*   177 */
                        hauteur = hauteur.clone($items169[1]);
                        var $__cloned_references = {};
                        $__cloned_references[hauteur._uuid] = hauteur;
                        $ret = Sk.abstr.objectSetItem(hauteur, maxi, $items169[1], true);
                        Sk.builtin.changeReferences($__cloned_references, $loc, hauteur);
                        for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
                            if (idx > 0) {
                                var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, hauteur);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, hauteur);
                                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, hauteur);
                            }
                        }
                        Sk.builtin.changeReferences($__cloned_references, $gbl, hauteur);
                        hauteur.updateReferencesInside($__cloned_references);
                        if (hauteur && hauteur.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(hauteur._uuid)) {
                            hauteur = $__cloned_references[hauteur._uuid];
                        }
                        if (debut && debut.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(debut._uuid)) {
                            debut = $__cloned_references[debut._uuid];
                        }
                        if (fin && fin.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(fin._uuid)) {
                            fin = $__cloned_references[fin._uuid];
                        }
                        if (maxi && maxi.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(maxi._uuid)) {
                            maxi = $__cloned_references[maxi._uuid];
                        }
                        if (i && i.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(i._uuid)) {
                            i = $__cloned_references[i._uuid];
                        }
                        if (milieu && milieu.hasOwnProperty('_uuid') && $__cloned_references.hasOwnProperty(milieu._uuid)) {
                            milieu = $__cloned_references[milieu._uuid];
                        }
                        $blk = 26;/* allowing case fallthrough */
                    case 26: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', $currLineNo, $currColNo);
                        }
                        if (Sk.breakpoints('<stdin>.py', 13, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 13, 2);
                            $susp.$blk = 27;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 27;/* allowing case fallthrough */
                    case 27: /* --- debug breakpoint for line 13 --- */
                        /*   178 */ //
                        /*   179 */ // line 13:
                        /*   180 */ //   deplacer_bambous(hauteur, debut, milieu)
                        /*   181 */ //   ^
                        /*   182 */ //
                        /*   183 */
                        $currLineNo = 13;
                        /*   184 */
                        $currColNo = 2;
                        /*   185 */
                        /*   186 */
                        console.log('test2', 'deplacer_bambous');
                        var $loadgbl170 = Sk.misceval.loadname('deplacer_bambous', $gbl);
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   187 */
                        if (debut === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'debut\' referenced before assignment');
                        }
                        /*   188 */
                        if (milieu === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'milieu\' referenced before assignment');
                        }
                        /*   189 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl170, [hauteur, debut, milieu]);
                        $blk = 28;/* allowing case fallthrough */
                    case 28: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 13, 2);
                        }
                        var $call171 = $ret;
                        /*   190 */ //
                        /*   191 */ // line 13:
                        /*   192 */ //   deplacer_bambous(hauteur, debut, milieu)
                        /*   193 */ //   ^
                        /*   194 */ //
                        /*   195 */
                        $currLineNo = 13;
                        /*   196 */
                        $currColNo = 2;
                        /*   197 */
                        /*   198 */
                        if (Sk.breakpoints('<stdin>.py', 14, 2)) {
                            var $susp = $saveSuspension({
                                data: {type: 'Sk.debug'}, resume: function () {
                                }
                            }, '<stdin>.py', 14, 2);
                            $susp.$blk = 29;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 29;/* allowing case fallthrough */
                    case 29: /* --- debug breakpoint for line 14 --- */
                        /*   199 */ //
                        /*   200 */ // line 14:
                        /*   201 */ //   deplacer_bambous(hauteur, milieu+1, fin)
                        /*   202 */ //   ^
                        /*   203 */ //
                        /*   204 */
                        $currLineNo = 14;
                        /*   205 */
                        $currColNo = 2;
                        /*   206 */
                        /*   207 */
                        console.log('test2', 'deplacer_bambous');
                        var $loadgbl172 = Sk.misceval.loadname('deplacer_bambous', $gbl);
                        if (hauteur === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'hauteur\' referenced before assignment');
                        }
                        /*   208 */
                        if (milieu === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'milieu\' referenced before assignment');
                        }
                        /*   209 */
                        var $binop174 = Sk.abstr.numberBinOp(milieu, $scope147.$const173, 'Add');
                        if (fin === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'fin\' referenced before assignment');
                        }
                        /*   210 */
                        $ret = Sk.misceval.callsimOrSuspendArray($loadgbl172, [hauteur, $binop174, fin]);
                        $blk = 30;/* allowing case fallthrough */
                    case 30: /* --- function return or resume suspension --- */
                        if ($ret && $ret.$isSuspension) {
                            return $saveSuspension($ret, '<stdin>.py', 14, 2);
                        }
                        var $call175 = $ret;
                        /*   211 */ //
                        /*   212 */ // line 14:
                        /*   213 */ //   deplacer_bambous(hauteur, milieu+1, fin)
                        /*   214 */ //   ^
                        /*   215 */ //
                        /*   216 */
                        $currLineNo = 14;
                        /*   217 */
                        $currColNo = 2;
                        /*   218 */
                        /*   219 */
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
    $scope147.$const162 = new Sk.builtin.int_(2);
    $scope147.$const173 = new Sk.builtin.int_(1);
    /*   220 */
    return $scope146;
}();