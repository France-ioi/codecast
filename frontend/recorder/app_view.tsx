import React from 'react';
import {RecorderApp} from "./RecorderApp";
import {RecorderGlobalControls} from "./RecorderGlobalControls";

function RecorderAppSelector (state, props) {
  const scope = state.get('scope');
  const {MemoryUsage, Vumeter, RecorderGlobalControls} = scope;
  const user = state.get('user');
  const screen = state.get('screen');
  let Screen;

  if (!user) {
    Screen = scope.LoginScreen;
  } else if (screen === 'record') {
    Screen = scope.RecordScreen;
  } else if (screen === 'save') {
    Screen = scope.SaveScreen;
  }

  return {Screen, MemoryUsage, Vumeter, RecorderGlobalControls};
}

function RecorderGlobalControlsSelector (state) {
  const {LogoutButton} = state.get('scope');
  return {LogoutButton};
}

export default function (bundle, deps) {
  bundle.defineView('RecorderApp', RecorderAppSelector, RecorderApp);
  bundle.defineView('RecorderGlobalControls', RecorderGlobalControlsSelector, RecorderGlobalControls);
};
