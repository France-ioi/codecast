import React from 'react';
import {RecorderApp} from "./RecorderApp";
import {RecorderGlobalControls} from "./RecorderGlobalControls";

function RecorderGlobalControlsSelector(state) {
    const {LogoutButton} = state.get('scope');
    return {LogoutButton};
}

export default function (bundle, deps) {
    bundle.defineView('RecorderGlobalControls', RecorderGlobalControlsSelector, RecorderGlobalControls);
};
