import React from "react";
import {ActionTypes} from "./actionTypes";
import {PortHeader} from "./PortHeader";
import {PeripheralConfig} from "./PeripheralConfig";

interface PortConfigProps {
    dispatch: Function,
    index: any,
    defn: any,
    config: any,
    preventInput: any
}

export class PortConfig extends React.PureComponent<PortConfigProps> {
    onChange = (changes) => {
        const {dispatch, index} = this.props;
        dispatch({type: ActionTypes.ArduinoPortConfigured, index, changes});
    };
    onChangePeripheral = (changes) => {
        this.onChange({peripheral: changes});
    };

    render() {
        const {defn, config, preventInput} = this.props;
        const {peripheral} = config;
        return (
            <div className='arduino-port'>
                <PortHeader defn={defn}/>
                <div className='arduino-port-periph'>
                    <PeripheralConfig defn={defn} value={peripheral} onChange={this.onChangePeripheral}
                                      readOnly={preventInput}/>
                </div>
            </div>
        );
    }
}
