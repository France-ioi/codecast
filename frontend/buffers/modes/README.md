# Custom Ace modes

## How to add a new Ace mode (= syntaxic coloration) from a tmLanguage file?

Find a `{language}.tmLanguage.json` file on Internet. For example for Archetype: https://github.com/completium/vscode-archetype/blob/master/syntaxes/archetype.tmLanguage.json
(this file is part of the Visual Studio Archetype extension)

Then, follow this tutorial: https://github.com/ajaxorg/ace/wiki/Importing-.tmtheme-and-.tmlanguage-Files-into-Ace

Here is a summary:
```
git clone git@github.com:ajaxorg/ace.git
cd ace
npm install
cd tool
npm install
node tmlanguage.js {language}.tmLanguage.json
```

Two files will be created:
- `ace/src/mode/{language}.js`
- `ace/src/mode/{language}_highlight_rules.js`

Create a new file in Codecast `buffers/modes/{language}.ts` from the template:

```
cp template.ts.txt {language}.ts
```

Edit the file:
- change {language} by the language
- copy the content of the file `ace/src/mode/{language}_highlight_rules.js` in the appropriate section
- copy the content of the file `ace/src/mode/{language}.js` in the appropriate section

Import your `{language}.ts` file in `frontend/buffers/index.ts`

You're all set!
