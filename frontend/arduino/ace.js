ace.define("ace/mode/arduino",[
    "require","exports","module",
    "ace/lib/oop","ace/mode/c_cpp","ace/mode/c_cpp_highlight_rules"],
    function(acequire, exports, module) {
"use strict";

var oop = acequire("ace/lib/oop");
var CCppMode = acequire("ace/mode/c_cpp").Mode;
var c_cppHighlightRules = acequire("./c_cpp_highlight_rules").c_cppHighlightRules;
var MatchingBraceOutdent = acequire("ace/mode/matching_brace_outdent").MatchingBraceOutdent;
var CstyleBehaviour = acequire("ace/mode/behaviour/cstyle").CstyleBehaviour;
var CStyleFoldMode = acequire("ace/mode/folding/cstyle").FoldMode;

function ArduinoHighlightRules () {
    this.$rules = new c_cppHighlightRules().getRules();
    this.$rules.start.unshift({
        token: "constant.c++.arduino",
        regex: /\b(?:HIGH|LOW|INPUT|OUTPUT|DEC|BIN|HEX|OCT|BYTE|PI|HALF_PI|TWO_PI|LSBFIRST|MSBFIRST|CHANGE|FALLING|RISING|DEFAULT|EXTERNAL|INTERNAL|INTERNAL1V1|INTERNAL2V56|null)\b/
    }, {
        token: "storage.c++.arduino",
        regex: /\b(?:boolean|byte|word)\b/
    }, {
        token: "support.function.c++.arduino",
        regex: /\b(?:abs|acos|asin|atan|atan2|ceil|constrain|cos|degrees|exp|floor|log|map|max|min|radians|random|randomSeed|round|sin|sq|sqrt|tan|bitRead|bitWrite|bitSet|bitClear|bit|highByte|lowByte|analogReference|analogRead|analogWrite|attachInterrupt|detachInterrupt|delay|delayMicroseconds|digitalWrite|digitalRead|interrupts|millis|micros|noInterrupts|noTone|pinMode|pulseIn|shiftOut|tone|begin|end|read|print|println|available|flush|setup|loop)\b/
    }, {
        token: "support.class.c++.arduino",
        regex: /\bSerial\d?\b/
    }, {
        token: "storage.modifier.c++.arduino",
        regex: /\b(?:private|protected|public)/
    });
    this.normalizeRules();
};
ArduinoHighlightRules.metaData = {
    name: "Arduino",
    scopeName: "source.c++.arduino",
    fileTypes: ["ino"]
};
oop.inherits(ArduinoHighlightRules, c_cppHighlightRules);

function Mode () {
    this.HighlightRules = ArduinoHighlightRules;
    this.$outdent = new MatchingBraceOutdent();
    this.$behaviour = new CstyleBehaviour();
    this.foldingRules = new CStyleFoldMode();
};
oop.inherits(Mode, CCppMode);

(function() {
    this.$id = "ace/mode/arduino";
}).call(Mode.prototype);

exports.Mode = Mode;
});