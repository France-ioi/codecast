import React from "react";
import {ActionTypes} from "./actionTypes";

interface SelectedPortPanelProps {
    index: any,
    preventInput: any,
    state: any,
    dispatch: Function
}

export class SelectedPortPanel extends React.PureComponent<SelectedPortPanelProps> {
    onChange = (changes) => {
        const {index, preventInput} = this.props;
        if (!preventInput) {
            this.props.dispatch({type: ActionTypes.ArduinoPortChanged, index, changes});
        }
    };
    onSliderChanged = (event) => {
        this.onChange({input: {$set: event.currentTarget.value / 1023}});
    }
    renderSlider = () => {
        const value = Math.round(this.props.state.input * 1023);
        return (
            <div>
                <input type="number" value={value} onChange={this.onSliderChanged}/>
                <input type="range" value={value} min={0} max={1023} onChange={this.onSliderChanged}/>
            </div>
        );
    };

    render() {
        const {index, state} = this.props;
        return (
            <div className='arduino-port-panel'>
                <p>{"Port "}{index}</p>
                {state.peripheral.type === 'slider' && this.renderSlider()}
            </div>
        );
    };
}
