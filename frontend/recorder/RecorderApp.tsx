import React from "react";
import {Vumeter} from "./Vumeter";
import {MemoryUsage} from "./MemoryUsage";
import {RecorderGlobalControls} from "./RecorderGlobalControls";

export class RecorderApp extends React.PureComponent {
    render () {
        return (
            <div className='container'>
                <RecorderGlobalControls />
                <div id='page-level-controls'>
                    <div>
                        <MemoryUsage />
                        <Vumeter />
                    </div>
                </div>

                <Screen />
            </div>
        );
    }
}
