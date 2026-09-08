import React from "react";
import {ActionTypes as CommonActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";
import {useAppSelector} from '../hooks';
import {platformsList} from '../stepper/platforms';
import {CodecastPlatform} from '../stepper/codecast_platform';
import {getMessage} from '../lang/messages';

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

    const selector = <div className='bp6-select'>
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
            <label className='bp6-label'>
                {getMessage('PLATFORM_SETTING')}
                {selector}
            </label>
        </div>
    );
}
