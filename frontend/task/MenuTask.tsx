import React from 'react';
import {Dialog, Icon} from '@blueprintjs/core';
import {isLocalMode} from "../utils/app";
import {LanguageSelection} from "../lang/LanguageSelection";
import {ExamplePicker} from "../common/ExamplePicker";
import {ActionTypes as CommonActionTypes} from "../common/actionTypes";
import {ActionTypes as IOActionTypes} from "../stepper/io/actionTypes";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {MenuIconsTask} from "./MenuIconsTask";
import {select} from "redux-saga/effects";
import {IoMode} from "../stepper/io";
import {recordingEnabledChange} from "./task_slice";
import {StepperStatus} from "../stepper";

interface MenuTaskStateToProps {
    getMessage: Function,
    canChangePlatform: boolean,
    platform: string,
    offlineDownloadUrl: string,
    recordingEnabled: boolean,
    playerEnabled: boolean,
    ioMode: IoMode,
    ioModeSelect: boolean,
}

function mapStateToProps(state: AppStore): MenuTaskStateToProps {
    const {baseUrl, baseDataUrl, platform, canChangePlatform} = state.options;
    const getMessage = state.getMessage;
    const recordingEnabled = state.task.recordingEnabled;
    const playerEnabled = !!state.options.baseDataUrl;
    const {mode: ioMode, modeSelect} = state.ioPane;
    const ioModeSelect = modeSelect && (!state.stepper || state.stepper.status === StepperStatus.Clear);

    let offlineDownloadUrl = null;
    if (!isLocalMode() && baseDataUrl) {
        offlineDownloadUrl = baseUrl + '/offline?recording=' + encodeURIComponent(baseDataUrl);
    }

    return {
        getMessage, platform, canChangePlatform, offlineDownloadUrl, recordingEnabled, playerEnabled, ioMode, ioModeSelect,
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

    modeOptions = [
        {value: IoMode.Split, label: 'IOPANE_MODE_SPLIT'},
        {value: IoMode.Terminal, label: 'IOPANE_MODE_INTERACTIVE'}
    ];

    private wrapperRef: React.RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.wrapperRef = React.createRef();
        this.setWrapperRef = this.setWrapperRef.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    render() {
        const {getMessage, platform, canChangePlatform, offlineDownloadUrl, playerEnabled, ioMode, ioModeSelect} = this.props;
        const {settingsOpen} = this.state;

        return (
            <div ref={this.wrapperRef} className={`menu-container ${this.state.menuOpen ? 'is-open' : ''}`}>
                <div className="menu-icons">
                    <MenuIconsTask
                        toggleMenu={this.toggleMenu}
                    />
                </div>
                <div className={`task-menu`}>
                    <div className="menu-item" onClick={this.toggleSettings}>
                        <Icon icon="cog"/>
                        <span>{getMessage('MENU_SETTINGS')}</span>
                    </div>
                    {!playerEnabled && <div className="menu-item" onClick={this.toggleRecording}>
                        <Icon icon="record" color="#ff001f"/>
                        <span>{getMessage('MENU_RECORDER')}</span>
                    </div>}
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
                            {ioModeSelect &&
                                <div>
                                  <label className='bp3-label'>
                                      {getMessage('IOPANE_MODE')}
                                    <div className='bp3-select'>
                                      <select value={ioMode} onChange={this.onIOModeChanged}>
                                          {this.modeOptions.map(p =>
                                              <option
                                                  key={p.value}
                                                  value={p.value}
                                              >
                                                  {getMessage(p.label)}
                                              </option>)}
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

    setWrapperRef(node) {
        this.wrapperRef = node;
    }

    handleClickOutside(event) {
        if (
            this.wrapperRef
            && !this.wrapperRef.current.contains(event.target)
            && !event.target.closest('.bp3-portal')
            && this.state.menuOpen
        ) {
            this.closeMenu();
        }
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
        this.props.dispatch(recordingEnabledChange(!this.props.recordingEnabled));
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

    onIOModeChanged = (event) => {
        const mode = event.target.value;
        this.props.dispatch({type: IOActionTypes.IoPaneModeChanged, payload: {mode}});
    };
}

export const MenuTask = connect(mapStateToProps)(_MenuTask);
