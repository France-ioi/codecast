import React from "react";
import {ActionTypes as CommonActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {useAppSelector} from '../hooks';
import {select} from 'typed-redux-saga';
import {hasBlockPlatform} from '../stepper/js';
import {getJsLibLoaded} from '../task/libs/import_modules';
import {getMessage} from '../lang';

export interface PlatformSelectionProps {
    withoutLabel?: boolean
}

export function PlatformSelection(props: PlatformSelectionProps) {
    const platform = useAppSelector(state => state.options.platform);
    const availablePlatforms = useAppSelector(state => state.task.availablePlatforms);
    const dispatch = useDispatch();

    const setPlatform = (event) => {
        const platform = event.target.value;
        dispatch({
            type: CommonActionTypes.PlatformChanged,
            payload: {platform},
        });
    };

    const selector = <div className='bp3-select'>
        <select onChange={setPlatform} value={platform}>
            {availablePlatforms.map(platform =>
                <option key={platform} value={platform}>{getMessage(`PLATFORM_${platform.toLocaleUpperCase()}`)}</option>
            )}
        </select>
    </div>;

    if (props.withoutLabel) {
        return selector;
    }

    return (
        <div>
            <label className='bp3-label'>
                {getMessage('PLATFORM_SETTING')}
                {selector}
            </label>

            {hasBlockPlatform(platform) && platform !== getJsLibLoaded() && null !== getJsLibLoaded() && <div className="mt-4">
                {getMessage('PLATFORM_RELOAD').format({platform: getMessage('PLATFORM_' + platform.toLocaleUpperCase())})}
            </div>}
        </div>
    );
}
