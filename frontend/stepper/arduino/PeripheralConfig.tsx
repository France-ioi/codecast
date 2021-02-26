import React from "react";
import {Button, Icon} from "@blueprintjs/core";
import classnames from 'classnames';
import {ArduinoPortPeripheralType} from "./index";

interface PeripheralConfigProps {
    defn: any,
    value: any,
    readOnly: any,
    onChange: Function
}

const peripheralTypes = [ArduinoPortPeripheralType.None, ArduinoPortPeripheralType.Slider, ArduinoPortPeripheralType.Led, ArduinoPortPeripheralType.Button];
const ledColors = ['red', 'amber', 'yellow', 'green', 'blue', 'white'];
const peripheralDefault = {
    none: {type: ArduinoPortPeripheralType.None},
    LED: {type: ArduinoPortPeripheralType.Led, color: ledColors[0]},
    button: {type: ArduinoPortPeripheralType.Button},
    slider: {type: ArduinoPortPeripheralType.Slider}
};

export class PeripheralConfig extends React.PureComponent<PeripheralConfigProps> {
    onSelectNext = () => {
        const {defn, value, onChange} = this.props;
        let type = value.type;
        do {
            type = nextInArray(peripheralTypes, type);
        } while (!peripheralTypeAvailable(defn, type) && type !== value.type);
        onChange({$set: peripheralDefault[type]});
    };
    onSelectNextLedColor = () => {
        const {value, onChange, readOnly} = this.props;
        if (!readOnly) {
            const color = nextInArray(ledColors, value.color);
            onChange({color: {$set: color}});
        }
    };

    render() {
        const {value, readOnly} = this.props;
        /* peripheral select: none, LED, button, slider */
        return (
            <div className='arduino-peripheral'>
                <div>
                    <Button onClick={this.onSelectNext} disabled={readOnly} icon='chevron-right'/>
                </div>
                {value.type === 'none' &&
                <p>{"—"}</p>}
                {value.type === 'LED' &&
                <div className={classnames(['arduino-peri-led', readOnly || 'clickable'])}
                     onClick={this.onSelectNextLedColor}>
                    {"LED"}
                    <Icon icon='full-circle' style={{color: colorToCss[value.color]}}/>
                </div>}
                {value.type === 'button' &&
                <p>{"BTN"}</p>}
                {value.type === 'slider' &&
                <p>{"POT"}</p>}
            </div>
        );
    };
}

function nextInArray(array, key) {
    let index = array.indexOf(key);
    if (index === -1 || index === array.length - 1) {
        index = 0;
    } else {
        index = index + 1;
    }
    return array[index];
}

function peripheralTypeAvailable(defn, type) {
    if (type === 'slider') {
        return !!defn.analog;
    }
    return true;
}

const colorToCss = {
    red: '#f40',
    amber: '#fa4',
    yellow: '#fe4',
    green: '#4f0',
    blue: '#54f',
    white: '#eef',
};
