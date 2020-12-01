import React from "react";
import {ActionTypes} from "./actionTypes";
import {connect} from "react-redux";

interface VumeterDispatchToProps {
    dispatch: Function
}

interface VumeterProps extends VumeterDispatchToProps {

}

class _Vumeter extends React.PureComponent<VumeterProps> {
    _canvas = HTMLCanvasElement = null;

    render () {
        return <canvas ref={this._refCanvas} id='vumeter' width="10" height="100"></canvas>;
    }
    componentDidMount () {
        this.props.dispatch({type: ActionTypes.VumeterMounted, payload: {element: this._canvas}});
    }
    _refCanvas = (el) => {
        this._canvas = el;
    };
}

export const Vumeter = connect()(_Vumeter);
