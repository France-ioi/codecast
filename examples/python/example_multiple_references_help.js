// Root reference

var $LOADNAME163 = $loc.a !== undefined ? $loc.a : Sk.misceval.loadname('a', $gbl);
$LOADNAME163 = $LOADNAME163.clone();
$ret = Sk.abstr.objectSetItem($LOADNAME163, $scope146.$const147, $scope146.$const162, true);
$loc.a = $LOADNAME163;


// Reference via children

var $LOADNAME174 = $loc.c !== undefined ? $loc.c : Sk.misceval.loadname('c', $gbl);
$ret = Sk.abstr.objectGetItem($LOADNAME174, $scope146.$const147, true);
// Suspension and case...
var $LSUBSCR175 = $ret;
$LSUBSCR175 = $LSUBSCR175.clone();
$ret = Sk.abstr.objectSetItem($LSUBSCR175, $scope146.$const147, $scope146.$const173, true);
$LOADNAME174 = $LOADNAME174.clone();
Sk.abstr.objectSetItem($LOADNAME174, $scope146.$const147, $LSUBSCR175, true);
$loc.c = $LOADNAME174;

