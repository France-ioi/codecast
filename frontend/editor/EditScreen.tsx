import React from "react";
import classnames from 'classnames';
import {StepperView} from "../stepper/views/StepperView";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {TrimEditorControls} from "./TrimEditorControls";
import {PlayerControls} from "../player/PlayerControls";
import {EditorControl} from "./index";

interface EditScreenStateToProps {
    containerWidth: any,
    viewportTooSmall: any,
    controls: EditorControl
}

function mapStateToProps(state: AppStore): EditScreenStateToProps {
    const viewportTooSmall = state.viewportTooSmall;
    const containerWidth = state.containerWidth;
    const controls = state.editor.controls;

    return {
        viewportTooSmall, containerWidth, controls
    };
}

interface EditScreenDispatchToProps {
    dispatch: Function
}

interface EditScreenProps extends EditScreenStateToProps, EditScreenDispatchToProps {

}

class _EditScreen extends React.PureComponent<EditScreenProps> {
    render() {
        const {containerWidth, viewportTooSmall, controls} = this.props;

        let displayControls = null;
        if (controls === 'trim') {
            displayControls = (
                <React.Fragment>
                    <TrimEditorControls width={containerWidth} />
                    <PlayerControls />
                </React.Fragment>
            );
        } else if (controls === 'subtitles') {
            displayControls = <PlayerControls />
        }

        return (
            <div
                id='main'
                style={{width: `${containerWidth}px`}}
                className={classnames([viewportTooSmall && 'viewportTooSmall'])}
            >
                {displayControls}

                <StepperView />
                <SubtitlesBand />
            </div>
        );
    }
}

export const EditScreen = connect(mapStateToProps)(_EditScreen);
