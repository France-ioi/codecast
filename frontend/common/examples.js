
import React from 'react';
import url from 'url';

export default function (bundle, deps) {

  bundle.addReducer('init', function (state, {payload: {examplesUrl, callbackUrl}}) {
    examplesUrl = makeExamplesUrl(state, callbackUrl, examplesUrl);
    return state.set('examples', {examplesUrl});
  });

  function ExamplePickerSelector (state, props) {
    const getMessage = state.get('getMessage');
    let {examplesUrl} = state.get('examples', {});
    return {examplesUrl, getMessage};
  }

  function makeExamplesUrl (state, callbackUrl, examplesUrl) {
    if (!examplesUrl) return false;
    /* Clean up the callback URL to avoid passing the current source to the
       examples selector.  Also clear 'mode' in case the user changes it in
       the selector. */
    callbackUrl = url.parse(callbackUrl, true);
    delete callbackUrl.search; // force url.format to rebuild the search string
    delete callbackUrl.query.source;
    delete callbackUrl.query.mode;
    callbackUrl = url.format(callbackUrl);
    const {mode, language} = state.get('options');
    examplesUrl = url.parse(examplesUrl, true);
    examplesUrl.query.target = '_self';
    examplesUrl.query.tags = mode;
    /* XXX better to pass language unchanged and have the examples app drop the country code */
    examplesUrl.query.lang = language.replace(/_.*$/, '');
    examplesUrl.query.callback = callbackUrl;
    examplesUrl = url.format(examplesUrl);
    return examplesUrl;
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
