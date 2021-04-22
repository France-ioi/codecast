import {RelativeLayout, RelativeLayoutOrientation} from "./RelativeLayout";
import {ZoneLayout} from "./ZoneLayout";
import {BufferEditor} from "../../buffers/BufferEditor";
import {TaskInstructions} from "../TaskInstructions";
import {ContextVisualization} from "../ContextVisualization";
import {PythonStackView} from "../../stepper/python/analysis/components/PythonStackView";
import {StackView} from "../../stepper/views/c/StackView";
import {DOMParser} from 'xmldom';
import {createElement, ReactElement, ReactNode} from 'react';
import {PlayerError} from "../../player";
import {AppStore, CodecastOptions} from "../../store";
import {ControlsAndErrors} from "../ControlsAndErrors";
import {Bundle} from "../../linker";
import {ActionTypes} from "./actionTypes";
import {QuickAlgoContext} from "../index";
import {ActionTypes as AppActionTypes} from "../../actionTypes";

function validateConverters(converters: Converters): boolean {
    if (typeof converters !== 'object' || !converters) {
        return false;
    }

    const keys = Object.keys(converters);
    const isEmpty = !keys.length;
    if (isEmpty) {
        return false;
    }

    const isFunction = key => (typeof converters[key] === 'function');

    return keys.every(isFunction);
}

function getAttributes(node) {
    if (!node) {
        return {};
    }

    const {attributes} = node;
    if (!attributes || !attributes.length) {
        return {};
    }

    const result = {};

    Array.from(attributes)
        .forEach(({ name, value }) => {
            result[name] = value;
        });

    return result;
}

function getChildren(node) {
    if (!node) {
        return [];
    }

    const { childNodes: children } = node;

    if (!children) {
        return [];
    }

    return children.length ? Array.from(children) : [];
}

function visitNode(node, index, converters, data): ReactElement {
    if (!node) {
        return null;
    }

    const { tagName, nodeType } = node;
    if (nodeType === 3 && node.nodeValue.trim().length) {
        return node.nodeValue;
    }

    if (!tagName) {
        return null;
    }

    const converter = converters[tagName];

    if (typeof converter !== 'function') {
        return null;
    }

    const attributes = getAttributes(node);
    const {type, metadata, props} = converter(attributes, data);
    const newProps = Object.assign({}, {key: index}, props);
    newProps.metadata = metadata ?? {};

    const children = getChildren(node);
    const visitChildren = (child, childIndex) => visitNode(child, childIndex, converters, data);
    const childElements = children.map(visitChildren).filter(child => null !== child);
    if ((type === ZoneLayout || type === RelativeLayout) && !childElements.length) {
        return null;
    }

    return createElement(type, newProps, ...childElements);
}

class XMLToReact {
    private readonly converters: Converters;
    private readonly xmlParser: DOMParser;

    constructor(converters: Converters) {
        const isValid = validateConverters(converters);
        if (!isValid) {
            throw new Error('Invalid value for converter map argument. Please use an object with functions as values.');
        }

        this.converters = converters;

        const throwError = (m) => { throw new Error(m); };
        this.xmlParser = new DOMParser({
            errorHandler: throwError,
            fatalError: throwError,
            warning: throwError,
        });
    }

    convert(xml: string, data = {}) {
        if (typeof xml !== 'string') {
            return null;
        }

        const tree = this.parseXml(xml);
        if (!tree) {
            return null;
        }

        return visitNode(tree.documentElement, 0, this.converters, data);
    }

    parseXml(xml: string) {
        if (typeof xml !== 'string') {
            return null;
        }

        try {
            return this.xmlParser.parseFromString(xml, 'text/xml');
        } catch (e) {
            console.warn('Unable to parse invalid XML input. Please input valid XML.'); // eslint-disable-line no-console
        }

        return null;
    }
}

interface Converters {
    [key: string]: (attrs: object) => ({type: ReactNode, metadata?: LayoutElementMetadata, props?: object})
}

