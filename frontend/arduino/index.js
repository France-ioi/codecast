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
import EpicComponent from 'epic-component';
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

  bundle.addReducer('init', function (state, action) {
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

  bundle.defineView('ArduinoPanel', ArduinoPanelSelector, EpicComponent(self => {

    self.render = function () {
      const {portConfigs, portDefns, portStates, selectedPort, preventInput, dispatch} = self.props;
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

  }));

  const PortConfig = EpicComponent(self => {
    function onChange (changes) {
      const {dispatch, index} = self.props;
      dispatch({type: deps.arduinoPortConfigured, index, changes});
    }
    function onChangePeripheral (changes) {
      onChange({peripheral: changes});
    }
    self.render = function () {
      const {defn, config, preventInput} = self.props;
      const {peripheral} = config;
      return (
        <div className='arduino-port'>
          <PortHeader defn={defn}/>
          <div className='arduino-port-periph'>
            <PeripheralConfig defn={defn} value={peripheral} onChange={onChangePeripheral}
              readOnly={preventInput} />
          </div>
        </div>
      );
    };
  });

  const PortDisplay = EpicComponent(self => {
    function onChange (changes) {
      const {index, preventInput} = self.props;
      if (!preventInput) {
        self.props.dispatch({type: deps.arduinoPortChanged, index, changes});
      }
    }
    function onButtonToggle () {
      const input = 1 ^ self.props.state.input;
      onChange({input: {$set: input}});
    }
    function onSelect () {
      let {index, preventInput, selected} = self.props;
      if (!preventInput) {
        self.props.dispatch({
          type: deps.arduinoPortSelected,
          index: selected ? undefined : index
        });
      }
    }
    self.render = function () {
      const {index, defn, config, state, selected} = self.props;
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
            <div className="arduino-peri-button clickable" onClick={onButtonToggle}>
              {state.input === 0
                ? <i className="fa fa-caret-down"/>
                : <i className="fa fa-caret-up"/>}
            </div>}
          {peripheral.type === 'slider' &&
            <div className="arduino-slider" onClick={onSelect}>
              {Math.round(state.input * 1023)}
            </div>}
        </div>
      );
    };
  });

  const PortHeader = EpicComponent(self => {
    self.render = function () {
      const {defn, brief} = self.props;
      const {label, digital, analog} = defn;
      return (
        <div className='arduino-port-header' style={{minHeight: brief ? '21px' : '63px'}}>
          <span className='arduino-port-index'>{label}</span>
          {!brief && digital && <span className='arduino-port-digital'>{digital}</span>}
          {!brief && analog && <span className='arduino-port-analog'>{analog}</span>}
        </div>
      );
    };
  });

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
  const PeripheralConfig = EpicComponent(self => {
    function onSelectNext () {
      const {defn, value, onChange} = self.props;
      let type = value.type;
      do {
        type = nextInArray(peripheralTypes, type);
      } while (!peripheralTypeAvailable(defn, type) && type !== value.type);
      onChange({$set: peripheralDefault[type]});
    }
    function onSelectNextLedColor () {
      const {value, onChange, readOnly} = self.props;
      if (!readOnly) {
        const color = nextInArray(ledColors, value.color);
        onChange({color: {$set: color}});
      }
    }
    self.render = function () {
      const {value, readOnly} = self.props;
      /* peripheral select: none, LED, button, slider */
      return (
        <div className='arduino-peripheral'>
          <div>
            <Button onClick={onSelectNext} disabled={readOnly} >
              <i className="fa fa-angle-right"/>
            </Button>
          </div>
          {value.type === 'none' &&
            <p>—</p>}
          {value.type === 'LED' &&
            <div className={classnames(['arduino-peri-led', readOnly || 'clickable'])} onClick={onSelectNextLedColor}>
              {"LED"}
              <i className='fa fa-circle' style={{color:colorToCss[value.color]}}/>
            </div>}
          {value.type === 'button' &&
            <p>{"BTN"}</p>}
          {value.type === 'slider' &&
            <p>{"POT"}</p>}
        </div>
      );
    };
  });

  const SelectedPortPanel = EpicComponent(self => {
    function onChange (changes) {
      const {index, preventInput} = self.props;
      if (!preventInput) {
        self.props.dispatch({type: deps.arduinoPortChanged, index, changes});
      }
    }
    function onSliderChanged (event) {
      onChange({input: {$set: event.currentTarget.value / 1023}});
    }
    function renderSlider () {
      const value = Math.round(self.props.state.input * 1023);
      return (
        <div>
          <input type="number" value={value} onChange={onSliderChanged}/>
          <input type="range" value={value} min={0} max={1023} onChange={onSliderChanged}/>
        </div>
      );
    }
    self.render = function () {
      const {index, state} = self.props;
      return (
        <div className="arduino-port-panel">
          <p>Port {index}</p>
          {state.peripheral.type === 'slider' && renderSlider()}
        </div>
      );
    };
  });


  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    recordApi.onStart(function* (init) {
      init.arduino = yield select(state => state.get('arduino'));
    });
    replayApi.on('start', function (context, event, instant) {
      const {arduino} = event[2];
      context.state = arduinoReset(context.state, {state: arduino});
    });
    replayApi.onReset(function* (instant) {
      const arduinoState = instant.state.get('arduino');
      yield put({type: deps.arduinoReset, state: arduinoState});
    });

    recordApi.on(deps.arduinoPortConfigured, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.configured', index, changes);
    });
    replayApi.on('arduino.port.configured', function (context, event, instant) {
      const index = event[2];
      const changes = event[3];
      context.state = arduinoPortConfigured(context.state, {index, changes});
    });

    recordApi.on(deps.arduinoPortChanged, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.changed', index, changes);
    });
    replayApi.on('arduino.port.changed', function (context, event, instant) {
      const index = event[2];
      const changes = event[3];
      context.state = arduinoPortChanged(context.state, {index, changes});
    });

    recordApi.on(deps.arduinoPortSelected, function* (addEvent, action) {
      const {index} = action;
      yield call(addEvent, 'arduino.port.selected', index);
    });
    replayApi.on('arduino.port.selected', function (context, event, instant) {
      const index = event[2];
      context.state = arduinoPortSelected(context.state, {index});
    });

    stepperApi.onInit(function (stepperState, globalState) {
      const arduinoState = globalState.get('arduino');
      stepperState.ports = range(0, NPorts-1).map(function (index) {
        /* Copy peripheral config on stepper init. */
        const {peripheral} = arduinoState.ports[index];
        return {direction: 0, output: 0, input: 0, peripheral};
      });
    });

    stepperApi.addBuiltin('pinMode', function* pinModeBuiltin (context, pin, mode) {
      yield ['pinMode', pin.toInteger(), mode.toInteger()];
    });
    stepperApi.onEffect('pinMode', function* pinModeEffect (context, pin, mode) {
      let {direction, output} = context.state.ports[pin];
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
      context.state = update(context.state,
        {ports: {[pin]: {
          direction: {$set: direction},
          output: {$set: output}
        }}});
    });

    stepperApi.addBuiltin('digitalWrite', function* digitalWriteBuiltin (context, pin, level) {
      yield ['digitalWrite', pin.toInteger(), level.toInteger()];
    });
    stepperApi.onEffect('digitalWrite', function* digitalWriteEffect (context, pin, level) {
      const port = context.state.ports[pin];
      context.state = update(context.state,
        {ports: {[pin]: {
          output: {$set: level}
        }}});
    });

    stepperApi.addBuiltin('digitalRead', function* digitalReadBuiltin (context, pin) {
      const level = yield ['digitalRead', pin.toInteger()];
      yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
    });
    stepperApi.onEffect('digitalRead', function* digitalReadEffect (context, pin) {
      const port = context.state[pin];
      if (port.direction === 1) {
        /* Pin configured as output, read driver level. */
        return port.output;
      }
      /* TODO: read peripheral */
      return (context.state.ports[pin].input >= 0.8) ? 1 : 0;
    });

    stepperApi.addBuiltin('analogRead', function* analogReadBuiltin (context, pin) {
      const level = yield ['analogRead', pin.toInteger()];
      yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
    });
    stepperApi.onEffect('analogRead', function* analogReadEffect (context, pin) {
      const port = context.state.ports[pin];
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

    stepperApi.addBuiltin('Serial_print', function* (context, value, base) {
      const str = stringifyValue(context.state.core, value, base);
      yield ['write', str];
    });

    stepperApi.addBuiltin('Serial_println', function* (context, value, base) {
      const str = stringifyValue(context.state.core, value, base) + '\n';
      yield ['write', str];
    });

    stepperApi.addBuiltin('Serial_write', function* (context, value) {
      yield ['write', String.fromCharCode(value.toInteger())];
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
