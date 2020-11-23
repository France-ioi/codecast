import React from "react";

interface StepperViewPanesProps {
    panes: any
}

export class StepperViewPanes extends React.PureComponent<StepperViewPanesProps> {
    render() {
        const {panes} = this.props;
        return (
            <div id='mainView-panes'>
                {panes.entrySeq().map(([key, pane]) => {
                    if (!pane.get('visible')) return false;
                    const View = pane.get('View');
                    const paneStyle = {
                        width: `${pane.get('width')}px`
                    };
                    return (
                        <div key={key} className='pane' style={paneStyle}>
                            <View/>
                        </div>
                    );
                })}
            </div>
        );
    }
}
