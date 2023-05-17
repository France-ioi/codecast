window.ace.define(
    "ace/mode/archetype_highlight_rules",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text_highlight_rules"],
    function (require, exports, module) {
        "use strict";

        var oop = require("../lib/oop");
        var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

        var ArchetypeHighlightRules = function() {
            // regexp must not have capturing parentheses. Use (?:) instead.
            // regexps are ordered -> the first match is used

            this.$rules = {
                start: [{
                    include: "#expression"
                }],
                "#expression": [{
                    include: "#identifier"
                }, {
                    include: "#transfer"
                }, {
                    include: "#detach"
                }, {
                    include: "#declaration"
                }, {
                    include: "#comment"
                }, {
                    include: "#operator"
                }, {
                    include: "#literal"
                }, {
                    include: "#type"
                }, {
                    include: "#control"
                }, {
                    include: "#builtin"
                }, {
                    include: "#case"
                }, {
                    include: "#section"
                }, {
                    include: "#local"
                }, {
                    include: "#seq"
                }, {
                    include: "#emphasis"
                }, {
                    include: "#constant"
                }, {
                    include: "#other"
                }],
                "#identifier": [{
                    token: "variable.other",
                    regex: /\%[a-zA-Z][a-zA-Z0-9_]*/
                }],
                "#transfer": [{
                    token: "entity.name.function",
                    regex: /\btransfer\b/,
                    push: [{
                        token: "entity.name.function",
                        regex: /\b(?:to entry|to)\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }],
                "#detach": [{
                    token: "storage.type",
                    regex: /\bdetach\b/,
                    push: [{
                        token: "storage.type",
                        regex: /\bas\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }],
                "#constant": [{
                    token: "constant.language.boolean",
                    regex: /\b(?:self_chain_id|now|balance|transferred|self|caller|source|self_address|state|operations|metadata|level|total_voting_power|min_block_time)\b/
                }],
                "#operator": [{
                    token: "keyword.operator.comparison",
                    regex: /<|>|<=|>=|<>|=|<=>|\|>>|\|<</
                }, {
                    token: "keyword.operator.arithmetic",
                    regex: /\+|\-|\*|,|\[|\]|\/|\/%|&/
                }, {
                    token: "keyword.operator.arithmetic",
                    regex: /\bdiv\b/
                }, {
                    token: "keyword.operator.boolean",
                    regex: /\b(?:and|or|not|xor|\->)\b/
                }, {
                    token: "keyword.operator.arithmetic",
                    regex: /\,|\[|\]|\/|&/
                }, {
                    token: "keyword.operator.type",
                    regex: /:/
                }],
                "#emphasis": [{
                    token: "entity.name.tag",
                    regex: /\b(?:do_require|fail_some|do_fail_if|fail)\b/
                }, {
                    token: "entity.name.tag",
                    regex: /\b[A-Z][0-9A-Z_]*\b/
                }],
                "#section": [{
                    token: "storage.modifier",
                    regex: /\b(?:called\s+by|sourced\s+by|effect|with\s+effect|no\s+transfer|constant|require|fail\s+if|otherwise|is|when|identified\s+by|initialized\s+(?:by|with))\b/
                }, {
                    token: "storage.modifier",
                    regex: /\bfrom\b/,
                    push: [{
                        token: "storage.modifier",
                        regex: /\bto\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }],
                "#seq": [{
                    token: "punctuation.definition.block",
                    regex: /\bbegin\b/,
                    push: [{
                        token: "punctuation.definition.block",
                        regex: /\bend\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }],
                "#local": [{
                    token: "storage.type",
                    regex: /\b(?:var|const)\b/
                }, {
                    token: "storage.type",
                    regex: /\b(?:let\s+some|let)\b/,
                    push: [{
                        token: "storage.type",
                        regex: /\bin\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }],
                "#control": [{
                    token: "keyword.control",
                    regex: /\b(?:return|if|then|else|exists)\b/
                }, {
                    token: "keyword.control",
                    regex: /\bmatch\b/
                }, {
                    token: "keyword.control",
                    regex: /\bwith\b/,
                    push: [{
                        token: "keyword.control",
                        regex: /\bend\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }, {
                    token: "keyword.control",
                    regex: /\bdo\b/,
                    push: [{
                        token: "keyword.control",
                        regex: /\bdone\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }, {
                    token: "keyword.control",
                    regex: /\b(?:for|forall|iter)\b/,
                    push: [{
                        token: "keyword.control",
                        regex: /\bin\b/,
                        next: "pop"
                    }, {
                        include: "#expression"
                    }]
                }],
                "#case": [{
                    token: "keyword.control",
                    regex: /\|\s+/
                }],
                "#builtin": [{
                    token: [
                        "entity.name.function",
                        "text",
                        "keyword.control"
                    ],
                    regex: /\b(call_view|get_entrypoint|left|make_event|make_asset|make_set|make_list|make_map|none|right|unpack|emit)(\s*)(<)/,
                    push: [{
                        token: ["text", "keyword.control"],
                        regex: /(\s*)(>)/,
                        next: "pop"
                    }, {
                        include: "#type"
                    }]
                }, {
                    token: "entity.name.function",
                    regex: /\b(?:to_container|call|remove_all|remove_if|clear|nth|sort|select|update|add_update|update_all|put_remove|remove|the|abs|add|address_to_contract|apply_lambda|blake2b|call_view|ceil|check_signature|concat|contains|contract_to_address|create_ticket|exec_lambda|floor|fold|get_entrypoint|greedy_and|greedy_or|int_to_date|int_to_nat|is_none|is_some|join_tickets|keccak|key_hash_to_contract|key_to_address|key_to_key_hash|left|length|make_big_map|make_list|make_map|make_operation|make_set|map|max|min|mutez_to_nat|nat_to_string|none|nth|head|tail|open_chest|pack|pairing_check|prepend|put|read_ticket|remove|reverse|right|sapling_empty_state|sapling_verify_update|set_delegate|sha256|sha3|sha512|slice|some|split_ticket|sub_mutez|sub_nat|unpack|update|voting_power|create_contract|nat_to_bytes|bytes_to_nat|int_to_bytes|bytes_to_int|simplify_rational|get_numerator|get_denominator|global_constant|is_implicit_address)\b/
                }],
                "#declaration": [{
                    token: ["keyword.control", "text", "text"],
                    regex: /\b(archetype)(\s+)((?:[a-z][a-zA-z0-9_]*)?)/
                }, {
                    token: [
                        "keyword.control",
                        "text",
                        "text",
                        "text",
                        "keyword.control"
                    ],
                    regex: /\b(import)(\s+)((?:[a-z][a-zA-z0-9_]*)?)(\s+)(from)/
                }, {
                    token: "keyword.control",
                    regex: /\bwith\s+metadata\b/
                }, {
                    token: "storage.type.function.visibility",
                    regex: /\b(?:onchain|offchain)\b/
                }, {
                    token: ["storage.type.function", "text", "text"],
                    regex: /\b(constant|variable|entry|getter|view|function|asset|to\s+big_map|transition|specification\s+(?:entry|getter|transition)|specification|definition|predicate|shadow\s+effect|assert|postcondition|fails|invariant\s+for)\b(\s*)((?:[a-zA-Z][a-zA-z0-9_]*)?)/
                }, {
                    token: ["storage.type.class", "text", "text"],
                    regex: /\b(enum|record|states|event)\b(\s*)((?:[a-zA-Z][a-zA-z0-9_]*)?)/
                }, {
                    token: "storage.type.other",
                    regex: /\binitial\b/
                }],
                "#type": [{
                    token: ["support.type", "text", "keyword"],
                    regex: /\b(aggregate|asset_key|asset_value|asset_view|asset_container|big_map|contract|iterable_big_map|lambda|list|map|option|or|partition|set)\b(\s*)(<)/,
                    push: [{
                        token: ["text", "keyword"],
                        regex: /(\s?)(>)/,
                        next: "pop"
                    }, {
                        include: "#type"
                    }, {
                        token: "keyword",
                        regex: /\*/
                    }]
                }, {
                    token: "support.type",
                    regex: /\b(?:address|bls12_381_fr|bls12_381_g1|bls12_381_g2|bool|bytes|chain_id|chest|chest_key|date|duration|int|key|key_hash|nat|never|operation|rational|sapling_state|sapling_transaction|signature|string|tez|ticket|tx_rollup_l2_address|unit)\b/
                }, {
                    token: "keyword",
                    regex: /\*/
                }],
                "#comment": [{
                    token: "comment.block.slash",
                    regex: /\(\*/,
                    push: [{
                        token: "comment.block.slash",
                        regex: /\*\)/,
                        next: "pop"
                    }, {
                        defaultToken: "comment.block.slash"
                    }]
                }, {
                    token: "comment.block.parenthese",
                    regex: /\/\*/,
                    push: [{
                        token: "comment.block.parenthese",
                        regex: /\*\//,
                        next: "pop"
                    }, {
                        defaultToken: "comment.block.parenthese"
                    }]
                }, {
                    token: "comment.line.slash",
                    regex: /\/\//,
                    push: [{
                        token: "comment.line.slash",
                        regex: /$/,
                        next: "pop"
                    }, {
                        defaultToken: "comment.line.slash"
                    }]
                }],
                "#literal": [{
                    token: "string.quoted.double.archetype",
                    regex: /"/,
                    push: [{
                        token: "string.quoted.double.archetype",
                        regex: /"/,
                        next: "pop"
                    }, {
                        token: "constant.character.escape.archetype",
                        regex: /\\./
                    }, {
                        defaultToken: "string.quoted.double.archetype"
                    }]
                }, {
                    token: "constant.numeric.rational.archetype",
                    regex: /\b\d+ div \d+\b/
                }, {
                    token: "constant.numeric.currency.tz.archetype",
                    regex: /\b\d+(?:\.\d+)?tz\b/
                }, {
                    token: "constant.numeric.currency.mtz.archetype",
                    regex: /\b\d+(?:\.\d+)?mtz\b/
                }, {
                    token: "constant.numeric.currency.utz.archetype",
                    regex: /\b\d+(?:\.\d+)?utz\b/
                }, {
                    token: "constant.numeric.rational.percent.archetype",
                    regex: /\d+(?:\.\d+)?%/
                }, {
                    token: "constant.numeric.rational.decimal.archetype",
                    regex: /\b\d+\.\d+\b/
                }, {
                    token: "constant.language.boolean",
                    regex: /\b(?:\d+[wdhms])+\b/
                }, {
                    token: "constant.language.address.archetype",
                    regex: /\b@?(?:tz(?:1|2|3|4)|KT1)[0-9a-zA-Z]{33}\b/
                }, {
                    token: "constant.language.tz_expr.archetype",
                    regex: /\b@?expr[0-9a-zA-Z]{50}\b/
                }, {
                    token: "constant.language.bytes.archetype",
                    regex: /0x[0-9a-fA-F]+/
                }, {
                    token: "constant.numeric.number.archetype",
                    regex: /\b\d+i?\b/
                }, {
                    token: "constant.numeric.int.archetype",
                    regex: /\b\d\d?\d?(?:_\d\d\d)+i\b/
                }, {
                    token: "constant.numeric.nat.archetype",
                    regex: /\b\d\d?\d?(?:_\d\d\d)+\b/
                }, {
                    token: "constant.language.boolean",
                    regex: /\b[\+-]?\d{4}(?!\d{2}\b)(?:-?(?:(?:0[1-9]|1[0-2])(?:\3(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?::?[0-5]\d)?|24\:?00)(?:[\.,]\d+(?!:))?)?(?:\17[0-5]\d(?:[\.,]\d+)?)?(?:[zZ]|[\+-](?:[01]\\d|2[0-3]):?(?:[0-5]\d)?)?)?)?\b/
                }, {
                    token: "constant.language.boolean",
                    regex: /\b(?:true|false)\b/
                }, {
                    token: "constant.language.boolean",
                    regex: /\bUnit\b/
                }]
            }

            this.normalizeRules();
        };

        // @ts-ignore
        ArchetypeHighlightRules.metaData = {
            "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
            name: "Archetype",
            scopeName: "source.archetype",
            fileTypes: ["arl"]
        }

        oop.inherits(ArchetypeHighlightRules, TextHighlightRules);

        exports.ArchetypeHighlightRules = ArchetypeHighlightRules;
    }
);

window.ace.define(
    "ace/mode/archetype",
    ["require", "exports", "module", "ace/lib/oop", "ace/mode/text", "ace/mode/archetype_highlight_rules", "ace/mode/folding/cstyle"],
    function (require, exports, module) {
        "use strict";

        var oop = require("../lib/oop");
        var TextMode = require("./text").Mode;
        var ArchetypeHighlightRules = require("./archetype_highlight_rules").ArchetypeHighlightRules;
        // TODO: pick appropriate fold mode
        var FoldMode = require("./folding/cstyle").FoldMode;

        var Mode = function() {
            this.HighlightRules = ArchetypeHighlightRules;
            this.foldingRules = new FoldMode();
        };
        oop.inherits(Mode, TextMode);

        (function() {
            // this.lineCommentStart = ""//"";
            // this.blockComment = {start: ""/*"", end: ""*/""};
            // Extra logic goes here.
            this.$id = "ace/mode/archetype";
        }).call(Mode.prototype);

        exports.Mode = Mode;
    }
);

(function () {
    window.ace.require(["ace/mode/archetype"], function (m) {
        if (typeof module == "object" && typeof exports == "object" && module) {
            module.exports = m;
        }
    });
})();
