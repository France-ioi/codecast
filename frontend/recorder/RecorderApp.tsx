import React from "react";

class RecorderApp extends React.PureComponent {
    render () {
        return (
            <div className='container'>
                <RecorderGlobalControls/>
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
