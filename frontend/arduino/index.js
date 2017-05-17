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
import EpicComponent from 'epic-component';
import {Button, FormControl, ControlLabel, FormGroup} from 'react-bootstrap';
import Slider from 'rc-slider';
import range from 'node-range';
import update from 'immutability-helper';
import {call, select} from 'redux-saga/effects';

import './style.scss';

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

  function ArduinoConfigPanelSelector (state, props) {
    const arduinoState = state.get('arduino');
    const portDefns = PortDefns; /* should depend on arduinoState.hardware */
    return {state: arduinoState, portDefns};
  }

  bundle.defineView('ArduinoConfigPanel', ArduinoConfigPanelSelector, EpicComponent(self => {

    self.render = function () {
      const {portDefns, state, dispatch} = self.props;
      return (
        <form>
          <div className='arduino-ports'>
            {portDefns.map((defn, index) =>
              <PortConfig key={index} index={index} defn={defn} state={state.ports[index]} dispatch={dispatch}/>)}
          </div>
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
      const {defn, state} = self.props;
      const {peripheral} = state;
      return (
        <div className='arduino-port'>
          <PortHeader defn={defn}/>
          <div className='arduino-port-periph'>
            <PeripheralConfig defn={defn} value={peripheral} onChange={onChangePeripheral} />
          </div>
        </div>
      );
    };
  });

  function ArduinoPanelSelector (state, props) {
    const stepperState = deps.getStepperDisplay(state);
    const portStates = stepperState.ports;
    const arduinoState = state.get('arduino');
    const portConfigs = arduinoState.ports;
    const portDefns = PortDefns; /* should depend on arduinoState.hardware */
    return {portStates, portConfigs, portDefns};
  }

  bundle.defineView('ArduinoPanel', ArduinoPanelSelector, EpicComponent(self => {

    self.render = function () {
      const {portStates, portConfigs, portDefns, dispatch} = self.props;
      return (
        <form>
          <div className='arduino-ports'>
            {portDefns.map(function (defn, index) {
              const config = portConfigs[index];
              const state = portStates[index];
              return (
                <PortDisplay key={index} index={index} defn={defn} config={config} state={state} dispatch={dispatch}/>
              );
            })}
          </div>
        </form>
      );
    };

  }));

  const PortDisplay = EpicComponent(self => {
    function onChange (changes) {
      const {index} = self.props;
      console.log('onChange', index, changes);
      self.props.dispatch({type: deps.arduinoPortChanged, index, changes});
    }
    function onButtonToggle () {
      const input = 1 ^ self.props.state.input;
      onChange({input: {$set: input}});
    }
    function onSliderChange () {
    }
    self.render = function () {
      const {index, defn, config, state} = self.props;
      const {peripheral} = config;
      const level = state.dir === 0 ? 'Z' : (state.output === 0 ? '0' : '1');
      return (
        <div className='arduino-port'>
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
            <div>{"TODO"}</div>}
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

  const peripheralTypes = ['none', 'LED', 'button', 'slider'];
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
      const {value, onChange} = self.props;
      const color = nextInArray(ledColors, value.color);
      onChange({color: {$set: color}});
    }
    self.render = function () {
      const {value} = self.props;
      /* peripheral select: none, LED, button, slider */
      return (
        <div className='arduino-peripheral'>
          <div>
            <Button onClick={onSelectNext}>
              <i className="fa fa-angle-right"/>
            </Button>
          </div>
          {value.type === 'none' &&
            <p>none</p>}
          {value.type === 'LED' &&
            <div className="arduino-peri-led" onClick={onSelectNextLedColor}>
              {"LED"}
              <i className="fa fa-circle" style={{color:colorToCss[value.color]}}/>
            </div>}
          {value.type === 'button' &&
            <p>button</p>}
          {value.type === 'slider' &&
            <p>slider</p>}
        </div>
      );
    };
  });

  bundle.defer(function ({recordApi, replayApi, stepperApi}) {

    recordApi.onStart(function* (init) {
      init.arduino = yield select(state => state.get('arduino'));
    });
    replayApi.on('start', function* (context, event, instant) {
      const {arduino} = event[2];
      context.state = arduinoReset(context.state, {state: arduino});
    });

    recordApi.on(deps.arduinoPortConfigured, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.configured', index, changes);
    });
    replayApi.on('arduino.port.configured', function* (context, event, instant) {
      const index = event[2];
      const changes = event[3];
      context.state = arduinoPortConfigured(context.state, {index, changes});
    });

    recordApi.on(deps.arduinoPortChanged, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.changed', index, changes);
    });
    replayApi.on('arduino.port.changed', function* (context, event, instant) {
      const index = event[2];
      const changes = event[3];
      context.state = arduinoPortChanged(context.state, {index, changes});
    });

    stepperApi.onInit(function (stepperState, globalState) {
      stepperState.ports = range(0, NPorts-1).map(function (index) {
        return {dir: 0, output: 0, input: 0};
      });
    });

    stepperApi.addBuiltin('pinMode', function* pinModeBuiltin (context, pin, dir) {
      yield ['pinMode', pin, dir];
    });
    stepperApi.onEffect('pinMode', function* pinModeEffect (context, pin, dir) {
      const port = context.state.ports[pin];
      context.state = update(context.state,
        {ports: {[pin]: {dir: {$set: dir.toInteger()}}}});
    });

    stepperApi.addBuiltin('digitalWrite', function* digitalWriteBuiltin (context, pin, level) {
      yield ['digitalWrite', pin, level];
    });
    stepperApi.onEffect('digitalWrite', function* digitalWriteEffect (context, pin, level) {
      const ports = context.state;
      const port = ports[pin];
      context.state = update(context.state,
        {ports: {[pin]: {output: {$set: level.toInteger()}}}});
    });

    stepperApi.addBuiltin('digitalRead', function* digitalReadBuiltin (context, pin) {
      const level = yield ['digitalRead', pin];
      yield ['result', new C.IntegralValue(C.builtinTypes['int'], level)];
    });
    stepperApi.onEffect('digitalRead', function* digitalReadEffect (context, pin) {
      return context.state.ports[pin].input | 0;
    });

  })

};
