import {RelativeLayout, RelativeLayoutOrientation} from "./RelativeLayout";
import {ZoneLayout} from "./ZoneLayout";
import {TaskInstructions} from "../TaskInstructions";
import {ContextVisualization} from "../ContextVisualization";
import {DOMParser} from 'xmldom';
import React, {createElement, ReactElement, ReactNode} from 'react';
import {AppStore, CodecastOptions} from "../../store";
import {ControlsAndErrors} from "../ControlsAndErrors";
import {Bundle} from "../../linker";
import {ActionTypes as LayoutActionTypes, ActionTypes, CursorPosition} from "./actionTypes";
import {ActionTypes as AppActionTypes} from "../../actionTypes";
import {ActionTypes as StepperActionTypes} from "../../stepper/actionTypes";
import {ActionTypes as PlayerActionTypes} from "../../player/actionTypes";
import {Directive} from "../../stepper/python/directives";
import {MultiVisualization} from "./MultiVisualization";
import {ZoneLayoutVisualizationGroup} from "./ZoneLayoutVisualizationGroup";
import {LayoutStackView} from "./LayoutStackView";
import {LayoutEditor} from "./LayoutEditor";
import {LayoutDirective} from "./LayoutDirective";
import {Screen} from "../../common/screens";
import {Documentation} from "../documentation/Documentation";
import {getMessage} from "../../lang";
import {call, put, takeEvery} from "typed-redux-saga";
import {PlayerInstant} from "../../player";
import {askConfirmation} from "../../alert";
import {selectAnswer} from "../selectors";
import {StepperStatus} from "../../stepper";
import log from 'loglevel';
import {capitalizeFirstLetter} from '../../common/utils';
import {appSelect} from '../../hooks';
import {taskSetBlocksPanelCollapsed} from '../task_slice';
import {submissionChangePaneOpen} from '../../submission/submission_slice';
import {LayoutMobileMode, LayoutPlayerMode, LayoutType, LayoutView} from './layout_types';
import {App} from '../../app_types';
import {quickAlgoLibraries, QuickAlgoLibraries} from '../libs/quick_algo_libraries_model';
import {ReplayContext} from '../../player/sagas';
import {TaskSolution} from '../TaskSolution';

export const ZOOM_LEVEL_LOW = 1;
export const ZOOM_LEVEL_HIGH = 1.5;

interface Dimensions {
    width: number,
    height: number,
}

interface XmlParserNodeProps {
    [key: string]: unknown,
    metadata: LayoutElementMetadata,
}

interface XmlParserNode {
    type: any,
    props: XmlParserNodeProps,
    elements: XmlParserNode[],
    visualizationGroups?: LayoutVisualizationGroup[],
    allocatedWidth?: number,
    allocatedHeight?: number,
}

interface Converters {
    [key: string]: (attrs: object, data?: any) => ({type: any, metadata?: LayoutElementMetadata, props?: object})
}

interface BuildZoneLayoutData {
    directivesByZone: {[zone: string]: Directive[]},
    width: number,
    height: number,
    preferredVisualizations: string[],
    quickAlgoLibraries: QuickAlgoLibraries,
    documentationOpen: boolean,
}

export interface LayoutProps {
    orderedDirectives: readonly Directive[],
    fullScreenActive: boolean,
    width: number,
    height: number,
    preferredVisualizations: string[],
    layoutRequiredType: LayoutType,
    layoutType: LayoutType,
    layoutMobileMode: LayoutMobileMode,
    screen: Screen,
    options: CodecastOptions,
    currentTask: any,
    showVariables: boolean,
    activeView?: string,
    advisedVisualization: string,
}

export interface LayoutElementMetadata {
    id?: string,
    title?: string,
    icon?: string,
    overflow?: boolean|string,
    desiredSize?: string,
    stackingOrientation?: RelativeLayoutOrientation,
    allocatedWidth?: number,
    allocatedHeight?: number,
}

