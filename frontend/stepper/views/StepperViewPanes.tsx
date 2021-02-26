import React from "react";
import {SubtitlesEditorPane} from "../../subtitles/views/SubtitlesEditorPane";
import {SubtitlesPane} from "../../subtitles/SubtitlesPane";
import {Panes} from "../../store";

interface StepperViewPanesProps {
    panes: Panes
}

export class StepperViewPanes extends React.PureComponent<StepperViewPanesProps> {
    render() {
        const {panes} = this.props;

        return (
            <div id='mainView-panes'>
                {Object.keys(panes).map((key: string) => {
                    const pane = panes[key];

                    if (!pane.visible) {
                        return false;
                    }

                    const view = pane.view;
                    const paneStyle = {
                        width: `${pane.width}px`
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
