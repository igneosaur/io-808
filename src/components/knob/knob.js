import React from 'react';
import Radium from 'radium';

import {BASE_HEIGHT} from './constants';
import KnobOverlay from './knobOverlay';

function emptyKnobState() {
  return {
    topPosition: null,
    xPosition: null,
    scale: null,
    knobCenter: null,
    cursorPos: null
  };
}

function getNormalizedValue(value, min, max) {
  return (value - min) / (max - min);
}

function round(number, increment, offset) {
  return Math.round(number / increment ) * increment + offset;
}

@Radium
class Knob extends React.Component {
  constructor(props) {
    super(props);
    this.state = emptyKnobState();

    this.startDrag = this.startDrag.bind(this);
    this.handleDrag = this.handleDrag.bind(this);
    this.endDrag = this.endDrag.bind(this);
  }

  handleDrag(e) {
    e.preventDefault();
    const xPosition = e.pageX;
    const tempY = e.pageY;
    const distance = Math.abs(xPosition - this.state.knobCenter[0]);
    const scale = ((distance / 200) + 1);

    let topPosition = this.state.topPosition;
    if (tempY < topPosition) {
      topPosition = tempY;
    }

    if (tempY > topPosition + (BASE_HEIGHT * scale)) {
      topPosition = (tempY - (BASE_HEIGHT * scale));
    }

    const cursorPos = [e.pageX, e.pageY];
    const normalizedValue = (100 - ((tempY - topPosition) * (100 / (BASE_HEIGHT * scale)))) / 100;

    const {min, max, step} = this.props;
    const unnormalizedValue = round((normalizedValue * (max - min)), step, min);

    this.setState({xPosition, topPosition, scale, cursorPos});
    if (unnormalizedValue !== this.props.value) {
      this.props.onChange(unnormalizedValue);
    }
  }

  endDrag(e) {
    document.removeEventListener('mousemove', this.handleDrag, false);
    document.removeEventListener('mouseup', this.endDrag, false);
    this.setState(emptyKnobState());
  }

  startDrag(e) {
    e.preventDefault();

    const {value, min, max} = this.props;

    const knobRect = e.currentTarget.getBoundingClientRect();
    const knobCenter = [
      knobRect.left + (knobRect.width / 2),
      knobRect.top + (knobRect.height / 2)
    ];

    const xPosition = e.pageX;
    const distance = Math.abs(xPosition - knobCenter[0]);
    const scale = ((distance / 200) + 1);
    const topPosition = e.pageY - ((BASE_HEIGHT * scale) - getNormalizedValue(value, min, max) * (BASE_HEIGHT * scale));

    const cursorPos = [e.pageX, e.pageY];

    document.addEventListener('mousemove', this.handleDrag, false);
    document.addEventListener('mouseup', this.endDrag, false);

    this.setState({ xPosition, topPosition, scale, knobCenter, cursorPos });
  }

  render() {
    const {value, min, max, overlayColor='#fff', size, displayValue=false, bufferSize=360} = this.props;

    const rotationAmount = (getNormalizedValue(value, min, max) * bufferSize) - (bufferSize / 2);

    const styles = {
      wrapper: {
        position: 'relative',
        borderRadius: '50%',
        height: size, width: size,
        ':hover': {
          cursor: '-webkit-grab'
          // TODO: Fix fallback with: cursor: ['-webkit-grab', 'grab']
        }
      },
      knob: {
        position: 'relative',
        borderRadius: '50%',
        height: '100%', width: '100%',
        transform: 'rotate(' + rotationAmount + 'deg) translateZ(0px)'
      }
    }

    let helper = null;
    if (this.state.xPosition != null ) {
      helper = <KnobOverlay {...this.state} overlayColor={overlayColor}/>;
    }

    return (
      <div style={ styles.wrapper }>
        <div style={ styles.knob } onMouseDown={this.startDrag}>
          {this.props.children}
        </div>
        {helper}
      </div>
    );
  }
}

Knob.propTypes = {
  size: React.PropTypes.number.isRequired,
  value: React.PropTypes.number.isRequired,
  min: React.PropTypes.number.isRequired,
  max: React.PropTypes.number.isRequired,
  step: React.PropTypes.number.isRequired,
  onChange: React.PropTypes.func.isRequired,
  bufferSize: React.PropTypes.number,
  overlayColor: React.PropTypes.string,
  innerColor: React.PropTypes.string,
  displayValue: React.PropTypes.bool
};

export default Knob;