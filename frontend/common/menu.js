
import React from 'react';
import {Button, ButtonGroup, Nav, NavDropdown, MenuItem} from 'react-bootstrap';
import Portal from 'react-portal';

export default function (bundle, deps) {

  bundle.use(
    'FullscreenButton', 'LogoutButton',
    'ExamplePicker', 'isTranslated', 'setLanguage', 'exampleSelected',
  );

  bundle.defineAction('menuOpened', 'Menu.Opened');
  bundle.defineAction('menuClosed', 'Menu.Closed');

  bundle.addReducer('init', state => state.set('menu', {}));

  class Menu extends React.PureComponent {
    render () {
      const {isOpen, dispatch, isTranslated, getMessage} = this.props;
      const menuButton =
        <Button title={getMessage('MENU_TOOLTIP')}>
          <i className='fa fa-bars'/>
        </Button>;
      return (
        <div id='menu'>
          <ButtonGroup>
            <deps.FullscreenButton/>
            <deps.LogoutButton/>
            <Portal closeOnEsc closeOnOutsideClick openByClickOn={menuButton}>
              <MenuPopup getMessage={getMessage} dispatch={dispatch} canSelectExample={!isTranslated}/>
            </Portal>
          </ButtonGroup>
        </div>
      );
    }
  }
  bundle.defineView('Menu', MenuSelector, Menu);

  class MenuPopup extends React.PureComponent {
    render() {
      const {getMessage, canSelectExample} = this.props;
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
              <button type='button' className='btn' data-language='fr-FR' onClick={this.onSetLanguage}>{"fr-FR"}</button>
              <button type='button' className='btn' data-language='en-US' onClick={this.onSetLanguage}>{"en-US"}</button>
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

  function MenuSelector (state, props) {
    const getMessage = state.get('getMessage');
    const isTranslated = deps.isTranslated(state);
    return {isTranslated, getMessage};
  }

};
