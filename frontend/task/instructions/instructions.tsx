import convertHtmlToReact, {processNodes} from '@hedgedoc/html-to-react';
import {CodecastPlatform, platformsList} from '../../stepper/platforms';
import {PlatformSelection} from '../../common/PlatformSelection';
import {SmartContractStorage} from '../libs/smart_contract/SmartContractStorage';
import {Editor} from '../../buffers/Editor';
import {generatePropsFromAttributes} from '@hedgedoc/html-to-react/dist/utils/generatePropsFromAttributes';
import {VOID_ELEMENTS} from '@hedgedoc/html-to-react/dist/dom/elements/VoidElements';
import React from 'react';

function transformNode(node, index: string | number, context: { platform: CodecastPlatform }) {
    if (node.attribs && 'select-lang-selector' in node.attribs) {
        return <PlatformSelection key="platform-selection" withoutLabel/>;
    } else if (node.attribs && 'smart-contract-storage' in node.attribs) {
        return <SmartContractStorage/>;
    } else if (node.attribs && 'data-show-source' in node.attribs) {
        const code = node.attribs['data-code'];
        const lang = node.attribs['data-lang'];

        if ('all' !== lang && context.platform !== lang) {
            return null;
        }

        const sourceMode = platformsList[context.platform].aceSourceMode;

        return <Editor
            content={code.trim()}
            readOnly
            mode={sourceMode}
            width="100%"
            hideGutter
            hideCursor
            printMarginColumn={false}
            highlightActiveLine={false}
            dragEnabled={false}
            maxLines={Infinity}
        />
    } else if (node.attribs && 'onclick' in node.attribs) {
        const tagName = node.tagName;
        const props = generatePropsFromAttributes(node.attribs, index);
        // @ts-ignore
        props['onClick'] = () => {
            eval(node.attribs.onclick);
        }

        // If the node is not a void element and has children then process them
        let children = null;
        if (VOID_ELEMENTS.indexOf(tagName) === -1) {
            children = processNodes(node.children, (node, index) => transformNode(node, index, context));
        }

        return React.createElement(tagName, props, children)
    }

    return undefined;
}

export function convertHtmlInstructionsToReact(instructionsHtml: string, platform: CodecastPlatform) {
    return convertHtmlToReact(instructionsHtml, {transform: (node, index) => transformNode(node, index, {platform})})
}