interface LayoutProps {
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
    error: string,
    geometry: any,
    panes: any,
    showStack: boolean,
    arduinoEnabled: boolean,
    showViews: boolean,
    showIO: boolean,
    windowHeight: any,
    currentStepperState: any,
    preventInput: any,
    fullScreenActive: boolean,
    diagnostics: any,
    recordingEnabled: boolean,
    playerEnabled: boolean,
    isPlayerReady: boolean,
    playerProgress: number,
    playerError: PlayerError,
    getMessage: Function,
    options: CodecastOptions,
    taskSuccess: boolean,
    taskSuccessMessage: string,
    advisedVisualization: string,
}

export interface LayoutElementMetadata {
    id?: string,
    title?: string,
    icon?: string,
    overflow?: boolean,
    desiredSize?: string,
}

export function createLayout(layoutProps: LayoutProps): ReactElement {
    const xmlToReact = new XMLToReact({
        HorizontalLayout: (attrs) => ({
            type: RelativeLayout,
            metadata: attrs,
            props: {
                orientation: RelativeLayoutOrientation.HORIZONTAL,
            }
        }),
        VerticalLayout: (attrs) => ({
            type: RelativeLayout,
            metadata: attrs,
            props: {
                orientation: RelativeLayoutOrientation.VERTICAL,
            }
        }),
        ZoneLayout: (attrs) => ({
            type: ZoneLayout,
            metadata: attrs,
        }),
        ControlsAndErrors: (attrs) => ({
            type: ControlsAndErrors,
            metadata: {
                desiredSize: '0px',
                overflow: false,
                ...attrs,
            },
            props: {
                error: layoutProps.error,
                diagnostics: layoutProps.diagnostics,
            }
        }),
        Editor: (attrs) => ({
            type: BufferEditor,
            metadata: attrs,
            props: {
                buffer: 'source',
                readOnly: layoutProps.readOnly,
                shield: layoutProps.preventInput,
                mode: layoutProps.sourceMode,
                theme: 'textmate',
                width: '100%',
                height: '100%',
            }
        }),
        Instructions: (attrs) => ({
            type: TaskInstructions,
            metadata: {
                id: 'instructions',
                title: layoutProps.getMessage('TASK_DESCRIPTION'),
                icon: 'align-left',
            },
        }),
        ContextVisualization: (attrs) => ({
            type: ContextVisualization,
            metadata: attrs,
        }),
        Variables: (attrs) => ({
            type: (layoutProps.currentStepperState && layoutProps.currentStepperState.platform === 'python') ? PythonStackView : StackView,
            metadata: {
                id: 'variables',
                title: layoutProps.getMessage('TASK_VARIABLES'),
                icon: 'code',
                ...attrs,
            },
            props: {
                height: layoutProps.sourceRowHeight,
                analysis: layoutProps.currentStepperState ? layoutProps.currentStepperState.analysis : null,
            },
        }),
        // <DirectivesPane scale={1}/>
    });

    let layoutXml = require('./DefaultLayoutDesktop.xml').default;
    if (layoutProps.fullScreenActive) {
        layoutXml = '<Editor/>';
    }

    console.log(layoutXml);
    const xmlParsed = xmlToReact.convert(layoutXml);
    console.log({xmlParsed});

    return xmlParsed;
}

function layoutVisualizationSelectedReducer(state: AppStore, {payload: {visualization}}) {
    if (-1 !== state.layout.preferredVisualizations.indexOf(visualization)) {
        state.layout.preferredVisualizations.splice(state.layout.preferredVisualizations.indexOf(visualization), 1);
    }
    state.layout.preferredVisualizations.push(visualization);
}

export interface LayoutState {
    preferredVisualizations: string[], // least preferred at the beginning, most preferred at the end
}

export default function (bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.layout = {
            preferredVisualizations: [],
        };
    });

    bundle.defineAction(ActionTypes.LayoutVisualizationSelected);
    bundle.addReducer(ActionTypes.LayoutVisualizationSelected, layoutVisualizationSelectedReducer);
};
