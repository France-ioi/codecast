
import React from 'react';

export class SvgPan extends React.PureComponent {

  render () {
    const {width, height, x, y, scale} = this.props;
    const viewTransform = `matrix(${scale},0,0,${scale},${-x},${-y})`;
    return (
      <svg version='1.1' xmlns='http://www.w3.org/2000/svg'
        width={width} height={height}
        onMouseDown={this.onMouseDown} onMouseMove={this.onMouseMove} onMouseUp={this.onMouseUp} >
        <g transform={viewTransform}>
          {this.props.children}
        </g>
      </svg>
    );
  }

  state = {mode: 'idle'};

  refSvg = (element) => {
    this._svg = element;
  };

  refGroup = (element) => {
    this._g = element;
  };

  onMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const startPosition = this.props.getPosition();
    const startX = event.clientX;
    const startY = event.clientX;
    this.setState({mode: 'panning', startPosition, startX, startY});
  };

  onMouseMove = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const {mode, startPosition, startX, startY} = this.state;
    if (mode === 'panning') {
      const forceExit = (event.buttons === 0); // the mouse exited and reentered into svg
      if (forceExit) {
        this.setState({mode: 'idle'});
      } else {
        const {scale} = this.props;
        const dx = (event.clientX - startX) / scale;
        const dy = (event.clientY - startY) / scale;
        this.props.onPan(startPosition, event.clientX - startX, event.clientY - startY);
      }
    }
  };

  onMouseUp = (event) => {
    event.preventDefault();
    event.stopPropagation();
    this.setState({mode: 'idle'});
  };

}