export interface LayoutVisualizationGroup {
    allocatedWidth?: number,
    allocatedHeight?: number,
    metadata?: LayoutElementMetadata,
    elements: XmlParserNode[],
}

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

    convert(xml: string, data = {}): XmlParserNode {
        if (typeof xml !== 'string') {
            return null;
        }

        const tree = this.parseXml(xml);
        if (!tree) {
            return null;
        }

        return this.visitNode(tree.documentElement, 0, this.converters, data);
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

    getAttributes(node, data) {
        if (!node) {
            return {};
        }

        const {attributes} = node;
        if (!attributes || !attributes.length) {
            return {};
        }

        const result = {};

        Array.from<{name: string, value: any}>(attributes)
            .forEach(({name, value}) => {
                if ('true' === value) {
                    value = true;
                }
                if ('false' === value) {
                    value = false;
                }
                let insideVariable = 'string' === typeof value && value.match(/{(\w+)}/);
                if (insideVariable && insideVariable[1] in data) {
                    value = data[insideVariable[1]];
                }
                result[name] = value;
            });

        return result;
    }

    getChildren(node) {
        if (!node) {
            return [];
        }

        const { childNodes: children } = node;

        if (!children) {
            return [];
        }

        return children.length ? Array.from(children) : [];
    }

    visitNode(node, index, converters, data): XmlParserNode {
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

        const attributes = this.getAttributes(node, data);
        const {type, metadata, props} = converter(attributes, data);
        const newProps = Object.assign({}, {key: index}, props);
        newProps.metadata = metadata ?? {};

        const children = this.getChildren(node);
        const visitChildren = (child, childIndex) => this.visitNode(child, childIndex, converters, data);
        const childElements = children.map(visitChildren).filter(child => null !== child);

        return {
            type,
            props: newProps,
            elements: childElements,
        };
    }
}

function createVisualizationGroupsForZone(node: XmlParserNode, data: BuildZoneLayoutData): LayoutVisualizationGroup[] {
    const {directivesByZone} = data;
    const metadata = node.props.metadata;

    const visualizationGroups: LayoutVisualizationGroup[] = [];

    for (let child of node.elements) {
        if ((child.type === Documentation && !data.documentationOpen) || (data.documentationOpen && child.props.metadata['closedOnDocumentationOpen'])) {
            continue;
        }
        visualizationGroups.push({
            elements: [child],
        });
    }

    let zoneDirectives = [];
    if (metadata['name']) {
        for (let zone of metadata['name'].split(',').map(zone => zone.trim()).filter(zone => zone.length)) {
            if (zone in directivesByZone) {
                zoneDirectives = [...zoneDirectives, ...directivesByZone[zone]];
            }
        }
    }

    if (metadata['default'] && 'default' in directivesByZone) {
        zoneDirectives = [...zoneDirectives, ...directivesByZone['default']];
    }

    if (zoneDirectives.length) {
        const directivesByGroup: {[key: string]: Directive[]} = {};
        let groupId = 0;
        for (let directive of zoneDirectives) {
            const {byName} = directive;
            const directiveGroup = byName['group'] ?? 'default-' + groupId;
            if (!(directiveGroup in directivesByGroup)) {
                directivesByGroup[directiveGroup] = [];
                groupId++;
            }
            directivesByGroup[directiveGroup].push(directive);
        }

        for (let directives of Object.values(directivesByGroup)) {
            const visualizationGroup: LayoutVisualizationGroup = {elements: []};
            for (let directive of directives) {
                visualizationGroup.elements.push({
                    type: LayoutDirective,
                    props: {
                        metadata: {},
                        directive,
                    },
                    elements: [],
                });
            }

            visualizationGroups.push(visualizationGroup);
        }
    }

    return visualizationGroups;
}

