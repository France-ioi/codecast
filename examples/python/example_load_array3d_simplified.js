/*    22 */ // Array3D[0][1][0] = Array3D[0][1][1] + v + 100

var $loadname177_Array3d = $loc.Array3D !== undefined ? $loc.Array3D : Sk.misceval.loadname('Array3D', $gbl);
$ret = Sk.abstr.objectGetItem($loadname177_Array3d, "CONSTANT_0", true);

var $lsubscr179_Array3d_0 = $ret;
$ret = Sk.abstr.objectGetItem($lsubscr179_Array3d_0, "CONSTANT_1", true);

var $lsubscr181_Array3d_0_1 = $ret;
$ret = Sk.abstr.objectGetItem($lsubscr181_Array3d_0_1, "CONSTANT_1", true);

var $lsubscr182_Array3d_0_1_1 = $ret;
var $loadname183_v = $loc.v !== undefined ? $loc.v : Sk.misceval.loadname('v', $gbl);
var $binop184 = Sk.abstr.numberBinOp($lsubscr182_Array3d_0_1_1, $loadname183_v, 'Add');
var $binop186 = Sk.abstr.numberBinOp($binop184, "CONSTANT_100", 'Add');

var $loadname187_Array3d = $loc.Array3D !== undefined ? $loc.Array3D : Sk.misceval.loadname('Array3D', $gbl);
$ret = Sk.abstr.objectGetItem($loadname187_Array3d, "CONSTANT_0", true);

var $lsubscr188_Array3d_0 = $ret;
$ret = Sk.abstr.objectGetItem($lsubscr188_Array3d_0, "CONSTANT_1", true);

var $lsubscr189_Array3d_0_1 = $ret;
$lsubscr189_Array3d_0_1 = $lsubscr189_Array3d_0_1.clone($binop186);
var $__cloned_references = {};
$__cloned_references[$lsubscr189_Array3d_0_1._uuid] = $lsubscr189_Array3d_0_1;
if ($lsubscr189_Array3d_0_1.hasOwnProperty('$d')) {
    $__cloned_references[$lsubscr189_Array3d_0_1.$d._uuid] = $lsubscr189_Array3d_0_1.$d;
}
$ret = Sk.abstr.objectSetItem($lsubscr189_Array3d_0_1, "CONSTANT_0", $binop186, true);
Sk.builtin.changeReferences($__cloned_references, $loc, $lsubscr189_Array3d_0_1);
for (var idx in window.currentPythonRunner._debugger.suspension_stack) {
    if (idx > 0) {
        var $__cur_suspension__ = window.currentPythonRunner._debugger.suspension_stack[idx];
        while ($__cur_suspension__) {
            if ($__cur_suspension__.hasOwnProperty('$gbl')) {
                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$tmps, $lsubscr189_Array3d_0_1);
                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$loc, $lsubscr189_Array3d_0_1);
                Sk.builtin.changeReferences($__cloned_references, $__cur_suspension__.$gbl, $lsubscr189_Array3d_0_1);
            }
            $__cur_suspension__ = $__cur_suspension__.child;
        }
    }
}
Sk.builtin.changeReferences($__cloned_references, $gbl, $lsubscr189_Array3d_0_1);
window.currentPythonRunner._debugger.updatePromiseReference($lsubscr189_Array3d_0_1);
$lsubscr189_Array3d_0_1.updateReferencesInside($__cloned_references);
