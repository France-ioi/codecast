import React from "react";
import {SubtitlesEditorPane} from "../../subtitles/views/SubtitlesEditorPane";
import {SubtitlesPane} from "../../subtitles/SubtitlesPane";

interface StepperViewPanesProps {
    panes: any
}

export class StepperViewPanes extends React.PureComponent<StepperViewPanesProps> {
    render() {
        const {panes} = this.props;

        return (
            <div id='mainView-panes'>
                {panes.entrySeq().map(([key, pane]) => {
                    if (!pane.get('visible')) {
                        return false;
                    }

                    const view = pane.get('view');
                    const paneStyle = {
                        width: `${pane.get('width')}px`
                    };

                    let displayView = null;
                    if (view === 'editor') {
                        displayView = <SubtitlesEditorPane />;
                    } else if (view === 'subtitles') {
                        displayView = <SubtitlesPane />
                    }

                    return (
                        <div key={key} className='pane' style={paneStyle}>
                            {displayView}
                        </div>
                    );
                })}
            </div>
        );
    }
}
