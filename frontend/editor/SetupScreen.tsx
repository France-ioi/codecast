import React from "react";
import {ProgressBar, Tab, Tabs} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {EditorOverview} from "./EditorOverview";
import {SubtitlesEditor} from "../subtitles/SubtitlesEditor";
import {TrimEditor} from "./TrimEditor";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface SetupScreenStateToProps {
    step: 'loading' | 'preparing' | 'ready',
    progress: number,
    tabId?: string
}

function mapStateToProps(state: AppStore): SetupScreenStateToProps {
    const editor = state.get('editor');
    const audioLoaded = editor.get('audioLoaded');
    if (!audioLoaded) {
        const progress = editor.get('audioLoadProgress');

        return {
            step: 'loading',
            progress
        };
    }

    const playerReady = editor.get('playerReady');
    if (!playerReady) {
        const progress = state.getIn(['player', 'progress']);

        return {
            step: 'preparing',
            progress
        };
    }

    const tabId = editor.get('setupTabId');

    return {
        step: 'ready',
        progress: 100,
        tabId
    };
}

interface SetupScreenDispatchToProps {
    dispatch: Function
}

interface SetupScreenProps extends SetupScreenStateToProps, SetupScreenDispatchToProps {

}

class _SetupScreen extends React.PureComponent<SetupScreenProps> {
    render() {
        const {step, progress} = this.props;

        if (step === 'loading' || step === 'preparing') {
            return (
                <div className='cc-container'>
                    {step === 'loading' &&
                        <p style={{marginTop: '20px'}}>{"Loading audio…"}</p>
                    }
                    {step === 'preparing' &&
                        <p style={{marginTop: '20px'}}>{"Preparing player…"}</p>
                    }

                    <ProgressBar value={progress} />
                </div>
            );
        }

        const {tabId} = this.props;

        return (
            <div className='cc-container'>
                <h1 style={{margin: '20px 0'}}>{"Codecast Editor"}</h1>
                <Tabs id='setup-tabs' onChange={this.handleTabChange} selectedTabId={tabId} large={true}>
                    <Tab id='setup-tab-infos' title="Overview" panel={<EditorOverview />}/>
                    <Tab id='setup-tab-subtitles' title="Subtitles" panel={<SubtitlesEditor />}/>
                    <Tab id='setup-tab-trim' title="Trim" panel={<TrimEditor />}/>
                </Tabs>
            </div>
        );
    }

    handleTabChange = (newTabId) => {
        const {dispatch} = this.props;

        dispatch({type: ActionTypes.SetupScreenTabChanged, payload: {tabId: newTabId}});
    };
}

export const SetupScreen = connect(mapStateToProps)(_SetupScreen);
