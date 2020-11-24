import React from "react";
import {PortConfig} from "./PortConfig";
import {PortDisplay} from "./PortDisplay";
import {SelectedPortPanel} from "./SelectedPortPanel";

interface ArduinoPanelProps {
    portConfigs: any,
    portDefns: any,
    portStates: any,
    selectedPort: any,
    preventInput: any,
    dispatch: Function
}

export class ArduinoPanel extends React.PureComponent<ArduinoPanelProps> {
    render() {
        const {portConfigs, portDefns, portStates, selectedPort, preventInput, dispatch} = this.props;
        if (!portStates) {
            return (
                <form>
                    <div className='arduino-ports'>
                        {portDefns.map((defn, index) =>
                            <PortConfig key={index} index={index} defn={defn} config={portConfigs[index]}
                                        dispatch={dispatch} preventInput={preventInput}/>)}
                    </div>
                </form>
            );
        }
        return (
            <form>
                <div className='arduino-ports'>
                    {portDefns.map(function (defn, index) {
                        const config = portConfigs[index];
                        const state = portStates[index];
                        return (
                            <PortDisplay key={index} index={index} defn={defn} config={config} state={state}
                                         selected={selectedPort === index}
                                         dispatch={dispatch} preventInput={preventInput}/>
                        );
                    })}
                </div>
                {selectedPort !== undefined &&
                <SelectedPortPanel index={selectedPort} dispatch={dispatch} preventInput={preventInput}
                                   state={portStates[selectedPort]}/>}
            </form>
        );
    };
}
