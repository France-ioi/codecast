import React from 'react';
import {Button} from '@blueprintjs/core';
import {getMessage} from '../lang';
import {useDispatch} from 'react-redux';
import {bufferResetToDefaultSourceCode} from '../buffers/buffer_actions';
import {useAppSelector} from '../hooks';
import {quickAlgoLibraries} from './libs/quick_algo_libraries_model';

export function TaskRestartButton() {
    const dispatch = useDispatch();
    const activeBufferName = useAppSelector(state => state.buffers.activeBufferName);

    const environment = useAppSelector(state => state.environment);
    const context = quickAlgoLibraries.getContext(null, environment);
    if (!context?.infos?.startingExample) {
        return null;
    }

    const restartTask = () => {
        dispatch(bufferResetToDefaultSourceCode(activeBufferName))
    };

    return (
        <div>
            <Button
                className="quickalgo-button"
                onClick={restartTask}
            >
                {getMessage('TASK_RESTART')}
            </Button>
        </div>
    );
}
