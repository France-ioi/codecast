
import React from 'react';
import ReactDOM from 'react-dom';
import EpicComponent from 'epic-component';

export default function (bundle, deps) {

  bundle.use('StepperControls', 'Menu', 'MainView');

  bundle.defineView('SandboxApp', SandboxAppSelector, EpicComponent(self => {
    self.render = function () {
      const {size} = self.props;
      return (
        <div className={`container size-${size}`}>
          <div className="row">
            <div className="col-sm-12">
              <div className="pane pane-controls clearfix">
                <div className="pane-controls-right">
                  <deps.Menu/>
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

  function SandboxAppSelector (state) {
    const size = state.get('size');
    return {size};
  }

};
