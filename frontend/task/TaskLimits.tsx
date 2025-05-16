import React from 'react';
import {Button} from '@blueprintjs/core';
import {getMessage} from '../lang';
import {useDispatch} from 'react-redux';
import {bufferResetToDefaultSourceCode} from '../buffers/buffer_actions';
import {useAppSelector} from '../hooks';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';
import {selectActiveBufferPlatform} from '../buffers/buffer_selectors';
import {isServerTask} from './task_types';

export function TaskLimits() {
    const task = useAppSelector(state => state.task.currentTask);
    if (!isServerTask(task)) {
        return null;
    }

    const platform = useAppSelector(state => state.options.platform);

    const limits = task.limits;
    let limitToUse = limits.find(limit => limit.language === platform);
    if (!limitToUse) {
        limitToUse = limits.find(limit => limit.language === '*');
    }
    if (!limitToUse || (!limitToUse.maxTime && !limitToUse.maxMemory)) {
        return null;
    }

    return (
        <div style={{marginTop: 30}}>
            {limitToUse.maxTime && <p><strong>{getMessage('TASK_LIMIT_TIME')}</strong> {limitToUse.maxTime} ms.</p>}
            {limitToUse.maxMemory && <p><strong>{getMessage('TASK_LIMIT_MEMORY')}</strong> {limitToUse.maxMemory} kb.</p>}
        </div>
    );
}
