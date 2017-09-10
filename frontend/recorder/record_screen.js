
import React from 'react';
import EpicComponent from 'epic-component';

export default function (bundle, deps) {

  bundle.use('RecorderControls', 'MainView');

  function RecordScreenSelector (state, props) {
    const getMessage = state.get('getMessage');
    return {getMessage};
  }

  bundle.defineView('RecordScreen', RecordScreenSelector, EpicComponent(self => {

    self.render = function () {
      const {getMessage} = self.props;
      if (false) {  // TODO: test if encoding
        return (
          <div className="row">
            <div className="col-sm-12">
              <p>{getMessage('ENCODING_IN_PROGRESS')}</p>
            </div>
          </div>);
      }
      return (
        <div>
          <div className="row">
            <div className="col-sm-12">
              <deps.RecorderControls/>
            </div>
          </div>
          <deps.MainView/>
        </div>
      );
    };

  }));

};
