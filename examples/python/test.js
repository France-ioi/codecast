var args, args, $free, $lattr18, $unpack19, $lattr18, $unpack19;
var $wakeFromSuspension = function () {
    var susp = $scope15.$wakingSuspension;
    $scope15.$wakingSuspension = undefined;
    $blk = susp.$blk;
    $loc = susp.$loc;
    $gbl = susp.$gbl;
    $exc = susp.$exc;
    $err = susp.$err;
    $postfinally = susp.$postfinally;
    $currLineNo = susp.$lineno;
    $currColNo = susp.$colno;
    Sk.lastYield = Date.now();
    args = susp.$tmps.args;
    $free = susp.$tmps.$free;
    $lattr18 = susp.$tmps.$lattr18;
    $unpack19 = susp.$tmps.$unpack19;
    try {
        $ret = susp.child.resume();
    } catch (err) {
        if (!(err instanceof Sk.builtin.BaseException)) {
            err = new Sk.builtin.ExternalError(err);
        }
        err.traceback.push({lineno: $currLineNo, colno: $currColNo, filename: 'classmethod.py'});
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
        $scope15.$wakingSuspension = susp;
        return $scope15();
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
    susp._name = 'newfunc';
    susp._argnames = [];
    susp._scopename = '$scope15';
    var __$tmpsReferences__ = {};
    if (args && args.hasOwnProperty('_uuid')) {
        __$tmpsReferences__[undefined] = args;
    }
    if ($free && $free.hasOwnProperty('_uuid')) {
        __$tmpsReferences__[undefined] = $free;
    }
    if ($lattr18 && $lattr18.hasOwnProperty('_uuid')) {
        __$tmpsReferences__[undefined] = $lattr18;
    }
    if ($unpack19 && $unpack19.hasOwnProperty('_uuid')) {
        __$tmpsReferences__[undefined] = $unpack19;
    }
    susp.$tmps = {
        "args": args,
        "$free": $free,
        "$lattr18": $lattr18,
        "$unpack19": $unpack19,
        "__refs__": __$tmpsReferences__
    };
    return susp;
};
