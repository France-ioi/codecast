import React from "react";
import classnames from 'classnames';
import {StepperView} from "../stepper/views/StepperView";
import {SubtitlesBand} from "../subtitles/SubtitlesBand";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface EditScreenStateToProps {
    containerWidth: any,
    viewportTooSmall: any,
    topControls: any
}

function mapStateToProps(state: AppStore): EditScreenStateToProps {
    const viewportTooSmall = state.get('viewportTooSmall');
    const containerWidth = state.get('containerWidth');
    const topControls = state.getIn(['editor', 'controls']).top;

    return {
        viewportTooSmall, containerWidth, topControls
    };
}

interface EditScreenDispatchToProps {
    dispatch: Function
}

interface EditScreenProps extends EditScreenStateToProps, EditScreenDispatchToProps {

}

class _EditScreen extends React.PureComponent<EditScreenProps> {
    render() {
        const {containerWidth, viewportTooSmall, topControls} = this.props;
        return (
            <div id='main' style={{width: `${containerWidth}px`}}
                 className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
                {topControls.map((Component, i) => <Component key={i} width={containerWidth}/>)}
                <StepperView />
                <SubtitlesBand />
            </div>
        );
    }
}

export const EditScreen = connect(mapStateToProps)(_EditScreen);
