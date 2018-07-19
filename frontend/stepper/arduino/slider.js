
class Slider extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dragging: false
    };
    this.refElement = (element) => {
      this.element = element;
    };
    this.start = (position) => {
      this.setState({
        startValue: this.state.value,
        startPosition: position,
        dragging: true
      });
      /*
      this.props.onChange(
        this.element.offsetTop
        this.element.offsetHeight
      );
      */
    }
    this.onMouseDown = (e) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.props.disabled) return;
      var position = e.clientY;
      this.start(e.clientY);
    };
    this.onMouseUp = (e) => {
      this.setState({dragging: false});
    };
    this.onMouseMove = (e) => {
      console.log(this.state.startPosition, e.clientY);
    };
  }
  render() {
    const {value} = this.props;
    const {dragging} = this.state;
    return (
      <div
        ref={this.refElement}
        onMouseDown={this.onMouseDown}
        onMouseMove={dragging && this.onMouseMove}
        onMouseUp={dragging && this.onMouseUp}
        className="arduino-slider"
      >
        <div className="arduino-slider-level" style={{height: `${value*100}%`}} />
      </div>
    );
  }
}
Slider.propTypes = {
  value: PropTypes.number.isRequired,
  disabled: PropTypes.boolean,
  onChange: PropTypes.func.isRequired
};
Slider.defaultProps = {
  disabled: false
};