function allocateSpaceToVisualizations(visualizationGroup: LayoutVisualizationGroup, dimensions: Dimensions): void {
    const {elements} = visualizationGroup;
    const {width, height} = dimensions;

    let dimensionsSum = {width: 0, height: 0};
    let elementDimensions = [];
    for (let element of elements) {
        // @ts-ignore
        let elementDimension = element.type && element.type.computeDimensions ? element.type.computeDimensions(width, height, element.props) : {
            taken: {width, height},
            minimum: {width, height},
        };
        elementDimensions.push(elementDimension);
        dimensionsSum.width += elementDimension.taken.width;
        dimensionsSum.height += elementDimension.taken.height;
    }

    const ratioX = dimensionsSum.width / width;
    const ratioY = dimensionsSum.height / height;
    const privilegedStackingDimension = ratioX < ratioY ? 'width' : 'height';
    const otherDimension = ratioX < ratioY ? 'height' : 'width';
    const relevantDimensionSize = dimensions[privilegedStackingDimension];
    const remainingSize = relevantDimensionSize - dimensionsSum[privilegedStackingDimension];
    const ratio = remainingSize < 0 ? relevantDimensionSize / dimensionsSum[privilegedStackingDimension] : 1;
    let allocatedSizeTotal = 0;
    let maxAllocatedSizeOtherDimension = 0;
    for (let elementId = 0; elementId < elements.length; elementId++) {
        const element = elements[elementId];
        const elementDimension = elementDimensions[elementId].taken;
        let elementRatio = elementDimension[otherDimension] * ratio > dimensions[otherDimension] ?
            dimensions[otherDimension] / elementDimension[otherDimension] : ratio;
        let allocatedSize = elementDimension[privilegedStackingDimension] * elementRatio;
        let allocatedSizeOtherDimension = elementDimension[otherDimension] * elementRatio;
        element[privilegedStackingDimension === 'width' ? 'allocatedWidth' : 'allocatedHeight'] = allocatedSize;
        element[otherDimension === 'width' ? 'allocatedWidth' : 'allocatedHeight'] = allocatedSizeOtherDimension;
        allocatedSizeTotal += allocatedSize;
        maxAllocatedSizeOtherDimension = Math.max(maxAllocatedSizeOtherDimension, allocatedSizeOtherDimension);
    }

    visualizationGroup[privilegedStackingDimension === 'width' ? 'allocatedWidth' : 'allocatedHeight'] = allocatedSizeTotal;
    visualizationGroup[otherDimension === 'width' ? 'allocatedWidth' : 'allocatedHeight'] = maxAllocatedSizeOtherDimension;
    if (!visualizationGroup.metadata) {
        visualizationGroup.metadata = {};
    }
    visualizationGroup.metadata.stackingOrientation = privilegedStackingDimension === 'width' ? RelativeLayoutOrientation.HORIZONTAL : RelativeLayoutOrientation.VERTICAL;
}

function canMergeVisualizationGroups (visualizationGroup1: LayoutVisualizationGroup, visualizationGroup2: LayoutVisualizationGroup, dimensions: Dimensions): boolean {
    return visualizationGroup1.allocatedWidth + visualizationGroup2.allocatedWidth <= dimensions.width
        || visualizationGroup1.allocatedHeight + visualizationGroup2.allocatedHeight <= dimensions.height;
}

function mergeVisualizationGroupsIfPossible(visualizationGroups: LayoutVisualizationGroup[], dimensions: Dimensions) {
    let currentGroup = 0;
    let mergedVisualizationGroups: LayoutVisualizationGroup[] = [];
    for (let visualizationGroup of visualizationGroups) {
        if (!mergedVisualizationGroups[currentGroup]) {
            mergedVisualizationGroups[currentGroup] = visualizationGroup;
            continue;
        }
        if (canMergeVisualizationGroups(visualizationGroups[currentGroup], visualizationGroup, dimensions)) {
            if (visualizationGroups[currentGroup].allocatedWidth + visualizationGroup.allocatedWidth <= dimensions.width) {
                mergedVisualizationGroups[currentGroup].allocatedWidth = visualizationGroups[currentGroup].allocatedWidth + visualizationGroup.allocatedWidth;
                mergedVisualizationGroups[currentGroup].metadata.stackingOrientation = RelativeLayoutOrientation.HORIZONTAL;
            } else {
                mergedVisualizationGroups[currentGroup].allocatedHeight = visualizationGroups[currentGroup].allocatedHeight + visualizationGroup.allocatedHeight;
                mergedVisualizationGroups[currentGroup].metadata.stackingOrientation = RelativeLayoutOrientation.VERTICAL;
            }
            mergedVisualizationGroups[currentGroup].elements = [
                ...mergedVisualizationGroups[currentGroup].elements,
                ...visualizationGroup.elements,
            ];
            continue;
        }

        currentGroup++;
        mergedVisualizationGroups[currentGroup] = visualizationGroup;
    }

    return mergedVisualizationGroups;
}

