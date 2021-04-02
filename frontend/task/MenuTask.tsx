import React from 'react';
import {Dialog, Icon} from '@blueprintjs/core';
import {isLocalMode} from "../utils/app";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "../common/ExamplePicker";
import {ActionTypes} from "./actionTypes";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {MenuIconsTask} from "./MenuIconsTask";

interface MenuTaskStateToProps {
    getMessage: Function,
    canChangePlatform: boolean,
    platform: string,
    offlineDownloadUrl: string,
    recordingEnabled: boolean,
}

function mapStateToProps(state: AppStore): MenuTaskStateToProps {
    const {baseUrl, baseDataUrl, platform, canChangePlatform} = state.options;
    const getMessage = state.getMessage;
    const recordingEnabled = state.task.recordingEnabled;

    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl) {
        offlineDownloadUrl = baseUrl + '/offline?base=' + encodeURIComponent(baseDataUrl);
    }

    return {
        getMessage, platform, canChangePlatform, offlineDownloadUrl, recordingEnabled,
    };
}

interface MenuTaskDispatchToProps {
    dispatch: Function
}

interface MenuTaskState {
    settingsOpen: boolean,
    menuOpen: boolean,
}

interface MenuTaskProps extends MenuTaskStateToProps, MenuTaskDispatchToProps {

}

class _MenuTask extends React.PureComponent<MenuTaskProps, MenuTaskState> {
    state = {
        settingsOpen: false,
        menuOpen: false,
    };

    render() {
        const {getMessage, platform, canChangePlatform, offlineDownloadUrl} = this.props;
        const {settingsOpen} = this.state;

        return (
            <div className={`menu-container ${this.state.menuOpen ? 'is-open' : ''}`}>
                <div className="menu-icons">
                    <MenuIconsTask
                        toggleMenu={this.toggleMenu}
                    />
                </div>
                <div className={`task-menu`}>
                    <div className="menu-item" onClick={this.toggleSettings}>
                        <Icon icon="globe"/>
                        <span>{getMessage('MENU_LANGUAGE')}</span>
                    </div>
                    <div className="menu-item" onClick={this.toggleRecording}>
                        <Icon icon="record" color="#ff001f"/>
                        <span>{getMessage('MENU_RECORDER')}</span>
                    </div>
                    <Dialog icon='menu' title={getMessage('SETTINGS_MENU_TITLE')} isOpen={settingsOpen} onClose={this.closeSettings}>
                        <div className='bp3-dialog-body'>
                            <div style={{marginBottom: '10px'}}>
                                <LanguageSelection closeMenu={this.closeSettings}/>
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
            </div>
        );
    }

    toggleSettings = () => {
        this.setState(prevState => ({
            settingsOpen: !prevState.settingsOpen,
        }));
    };

    toggleMenu = () => {
        this.setState(prevState => ({
            menuOpen: !prevState.menuOpen,
        }));
    };

    toggleRecording = () => {
        this.props.dispatch({
            type: ActionTypes.TaskRecordingEnabledChange,
            payload: {enabled: !this.props.recordingEnabled}
        });
        this.closeMenu();
    }

    closeSettings = () => {
        this.setState({
            settingsOpen: false,
        });
    };

    closeMenu = () => {
        this.setState({
            menuOpen: false,
        });
    };

    setPlatform = (event) => {
        const platform = event.target.value;
        this.props.dispatch({
            type: CommonActionTypes.PlatformChanged,
            payload: platform
        });
    };
}

export const MenuTask = connect(mapStateToProps)(_MenuTask);
