
import React from 'react';
import {Button, ButtonGroup, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import Portal from 'react-portal';

export default function (bundle, deps) {

  bundle.use(
    'ExamplePicker', 'isTranslated', 'setLanguage',
    'subtitlesGetMenu', 'FullscreenButton'
  );

  bundle.defineAction('menuOpened', 'Menu.Opened');
  bundle.defineAction('menuClosed', 'Menu.Closed');

  bundle.addReducer('init', state => state.set('menu', {}));

  class Menu extends React.PureComponent {
    render () {
      const {getMessage, MenuPopup, SubtitlesMenu, FullscreenButton} = this.props;
      const menuButton =
        <Button title={getMessage('MENU_TOOLTIP')}>
          <i className='fa fa-bars'/>
        </Button>;
      return (
        <div id='menu'>
          <ButtonGroup>
            {SubtitlesMenu && <SubtitlesMenu/>}
            <Portal closeOnEsc closeOnOutsideClick openByClickOn={menuButton}>
              <MenuPopup/>
            </Portal>
            <FullscreenButton/>
          </ButtonGroup>
        </div>
      );
    }
  }
  bundle.defineView('Menu', MenuSelector, Menu);

  function MenuSelector (state, props) {
    const {MenuPopup, FullscreenButton, subtitlesGetMenu} = state.get('scope');
    const getMessage = state.get('getMessage');
    const SubtitlesMenu = subtitlesGetMenu(state);
    return {getMessage, MenuPopup, SubtitlesMenu, FullscreenButton};
  }

  class MenuPopup extends React.PureComponent {
    render() {
      const {languages, language, getMessage} = this.props;
      return (
        <div className='menu-popup' onClick={this.close}>
          <div className='menu-popup-inset' onClick={this.stopPropagation}>
            <div className='pull-right'>
              <Button onClick={this.close}>
                <i className='fa fa-times'/>
              </Button>
            </div>
            <div>
              {getMessage('LANGUAGE:')}
              {languages.map(lang =>
                <Button key={lang} data-language={lang} onClick={this.onSetLanguage} active={language === lang}>{lang}</Button>)}
            </div>
            <div style={{marginTop: '10px'}}>
              <deps.ExamplePicker />
            </div>
          </div>
        </div>
      );
    }
    stopPropagation = (event) => {
      event.stopPropagation();
    };
    close = (event) => {
      event.stopPropagation();
      this.props.closePortal();
    };
    onSetLanguage = (event) => {
      event.stopPropagation();
      const {language} = event.currentTarget.dataset;
      const {closePortal, dispatch} = this.props;
      closePortal();
      setTimeout(() => dispatch({type: deps.setLanguage, language}), 0);
    };
  }
  bundle.defineView('MenuPopup', MenuPopupSelector, MenuPopup);

  function MenuPopupSelector (state, props) {
    const languages = state.get('availableLanguages');
    const language = state.get('language');
    const getMessage = state.get('getMessage');
    const isTranslated = deps.isTranslated(state);
    return {languages, language, getMessage};
  }

};
