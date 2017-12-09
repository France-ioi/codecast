
import React from 'react';
import {Button, ButtonGroup, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import Portal from 'react-portal';

export default function (bundle, deps) {

  bundle.use(
    'FullscreenButton', 'LogoutButton',
    'ExamplePicker', 'isTranslated', 'setLanguage', 'exampleSelected',
    'subtitlesGetMenu'
  );

  bundle.defineAction('menuOpened', 'Menu.Opened');
  bundle.defineAction('menuClosed', 'Menu.Closed');

  bundle.addReducer('init', state => state.set('menu', {}));

  class Menu extends React.PureComponent {
    render () {
      const {languages, language, getMessage, canSelectExample, SubtitlesMenu} = this.props;
      const menuButton =
        <Button title={getMessage('MENU_TOOLTIP')}>
          <i className='fa fa-bars'/>
        </Button>;
      return (
        <div id='menu'>
          <ButtonGroup>
            {SubtitlesMenu && <SubtitlesMenu/>}
            <deps.LogoutButton/>
            <Portal closeOnEsc closeOnOutsideClick openByClickOn={menuButton}>
              <deps.MenuPopup/>
            </Portal>
            <deps.FullscreenButton/>
          </ButtonGroup>
        </div>
      );
    }
  }
  bundle.defineView('Menu', MenuSelector, Menu);

  function MenuSelector (state, props) {
    const getMessage = state.get('getMessage');
    const SubtitlesMenu = deps.subtitlesGetMenu(state);
    return {getMessage, SubtitlesMenu};
  }

  class MenuPopup extends React.PureComponent {
    render() {
      const {languages, language, getMessage, canSelectExample} = this.props;
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
            <div>
              {getMessage('LOAD_EXAMPLE:')}
              <deps.ExamplePicker disabled={!canSelectExample} onSelect={this.onSelectExample} />
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
    onSelectExample = (example) => {
      this.props.closePortal();
      this.props.dispatch({type: deps.exampleSelected, example});
    };
  }
  bundle.defineView('MenuPopup', MenuPopupSelector, MenuPopup);

  function MenuPopupSelector (state, props) {
    const languages = state.get('availableLanguages');
    const language = state.get('language');
    const getMessage = state.get('getMessage');
    const isTranslated = deps.isTranslated(state);
    return {canSelectExample: !isTranslated, languages, language, getMessage};
  }

};
