export const createDocGenerator = (customBlocks, strings) => {
    return {
        variants_cache: null,
        separators: {
            argument: ', ',
            variant: '<br>',
            description: " : ",
        },

        init: function () {
            if (this.variants_cache) return;
            this.variants_cache = {};
            for (let lib in customBlocks) {
                for (let section in customBlocks[lib]) {
                    let blocks = customBlocks[lib][section];
                    for (let i = 0; i < blocks.length; i++) {
                        let block = blocks[i];
                        if (block.variants_names) {
                            this.variants_cache[block.name] = [];
                            for (let j = 0; j < block.variants_names.length; j++) {
                                this.variants_cache[block.name].push(
                                    this.formatArguments(block.variants_names[j])
                                )
                            }
                        } else if (block.params_names) {
                            this.variants_cache[block.name] = [
                                this.formatArguments(block.params_names)
                            ];
                        }
                    }

                }
            }
        },


        formatArguments: function (arg_names) {
            let res = [];
            for (let i = 0; i < arg_names.length; i++) {
                let arg = arg_names[i];
                res.push(strings.params[arg] || arg);
            }
            return res.join(this.separators.argument);
        },


        blockDescription: function (name) {
            this.init();
            let description = strings.description[name] || '';
            let separator_description = description == '' ? ' ' : this.separators.description;

            let visible_name = strings.code[name] || name;
            let variants = this.variants_cache[name];

            let res = [];
            if (variants) {
                for (let i = 0; i < variants.length; i++) {
                    res.push('<code>' + visible_name + '(' + variants[i] + ')</code>');
                }
                return res.join(this.separators.variant) +
                    (res.length > 1 ? this.separators.variant : separator_description) +
                    description;
            }
            return '<code>' + visible_name + '()</code>' + separator_description + description
        }
    };
};