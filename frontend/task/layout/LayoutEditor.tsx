import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {BufferEditor} from "../../buffers/BufferEditor";
import {getPlayerState} from "../../player/selectors";

interface LayoutEditorStateToProps {
    sourceMode: string,
    preventInput: any,
}

function mapStateToProps(state: AppStore): LayoutEditorStateToProps {
    const {platform} = state.options;

    let mode;
    switch (platform) {
        case 'arduino':
            mode = 'arduino';

            break;
        case 'python':
            mode = 'python';

            break;
        default:
            mode = 'c_cpp';

            break;
    }

    const sourceMode = mode;

    const player = getPlayerState(state);
    const preventInput = player.isPlaying;

    return {
        sourceMode,
        preventInput,
    };
}

interface LayoutStackViewProps extends LayoutEditorStateToProps {
}

export class _LayoutEditor extends React.PureComponent<LayoutStackViewProps> {
    render() {
        return (
            <BufferEditor
                buffer="source"
                readOnly={false}
                shield={this.props.preventInput}
                mode={this.props.sourceMode}
                theme="textmate"
                requiredWidth="100%"
                requiredHeight="100%"
                hasAutocompletion
            />
        );
    }

    static computeDimensions(width: number, height: number) {
        return {
            taken: {width, height},
            minimum: {width, height},
        }
    }
}

export const LayoutEditor = connect(mapStateToProps)(_LayoutEditor);
