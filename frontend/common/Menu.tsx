import React from 'react';
import {Button, ButtonGroup, Dialog} from '@blueprintjs/core';
import {isLocalMode} from "../utils/app";
import {FullscreenButton} from "./FullscreenButton";
import {SubtitlesMenu} from "../subtitles/SubtitlesMenu";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "./ExamplePicker";
import {ActionTypes} from "./actionTypes";

export default function (bundle) {
    bundle.defineView('Menu', MenuSelector, Menu);
};

interface MenuProps {
    getMessage: Function,
    canChangePlatform: boolean,
    platform: string,
    offlineDownloadUrl: string,
    dispatch: Function
}

class Menu extends React.PureComponent<MenuProps> {
    state = {isOpen: false};

    render() {
        const {getMessage, platform, canChangePlatform, offlineDownloadUrl} = this.props;
        const {isOpen} = this.state;

        return (
            <div id='menu'>
                <ButtonGroup>
                    <SubtitlesMenu />
                    <Button onClick={this.openMenu} icon='menu'/>
                    <FullscreenButton />
                </ButtonGroup>
                <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={isOpen} onClose={this.closeMenu}>
                    <div className='bp3-dialog-body'>
                        <div style={{marginBottom: '10px'}}>
                            <LanguageSelection closeMenu={this.closeMenu}/>
                        </div>
                        {canChangePlatform &&
                        <div>
                            <label className='bp3-label'>
                                {getMessage('PLATFORM_SETTING')}
                                <div className='bp3-select'>
                                    <select onChange={this.setPlatform} value={platform}>
                                        <option value='python'>{getMessage('PLATFORM_PYTHON')}</option>
                                        <option value='unix'>{getMessage('PLATFORM_UNIX')}</option>
                                        <option value='arduino'>{getMessage('PLATFORM_ARDUINO')}</option>
                                    </select>
                                </div>
                            </label>
                        </div>
                        }
                        {offlineDownloadUrl &&
                        <a href={offlineDownloadUrl} target="_blank">
                            {getMessage('DOWNLOAD_OFFLINE')}
                        </a>
                        }
                        <ExamplePicker />
                    </div>
                </Dialog>
            </div>
        );
    }

    openMenu = () => {
        this.setState({isOpen: true});
    };
    closeMenu = () => {
        this.setState({isOpen: false});
    };
    setPlatform = (event) => {
        const platform = event.target.value;
        this.props.dispatch({
            type: ActionTypes.PlatformChanged,
            payload: platform
        });
    };
}

function MenuSelector(state, props) {
    const {baseUrl, baseDataUrl, platform, canChangePlatform} = state.get('options');
    const getMessage = state.get('getMessage');

    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl) {
        offlineDownloadUrl = baseUrl + '/offline?base=' + encodeURIComponent(baseDataUrl);
    }

    return {
        getMessage, platform, canChangePlatform, offlineDownloadUrl
    };
}
