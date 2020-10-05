
import React from 'react';
import {AnchorButton, Icon, Label} from '@blueprintjs/core';
import url from 'url';

export default function (bundle, deps) {
  bundle.addReducer('init', initReducer);
  bundle.addReducer('platformChanged', platformChangedReducer);
  bundle.defineView('ExamplePicker', ExamplePickerSelector, ExamplePicker);
}

function initReducer (state, _action) {
  return state.set('examples', updateExamplesState(state, {}));
}

function platformChangedReducer (state) {
  return state.update('examples', examples => updateExamplesState(state, examples));
}

function updateExamplesState (state, examples) {
  const {callbackUrl, examplesUrl, platform, language} = state.get('options');
  if (!examplesUrl) return false;
  /* Clean up the callback URL to avoid passing the current source to the
     examples selector.  Also clear 'platform' in case the user changes it
     in the selector. */
  let fullCallbackUrl = url.parse(callbackUrl, true);
  delete fullCallbackUrl.search; // force url.format to rebuild the search string
  delete fullCallbackUrl.query.source;
  delete fullCallbackUrl.query.platform;
  fullCallbackUrl.query.language = language;
  fullCallbackUrl = url.format(fullCallbackUrl);
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
        <label className='bp3-label'>
          {getMessage('EXAMPLES_LABEL')}
          <AnchorButton href={examplesUrl} rightIcon='share' >
            {getMessage('EXAMPLES_BUTTON_TITLE')}
          </AnchorButton>
        </label>
        <p>
          <Icon icon='warning-sign'/>{' '}
          {getMessage('EXAMPLES_MESSAGE')}
        </p>
      </div>
    );
  }
}