function determineCurrentVisualizationGroup(mergedVisualizationGroups: LayoutVisualizationGroup[], data: BuildZoneLayoutData): number {
    if (mergedVisualizationGroups.length > 1) {
        let visualizationsRankPreference: {visualizationGroupId: number, rank: number}[] = [];
        let visualizationGroupId = 0;
        for (let visualizationGroup of mergedVisualizationGroups) {
            let maxRank = data.preferredVisualizations.indexOf(visualizationGroup.metadata.id);
            for (let element of visualizationGroup.elements) {
                if (element.props.metadata.id) {
                    maxRank = Math.max(maxRank, data.preferredVisualizations.indexOf(element.props.metadata.id));
                }
            }
            visualizationsRankPreference.push({visualizationGroupId, rank: maxRank})
            visualizationGroupId++;
        }

        if (visualizationsRankPreference.length) {
            visualizationsRankPreference.sort(({rank: rank1}, {rank: rank2}) => rank2 - rank1);

            return visualizationsRankPreference[0].visualizationGroupId;
        }
    }

    return 0;
}

function assignMetadataToVisualizationGroups(mergedVisualizationGroups: LayoutVisualizationGroup[], data: BuildZoneLayoutData) {
    let visualizationGroupsCount = 0;
    for (let visualizationGroup of mergedVisualizationGroups) {
        visualizationGroupsCount++;
        const defaultMetadata = {
            ...visualizationGroup.metadata,
            id: "visualization-" + visualizationGroupsCount,
            title: getMessage('TASK_VISUALIZATION').format({number: visualizationGroupsCount}),
            icon: null,
        };

        if (visualizationGroup.elements.length === 1) {
            const element = visualizationGroup.elements[0];
            visualizationGroup.metadata = {...defaultMetadata, ...element.props.metadata};
        } else {
            visualizationGroup.metadata = defaultMetadata;
        }
    }
}

function allocateSpaceZoneLayout(node: XmlParserNode, data: BuildZoneLayoutData, dimensions: Dimensions): void {
    const visualizationGroups = node.visualizationGroups;
    visualizationGroups.forEach(visualizationGroup => allocateSpaceToVisualizations(visualizationGroup, dimensions));

    let mergedVisualizationGroups = mergeVisualizationGroupsIfPossible(visualizationGroups, dimensions);

    assignMetadataToVisualizationGroups(mergedVisualizationGroups, data);

    const visualizationGroupElements = mergedVisualizationGroups.map(visualizationGroup => ({
        type: ZoneLayoutVisualizationGroup,
        props: {
            metadata: {
                ...visualizationGroup.metadata,
                allocatedWidth: visualizationGroup.allocatedWidth,
                allocatedHeight: visualizationGroup.allocatedHeight,
            }
        },
        elements: visualizationGroup.elements.map(element => {
            return {
                ...element,
                props: {
                    ...element.props,
                    metadata: {
                        ...element.props.metadata,
                        allocatedWidth: element.allocatedWidth,
                        allocatedHeight: element.allocatedHeight,
                    },
                },
            };
        }),
    }));

    if (mergedVisualizationGroups.length > 1) {
        let currentVisualizationGroup = determineCurrentVisualizationGroup(mergedVisualizationGroups, data);
        const multiVisualizationElement: XmlParserNode = {
            type: MultiVisualization,
            props: {
                currentVisualizationGroup,
                metadata: {},
            },
            elements: visualizationGroupElements,
        };

        node.elements = [multiVisualizationElement];
    } else {
        node.elements = visualizationGroupElements;
    }
}

function applyOnLayoutZones(node: XmlParserNode, callback: (XmlParserNode) => void) {
    if (node.type && node.type === ZoneLayout) {
        callback(node);
    }

    if (node.elements && node.elements.length) {
        node.elements.forEach(node => applyOnLayoutZones(node, callback));
    }
}

