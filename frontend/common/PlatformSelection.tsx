import React from "react";
import {ActionTypes as CommonActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {useAppSelector} from '../hooks';
import {getJsLibLoaded} from '../task/libs/import_modules';
import {getMessage} from '../lang';
import {hasBlockPlatform, platformsList} from '../stepper/platforms';
import {CodecastPlatform} from '../stepper/codecast_platform';

export interface PlatformSelectionProps {
    withoutLabel?: boolean,
    customPlatform?: CodecastPlatform,
    customSetPlatform?: (platform: CodecastPlatform) => void,
}

export function PlatformSelection(props: PlatformSelectionProps) {
    const platform = useAppSelector(state => state.options.platform);
    const availablePlatforms = useAppSelector(state => state.task.availablePlatforms);
    const dispatch = useDispatch();

    let currentPlatform = props.customPlatform ?? platform;

    const setPlatform = (event) => {
        const platform = event.target.value;
        if (props.customSetPlatform) {
            props.customSetPlatform(platform);
        } else {
            dispatch({
                type: CommonActionTypes.PlatformChanged,
                payload: {platform},
            });
        }
    };

    const selector = <div className='bp4-select'>
        <select onChange={setPlatform} value={currentPlatform}>
            {availablePlatforms.map(platform =>
                <option key={platform} value={platform}>{platformsList[platform].name}</option>
            )}
        </select>
    </div>;

    if (props.withoutLabel) {
        return selector;
    }

    return (
        <div>
            <label className='bp4-label'>
                {getMessage('PLATFORM_SETTING')}
                {selector}
            </label>

            {hasBlockPlatform(currentPlatform) && currentPlatform !== getJsLibLoaded() && null !== getJsLibLoaded() && <div className="mt-4">
                {getMessage('PLATFORM_RELOAD').format({platform: platformsList[currentPlatform].name})}
            </div>}
        </div>
    );
}
