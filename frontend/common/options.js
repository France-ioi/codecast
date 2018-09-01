
import update from 'immutability-helper';

export default function (bundle) {
  bundle.defineAction('optionsChanged', 'Options.Changed');
  bundle.addReducer('init', initReducer);
  bundle.addReducer('optionsChanged', optionsChangedReducer);
}

function initReducer (state, {payload: {options}}) {
  return state.set('options', options);
}

function optionsChangedReducer (state, {payload: changes}) {
  return state.update('options', options => update(options, changes));
}
