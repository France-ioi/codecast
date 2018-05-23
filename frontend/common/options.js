
import update from 'immutability-helper';

export default function (bundle) {
  bundle.defineAction('optionsChanged', 'Options.Changed');
  bundle.addReducer('optionsChanged', optionsChangedReducer);
}

function optionsChangedReducer (state, {payload: changes}) {
  return state.update('options', options => update(options, changes));
}
