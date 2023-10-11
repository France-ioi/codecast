window.ace.define(
    "ace/mode/michelson_highlight_rules",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"],
    function (require, exports, module) {
        "use strict";

        var oop = require("../lib/oop");
        var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

        var MichelsonHighlightRules = function() {
            // regexp must not have capturing parentheses. Use (?:) instead.
            // regexps are ordered -> the first match is used

            this.$rules = {
                start: [{
                    include: "#bytes"
                }, {
                    include: "#string"
                }, {
                    include: "#number"
                }, {
                    include: "#comment"
                }, {
                    include: "#multicomment"
                }, {
                    include: "#block"
                }, {
                    include: "#data"
                }, {
                    include: "#instruction"
                }, {
                    include: "#type"
                }, {
                    include: "#macros"
                }, {
                    include: "#annotations"
                }],
                "#string": [{
                    token: "string.quoted.michelson",
                    regex: /"/,
                    push: [{
                        token: "string.quoted.michelson",
                        regex: /"/,
                        next: "pop"
                    }, {
                        token: "string.quoted.michelson",
                        regex: /\\./
                    }, {
                        defaultToken: "string.quoted.michelson"
                    }]
                }],
                "#number": [{
                    token: "string.michelson",
                    regex: /\b-?[0-9]+\b/
                }],
                "#bytes": [{
                    token: "string.michelson",
                    regex: /\b0x[0-9A-Ea-e]*\b/
                }],
                "#comment": [{
                    token: "comment.language.michelson",
                    regex: /#.*$/,
                    next: "pop"
                }],
                "#multicomment": [{
                    token: "comment.language.michelson",
                    regex: /\/\*/,
                    push: [{
                        token: "comment.language.michelson",
                        regex: /\*\//,
                        next: "pop"
                    }, {
                        token: "constant.character.escape.michelson",
                        regex: /wordPattern/
                    }, {
                        defaultToken: "comment.language.michelson"
                    }]
                }],
                "#block": [{
                    token: "keyword.control.michelson",
                    regex: /\b(?:parameter|storage|code?)\b/
                }],
                "#data": [{
                    token: "variable.other.enummember.michelson",
                    regex: /\b(?:Unit|True|False|Pair|Left|Right|Some|None|Elt)\b/
                }],
                "#instruction": [{
                    token: "support.function.michelson",
                    regex: /\b(?:APPLY|EXEC|FAILWITH|IF_CONS|IF_LEFT|IF_NONE|IF|ITER|LAMBDA|LOOP_LEFT|LOOP)\b/
                }, {
                    token: "support.function.michelson",
                    regex: /\b(?:DIG|DIP|DROP|DUG|DUP|PUSH|SWAP|CAST|RENAME|STEPS_TO_QUOTA)\b/
                }, {
                    token: "support.function.michelson",
                    regex: /\b(?:ABS|ADD|COMPARE|EDIV|NEQ|EQ|GE|GT|INT|ISNAT|LE|LSL|LSR|LT|MUL|NEG|SUB|AND|NOT|OR|XOR)\b/
                }, {
                    token: "support.function.michelson",
                    regex: /\b(?:BLAKE2B|CHECK_SIGNATURE|HASH_KEY|KECCAK|PAIRING_CHECK|SAPLING_EMPTY_STATE|SAPLING_VERIFY_UPDATE|SHA256|SHA3|SHA512)\b/
                }, {
                    token: "support.function.michelson",
                    regex: /\b(?:ADDRESS|AMOUNT|BALANCE|CHAIN_ID|CREATE_CONTRACT|CONTRACT|IMPLICIT_ACCOUNT|LEVEL|NOW|SELF_ADDRESS|SELF|SENDER|SET_DELEGATE|SOURCE|TOTAL_VOTING_POWER|VOTING_POWER|TRANSFER_TOKENS)\b/
                }, {
                    token: "support.function.michelson",
                    regex: /\b(?:GET_AND_UPDATE|GET|UPDATE|SOME|NONE|UNIT|UNPAIR|PAIR|CAR|CDR|LEFT|RIGHT|NIL|CONS|SIZE|EMPTY_SET|EMPTY_MAP|MAP|MEM|CONCAT|SLICE|UNPACK|PACK|JOIN_TICKETS|READ_TICKET|SPLIT_TICKET|TICKET)\b/
                }],
                "#type": [{
                    token: "entity.name.type.michelson support.type.michelson",
                    regex: /\b(?:unit|int|nat|string|bytes|bool)\b/
                }, {
                    token: "entity.name.type.michelson support.type.michelson",
                    regex: /\b(?:option|list|set|contract|pair|or|lambda|big_map|map|ticket)\b/
                }, {
                    token: "entity.name.type.michelson support.type.michelson",
                    regex: /\b(?:key_hash|key|signature|operation|address|mutez|timestamp|chain_id|never)\b/
                }, {
                    token: "entity.name.type.michelson support.type.michelson",
                    regex: /\b(?:sapling_state|sapling_transaction|bls12_381_fr|bls12_381_g1|bls12_381_g2)\b/
                }],
                "#macros": [{
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\b(?:IF_SOME|IF_RIGHT|FAIL|ASSERT|ASSERT_NONE|ASSERT_SOME|ASSERT_LEFT|ASSERT_RIGHT|(?:SET|MAP)_C[AD]+R)\b/
                }, {
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\b(?:DII+P|C[AD]{2,}R|DUU+P|P[PAI]{3,}R|UNP[PAI]{3,}R)\b/
                }, {
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\bCMP(?:EQ|NEQ|LT|GT|LE|GE)\b/
                }, {
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\bIF(?:EQ|NEQ|LT|GT|LE|GE)\b/
                }, {
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\bIFCMP(?:EQ|NEQ|LT|GT|LE|GE)\b/
                }, {
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\bASSERT_(?:EQ|NEQ|LT|LE|GT|GE)\b/
                }, {
                    token: "variable.function.michelson meta.preprocessor.numeric.michelson",
                    regex: /\bASSERT_CMP(?:EQ|NEQ|LT|LE|GT|GE)\b/
                }],
                "#annotations": [{
                    token: "entity.other.attribute-name.michelson",
                    regex: /(?:\s)%[A-z_0-9%@]*/
                }, {
                    token: "entity.other.attribute-name.michelson",
                    regex: /(?:\s)@[A-z_0-9%]+\b/
                }, {
                    token: "entity.other.attribute-name.michelson",
                    regex: /(?:\s):[A-z_0-9]+\b/
                }]
            }

            this.normalizeRules();
        };

        // @ts-ignore
        MichelsonHighlightRules.metaData = {
            scopeName: "source.michelson",
            name: "Michelson"
        }

        oop.inherits(MichelsonHighlightRules, TextHighlightRules);

        exports.MichelsonHighlightRules = MichelsonHighlightRules;
    }
);

window.ace.define(
    "ace/mode/michelson",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/michelson_highlight_rules", "ace/mode/folding/cstyle"],
    function (require, exports, module) {
        "use strict";

        var oop = require("../lib/oop");
        var TextMode = require("./text").Mode;
        var MichelsonHighlightRules = require("./michelson_highlight_rules").MichelsonHighlightRules;
        // TODO: pick appropriate fold mode
        var FoldMode = require("./folding/cstyle").FoldMode;

        var Mode = function() {
            this.HighlightRules = MichelsonHighlightRules;
            this.foldingRules = new FoldMode();
        };
        oop.inherits(Mode, TextMode);

        (function() {
            // this.lineCommentStart = ""\\/\\*"";
            // this.blockComment = {start: ""/*"", end: ""*/""};
            // Extra logic goes here.
            this.$id = "ace/mode/michelson";
        }).call(Mode.prototype);

        exports.Mode = Mode;
    }
);

(function () {
    window.ace.require(["ace/mode/michelson"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
