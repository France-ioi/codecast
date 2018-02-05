import React from 'react';
import EpicComponent from 'epic-component';
import Select from 'react-select';


export default function (bundle, deps) {

	bundle.use('bufferChangeMode');

	function modePickerSelector (state, props) {
    return;
  }

  bundle.defineView('ModePicker', modePickerSelector, class ModePicker extends React.PureComponent {

    render () {
      const exampleOptions =  [{label : "C++", value: "c_cpp"}, {label : "Python", value:"python"}, {label : "Java", value:"java"}]
      return <Select options={exampleOptions} onChange={this.onSelect} clearableValue={false} />;
    }

    onSelect = (option) => {
      this.props.dispatch({type: deps.bufferChangeMode, buffer: 'source', mode: option.value});
    };

  });




};