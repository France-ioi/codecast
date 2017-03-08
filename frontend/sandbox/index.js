
import React from 'react';
import ReactDOM from 'react-dom';
import EpicComponent from 'epic-component';
import {Provider} from 'react-redux';
import Immutable from 'immutable';
import queryString from 'query-string';
import link from 'epic-linker';

import 'brace';
// For jspm bundle-sfx, ensure that jspm-0.16.config.js has a meta entry
// listing brace as a dependency for each of these modules, otherwise the
// bundle will complain about an undefined "ace" global variable.
import 'brace/worker/javascript';
import 'brace/mode/c_cpp';
import 'brace/theme/github';

// Import font-awesome css here rather than in style.scss due to
// https://github.com/mobilexag/plugin-sass/blob/master/src/sass-builder.js#49
import 'font-awesome/css/font-awesome.min.css';
import '../style.scss';

import stepperComponent from '../stepper/index';
import {default as commonComponent, interpretQueryString} from '../common/index';

const {store, scope, start} = link(function (bundle, deps) {
  bundle.addReducer('init', _ => Immutable.Map());
  bundle.include(stepperComponent);
  bundle.include(commonComponent);
  bundle.use('StepperControls', 'FullscreenButton', 'MainView', 'ExamplePicker', 'isTranslated');
  bundle.defineSelector('AppSelector', function (state) {
    const isTranslated = deps.isTranslated(state);
    const size = state.get('size');
    return {isTranslated, size};
  });
  bundle.defineView('App', 'AppSelector', EpicComponent(self => {
    self.render = function () {
      const {isTranslated, size} = self.props;
      return (
        <div className={`container size-${size}`}>
          <div className="row">
            <div className="col-sm-12">
              <div className="pane pane-controls clearfix">
                <div className="pane-controls-right">
                  {isTranslated || <deps.ExamplePicker/>}
                  <deps.FullscreenButton/>
                </div>
                <div className="controls controls-main">
                </div>
                <deps.StepperControls enabled={true}/>
              </div>
            </div>
          </div>
          <deps.MainView/>
        </div>
      );
    };
  }));
});

const qs = queryString.parse(window.location.search);

store.dispatch({type: scope.init});
interpretQueryString(store, scope, qs);
start();

const container = document.getElementById('react-container');
ReactDOM.render(<Provider store={store}><scope.App/></Provider>, container);