function recursivelyPruneReactTree(node: XmlParserNode, documentationOpen: Boolean): XmlParserNode {
    node.elements = node.elements
        .map(element => recursivelyPruneReactTree(element, documentationOpen))
        .filter(child => null !== child);

    if (
        node.type && (node.type === RelativeLayout || node.type === ZoneLayout)
        && !node.elements.length && !(node.visualizationGroups && node.visualizationGroups.length)
    ) {
        return null;
    }

    if ((node.type === Documentation && !documentationOpen) || (documentationOpen && node.props.metadata['closedOnDocumentationOpen'])) {
        return null;
    }

    return node;
}

function allocateSpaceRelativeLayout(node: XmlParserNode, data: BuildZoneLayoutData, dimensions: Dimensions): void {
    const relevantDimension = node.props['orientation'] === RelativeLayoutOrientation.VERTICAL ? 'height' : 'width';
    const otherDimension = node.props['orientation'] === RelativeLayoutOrientation.VERTICAL ? 'width' : 'height';
    const relevantDimensionSize = dimensions[relevantDimension];
    let desiredSizeSum = 0;
    let elementsWithoutDesiredSize = 0;
    const elementsDesiredSize: number[] = [];
    let elementsWithPercentage = [];
    for (let element of node.elements) {
        let desiredSizeValue = element.props.metadata['desiredSize'];
        let desiredSize: number = null;
        if (undefined === desiredSizeValue) {
            elementsWithoutDesiredSize++;
        } else if (desiredSizeValue.indexOf('%') !== -1) {
            desiredSize = relevantDimensionSize * (parseFloat(desiredSizeValue.split('%')[0]) / 100);
            desiredSizeSum += desiredSize;
            elementsWithPercentage.push(element);
        } else {
            desiredSize = parseFloat(desiredSizeValue);
            desiredSizeSum += desiredSize;
        }
        elementsDesiredSize.push(desiredSize);
    }

    // If there is a single element in this group that has a percentage, the percentage is not useful
    // We want the element to fill the space instead
    if (elementsWithPercentage.length === 1 && 0 === elementsWithoutDesiredSize) {
        elementsWithPercentage[0].props.metadata['desiredSize'] = null;
    }

    const remainingSize = relevantDimensionSize - desiredSizeSum;
    const ratio = remainingSize < 0 ? relevantDimensionSize / desiredSizeSum : 1;
    for (let elementId = 0; elementId < node.elements.length; elementId++) {
        let allocatedSize = 0;
        if (null !== elementsDesiredSize[elementId]) {
            allocatedSize = elementsDesiredSize[elementId] * ratio;
        } else {
            allocatedSize = remainingSize <= 0 ? 0 : remainingSize / elementsWithoutDesiredSize;
        }
        node.elements[elementId][relevantDimension === 'width' ? 'allocatedWidth' : 'allocatedHeight'] = allocatedSize;
        node.elements[elementId][otherDimension === 'width' ? 'allocatedWidth' : 'allocatedHeight'] = dimensions[otherDimension];
    }
}

function recursivelyAllocateSpace(node: XmlParserNode, data: BuildZoneLayoutData, {width, height}: Dimensions): void {
    if (node.type && node.type === RelativeLayout) {
        allocateSpaceRelativeLayout(node, data, {width, height});
    }

    if (node.type && node.type === ZoneLayout) {
        allocateSpaceZoneLayout(node, data, {width, height});
    }

    node.elements.forEach(element => recursivelyAllocateSpace(element, data, {width: element.allocatedWidth, height: element.allocatedHeight}));
}

function recursivelyConvertToReactElements(node: XmlParserNode): ReactElement {
    const children = node.elements.map(element => recursivelyConvertToReactElements(element));

    // @ts-ignore
    return createElement(node.type, node.props, ...children);
}

function buildZonesLayout(node: XmlParserNode, data: BuildZoneLayoutData): ReactElement {
    applyOnLayoutZones(node, (node) => {
        node.visualizationGroups = createVisualizationGroupsForZone(node, data);
    });

    recursivelyPruneReactTree(node, data.documentationOpen);

    if (data.width && data.height) {
        recursivelyAllocateSpace(node, data, {width: data.width, height: data.height});
    }

    const reactTree = recursivelyConvertToReactElements(node);
    log.getLogger('layout').debug('final node', {node, reactTree});

    return reactTree;
}

