/*

Constants (until microcontroller hardware is configurable):
- PortDefns[portNumber] → {index, label, digital, analog}

In the global state:
- globalState.get('arduino').ports[portNumber] →
    {peripheral: {type, …}}

In the stepper state:
- stepperState.ports[portNumber] →
    {direction, output, input}

*/

import React from 'react';
import PropTypes from 'prop-types';
import {Button, FormControl, ControlLabel, FormGroup} from 'react-bootstrap';
import classnames from 'classnames';
import range from 'node-range';
import update from 'immutability-helper';
import {call, select, put} from 'redux-saga/effects';
import * as C from 'persistent-c';

import './style.scss';

const PINMODE_INPUT = 0;
const PINMODE_OUTPUT = 1;
const PINMODE_INPUT_PULLUP = 2;

export default function (bundle, deps) {

  bundle.use('getStepperDisplay');

  const NPorts = 20;
  const PortDefns = range(0,NPorts-1).map(index => {
    const label = index.toString();
    const analog = index >= 14 && index <= 19 ? `A${index - 14}` : false;
    let digital = false;
    if (index <= 7) digital = `PD${index}`;
    else if (index <= 13) digital = `PB${index - 8}`;
    else if (index <= 19) digital = `PC${index - 14}`;
    return {index, label, digital, analog};
  });

  const initialArduinoState = {
    hardware: 'atmega328p',
    ports: range(0,NPorts-1).map(_ => {
      return {peripheral: {type: 'none'}};
    })
  };

  bundle.addReducer('init', function (state, _action) {
    return arduinoReset(state, {state: initialArduinoState});
  });

  bundle.defineAction('arduinoReset', 'Arduino.Reset');
  bundle.addReducer('arduinoReset', arduinoReset);
  function arduinoReset (state, action) {
    return state.set('arduino', action.state);
  }

  bundle.defineAction('arduinoPortConfigured', 'Arduino.Port.Configured');
  bundle.addReducer('arduinoPortConfigured', arduinoPortConfigured);
  function arduinoPortConfigured (state, action) {
    const {index, changes} = action;
    return state.update('arduino', arduino =>
      update(arduino, {ports: {[index]: changes}}));
  }

  bundle.defineAction('arduinoPortChanged', 'Arduino.Port.Changed');
  bundle.addReducer('arduinoPortChanged', arduinoPortChanged)
  function arduinoPortChanged (state, action) {
    const {index, changes} = action;
    return state.updateIn(['stepper', 'current'], stepper =>
      update(stepper, {ports: {[index]: changes}}));
  }

  bundle.defineAction('arduinoPortSelected', 'Arduino.Port.Selected');
  bundle.addReducer('arduinoPortSelected', arduinoPortSelected)
  function arduinoPortSelected (state, action) {
    const {index} = action;
    return state.updateIn(['stepper', 'current'], stepper =>
      update(stepper, {selectedPort: {$set: index}}));
  }

  function ArduinoPanelSelector (state, props) {
    const arduinoState = state.get('arduino');
    const portDefns = PortDefns; /* should depend on arduinoState.hardware */
    const portConfigs = arduinoState.ports;
    let portStates, selectedPort;
    const stepperState = deps.getStepperDisplay(state);
    if (stepperState) {
      portStates = stepperState.ports;
      selectedPort = stepperState.selectedPort;
    }
    return {portConfigs, portDefns, portStates, selectedPort};
  }

  class ArduinoPanel extends React.PureComponent {

    render () {
      const {portConfigs, portDefns, portStates, selectedPort, preventInput, dispatch} = this.props;
      if (!portStates) {
        return (
          <form>
            <div className='arduino-ports'>
              {portDefns.map((defn, index) =>
                <PortConfig key={index} index={index} defn={defn} config={portConfigs[index]}
                  dispatch={dispatch} preventInput={preventInput} />)}
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
                  dispatch={dispatch} preventInput={preventInput} />
              );
            })}
          </div>
          {selectedPort !== undefined && <SelectedPortPanel index={selectedPort} dispatch={dispatch} preventInput={preventInput}
            defn={portDefns[selectedPort]} config={portConfigs[selectedPort]} state={portStates[selectedPort]} />}
        </form>
      );
    };

  }
  bundle.defineView('ArduinoPanel', ArduinoPanelSelector, ArduinoPanel);

  class PortConfig extends React.PureComponent {
    onChange = (changes) => {
      const {dispatch, index} = this.props;
      dispatch({type: deps.arduinoPortConfigured, index, changes});
    };
    onChangePeripheral = (changes) => {
      this.onChange({peripheral: changes});
    };
    render () {
      const {defn, config, preventInput} = this.props;
      const {peripheral} = config;
      return (
        <div className='arduino-port'>
          <PortHeader defn={defn}/>
          <div className='arduino-port-periph'>
            <PeripheralConfig defn={defn} value={peripheral} onChange={this.onChangePeripheral}
              readOnly={preventInput} />
          </div>
        </div>
      );
    }
  }

  class PortDisplay extends React.PureComponent {
    onChange = (changes) => {
      const {index, preventInput} = this.props;
      if (!preventInput) {
        this.props.dispatch({type: deps.arduinoPortChanged, index, changes});
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
          type: deps.arduinoPortSelected,
          index: selected ? undefined : index
        });
      }
    };
    render = () => {
      const {index, defn, config, state, selected} = this.props;
      const {peripheral} = config;
      const level = state.direction === PINMODE_INPUT
        ? (state.output === 1 ? <strong>{'Z'}</strong> : 'Z')
        : (state.output === 0 ? '0' : '1');
      return (
        <div className={classnames(['arduino-port', selected && 'arduino-port-selected'])}>
          <PortHeader defn={defn} brief/>
          <div className='arduino-port-level'>{level}</div>
          {peripheral.type === 'LED' &&
            <div className="arduino-peri-led" style={{color:colorToCss[peripheral.color]}}>
              {state.output === 0
                ? <i className="fa fa-circle-thin"/>
                : <i className="fa fa-circle"/>}
            </div>}
          {peripheral.type === 'button' &&
            <div className="arduino-peri-button clickable" onClick={this.onButtonToggle}>
              {state.input === 0
                ? <i className="fa fa-caret-down"/>
                : <i className="fa fa-caret-up"/>}
            </div>}
          {peripheral.type === 'slider' &&
            <div className="arduino-slider" onClick={this.onSelect}>
              {Math.round(state.input * 1023)}
            </div>}
        </div>
      );
    };
  }

  class PortHeader extends React.PureComponent {
    render () {
      const {defn, brief} = this.props;
      const {label, digital, analog} = defn;
      return (
        <div className='arduino-port-header' style={{minHeight: brief ? '21px' : '63px'}}>
          <span className='arduino-port-index'>{label}</span>
          {!brief && digital && <span className='arduino-port-digital'>{digital}</span>}
          {!brief && analog && <span className='arduino-port-analog'>{analog}</span>}
        </div>
      );
    };
  }

  const peripheralTypes = ['none', 'slider', 'LED', 'button'];
  const ledColors = ['red', 'amber', 'yellow', 'green', 'blue', 'white'];
  const peripheralDefault = {
    none: {type: 'none'},
    LED: {type: 'LED', color: ledColors[0]},
    button: {type: 'button'},
    slider: {type: 'slider'}
  };
  const colorToCss = {
    red: '#f40',
    amber: '#fa4',
    yellow: '#fe4',
    green: '#4f0',
    blue: '#54f',
    white: '#eef',
  };
  function nextInArray (array, key) {
    let index = array.indexOf(key);
    if (index === -1 || index === array.length - 1) {
      index = 0;
    } else {
      index = index + 1;
    }
    return array[index];
  }
  function peripheralTypeAvailable (defn, type) {
    if (type === 'slider') {
      return !!defn.analog;
    }
    return true;
  }
  class PeripheralConfig extends React.PureComponent {
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
    render () {
      const {value, readOnly} = this.props;
      /* peripheral select: none, LED, button, slider */
      return (
        <div className='arduino-peripheral'>
          <div>
            <Button onClick={this.onSelectNext} disabled={readOnly} >
              <i className="fa fa-angle-right"/>
            </Button>
          </div>
          {value.type === 'none' &&
            <p>{"—"}</p>}
          {value.type === 'LED' &&
            <div className={classnames(['arduino-peri-led', readOnly || 'clickable'])} onClick={this.onSelectNextLedColor}>
              {"LED"}
              <i className='fa fa-circle' style={{color: colorToCss[value.color]}}/>
            </div>}
          {value.type === 'button' &&
            <p>{"BTN"}</p>}
          {value.type === 'slider' &&
            <p>{"POT"}</p>}
        </div>
      );
    };
  }

  class SelectedPortPanel extends React.PureComponent {
    onChange = (changes) => {
      const {index, preventInput} = this.props;
      if (!preventInput) {
        this.props.dispatch({type: deps.arduinoPortChanged, index, changes});
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
    render () {
      const {index, state} = this.props;
      return (
        <div className='arduino-port-panel'>
          <p>{"Port "}{index}</p>
          {state.peripheral.type === 'slider' && this.renderSlider()}
        </div>
      );
    };
  }

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    recordApi.onStart(function* (init) {
      const {mode} = yield select(state => state.get('options'));
      if (mode === 'arduino') {
        init.arduino = yield select(state => state.get('arduino'));
      }
    });
    replayApi.on('start', function (replayContext, event, instant) {
      const {arduino} = event[2];
      if (arduino) {
        replayContext.state = arduinoReset(replayContext.state, {state: arduino});
      }
    });
    replayApi.onReset(function* (instant) {
      const arduinoState = instant.state.get('arduino');
      if (arduinoState) {
        yield put({type: deps.arduinoReset, state: arduinoState});
      }
    });

    recordApi.on(deps.arduinoPortConfigured, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.configured', index, changes);
    });
    replayApi.on('arduino.port.configured', function (replayContext, event, instant) {
      const index = event[2];
      const changes = event[3];
      replayContext.state = arduinoPortConfigured(replayContext.state, {index, changes});
    });

    recordApi.on(deps.arduinoPortChanged, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.changed', index, changes);
    });
    replayApi.on('arduino.port.changed', function (replayContext, event, instant) {
      const index = event[2];
      const changes = event[3];
      replayContext.state = arduinoPortChanged(replayContext.state, {index, changes});
    });

    recordApi.on(deps.arduinoPortSelected, function* (addEvent, action) {
      const {index} = action;
      yield call(addEvent, 'arduino.port.selected', index);
    });
    replayApi.on('arduino.port.selected', function (replayContext, event, instant) {
      const index = event[2];
      replayContext.state = arduinoPortSelected(replayContext.state, {index});
    });

    stepperApi.onInit(function (stepperState, globalState) {
      const arduinoState = globalState.get('arduino');
      if (arduinoState) {
        stepperState.ports = range(0, NPorts-1).map(function (index) {
          /* Copy peripheral config on stepper init. */
          const {peripheral} = arduinoState.ports[index];
          return {direction: 0, output: 0, input: 0, peripheral};
        });
        stepperState.serial = {speed: false};
      }
    });

    stepperApi.addBuiltin('pinMode', function* pinModeBuiltin (stepperContext, pin, mode) {
      yield ['pinMode', pin.toInteger(), mode.toInteger()];
    });
    stepperApi.onEffect('pinMode', function* pinModeEffect (stepperContext, pin, mode) {
      let {direction, output} = stepperContext.state.ports[pin];
      switch (mode) {
        case PINMODE_INPUT:
          direction = 0;
          break;
        case PINMODE_OUTPUT:
          direction = 1;
          break;
        case PINMODE_INPUT_PULLUP:
          direction = 0;
          output = 1;
          break;
      }
      stepperContext.state = update(stepperContext.state,
        {ports: {[pin]: {
          direction: {$set: direction},
          output: {$set: output}
        }}});
    });

    stepperApi.addBuiltin('digitalWrite', function* digitalWriteBuiltin (stepperContext, pin, level) {
      yield ['digitalWrite', pin.toInteger(), level.toInteger()];
    });
    stepperApi.onEffect('digitalWrite', function* digitalWriteEffect (stepperContext, pin, level) {
      const port = stepperContext.state.ports[pin];
      stepperContext.state = update(stepperContext.state,
        {ports: {[pin]: {
          output: {$set: level}
        }}});
    });

    stepperApi.addBuiltin('digitalRead', function* digitalReadBuiltin (stepperContext, pin) {
      const level = yield ['digitalRead', pin.toInteger()];
      yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
    });
    stepperApi.onEffect('digitalRead', function* digitalReadEffect (stepperContext, pin) {
      const port = stepperContext.state.ports[pin];
      if (port.direction === 1) {
        /* Pin configured as output, read driver level. */
        return port.output;
      }
      /* TODO: read peripheral */
      return (stepperContext.state.ports[pin].input >= 0.8) ? 1 : 0;
    });

    stepperApi.addBuiltin('analogRead', function* analogReadBuiltin (stepperContext, pin) {
      const level = yield ['analogRead', pin.toInteger()];
      yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
    });
    stepperApi.onEffect('analogRead', function* analogReadEffect (stepperContext, pin) {
      const port = stepperContext.state.ports[pin];
      if (port.direction === 1) {
        /* Pin configured as output, read 0. */
        return 0;
      }
      if (port.peripheral.type === 'slider') {
        return Math.round(port.input * 1023);
      }
      /* Assume no peripheral connected, read pull-up. */
      return (port.output === 1 ? 1023 : 0);
    });

    stepperApi.addBuiltin('Serial_begin', function* (stepperContext, speed) {
      yield ['serialBegin', speed.toInteger()];
    });
    stepperApi.onEffect('serialBegin', function* (stepperContext, speed) {
      stepperContext.state = update(stepperContext.state,
        {serial: {speed: {$set: speed}}});
    });

    stepperApi.addBuiltin('Serial_print', function* (stepperContext, value, base) {
      const str = stringifyValue(stepperContext.state.core, value, base);
      if (stepperContext.state.serial.speed) {
        yield ['write', str];
      }
    });

    stepperApi.addBuiltin('Serial_println', function* (stepperContext, value, base) {
      const str = stringifyValue(stepperContext.state.core, value, base) + '\n';
      if (stepperContext.state.serial.speed) {
        yield ['write', str];
      }
    });

    stepperApi.addBuiltin('Serial_write', function* (stepperContext, value) {
      if (stepperContext.state.serial.speed) {
        yield ['write', String.fromCharCode(value.toInteger())];
      }
    });

  })

};

function stringifyValue (core, value, base) {
  if (!value) {
    return '';
  }
  let str;
  switch (value.type.kind) {
  case 'pointer':
    str = C.readString(core.memory, value);
    break;
  case 'builtin':
    switch (value.type.repr) {
      case 'char':
        str = String.fromCharCode(value.number)
        break;
      case 'unsigned char':
      case 'unsigned short':
      case 'unsigned int':
      case 'unsigned long':
        str = value.toInteger().toString(base.toInteger());
        break;
      case 'int': case 'short': case 'long': {
        let intVal = value.toInteger();
        if (intVal < 0) {
          intVal = - intVal;
          str = '-';
        } else {
          str = '';
        }
        str = str + intVal.toString(base.toInteger());
        break;
      }
      case 'double': case 'float': default:
        str = value.toString();
        break;
    }
    break;
  default:
    console.log('handle type', value.type.kind);
    str = value.toString();
  }
  return str;
}
