
import React from 'react';
import url from 'url';

export default function (bundle, deps) {

  bundle.defineAction('examplesUrlChanged', 'Examples.Url.Changed');
  bundle.addReducer('examplesUrlChanged', function (state, {payload: {examplesUrl}}) {
    return state.set('examplesUrl', examplesUrl);
  });

  function ExamplePickerSelector (state, props) {
    let examplesUrl = state.get('examplesUrl');
    if (examplesUrl) {
      examplesUrl = url.parse(examplesUrl, true);
      examplesUrl.query.target = '_self';
      examplesUrl.query.tags = state.get('mode', 'plain');
      examplesUrl.query.lang = state.get('language', 'en').replace(/_.*$/, '');
      examplesUrl.query.callback = state.get('baseUrl');
      examplesUrl = url.format(examplesUrl);
    }
    return {examplesUrl};
  }

  bundle.defineView('ExamplePicker', ExamplePickerSelector, class ExamplePicker extends React.PureComponent {
    render () {
      const {examplesUrl, disabled} = this.props;
      if (disabled || !examplesUrl) return false;
      return (
        <a className='btn btn-default' href={examplesUrl}>{"Load an example"}</a>
      );
    }
  });

};