function getAppropriateXmlLayout(layoutType: LayoutType, layoutMobileMode: LayoutMobileMode): string {
    if (LayoutType.Desktop === layoutType) {
        return 'DefaultLayoutDesktop.xml';
    }
    if (LayoutType.TabletVertical === layoutType) {
        return 'DefaultLayoutTabletVertical.xml';
    }
    if (LayoutType.MobileVertical === layoutType) {
        return 'DefaultLayoutMobileVertical' + capitalizeFirstLetter(layoutMobileMode)  + '.xml';
    }
    if (LayoutType.MobileHorizontal === layoutType) {
        return 'DefaultLayoutMobileHorizontal' + capitalizeFirstLetter(layoutMobileMode) + '.xml';
    }

    throw 'Unable to load appropriate XML layout file for this configuration';
}

export function createLayout(layoutProps: LayoutProps): ReactElement {
    const instructionsAvailable = layoutProps.currentTask && LayoutView.Editor !== layoutProps.activeView && !(layoutProps.showVariables && 'variables' === layoutProps.advisedVisualization);

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
        }),
        Editor: (attrs) => ({
            type: LayoutEditor,
            metadata: {
                id: 'editor',
                title: getMessage('TASK_EDITOR'),
                icon: 'edit',
                ...attrs,
            },
        }),
        ...(instructionsAvailable ? {
            Instructions: (attrs) => ({
                type: TaskInstructions,
                metadata: {
                    id: 'instructions',
                    title: getMessage('TASK_DESCRIPTION'),
                    icon: 'document',
                    ...attrs,
                },
            })
        } : {}),
        ...(layoutProps.options.showIO ? {
            ContextVisualization: (attrs) => ({
                type: ContextVisualization,
                metadata: {
                    id: 'io',
                    title: getMessage('TASK_IO'),
                    icon: 'console',
                    ...attrs,
                },
            })
        } : {}),
        ...(!instructionsAvailable && layoutProps.showVariables ? {
            Variables: (attrs) => ({
                type: LayoutStackView,
                metadata: {
                    id: 'variables',
                    title: getMessage('TASK_VARIABLES'),
                    icon: 'code',
                    ...attrs,
                },
            }),
        } : {}),
        Documentation: (attrs) => ({
            type: Documentation,
            metadata: {
                id: 'doc',
                title: getMessage('TASK_DOCUMENTATION'),
                icon: 'help',
                ...attrs,
            },
        }),
    });

    const directivesByZone = {};
    const availableZones = ['top-right', 'top-left', 'center-top', 'center', 'center-bottom', 'center-left', 'center-right', 'bottom-left', 'bottom-right'];
    if (layoutProps.orderedDirectives) {
        if (layoutProps.options.showViews) {
            for (let directive of layoutProps.orderedDirectives) {
                const zone = directive.byName['zone'] && availableZones.indexOf(directive.byName['zone']) !== -1 ? directive.byName['zone'] : 'default';
                if (!(zone in directivesByZone)) {
                    directivesByZone[zone] = [];
                }
                directivesByZone[zone].push(directive);
            }
        }
    }

    const layout = layoutProps.layoutRequiredType ? layoutProps.layoutRequiredType + '.xml' : getAppropriateXmlLayout(layoutProps.layoutType, layoutProps.layoutMobileMode);
    let layoutXml = require('./' + layout).default;
    const documentationOpen = Screen.DocumentationSmall === layoutProps.screen || Screen.DocumentationBig === layoutProps.screen;
    if (documentationOpen && (layoutProps.layoutType === LayoutType.MobileHorizontal || layoutProps.layoutType === LayoutType.MobileVertical || Screen.DocumentationBig === layoutProps.screen)) {
        layoutXml = '<Documentation/>';
    }

    if (layoutProps.fullScreenActive) {
        layoutXml = '<Editor/>';
    } else if (LayoutView.Task === layoutProps.activeView) {
        return <TaskInstructions hideShowMoreButton expanded/>;
    } else if (LayoutView.Solution === layoutProps.activeView) {
        return <TaskSolution/>
    }

    const elementsTree = xmlToReact.convert(layoutXml, {
        contextVisualizationDesiredSize: layoutProps.options.contextVisualizationDesiredSize ?? '60%',
        editorDesiredSize: layoutProps.options.editorDesiredSize ?? '60%',
    });

    return buildZonesLayout(elementsTree, {
        directivesByZone,
        width: layoutProps.width,
        height: layoutProps.height,
        preferredVisualizations: layoutProps.preferredVisualizations,
        documentationOpen,
        quickAlgoLibraries,
    });
}

