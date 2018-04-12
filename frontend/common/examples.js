
import React from 'react';
import url from 'url';

export default function (bundle, deps) {

  bundle.defineAction('examplesUrlChanged', 'Examples.Url.Changed');
  bundle.addReducer('examplesUrlChanged', function (state, {payload: {examplesUrl, callbackUrl}}) {
    return state.set('examples', {examplesUrl, callbackUrl});
  });

  function ExamplePickerSelector (state, props) {
    const getMessage = state.get('getMessage');
    let {examplesUrl, callbackUrl} = state.get('examples', {});
    if (examplesUrl) {
      examplesUrl = url.parse(examplesUrl, true);
      examplesUrl.query.target = '_self';
      examplesUrl.query.tags = state.get('mode', 'plain');
      examplesUrl.query.lang = state.get('language', 'en').replace(/_.*$/, '');
      examplesUrl.query.callback = callbackUrl;
      examplesUrl = url.format(examplesUrl);
    }
    return {examplesUrl, getMessage};
  }

  bundle.defineView('ExamplePicker', ExamplePickerSelector, class ExamplePicker extends React.PureComponent {
    render () {
      const {examplesUrl, disabled, getMessage} = this.props;
      if (disabled || !examplesUrl) return false;
      return (
        <div>
          <p>
            {getMessage('EXAMPLES_LABEL')}{' '}
            <a className='btn btn-default' href={examplesUrl}>
              {getMessage('EXAMPLES_BUTTON_TITLE')}
            </a>{' '}
            <i className='fa fa-warning'/>{' '}
            {getMessage('EXAMPLES_MESSAGE')}
          </p>
        </div>
      );
    }
  });

};
