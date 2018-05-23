
import React from 'react';
import {Button, ButtonGroup, Dialog} from '@blueprintjs/core';

export default function (bundle) {
  bundle.defineView('Menu', MenuSelector, Menu);
};

class Menu extends React.PureComponent {
  render () {
    const {getMessage, SubtitlesMenu, FullscreenButton, LanguageSelection, ExamplePicker, platform} = this.props;
    const {isOpen} = this.state;
    return (
      <div id='menu'>
        <ButtonGroup>
          <SubtitlesMenu/>
          <Button onClick={this.openMenu} icon='menu'/>
          <FullscreenButton/>
        </ButtonGroup>
        <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={isOpen} onClose={this.closeMenu} >
          <div className='pt-dialog-body'>
            <div style={{marginBottom: '10px'}}>
              <LanguageSelection closeMenu={this.closeMenu} />
            </div>
            <div className='pt-select'>
              <label className='pt-label'>
                {getMessage('PLATFORM_SETTING')}
                <select onChange={this.setPlatform} value={platform}>
                  <option value='plain'>{getMessage('PLATFORM_UNIX')}</option>
                  <option value='arduino'>{getMessage('PLATFORM_ARDUINO')}</option>
                </select>
              </label>
            </div>
            <div>
              <ExamplePicker />
            </div>
          </div>
        </Dialog>
      </div>
    );
  }
  state = {isOpen: false};
  openMenu = () => { this.setState({isOpen: true}); };
  closeMenu = () => { this.setState({isOpen: false}); };
  setPlatform = (event) => {
    const platform = event.target.value;
    this.props.dispatch({type: this.props.optionsChanged, payload: {mode: {$set: platform}}});
  };
}

function MenuSelector (state, props) {
  const {FullscreenButton, SubtitlesMenu, LanguageSelection, ExamplePicker} = state.get('scope');
  const {optionsChanged} = state.get('actionTypes');
  const {mode} = state.get('options');
  const getMessage = state.get('getMessage');
  return {getMessage, FullscreenButton, SubtitlesMenu, LanguageSelection, ExamplePicker, platform: mode, optionsChanged};
}
