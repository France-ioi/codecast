import React from 'react';
import {Button, Dialog} from '@blueprintjs/core';
import {isLocalMode} from "../utils/app";
import {FullscreenButton} from "./FullscreenButton";
import {SubtitlesMenu} from "../subtitles/SubtitlesMenu";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "./ExamplePicker";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface MenuStateToProps {
    getMessage: Function,
    canChangePlatform: boolean,
    platform: string,
    offlineDownloadUrl: string
}

function mapStateToProps(state: AppStore): MenuStateToProps {
    const {baseUrl, baseDataUrl, platform, canChangePlatform} = state.options;
    const getMessage = state.getMessage;

    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl) {
        offlineDownloadUrl = baseUrl + '/offline?base=' + encodeURIComponent(baseDataUrl);
    }

    return {
        getMessage, platform, canChangePlatform, offlineDownloadUrl
    };
}

interface MenuDispatchToProps {
    dispatch: Function
}

interface MenuProps extends MenuStateToProps, MenuDispatchToProps {

}

class _MenuTask extends React.PureComponent<MenuProps> {
    state = {isOpen: false};

    render() {
        const {getMessage, platform, canChangePlatform, offlineDownloadUrl} = this.props;
        const {isOpen} = this.state;

        return (
            <div id='menu'>
                <div className="menu-task-elements">
                    <div className="menu-task-element is-blue">
                        <FullscreenButton />
                    </div>
                    <div className="menu-task-element">
                        <SubtitlesMenu />
                    </div>
                    <div className="menu-task-element">
                        <Button onClick={this.openMenu} icon='menu'/>
                    </div>
                </div>
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
                        <a href={offlineDownloadUrl} target="_blank" rel="noreferrer">
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

export const MenuTask = connect(mapStateToProps)(_MenuTask);
