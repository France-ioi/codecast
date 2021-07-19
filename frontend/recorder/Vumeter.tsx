import React, {useEffect, useRef} from "react";
import {ActionTypes} from "./actionTypes";
import {useDispatch} from "react-redux";

interface VumeterProps {
    width: number,
    height: number,
}

export function Vumeter(props: VumeterProps) {
    const canvasRef = useRef();

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch({type: ActionTypes.VumeterMounted, payload: {element: canvasRef.current, width: props.width, height: props.height}});
    }, []);

    return <canvas ref={canvasRef} className='vumeter' width={props.width} height={props.height}/>;
}
