import React from "react";
import classnames from 'classnames';

interface EditScreenProps {
    containerWidth: any,
    viewportTooSmall: any,
    topControls: any
}

export class EditScreen extends React.PureComponent<EditScreenProps> {
    render() {
        const {containerWidth, viewportTooSmall, topControls} = this.props;
        return (
            <div id='main' style={{width: `${containerWidth}px`}}
                 className={classnames([viewportTooSmall && 'viewportTooSmall'])}>
                {topControls.map((Component, i) => <Component key={i} width={containerWidth}/>)}
                <StepperView/>
                <SubtitlesBand/>
            </div>
        );
    }
}
