import React from "react";
import {Icon} from "@blueprintjs/core";
import classnames from 'classnames';
import {ActionTypes} from "./actionTypes";
import {PinMode} from "./index";
import {PortHeader} from "./PortHeader";

interface PortDisplayProps {
    index: any,
    preventInput: any,
    selected: any,
    state: any,
    defn: any,
    config: any,
    dispatch: Function
}

export class PortDisplay extends React.PureComponent<PortDisplayProps> {
    onChange = (changes) => {
        const {index, preventInput} = this.props;
        if (!preventInput) {
            this.props.dispatch({type: ActionTypes.ArduinoPortChanged, index, changes});
        }
    };
    onButtonToggle = () => {
        const input = 1 ^ this.props.state.input;
        this.onChange({input: {$set: input}});
    };
    onSelect = () => {
        let {index, preventInput, selected} = this.props;
        if (!preventInput) {
            this.props.dispatch({
                type: ActionTypes.ArduinoPortSelected,
                index: selected ? undefined : index
            });
        }
    };
    render = () => {
        const {defn, config, state, selected} = this.props;
        const {peripheral} = config;
        const level = state.direction === PinMode.PINMODE_INPUT
            ? (state.output === 1 ? <strong>{'Z'}</strong> : 'Z')
            : (state.output === 0 ? '0' : '1');
        return (
            <div className={classnames(['arduino-port', selected && 'arduino-port-selected'])}>
                <PortHeader defn={defn} brief/>
                <div className='arduino-port-level'>{level}</div>
                {peripheral.type === 'LED' &&
                <div className="arduino-peri-led" style={{color: colorToCss[peripheral.color]}}>
                    {state.output === 0
                        ? <Icon icon='circle'/>
                        : <Icon icon='full-circle'/>}
                </div>}
                {peripheral.type === 'button' &&
                <div className="arduino-peri-button clickable" onClick={this.onButtonToggle}>
                    <Icon icon={state.input === 0 ? 'arrow-down' : 'arrow-up'}/>
                </div>}
                {peripheral.type === 'slider' &&
                <div className="arduino-slider" onClick={this.onSelect}>
                    {Math.round(state.input * 1023)}
                </div>}
            </div>
        );
    };
}

const colorToCss = {
    red: '#f40',
    amber: '#fa4',
    yellow: '#fe4',
    green: '#4f0',
    blue: '#54f',
    white: '#eef',
};
