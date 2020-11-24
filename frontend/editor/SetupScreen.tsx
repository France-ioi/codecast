import React from "react";
import {ProgressBar, Tab, Tabs} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";

interface SetupScreenProps {
    step: any,
    progress: any,
    dispatch: any,
    tabId: any,
    views: any
}

export class SetupScreen extends React.PureComponent<SetupScreenProps> {
    render() {
        const {step, progress} = this.props;
        if (step) {
            return (
                <div className='cc-container'>
                    {step === 'loading' &&
                    <p style={{marginTop: '20px'}}>{"Loading audio…"}</p>}
                    {step === 'preparing' &&
                    <p style={{marginTop: '20px'}}>{"Preparing player…"}</p>}
                    <ProgressBar value={progress}/>
                </div>
            );
        }
        const {tabId, views} = this.props;
        return (
            <div className='cc-container'>
                <h1 style={{margin: '20px 0'}}>{"Codecast Editor"}</h1>
                <Tabs id='setup-tabs' onChange={this.handleTabChange} selectedTabId={tabId} large={true}>
                    <Tab id='setup-tab-infos' title="Overview" panel={<views.EditorOverview/>}/>
                    <Tab id='setup-tab-subtitles' title="Subtitles" panel={<views.SubtitlesEditor/>}/>
                    <Tab id='setup-tab-trim' title="Trim" panel={<views.TrimEditor/>}/>
                </Tabs>
            </div>
        );
    }

    handleTabChange = (newTabId) => {
        const {dispatch} = this.props;

        dispatch({type: ActionTypes.SetupScreenTabChanged, payload: {tabId: newTabId}});
    };
}
