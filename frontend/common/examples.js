
import React from 'react';
import {Icon} from '@blueprintjs/core';
import url from 'url';

export default function (bundle, deps) {
  bundle.addReducer('init', initReducer);
  bundle.addReducer('optionsChanged', optionsChangedReducer);
  bundle.defineView('ExamplePicker', ExamplePickerSelector, ExamplePicker);
}

function initReducer (state, {payload}) {
  return state.set('examples', updateExamplesState(state, payload));
}

function optionsChangedReducer (state) {
  return state.update('examples', examples => updateExamplesState(state, examples));
}

function updateExamplesState (state, examples) {
  const {callbackUrl, examplesUrl} = examples;
  if (!examplesUrl) return false;
  /* Clean up the callback URL to avoid passing the current source to the
     examples selector.  Also clear 'platform' in case the user changes it
     in the selector. */
  let fullCallbackUrl = url.parse(callbackUrl, true);
  delete fullCallbackUrl.search; // force url.format to rebuild the search string
  delete fullCallbackUrl.query.source;
  delete fullCallbackUrl.query.platform;
  fullCallbackUrl = url.format(fullCallbackUrl);
  const {platform, language} = state.get('options');
  let fullExamplesUrl = url.parse(examplesUrl, true);
  fullExamplesUrl.query.target = '_self';
  fullExamplesUrl.query.tags = platform;
  /* XXX better to pass language unchanged and have the examples app drop the country code */
  fullExamplesUrl.query.lang = language.replace(/_.*$/, '');
  fullExamplesUrl.query.callback = fullCallbackUrl;
  fullExamplesUrl = url.format(fullExamplesUrl);
  return {...examples, fullExamplesUrl};
}

function ExamplePickerSelector (state, props) {
  const getMessage = state.get('getMessage');
  const {fullExamplesUrl} = state.get('examples', {});
  return {examplesUrl: fullExamplesUrl, getMessage};
}

class ExamplePicker extends React.PureComponent {
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
          <Icon icon='warning-sign'/>{' '}
          {getMessage('EXAMPLES_MESSAGE')}
        </p>
      </div>
    );
  }
}
