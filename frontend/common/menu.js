
import React from 'react';
import {Button, ButtonGroup, Dialog, Label} from '@blueprintjs/core';

export default function (bundle) {
  bundle.defineView('Menu', MenuSelector, Menu);
};

class Menu extends React.PureComponent {
  render () {
    const {getMessage, SubtitlesMenu, FullscreenButton, LanguageSelection, ExamplePicker, platform, canChangePlatform} = this.props;
    const {isOpen} = this.state;
    return (
      <div id='menu'>
        <ButtonGroup>
          <SubtitlesMenu/>
          <Button onClick={this.openMenu} icon='menu'/>
          <FullscreenButton/>
        </ButtonGroup>
        <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={isOpen} onClose={this.closeMenu} >
          <div className='bp3-dialog-body'>
            <div style={{marginBottom: '10px'}}>
              <LanguageSelection closeMenu={this.closeMenu} />
            </div>
            {canChangePlatform &&
              <div>
                <label className='bp3-label'>
                  {getMessage('PLATFORM_SETTING')}
                  <div className='bp3-select'>
                    <select onChange={this.setPlatform} value={platform}>
                      <option value='unix'>{getMessage('PLATFORM_UNIX')}</option>
                      <option value='arduino'>{getMessage('PLATFORM_ARDUINO')}</option>
                    </select>
                  </div>
                </label>
              </div>}
            <ExamplePicker />
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
    this.props.dispatch({type: this.props.optionsChanged, payload: {platform: {$set: platform}}});
  };
}

function MenuSelector (state, props) {
  const {FullscreenButton, SubtitlesMenu, LanguageSelection, ExamplePicker} = state.get('scope');
  const {optionsChanged} = state.get('actionTypes');
  const {platform, canChangePlatform} = state.get('options');
  const getMessage = state.get('getMessage');
  return {
    getMessage, FullscreenButton, SubtitlesMenu, LanguageSelection, ExamplePicker,
    platform, canChangePlatform, optionsChanged
  };
}
