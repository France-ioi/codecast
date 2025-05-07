import React, {FormEvent, useState} from "react";
import {getMessage} from '../lang';
import {Button} from '@blueprintjs/core';
import {useAppSelector} from '../hooks';
import {PlatformSelection} from '../common/PlatformSelection';
import {useDispatch} from 'react-redux';
import {bufferInit} from './buffers_slice';
import {hasBlockPlatform, platformsList} from '../stepper/platforms';
import {getJsLibLoaded} from '../task/libs/import_modules';
import {bufferChangePlatform} from './buffer_actions';

export interface BufferEditorTabEditProps {
    bufferName: string,
    onClose: () => void,
}

export function BufferEditorTabEdit(props: BufferEditorTabEditProps) {
    const {bufferName} = props;

    const bufferState = useAppSelector(state => state.buffers.buffers[bufferName]);
    const [fileName, setFileName] = useState(bufferState.fileName);
    const [platform, setPlatform] = useState(bufferState.platform);
    const canChangePlatform = useAppSelector(state => state.options.canChangePlatform);
    const dispatch = useDispatch();

    const saveTab = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(bufferInit({buffer: bufferName, fileName}));
        if (canChangePlatform) {
            dispatch(bufferChangePlatform(bufferName, platform));
        }
        props.onClose();
    };

    return (
        <div className="layout-editor-tab-edit">
            <form onSubmit={saveTab}>
                <div>
                    <label className='bp4-label'>
                        {getMessage('BUFFER_TAB_FILE_NAME')}
                        <input
                            type='text'
                            placeholder="Name"
                            className='bp4-input bp4-fill'
                            value={fileName || ''}
                            onChange={(e) => setFileName(e.target.value)}
                        />
                    </label>
                </div>

                {canChangePlatform && <div>
                    <label className='bp4-label'>
                        {getMessage('BUFFER_TAB_LANGUAGE')}
                        <div className='bp4-select'>
                            <PlatformSelection
                                customPlatform={platform}
                                customSetPlatform={setPlatform}
                                withoutLabel
                            />
                        </div>

                        {hasBlockPlatform(platform) && platform !== getJsLibLoaded() && null !== getJsLibLoaded() && <div className="mt-4">
                            {getMessage('PLATFORM_RELOAD').format({platform: platformsList[platform].name})}
                        </div>}
                    </label>
                </div>}

                <div>
                    <Button
                        type="submit"
                        className="quickalgo-button is-fullwidth"
                    >
                        {getMessage('BUFFER_TAB_SAVE')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
