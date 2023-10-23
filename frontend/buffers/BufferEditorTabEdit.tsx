import React, {useState} from "react";
import {getMessage} from '../lang';
import {Button} from '@blueprintjs/core';
import {useAppSelector} from '../hooks';
import {PlatformSelection} from '../common/PlatformSelection';
import {useDispatch} from 'react-redux';
import {bufferInit} from './buffers_slice';
import {hasBlockPlatform} from '../stepper/platforms';
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
    const dispatch = useDispatch();

    const saveTab = () => {
        dispatch(bufferInit({buffer: bufferName, fileName}));
        dispatch(bufferChangePlatform(bufferName, platform));
        props.onClose();
    };

    return (
        <div className="layout-editor-tab-edit">
            <div>
                <label className='bp3-label'>
                    {getMessage('BUFFER_TAB_FILE_NAME')}
                    <input
                        type='text'
                        placeholder="Name"
                        className='bp3-input bp3-fill'
                        value={fileName || ''}
                        onChange={(e) => setFileName(e.target.value)}
                    />
                </label>
            </div>

            <div>
                <label className='bp3-label'>
                    {getMessage('BUFFER_TAB_LANGUAGE')}
                    <div className='bp3-select'>
                        <PlatformSelection
                            customPlatform={platform}
                            customSetPlatform={setPlatform}
                            withoutLabel
                        />
                    </div>

                    {hasBlockPlatform(platform) && platform !== getJsLibLoaded() && null !== getJsLibLoaded() && <div className="mt-4">
                        {getMessage('PLATFORM_RELOAD').format({platform: getMessage('PLATFORM_' + platform.toLocaleUpperCase())})}
                    </div>}
                </label>
            </div>

            <div>
                <Button
                    className="quickalgo-button is-fullwidth"
                    onClick={saveTab}
                >
                    {getMessage('BUFFER_TAB_SAVE')}
                </Button>
            </div>
        </div>
    );
}