function layoutVisualizationSelectedReducer(state: AppStore, {payload: {visualization}}) {
    makeVisualizationAsPreferred(state.layout.preferredVisualizations, visualization);
}

function layoutMobileModeChangedReducer(state: AppStore, {payload: {mobileMode}}) {
    state.layout.mobileMode = mobileMode;
}

function layoutZoomLevelChangedReducer(state: AppStore, {payload: {zoomLevel}}) {
    state.layout.zoomLevel = zoomLevel;
}

function layoutRequiredTypeChangedReducer(state: AppStore, {payload: {requiredType}}) {
    state.layout.requiredType = requiredType;
}

function layoutPlayerModeChangedReducer(state: AppStore, {payload: {playerMode, resumeImmediately}}) {
    state.layout.playerMode = playerMode;
    state.layout.playerModeResumeImmediately = !!resumeImmediately;
}

function layoutViewsChangedReducer(state: AppStore, {payload: {views}}) {
    state.layout.views = views;
}

function layoutCursorPositionChangedReducer(state: AppStore, {payload: {position}}) {
    state.layout.cursorPosition = position;
}

function layoutInstructionsIndexChangedReducer(state: AppStore, {payload}) {
    state.layout.instructions = {
        ...state.layout.instructions,
        ...payload,
    };
}

export function selectActiveView(state: AppStore): LayoutView|null {
    const activeViews = Object.entries(state.layout.views).find(([view, active]) => !!active);

    return undefined !== activeViews ? activeViews[0] as LayoutView : null;
}

export function makeVisualizationAsPreferred(visualizations: string[], visualization: string): string[] {
    if (-1 !== visualizations.indexOf(visualization)) {
        visualizations.splice(visualizations.indexOf(visualization), 1);
    }
    visualizations.push(visualization);

    return visualizations;
}

export function computeLayoutType(width: number, height: number) {
    if (width < 768 && width <= height) {
        return LayoutType.MobileVertical;
    } else if ((width < 855 || height < 450) && width > height) {
        return LayoutType.MobileHorizontal;
    } else if (width <= height) {
        return LayoutType.TabletVertical;
    } else {
        return LayoutType.Desktop; // and tablet horizontal
    }
}

export interface LayoutState {
    preferredVisualizations: string[], // least preferred at the beginning, most preferred at the end
    type: LayoutType,
    requiredType?: LayoutType,
    mobileMode: LayoutMobileMode,
    zoomLevel: number, // 1 is normal
    playerMode: LayoutPlayerMode,
    playerModeResumeImmediately?: boolean,
    views: {[view: string]: boolean},
    instructions: {tabIndex: number, pageIndex: number, maxHeight: number},
    cursorPosition?: CursorPosition,
}

