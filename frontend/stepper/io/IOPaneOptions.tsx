import React from "react";
import {Panel} from 'react-bootstrap';
import {select} from "redux-saga/effects";
import {ActionTypes} from "./actionTypes";
import {BufferEditor} from "../../buffers/BufferEditor";

interface IOPaneOptionsProps {
    dispatch?: Function,
    getMessage?: any,
    mode?: any,
    modeSelect?: any
}

export class IOPaneOptions extends React.PureComponent<IOPaneOptionsProps> {
    modeOptions = [
        {value: 'split', label: 'IOPANE_MODE_SPLIT'},
        {value: 'terminal', label: 'IOPANE_MODE_INTERACTIVE'}
    ];

    onModeChanged = (event) => {
        const mode = event.target.value;
        this.props.dispatch({type: ActionTypes.IoPaneModeChanged, payload: {mode}});
    }

    render() {
        const {getMessage, mode, modeSelect} = this.props;
        const headerTitle = getMessage(modeSelect ? 'IOPANE_SELECT_TERMINAL_TITLE' : 'IOPANE_FORCED_TERMINAL_TITLE');

        return (
            <Panel>
                <Panel.Heading>{headerTitle}</Panel.Heading>
                <Panel.Body>
                    <div className="row">
                        <div className="col-sm-12">
                            {!modeSelect &&
                            <p>{getMessage('IOPANE_TERMINAL_PROGRAM_STOPPED')}</p>}
                            {modeSelect && <form style={{marginTop: '10px', marginLeft: '10px'}}>
                                <label className='bp3-label bp3-inline'>
                                    {getMessage('IOPANE_MODE')}
                                    <div className='bp3-select'>
                                        <select value={mode} onChange={this.onModeChanged}>
                                            {this.modeOptions.map(p =>
                                                <option key={p.value}
                                                        value={p.value}>{getMessage(p.label)}</option>)}
                                        </select>
                                    </div>
                                </label>
                            </form>}
                            {mode === 'split' &&
                            <div>
                                <p>{getMessage('IOPANE_INITIAL_INPUT')}</p>
                                <BufferEditor buffer='input' mode='text' width='100%' height='150px'/>
                            </div>}
                        </div>
                    </div>
                </Panel.Body>
            </Panel>
        );
    };
}
