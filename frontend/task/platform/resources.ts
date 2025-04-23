import {appSelect} from '../../hooks';
import {loadOptionsFromQuery} from '../../common/options';
import {CodecastOptions} from '../../store';
import {call} from 'typed-redux-saga';
import {importPlatformModules} from '../libs/import_modules';
import {isServerTask} from '../task_types';
import {asyncGetFile} from '../../utils/api';
import {selectTaskMetadata} from './platform';

const extensionToLanguage = {
    adb:  'ada',
    cpp:  'cpp',
    c:    'c',
    pas:  'pascal',
    ml:   'ocaml',
    java: 'java',
    jvs:  'javascool',
    py:   'python'
};

// Code from https://github.com/France-ioi/bebras-modules/blob/2502ff7bdcbceac4a5fc08b55c94360c1a72a822/pemFioi/fioi-task-tools.js

function* taskGetResourcesImportCorrectSolutions(resources: any) {
    let taskSettingsParsed = yield* appSelect(selectTaskMetadata);
    const task = yield* appSelect(state => state.task.currentTask);
    if (isServerTask(task)) {
        const taskSettings = yield* call(asyncGetFile, 'taskSettings.json');
        if (!taskSettings) {
            return;
        }
        taskSettingsParsed = JSON.parse(taskSettings);
    }

    if (!taskSettingsParsed?.correctSolutions) {
        return;
    }

    const {correctSolutions} = taskSettingsParsed;
    resources.correct_solutions = [];
    for (let correctSolution of correctSolutions) {
        const {path} = correctSolution;
        const correctedPath = path.replace(/\$TASK_PATH\/?/, '');
        const solution = yield* call(asyncGetFile, correctedPath);
        resources.correct_solutions.push({type: 'solution', solution, id: path, ...correctSolution});
    }
}

function* fillSources(resources, sources, type, subtype = null) {
    if (!sources) return;
    if (null !== subtype && !resources[type][subtype]) {
        resources[type][subtype] = [];
    }

    let groupsResources = {
        task: {},
        solution: {}
    };

    for (let groupName in sources) {
        for (let iSource = 0; iSource < sources[groupName].length; iSource++) {
            let fileName = sources[groupName][iSource];
            let fileList = [
                "sources/" + groupName + "-" + fileName,
                "sources/" + fileName,
                groupName + "-" + fileName,
                fileName
            ];

            for (let file of fileList) {
                let answer;
                try {
                    answer = yield* call(asyncGetFile, file);
                } catch (e) {
                    continue;
                }

                let groupResource = groupsResources[type][groupName];
                if (!groupResource) {
                    groupResource = {
                        type: 'answer',
                        name: groupName,
                        answerVersions: []
                    };
                    groupsResources[type][groupName] = groupResource;
                    resources[type].push(groupResource);
                }

                groupResource.answerVersions.push({
                    params: {
                        sLangProg: extensionToLanguage[file.substring(file.lastIndexOf('.') + 1)]
                    },
                    answerContent: answer
                });

                break;
            }
        }
    }
}

function* fillSamples(resources, samples, type) {
    if (!samples) return;

    const samplesResources = {
        task: {},
        solution: {},
        grader: {}
    };

    for (let i = 0; i < samples.length; i++) {
        const sampleName = samples[i];

        for (let direction of ['in', 'out']) {
            let sample;
            try {
                sample = yield* call(asyncGetFile, "tests/files/" + samples[i] + ".in");
            } catch (e) {
                continue;
            }

            let sampleResource = samplesResources[type][sampleName];
            if (!sampleResource) {
                sampleResource = {
                    type: 'sample',
                    name: sampleName
                };
                samplesResources[type][sampleName] = sampleResource;
                resources[type].push(sampleResource);
            }
            if (direction == 'in') {
                sampleResource.inContent = sample;
            } else {
                sampleResource.outContent = sample;
            }
        }
    }
}

function ImgSrcToDataUrl(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.crossOrigin = 'Anonymous';
        let callbackCalled = false;
        img.onload = () => {
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            let dataURL;
            canvas.height = img.height;
            canvas.width = img.width;
            ctx.drawImage(img, 0, 0);
            dataURL = canvas.toDataURL();
            resolve(dataURL);
            callbackCalled = true;
            canvas = null;
        };
        img.src = src;
        if (img.complete || img.complete === undefined) {
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
            img.src = src;
        }
        setTimeout(() => {
            if (!callbackCalled) {
                reject();
            }
        }, 1000);
    })
}

function* fillImages(imageResources) {
    for (let i = 0; i < imageResources.length; i++) {
        let imageResource = imageResources[i];
        if (imageResource.type == 'image') {
            try {
                imageResource.content = yield* call(ImgSrcToDataUrl, imageResource.url);
            } catch (e) {
            }
        }
    }
}

function* taskGetResourcesFillResources(FIOITaskMetaData, resources) {
    yield* call(fillSamples, resources, FIOITaskMetaData.taskSamples, 'task');
    yield* call(fillSources, resources, FIOITaskMetaData.taskSources, 'task');
    yield* call(fillSources, resources, FIOITaskMetaData.solutionSources, 'solution');
    yield* call(fillImages, resources.solution);
    for (let hintNum in FIOITaskMetaData.hintsSources) {
        yield* call(fillSources, resources, FIOITaskMetaData.hintsSources[hintNum], 'hint', hintNum);
        yield* call(fillImages, resources.hint[hintNum]);
    }
}

export function* taskFillResources(resources: any) {
    const options = yield* appSelect(state => state.options);
    let optionsToPreload = {};
    const urlParameters = new URLSearchParams(window.location.search);
    const queryParameters = Object.fromEntries(urlParameters);
    loadOptionsFromQuery(optionsToPreload as CodecastOptions, queryParameters);
    optionsToPreload = {
        ...optionsToPreload,
        platform: options.platform,
        language: options.language,
    };

    // Import necessary platform modules without waiting for them to be imported, the declaration is enough
    const platform = yield* appSelect(state => state.options.platform);
    yield* call(importPlatformModules, platform, window.modulesPath);

    window.jQuery('script.module').each(function() {
        const scriptSrc = window.jQuery(this).attr('src');
        if (scriptSrc && !resources.task_modules.find(resource => scriptSrc === resource.url)) {
            resources.task_modules.push({type: 'javascript', url: scriptSrc, id: window.jQuery(this).attr('id')});
        }
    });

    try {
        yield* call(taskGetResourcesImportCorrectSolutions, resources);
        if (window.FIOITaskMetaData) {
            yield* call(taskGetResourcesFillResources, window.FIOITaskMetaData, resources);
        }
    } catch (e) {
        // Avoid blocking errors here
        console.error(e);
    }

    // For Castor platform, we need to add custom scripts that will be added to the assets during the generation of the task
    const castorScriptInject = `window.codecastPreload = JSON.parse('${JSON.stringify(optionsToPreload)}');
document.body.setAttribute('id', 'app');
let reactContainerDiv = document.createElement('div');
reactContainerDiv.setAttribute('id', 'react-container');
document.body.appendChild(reactContainerDiv);
try {
    $('#question-iframe', window.parent.document).css('width', '100%');
} catch(e) {
}`;

    resources.task.unshift({type: 'javascript', content: castorScriptInject, id: 'codecast-preload'});
}