function* layoutSaga({replayApi}: App) {
    yield* takeEvery(StepperActionTypes.StepperStepFromControls, function* () {
        const environment = yield* appSelect(state => state.environment);
        if ('replay' === environment) {
            yield* put({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode: LayoutMobileMode.Player}});
        }

        const submissionPaneOpen = yield* appSelect(state => state.submission.submissionsPaneOpen);
        if (submissionPaneOpen) {
            yield* put(submissionChangePaneOpen(false));
        }
    });

    yield* takeEvery(submissionChangePaneOpen, function* (action) {
        if (action.payload) {
            yield* put(taskSetBlocksPanelCollapsed({collapsed: true}));
        } else {
            const blocksPanelWasOpen = yield* appSelect(state => state.task.blocksPanelWasOpen);
            yield* put(taskSetBlocksPanelCollapsed({collapsed: !blocksPanelWasOpen}));
        }
    });

    yield* takeEvery(StepperActionTypes.StepperExit, function* () {
        const environment = yield* appSelect(state => state.environment);
        if ('replay' === environment) {
            yield* put({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode: LayoutMobileMode.Editor}});
        }
    });

    // @ts-ignore
    yield* takeEvery(ActionTypes.LayoutPlayerModeBackToReplay, function* ({payload}) {
        const state = yield* appSelect();
        const currentSource = selectAnswer(state);

        const instant = state.player.current;
        const instantSource = selectAnswer(instant.state);

        log.getLogger('layout').debug('current source', currentSource, instantSource);

        let confirmed = true;
        if (currentSource !== instantSource) {
            confirmed = yield* call(askConfirmation,{
                text: getMessage('RESUME_PLAYBACK_WARNING'),
                confirmText: getMessage('RESUME_PLAYBACK_CONFIRM'),
                cancelText: getMessage('CANCEL'),
            });
        }

        if (confirmed) {
            const needsExit = yield* appSelect(state => state.stepper && StepperStatus.Clear !== state.stepper.status);
            if (needsExit) {
                yield* put({type: StepperActionTypes.StepperExit});
            }
            yield* put({type: LayoutActionTypes.LayoutPlayerModeChanged, payload: {playerMode: LayoutPlayerMode.Replay}});
            yield* call(replayApi.reset, instant);
            if ((payload && payload.resumeImmediately) || state.layout.playerModeResumeImmediately) {
                yield* put({type: PlayerActionTypes.PlayerStart});
            }
        }
    });
}

export default function (bundle: Bundle) {
    bundle.addReducer(AppActionTypes.AppInit, (state: AppStore) => {
        state.layout = {
            preferredVisualizations: [],
            type: LayoutType.Desktop,
            mobileMode: LayoutMobileMode.Instructions,
            zoomLevel: 1,
            playerMode: LayoutPlayerMode.Execution,
            views: {},
            instructions: {tabIndex: 0, pageIndex: 0, maxHeight: null},
        };
    });

    bundle.defineAction(ActionTypes.LayoutVisualizationSelected);
    bundle.addReducer(ActionTypes.LayoutVisualizationSelected, layoutVisualizationSelectedReducer);

    bundle.defineAction(ActionTypes.LayoutMobileModeChanged);
    bundle.addReducer(ActionTypes.LayoutMobileModeChanged, layoutMobileModeChangedReducer);

    bundle.defineAction(ActionTypes.LayoutZoomLevelChanged);
    bundle.addReducer(ActionTypes.LayoutZoomLevelChanged, layoutZoomLevelChangedReducer);

    bundle.defineAction(ActionTypes.LayoutRequiredTypeChanged);
    bundle.addReducer(ActionTypes.LayoutRequiredTypeChanged, layoutRequiredTypeChangedReducer);

    bundle.defineAction(ActionTypes.LayoutPlayerModeChanged);
    bundle.addReducer(ActionTypes.LayoutPlayerModeChanged, layoutPlayerModeChangedReducer);

    bundle.defineAction(ActionTypes.LayoutViewsChanged);
    bundle.addReducer(ActionTypes.LayoutViewsChanged, layoutViewsChangedReducer);

    bundle.defineAction(ActionTypes.LayoutInstructionsIndexChanged);
    bundle.addReducer(ActionTypes.LayoutInstructionsIndexChanged, layoutInstructionsIndexChangedReducer);

    bundle.defineAction(ActionTypes.LayoutCursorPositionChanged);
    bundle.addReducer(ActionTypes.LayoutCursorPositionChanged, layoutCursorPositionChangedReducer);

    bundle.addSaga(layoutSaga);

    bundle.defer(function ({recordApi, replayApi}: App) {
        replayApi.onReset(function* (instant: PlayerInstant) {
            const mobileMode = instant.state.layout.mobileMode;
            yield* put({type: ActionTypes.LayoutMobileModeChanged, payload: {mobileMode}});

            const position = instant.state.layout.cursorPosition;
            yield* put({type: ActionTypes.LayoutCursorPositionChanged, payload: {position}});
        });

        recordApi.on(ActionTypes.LayoutCursorPositionChanged, function* (addEvent, action) {
            const position = action.payload.position;

            yield* call(addEvent, 'cursor.move', position);
        });

        replayApi.on('cursor.move', function* (replayContext: ReplayContext, event) {
            const position = event[2];
            yield* put({type: ActionTypes.LayoutCursorPositionChanged, payload: {position}});
        });
    });
}
