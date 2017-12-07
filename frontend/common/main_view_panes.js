
import React from 'react';

class MainViewPanes extends React.PureComponent {
  render () {
    const {panes} = this.props;
    return (
      <div id='mainView-panes'>
        {panes.entrySeq().map(([key, pane]) => {
          if (!pane.get('visible')) return false;
          const View = pane.get('View');
          const paneStyle = {
            width: `${pane.get('width')}px`,
            left: `${pane.get('left')}px`,
          };
          return (
            <div key={key} className='pane' style={paneStyle}>
              <View />
            </div>
          );
        })}
      </div>
    );
  }
}

export default function (bundle, deps) {

  function MainViewPanesSelector (state, props) {
    const panes = state.get('panes');
    return {panes};
  }

  bundle.defineView('MainViewPanes', MainViewPanesSelector, MainViewPanes);

};
