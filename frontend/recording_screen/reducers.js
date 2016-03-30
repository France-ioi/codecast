
export function recordingScreenSourceTextChanged (state, action) {
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      source: action.source
    }
  };
};

export function recordingScreenSourceSelectionChanged (state, action) {
  return {
    ...state,
    recordingScreen: {
      ...state.recordingScreen,
      selection: action.selection
    }
  };
};
