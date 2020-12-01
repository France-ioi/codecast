/*
      screen      main-view-no-subtitles
  xs      …800    best effort
  sm   800…1024   794  (subtitles always hidden)
  md  1024…1200   940 if no subtitles, 794 if subtitles
  lg  1200…      1140 if no subtitles, 940 if subtitles
*/

import classnames from 'classnames';
import React from "react";
import {Alert, Dialog, ProgressBar, Intent} from "@blueprintjs/core";
import {PlayerControls} from "./PlayerControls";
import {StepperView} from "../stepper/views/StepperView";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface PlayerAppStateToProps {
    containerWidth: any,
    viewportTooSmall: any,
    isReady: any,
    progress: any,
    error: any
}

function mapStateToProps(state: AppStore): PlayerAppStateToProps {
    const viewportTooSmall = state.get('viewportTooSmall');
    const containerWidth = state.get('containerWidth');
    const player = state.get('player');
    const isReady = player.get('isReady');
    const progress = player.get('progress');
    const error = player.get('error');

    return {
        viewportTooSmall, containerWidth, isReady, progress, error
    };
}

interface PlayerAppDispatchToProps {
    dispatch: Function
}

interface PlayerAppProps extends PlayerAppStateToProps, PlayerAppDispatchToProps {

}

class _PlayerApp extends React.PureComponent<PlayerAppProps> {
    render() {
        const {containerWidth, viewportTooSmall, isReady, progress, error} = this.props;

        return (
            <div id='player-app'>
                <Dialog isOpen={!isReady} title={"Preparing playback"} isCloseButtonShown={false}>
                    <div style={{margin: '20px 20px 0 20px'}}>
                        <ProgressBar value={progress} intent={Intent.SUCCESS}/>
                    </div>
                </Dialog>
                {isReady &&
                    <div
                        id='main'
                        style={{width: `${containerWidth}px`}}
                        className={classnames([viewportTooSmall && 'viewportTooSmall'])}
                    >
                        <PlayerControls />
                        <StepperView />
                        <SubtitlesBand />
                    </div>
                }
                {error &&
                    <Alert intent={Intent.DANGER} icon='error' isOpen={!!error} onConfirm={this.reload}>
                        <p style={{
                            fontSize: '150%',
                            fontWeight: 'bold'
                        }}>{"A fatal error has occured while preparing playback."}</p>
                        <p>{"Source: "}{error.source}</p>
                        <p>{"Error: "}{error.message}</p>
                        <p>{"Details: "}{error.details}</p>
                        <p style={{fontWeight: 'bold'}}>{"Click OK to reload the page."}</p>
                    </Alert>
                }
            </div>
        );
    }

    reload = () => {
        window.location.reload();
    };
}

export const PlayerApp = connect(mapStateToProps)(_PlayerApp);
