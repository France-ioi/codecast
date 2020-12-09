import React from "react";
import {Vumeter} from "./Vumeter";
import {MemoryUsage} from "./MemoryUsage";
import {RecorderGlobalControls} from "./RecorderGlobalControls";
import {LoginScreen} from "../common/LoginScreen";
import {SaveScreen} from "./SaveScreen";
import {RecordScreen} from "./RecordScreen";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface RecorderAppStateToProps {
    screen: string,
    user: any | false
}

function mapStateToProps(state: AppStore): RecorderAppStateToProps {
    const user = state.get('user');
    const screen = state.get('screen');

    return {user, screen};
}

interface RecorderAppDispatchToProps {
    dispatch: Function
}

interface RecorderAppProps extends RecorderAppStateToProps, RecorderAppDispatchToProps {
    enabled?: boolean
}

class _RecorderApp extends React.PureComponent<RecorderAppProps> {
    render () {
        let screenView = null;
        console.log(this.props.user);
        if (!this.props.user) {
            screenView = <LoginScreen />;
        } else if (this.props.screen === 'record') {
            screenView = <RecordScreen />;
        } else if (this.props.screen === 'save') {
            screenView = <SaveScreen />;
        }

        return (
            <div className='container'>
                <RecorderGlobalControls />
                <div id='page-level-controls'>
                    <div>
                        <MemoryUsage />
                        <Vumeter />
                    </div>
                </div>

                {screenView}
            </div>
        );
    }
}

export const RecorderApp = connect(mapStateToProps)(_RecorderApp);
