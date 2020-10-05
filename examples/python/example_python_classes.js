/*     1 */
$compiledmod = function() {
    var $scope146 = (function($forcegbl) {
        var $loadname165, $loadname168, $loadname168, $lattr170, $loadname168, $lattr170;
        var $wakeFromSuspension = function() {
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
            $loadname165 = susp.$tmps.$loadname165;
            $loadname168 = susp.$tmps.$loadname168;
            $lattr170 = susp.$tmps.$lattr170;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                } else {
                    throw err;
                }
            }
        };
        var $saveSuspension = function($child, $filename, $lineno, $colno) {
            var susp = new Sk.misceval.Suspension();
            susp.child = $child;
            susp.resume = function() {
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
            susp.$tmps = {
                "$loadname165": $loadname165,
                "$loadname168": $loadname168,
                "$lattr170": $lattr170
            };
            return susp;
        };
        var $gbl = $forcegbl || {},
            $blk = 0,
            $exc = [],
            $loc = $gbl,
            $cell = {},
            $err = undefined;
        $loc.__file__ = new Sk.builtins.str('<stdin>.py');
        var $ret = undefined,
            $postfinally = undefined,
            $currLineNo = undefined,
            $currColNo = undefined;
        if ($scope146.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        }
        if (Sk.retainGlobals) {
            if (Sk.globals) {
                $gbl = Sk.globals;
                Sk.globals = $gbl;
                $loc = $gbl;
            }
            if (Sk.globals) {
                $gbl = Sk.globals;
                Sk.globals = $gbl;
                $loc = $gbl;
                $loc.__file__ = new Sk.builtins.str('<stdin>.py');
            } else {
                Sk.globals = $gbl;
            }
        } else {
            Sk.globals = $gbl;
        }
        while (true) {
            try {
                switch ($blk) {
                    case 0:
                        /* --- module entry --- */ if (Sk.breakpoints('<stdin>.py', 1, 0)) {
                        var $susp = $saveSuspension({
                            data: {
                                type: 'Sk.debug'
                            },
                            resume: function() {}
                        }, '<stdin>.py', 1, 0);
                        $susp.$blk = 1;
                        $susp.optional = true;
                        return $susp;
                    }
                        $blk = 1; /* allowing case fallthrough */
                    case 1:
                        /* --- debug breakpoint for line 1 --- */
                        /*     2 */ //
                        /*     3 */ // line 1:
                        /*     4 */ // class classA:
                        /*     5 */ // ^
                        /*     6 */ //
                        /*     7 */
                        $currLineNo = 1;
                        /*     8 */
                        $currColNo = 0;
                        /*     9 */
                        /*    10 */
                        $scope147.co_name = new Sk.builtins['str']('classA');
                        $ret = Sk.misceval.buildClass($gbl, $scope147, 'classA', [], $cell);
                        $loc.classA = window.currentPythonRunner.reportValue($ret, '$loc.classA');
                        if (Sk.breakpoints('<stdin>.py', 5, 0)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function() {}
                            }, '<stdin>.py', 5, 0);
                            $susp.$blk = 2;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 2; /* allowing case fallthrough */
                    case 2:
                        /* --- debug breakpoint for line 5 --- */
                        /*    11 */ //
                        /*    12 */ // line 5:
                        /*    13 */ // class classB(classA):
                        /*    14 */ // ^
                        /*    15 */ //
                        /*    16 */
                        $currLineNo = 5;
                        /*    17 */
                        $currColNo = 0;
                        /*    18 */
                        /*    19 */
                        var $loadname152 = $loc.classA !== undefined ? $loc.classA : Sk.misceval.loadname('classA', $gbl);;
                        console.log('$loadname152 =', $loadname152);
                        $scope153.co_name = new Sk.builtins['str']('classB');
                        $ret = Sk.misceval.buildClass($gbl, $scope153, 'classB', [$loadname152], $cell);
                        $loc.classB = window.currentPythonRunner.reportValue($ret, '$loc.classB');
                        if (Sk.breakpoints('<stdin>.py', 10, 0)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function() {}
                            }, '<stdin>.py', 10, 0);
                            $susp.$blk = 3;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 3; /* allowing case fallthrough */
                    case 3:
                        /* --- debug breakpoint for line 10 --- */
                        /*    20 */ //
                        /*    21 */ // line 10:
                        /*    22 */ // obj = classB(41)
                        /*    23 */ // ^
                        /*    24 */ //
                        /*    25 */
                        $currLineNo = 10;
                        /*    26 */
                        $currColNo = 0;
                        /*    27 */
                        /*    28 */
                        var $loadname165 = $loc.classB !== undefined ? $loc.classB : Sk.misceval.loadname('classB', $gbl);;
                        console.log('$loadname165 =', $loadname165);
                        console.log('ENTER callsimOrSuspendArray', '$loadname165', $loadname165, [$scope146.$const166]);
                        $ret = Sk.misceval.callsimOrSuspendArray($loadname165, [$scope146.$const166]);
                        $blk = 4; /* allowing case fallthrough */
                    case 4:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 10, 6);
                    }
                        var $call167 = $ret;
                        console.log('$call167 =', $call167);
                        /*    29 */ //
                        /*    30 */ // line 10:
                        /*    31 */ // obj = classB(41)
                        /*    32 */ //       ^
                        /*    33 */ //
                        /*    34 */
                        $currLineNo = 10;
                        /*    35 */
                        $currColNo = 6;
                        /*    36 */
                        /*    37 */
                        $loc.obj = window.currentPythonRunner.reportValue($call167, '$loc.obj');
                        if (Sk.breakpoints('<stdin>.py', 11, 0)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function() {}
                            }, '<stdin>.py', 11, 0);
                            $susp.$blk = 5;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 5; /* allowing case fallthrough */
                    case 5:
                        /* --- debug breakpoint for line 11 --- */
                        /*    38 */ //
                        /*    39 */ // line 11:
                        /*    40 */ // print obj.a
                        /*    41 */ // ^
                        /*    42 */ //
                        /*    43 */
                        $currLineNo = 11;
                        /*    44 */
                        $currColNo = 0;
                        /*    45 */
                        /*    46 */
                        var $loadname168 = $loc.obj !== undefined ? $loc.obj : Sk.misceval.loadname('obj', $gbl);;
                        console.log('$loadname168 =', $loadname168);
                        $ret = Sk.abstr.gattr($loadname168, $scope146.$const169, true);
                        $blk = 6; /* allowing case fallthrough */
                    case 6:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 11, 6);
                    }
                        var $lattr170 = $ret;
                        console.log('$lattr170 =', $lattr170);
                        $ret = Sk.misceval.print_(new Sk.builtins['str']($lattr170).v);
                        $blk = 7; /* allowing case fallthrough */
                    case 7:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 11, 0);
                    }
                        $ret = Sk.misceval.print_("\n");
                        $blk = 8; /* allowing case fallthrough */
                    case 8:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 11, 0);
                    }
                        console.log('cmod ast return');
                        return $loc;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
    $scope146.$const166 = new Sk.builtin.int_(41);
    $scope146.$const169 = new Sk.builtin.str('a');
    var $scope147 = (function $classA$class_outer($globals, $locals, $cell) {
        var $gbl = $globals,
            $loc = $locals;
        $free = $globals;
        (function $classA$_closure($cell) {
            var $blk = 0,
                $exc = [],
                $ret = undefined,
                $postfinally = undefined,
                $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0:
                            /* --- class entry --- */
                            /*    47 */ //
                            /*    48 */ // line 2:
                            /*    49 */ //     def __init__(self, a):
                            /*    50 */ //     ^
                            /*    51 */ //
                            /*    52 */
                            $currLineNo = 2;
                            /*    53 */
                            $currColNo = 4;
                            /*    54 */
                            /*    55 */
                            $scope148.co_name = new Sk.builtins['str']('__init__');
                            $scope148.co_varnames = ['self', 'a'];
                            var $funcobj151 = new Sk.builtins['function']($scope148, $gbl);
                            console.log('$funcobj151 =', $funcobj151);
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj151, '$loc.__init__');
                            return;
                            throw new Sk.builtin.SystemError('internal error: unterminated block');
                    }
                } catch (err) {
                    if (!(err instanceof Sk.builtin.BaseException)) {
                        err = new Sk.builtin.ExternalError(err);
                    }
                    err.traceback.push({
                        lineno: $currLineNo,
                        colno: $currColNo,
                        filename: '<stdin>.py'
                    });
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
        var $wakeFromSuspension = function() {
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
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                } else {
                    throw err;
                }
            }
        };
        var $saveSuspension = function($child, $filename, $lineno, $colno) {
            var susp = new Sk.misceval.Suspension();
            susp.child = $child;
            susp.resume = function() {
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
            susp.$tmps = {
                "a": a,
                "self": self
            };
            return susp;
        };
        var $blk = 0,
            $exc = [],
            $loc = {},
            $cell = {},
            $gbl = this,
            $err = undefined,
            $ret = undefined,
            $postfinally = undefined,
            $currLineNo = undefined,
            $currColNo = undefined;
        if ($scope148.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {}
        $gbl.__class__ = this.classA;
        while (true) {
            try {
                switch ($blk) {
                    case 0:
                        /* --- codeobj entry --- */ if (self === undefined) {
                        throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                    }
                        /*    56 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    57 */
                        if (Sk.breakpoints('<stdin>.py', 3, 8)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function() {}
                            }, '<stdin>.py', 3, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1; /* allowing case fallthrough */
                    case 1:
                        /* --- debug breakpoint for line 3 --- */
                        /*    58 */ //
                        /*    59 */ // line 3:
                        /*    60 */ //         self.a = a
                        /*    61 */ //         ^
                        /*    62 */ //
                        /*    63 */
                        $currLineNo = 3;
                        /*    64 */
                        $currColNo = 8;
                        /*    65 */
                        /*    66 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    67 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*    68 */
                        $ret = Sk.abstr.sattr(self, $scope148.$const150, a, true);
                        $blk = 2; /* allowing case fallthrough */
                    case 2:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 3, 8);
                    }
                        return Sk.builtin.none.none$;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
    var $scope153 = (function $classB$class_outer($globals, $locals, $cell) {
        var $gbl = $globals,
            $loc = $locals;
        $free = $globals;
        (function $classB$_closure($cell) {
            var $blk = 0,
                $exc = [],
                $ret = undefined,
                $postfinally = undefined,
                $currLineNo = undefined,
                $currColNo = undefined;
            while (true) {
                try {
                    switch ($blk) {
                        case 0:
                            /* --- class entry --- */
                            /*    69 */ //
                            /*    70 */ // line 6:
                            /*    71 */ //     def __init__(self, a):
                            /*    72 */ //     ^
                            /*    73 */ //
                            /*    74 */
                            $currLineNo = 6;
                            /*    75 */
                            $currColNo = 4;
                            /*    76 */
                            /*    77 */
                            $scope154.co_name = new Sk.builtins['str']('__init__');
                            $scope154.co_varnames = ['self', 'a'];
                            var $funcobj164 = new Sk.builtins['function']($scope154, $gbl);
                            console.log('$funcobj164 =', $funcobj164);
                            $loc.__init__ = window.currentPythonRunner.reportValue($funcobj164, '$loc.__init__');
                            return;
                            throw new Sk.builtin.SystemError('internal error: unterminated block');
                    }
                } catch (err) {
                    if (!(err instanceof Sk.builtin.BaseException)) {
                        err = new Sk.builtin.ExternalError(err);
                    }
                    err.traceback.push({
                        lineno: $currLineNo,
                        colno: $currColNo,
                        filename: '<stdin>.py'
                    });
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
    var $scope154 = (function $__init__155$(self, a) {
        var a, a, self, self, self, self, $loadgbl156, $loadgbl156, $lattr158, $lattr161, $binop163;
        var $wakeFromSuspension = function() {
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
            a = susp.$tmps.a;
            self = susp.$tmps.self;
            $loadgbl156 = susp.$tmps.$loadgbl156;
            $lattr158 = susp.$tmps.$lattr158;
            $lattr161 = susp.$tmps.$lattr161;
            $binop163 = susp.$tmps.$binop163;
            try {
                $ret = susp.child.resume();
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
                if ($exc.length > 0) {
                    $err = err;
                    $blk = $exc.pop();
                } else {
                    throw err;
                }
            }
        };
        var $saveSuspension = function($child, $filename, $lineno, $colno) {
            var susp = new Sk.misceval.Suspension();
            susp.child = $child;
            susp.resume = function() {
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
            susp.$tmps = {
                "a": a,
                "self": self,
                "$loadgbl156": $loadgbl156,
                "$lattr158": $lattr158,
                "$lattr161": $lattr161,
                "$binop163": $binop163
            };
            return susp;
        };
        var $blk = 0,
            $exc = [],
            $loc = {},
            $cell = {},
            $gbl = this,
            $err = undefined,
            $ret = undefined,
            $postfinally = undefined,
            $currLineNo = undefined,
            $currColNo = undefined;
        if ($scope154.$wakingSuspension !== undefined) {
            $wakeFromSuspension();
        } else {}
        $gbl.__class__ = this.classB;
        while (true) {
            try {
                switch ($blk) {
                    case 0:
                        /* --- codeobj entry --- */ if (self === undefined) {
                        throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                    }
                        /*    78 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    79 */
                        if (Sk.breakpoints('<stdin>.py', 7, 8)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function() {}
                            }, '<stdin>.py', 7, 8);
                            $susp.$blk = 1;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 1; /* allowing case fallthrough */
                    case 1:
                        /* --- debug breakpoint for line 7 --- */
                        /*    80 */ //
                        /*    81 */ // line 7:
                        /*    82 */ //         classA.__init__(self, a)
                        /*    83 */ //         ^
                        /*    84 */ //
                        /*    85 */
                        $currLineNo = 7;
                        /*    86 */
                        $currColNo = 8;
                        /*    87 */
                        /*    88 */
                        var $loadgbl156 = Sk.misceval.loadname('classA', $gbl);
                        console.log('$loadgbl156 =', $loadgbl156);
                        $ret = Sk.abstr.gattr($loadgbl156, $scope154.$const157, true);
                        $blk = 2; /* allowing case fallthrough */
                    case 2:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 7, 8);
                    }
                        var $lattr158 = $ret;
                        console.log('$lattr158 =', $lattr158);
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*    89 */
                        if (a === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'a\' referenced before assignment');
                        }
                        /*    90 */
                        console.log('ENTER callsimOrSuspendArray', '$lattr158', $lattr158, [self, a]);
                        $ret = Sk.misceval.callsimOrSuspendArray($lattr158, [self, a]);
                        $blk = 3; /* allowing case fallthrough */
                    case 3:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 7, 8);
                    }
                        var $call159 = $ret;
                        console.log('$call159 =', $call159);
                        /*    91 */ //
                        /*    92 */ // line 7:
                        /*    93 */ //         classA.__init__(self, a)
                        /*    94 */ //         ^
                        /*    95 */ //
                        /*    96 */
                        $currLineNo = 7;
                        /*    97 */
                        $currColNo = 8;
                        /*    98 */
                        /*    99 */
                        if (Sk.breakpoints('<stdin>.py', 8, 8)) {
                            var $susp = $saveSuspension({
                                data: {
                                    type: 'Sk.debug'
                                },
                                resume: function() {}
                            }, '<stdin>.py', 8, 8);
                            $susp.$blk = 4;
                            $susp.optional = true;
                            return $susp;
                        }
                        $blk = 4; /* allowing case fallthrough */
                    case 4:
                        /* --- debug breakpoint for line 8 --- */
                        /*   100 */ //
                        /*   101 */ // line 8:
                        /*   102 */ //         self.a = self.a + 1
                        /*   103 */ //         ^
                        /*   104 */ //
                        /*   105 */
                        $currLineNo = 8;
                        /*   106 */
                        $currColNo = 8;
                        /*   107 */
                        /*   108 */
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   109 */
                        $ret = Sk.abstr.gattr(self, $scope154.$const160, true);
                        $blk = 5; /* allowing case fallthrough */
                    case 5:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 8, 17);
                    }
                        var $lattr161 = $ret;
                        console.log('$lattr161 =', $lattr161);
                        var $binop163 = Sk.abstr.numberBinOp($lattr161, $scope154.$const162, 'Add');
                        console.log('$binop163 =', $binop163);
                        if (self === undefined) {
                            throw new Sk.builtin.UnboundLocalError('local variable \'self\' referenced before assignment');
                        }
                        /*   110 */
                        $ret = Sk.abstr.sattr(self, $scope154.$const160, $binop163, true);
                        $blk = 6; /* allowing case fallthrough */
                    case 6:
                        /* --- function return or resume suspension --- */ if ($ret && $ret.$isSuspension) {
                        console.log('saveSuspension');
                        return $saveSuspension($ret, '<stdin>.py', 8, 8);
                    }
                        return Sk.builtin.none.none$;
                        throw new Sk.builtin.SystemError('internal error: unterminated block');
                }
            } catch (err) {
                if (!(err instanceof Sk.builtin.BaseException)) {
                    err = new Sk.builtin.ExternalError(err);
                }
                err.traceback.push({
                    lineno: $currLineNo,
                    colno: $currColNo,
                    filename: '<stdin>.py'
                });
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
    $scope154.$const157 = new Sk.builtin.str('__init__');
    $scope154.$const160 = new Sk.builtin.str('a');
    $scope154.$const162 = new Sk.builtin.int_(1);
    /*   111 */
    return $scope146;
}();