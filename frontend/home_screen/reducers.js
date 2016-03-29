
export function homeSourceTextChanged (state, action) {
  return {
    ...state,
    home: {
      ...state.home,
      source: action.source
    }
  };
};

export function homeSourceSelectionChanged (state, action) {
  return {
    ...state,
    home: {
      ...state.home,
      selection: action.range
    }
  };
};
