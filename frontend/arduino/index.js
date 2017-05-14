
import React from 'react';
import EpicComponent from 'epic-component';
import {Button, FormControl, ControlLabel, FormGroup} from 'react-bootstrap';
import Slider from 'rc-slider';
import Immutable from 'immutable';
import range from 'node-range';
import update from 'immutability-helper';

import './style.scss';

export default function (bundle, deps) {

  bundle.use('getStepperDisplay');

  bundle.defineAction('arduinoConfigured', 'Arduino.Configured');
  bundle.defineAction('arduinoPortChanged', 'Arduino.Port.Changed');

  bundle.addReducer('init', function (state, action) {
    return state.setIn(['arduino', 'ports'], Immutable.List(range(0,19).map(index => {
      const analog = index >= 14 && index <= 19 ? `A${index - 14}` : false;
      let digital = false;
      if (index <= 7) digital = `PD${index}`;
      else if (index <= 13) digital = `PB${index - 8}`;
      else if (index <= 19) digital = `PC${index - 14}`;
      const peripheral = {type: 'none'};
      return {index, digital, analog, peripheral};
    })));
  });

  bundle.addReducer('arduinoConfigured', function (state, action) {
    const {dump} = action;
    return state.setIn(['arduino', 'ports'], Immutable.List(dump.ports));
  });

  bundle.addReducer('arduinoPortChanged', arduinoPortChanged);
  function arduinoPortChanged (state, action) {
    const {index, changes} = action;
    const oldValue = state.getIn(['arduino', 'ports', index]);
    return state.setIn(['arduino', 'ports', index], {...oldValue, ...changes, changed: true});
  }

  bundle.defineView('ArduinoPanel', ArduinoPanelSelector, EpicComponent(self => {

    self.render = function () {
      const {ports, dispatch} = self.props;
      return (
        <form>
          <div className='arduino-ports'>
            {ports.toArray().map(function (config) {
              const {index} = config;
              const state = self.props.state[index];
              return (
                <PortDisplay key={index} index={index} config={config} state={state} dispatch={dispatch}/>
              );
            })}
          </div>
        </form>
      );
    };

  }));

  function ArduinoPanelSelector (state, props) {
    const stepper = deps.getStepperDisplay(state);
    const ports = state.getIn(['arduino', 'ports']);
    return {ports, state: stepper.ports};
  }

  const PortDisplay = EpicComponent(self => {
    function onButtonToggle () {
      /* XXX */
    }
    function onSliderChange () {
    }
    self.render = function () {
      const {index, config, state} = self.props;
      const {peripheral} = config;
      return (
        <div className='arduino-port'>
          <PortHeader index={index} port={config} brief/>
          {peripheral.type === 'LED' &&
            <div className="arduino-peri-led" style={{color:colorToCss[peripheral.color]}}>
              {state.output === 0
                ? <i className="fa fa-circle-thin"/>
                : <i className="fa fa-circle"/>}
            </div>}
          {peripheral.type === 'button' &&
            <div className="arduino-peri-button">
              <i className="fa fa-caret-down" onClick={onButtonToggle}/>
            </div>}
          {peripheral.type === 'slider' &&
            <div>{"TODO"}</div>}
        </div>
      );
    };
  });

  bundle.defineView('ArduinoConfigPanel', ArduinoConfigPanelSelector, EpicComponent(self => {

    self.render = function () {
      const {ports, dispatch} = self.props;
      return (
        <form>
          <div className='arduino-ports'>
            {ports.toArray().map(port =>
              <PortConfig key={port.index} index={port.index} port={port} dispatch={dispatch}/>)}
          </div>
        </form>
      );
    };

  }));

  function ArduinoConfigPanelSelector (state, props) {
    const ports = state.getIn(['arduino', 'ports']);
    return {ports};
  }

  const PortConfig = EpicComponent(self => {
    function onChange (changes) {
      const {dispatch, index} = self.props;
      dispatch({type: deps.arduinoPortChanged, index, changes});
    }
    function onChangePeripheral (peripheral) {
      onChange({peripheral});
    }
    self.render = function () {
      const {index, port} = self.props;
      const {peripheral} = port;
      return (
        <div className='arduino-port'>
          <PortHeader index={index} port={port}/>
          <div className='arduino-port-periph'>
            <PeripheralConfig onChange={onChangePeripheral} port={port} value={peripheral} />
          </div>
        </div>
      );
    };
  });

  const PortHeader = EpicComponent(self => {
    self.render = function () {
      const {port, index, brief} = self.props;
      const {digital, analog} = port;
      return (
        <div className='arduino-port-header' style={{minHeight: brief ? '21px' : '63px'}}>
          <span className='arduino-port-index'>{index}</span>
          {!brief && digital && <span className='arduino-port-digital'>{digital}</span>}
          {!brief && analog && <span className='arduino-port-analog'>{analog}</span>}
        </div>
      );
    }
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
  function peripheralTypeAvailable (port, type) {
    if (type === 'slider') {
      return !!port.analog;
    }
    return true;
  }
  const PeripheralConfig = EpicComponent(self => {
    function onSelectNext () {
      const {port, value, onChange} = self.props;
      let type = value.type;
      do {
        type = nextInArray(peripheralTypes, type);
      } while (!peripheralTypeAvailable(port, type) && type !== value.type);
      onChange(peripheralDefault[type]);
    }
    function onSelectNextLedColor () {
      const {value, onChange} = self.props;
      const color = nextInArray(ledColors, value.color);
      onChange({...value, color});
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

    recordApi.on(deps.arduinoPortChanged, function* (addEvent, action) {
      const {index, changes} = action;
      yield call(addEvent, 'arduino.port.changed', index, changes);
    });
    replayApi.on('arduino.port.changed', function (context, event, instant) {
      const index = event[2];
      const changes = event[3];
      context.state = context.state.update('arduino', st => arduinoPortChanged(st, {index, changes}));
    });

    /* TODO: record user interaction w/ arduino peripherals */
    replayApi.on('arduino.port.event', function (context, event, instant) {
    });

    stepperApi.addOptions(function (options, state) {
      const ports = state.getIn(['arduino', 'ports']).toArray().map(function (port) {
        const {index} = port;
        return {index, dir: 0, input: 0, output: 0, pullUp: false};
      });
      options.arduino = {ports};
    });

    stepperApi.onInit(function (state) {
      const {options} = state;
      state.ports = options.arduino.ports;
    });

    stepperApi.addBuiltin('pinMode', function* pinModeBuiltin (context, pin, dir) {
      yield ['pinMode', pin, dir];
    });
    stepperApi.onEffect('pinMode', function* pinModeEffect (context, pin, dir) {
      const port = context.state.ports[pin];
      context.state.ports[pin] = {...port, dir: dir.toInteger()};
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
      return context.state.ports[pin].input;
    });

    // TODO: analogRead

  })

};
