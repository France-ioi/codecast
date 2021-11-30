import React from "react";
import {Card} from 'react-bootstrap';
import {select} from "typed-redux-saga";
import {ActionTypes} from "./actionTypes";
import {BufferEditor} from "../../buffers/BufferEditor";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {IoMode} from "./index";
import {getMessage} from "../../lang";

interface IOPaneOptionsStateToProps {
    mode: string,
    modeSelect: boolean
}

function mapStateToProps(state: AppStore): IOPaneOptionsStateToProps {
    const {mode, modeSelect} = state.ioPane;

    return {mode, modeSelect};
}

interface IOPaneOptionsDispatchToProps {
    dispatch: Function
}

interface IOPaneOptionsProps extends IOPaneOptionsStateToProps, IOPaneOptionsDispatchToProps {

}

class _IOPaneOptions extends React.PureComponent<IOPaneOptionsProps> {
    modeOptions = [
        {value: IoMode.Split, label: 'IOPANE_MODE_SPLIT'},
        {value: IoMode.Terminal, label: 'IOPANE_MODE_INTERACTIVE'}
    ];

    onModeChanged = (event) => {
        const mode = event.target.value;
        this.props.dispatch({type: ActionTypes.IoPaneModeChanged, payload: {mode}});
    }

    render() {
        const {mode, modeSelect} = this.props;
        const headerTitle = getMessage(modeSelect ? 'IOPANE_SELECT_TERMINAL_TITLE' : 'IOPANE_FORCED_TERMINAL_TITLE');

        return (
            <Card>
                <Card.Header>{headerTitle}</Card.Header>
                <Card.Body>
                    <div className="row">
                        <div className="col-sm-12">
                            {!modeSelect &&
                                <p>{getMessage('IOPANE_TERMINAL_PROGRAM_STOPPED')}</p>
                            }
                            {modeSelect &&
                                <form style={{marginTop: '10px', marginLeft: '10px'}}>
                                    <label className='bp3-label bp3-inline'>
                                        {getMessage('IOPANE_MODE')}
                                        <div className='bp3-select'>
                                            <select value={mode} onChange={this.onModeChanged}>
                                                {this.modeOptions.map(p =>
                                                    <option
                                                        key={p.value}
                                                        value={p.value}
                                                    >
                                                        {getMessage(p.label)}
                                                    </option>)}
                                            </select>
                                        </div>
                                    </label>
                                </form>
                            }
                            {mode === IoMode.Split &&
                                <div>
                                    <p>{getMessage('IOPANE_INITIAL_INPUT')}</p>
                                    <BufferEditor
                                        buffer='input'
                                        mode='text'
                                        requiredWidth='100%'
                                        requiredHeight='150px'
                                    />
                                </div>
                            }
                        </div>
                    </div>
                </Card.Body>
            </Card>
        );
    };
}

export const IOPaneOptions = connect(mapStateToProps)(_IOPaneOptions);
