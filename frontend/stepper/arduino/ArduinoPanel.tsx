import React from "react";
import {PortConfig} from "./PortConfig";
import {PortDisplay} from "./PortDisplay";
import {SelectedPortPanel} from "./SelectedPortPanel";
import {connect} from "react-redux";
import {AppStore} from "../../store";
import {getCurrentStepperState} from "../selectors";
import {NPorts} from "./config";
import range from 'node-range';

interface ArduinoPanelStateToProps {
    portConfigs: any,
    portDefns: any,
    portStates: any,
    selectedPort: any
}

function mapStateToProps(state: AppStore): ArduinoPanelStateToProps {
    const arduinoState = state.get('arduino');
    const portDefns = PortDefns; /* should depend on arduinoState.hardware */
    const portConfigs = arduinoState.ports;
    let portStates, selectedPort;

    const stepperState = getCurrentStepperState(state);
    if (stepperState) {
        portStates = stepperState.ports;
        selectedPort = stepperState.selectedPort;
    }

    return {portConfigs, portDefns, portStates, selectedPort};
}

interface ArduinoPanelDispatchToProps {
    dispatch: Function
}

interface ArduinoPanelProps extends ArduinoPanelStateToProps, ArduinoPanelDispatchToProps {
    preventInput: any
}

class _ArduinoPanel extends React.PureComponent<ArduinoPanelProps> {
    render() {
        const {portConfigs, portDefns, portStates, selectedPort, preventInput, dispatch} = this.props;

        if (!portStates) {
            return (
                <form>
                    <div className='arduino-ports'>
                        {portDefns.map((defn, index) =>
                            <PortConfig
                                key={index}
                                index={index}
                                defn={defn}
                                config={portConfigs[index]}
                                dispatch={dispatch}
                                preventInput={preventInput}
                            />
                        )}
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
                            <PortDisplay
                                key={index}
                                index={index}
                                defn={defn}
                                config={config}
                                state={state}
                                selected={selectedPort === index}
                                dispatch={dispatch}
                                preventInput={preventInput}
                            />
                        );
                    })}
                </div>
                {selectedPort !== undefined &&
                    <SelectedPortPanel
                        index={selectedPort}
                        dispatch={dispatch}
                        preventInput={preventInput}
                        state={portStates[selectedPort]}
                    />
                }
            </form>
        );
    };
}

const PortDefns = range(0, NPorts - 1).map(index => {
    const label = index.toString();
    const analog = index >= 14 && index <= 19 ? `A${index - 14}` : false;
    let digital = null;
    if (index <= 7) {
        digital = `PD${index}`;
    } else if (index <= 13) {
        digital = `PB${index - 8}`;
    } else if (index <= 19) {
        digital = `PC${index - 14}`;
    }

    return {index, label, digital, analog};
});

export const ArduinoPanel = connect(mapStateToProps)(_ArduinoPanel);
