import React, {useEffect, useRef, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBackspace} from "@fortawesome/free-solid-svg-icons";
import {faCheckCircle} from "@fortawesome/free-solid-svg-icons";

export interface NumericKeypadOptions {
    minimum?: number,
    maximum?: number,
    precision?: number,
}

export interface NumericKeypadProps {
    initialValue: string,
    position: any,
    callbackModify: Function,
    callbackFinished: Function,
    options: NumericKeypadOptions,
}

export function NumericKeypad(props: NumericKeypadProps) {
    console.log('keypad options', props.options);
    const [keypadValue, setKeypadValue] = useState('0');
    const keypadInputRef = useRef<HTMLInputElement>();

    const onKeypadKeyDown = (e) => {
        let btn = null;
        if (e.key && /^\d$/.test(e.key)) {
            btn = e.key;
        } else if (e.key == 'Backspace' || e.keyCode == 8) {
            btn = 'R';
        } else if (e.key == 'Enter' || e.keyCode == 13) {
            btn = 'V';
        } else if (e.key == 'Escape' || e.keyCode == 27) {
            btn = 'C';
        } else if (e.key == '.' || e.key == ',' || e.keyCode == 110 || e.keyCode == 188 || e.keyCode == 190) {
            btn = '.';
        } else if (e.key == '-' || e.keyCode == 54 || e.keyCode == 109) {
            btn = '-';
        } else if (e.keyCode >= 96 && e.keyCode <= 105) {
            btn = '' + (e.keyCode - 96);
        }
        e.preventDefault();
        if (null !== btn) {
            handleKeypadKey(btn);
        }
    };

    const handleKeypadKey = (btn) => {
        let newValue = keypadValue;
        let finished = false;
        if (btn == 'R') {
            newValue = newValue.substring(0, newValue.length - 1);
            if (newValue == '' || newValue == '-') {
                newValue = '0';
            }
        } else if (btn == 'C') {
            newValue = props.initialValue;
            finished = true;
        } else if (btn == 'V') {
            if (newValue == '') {
                newValue = '0';
            }
            finished = true;
        } else if (btn == '0') {
            newValue += '0';
        } else if (btn == '-') {
            if (newValue == '') {
                newValue = '0';
            }
            if (newValue[0] == '-') {
                newValue = newValue.substring(1);
            } else {
                newValue = '-' + newValue;
            }
        } else if (btn == '.') {
            if (newValue == '') {
                newValue = '0';
            }
            if (newValue.indexOf('.') == -1) {
                newValue += '.';
            }
        } else if (btn) {
            newValue += btn;
        }

        while (newValue.length > 1 && newValue.substring(0, 1) == '0' && newValue.substring(0, 2) != '0.') {
            newValue = newValue.substring(1);
        }
        while (newValue.length > 2 && newValue.substring(0, 2) == '-0' && newValue.substring(0, 3) != '-0.') {
            newValue = '-' + newValue.substring(2);
        }

        if (newValue.length > 16) {
            newValue = newValue.substring(0, 16);
        }
        
        const displayValue = newValue == '' ? '0' : newValue;
        setKeypadValue(displayValue);

        if (finished) {
            const finalValue = newValue == '' ? props.initialValue : newValue;
            props.callbackFinished(parseFloat(finalValue), true);
            return;
        } else {
            props.callbackModify(parseFloat(newValue || "0"));
        }

        keypadInputRef.current.focus();
    };

    useEffect(() => {
        keypadInputRef.current.focus();
    });

    return (
        <div className="keypad">
            <div className="keypad-row">
                <input
                    ref={keypadInputRef}
                    inputMode="none"
                    className={`keypad-value ${keypadValue && keypadValue.length > 12 ? 'keypad-value-small' : ''}`}
                    value={keypadValue}
                    onKeyDown={onKeypadKeyDown}
                    onChange={() => {}}
                />
            </div>
            <div className="keypad-row keypad-row-margin">
                <div className="keypad-btn" onClick={() => handleKeypadKey("1")}>1</div>
                <div className="keypad-btn" onClick={() => handleKeypadKey("2")}>2</div>
                <div className="keypad-btn" onClick={() => handleKeypadKey("3")}>3</div>
            </div>
            <div className="keypad-row">
                <div className="keypad-btn" onClick={() => handleKeypadKey("4")}>4</div>
                <div className="keypad-btn" onClick={() => handleKeypadKey("5")}>5</div>
                <div className="keypad-btn" onClick={() => handleKeypadKey("6")}>6</div>
            </div>
            <div className="keypad-row">
                <div className="keypad-btn" onClick={() => handleKeypadKey("7")}>7</div>
                <div className="keypad-btn" onClick={() => handleKeypadKey("8")}>8</div>
                <div className="keypad-btn" onClick={() => handleKeypadKey("9")}>9</div>
            </div>
            <div className="keypad-row">
                <div className="keypad-btn" onClick={() => handleKeypadKey("0")}>0</div>
                {props.options.precision !== 1 && <div className="keypad-btn" onClick={() => handleKeypadKey(".")}>.</div>}
                {props.options.minimum < 0 && <div className="keypad-btn" onClick={() => handleKeypadKey("-")}>+/-</div>}
            </div>
            <div className="keypad-row keypad-row-margin">
                <div className="keypad-btn keypad-btn-r" onClick={() => handleKeypadKey("R")}>
                    <FontAwesomeIcon icon={faBackspace}/>
                </div>
                <div className="keypad-btn keypad-btn-v" onClick={() => handleKeypadKey("V")}>
                    <FontAwesomeIcon icon={faCheckCircle}/>
                </div>
            </div>
        </div>
    );
}
