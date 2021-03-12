import React from 'react';
import {StepperControls} from "../stepper/views/StepperControls";
import {MenuTask} from "../common/MenuTask";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {Container, Row, Col} from 'react-bootstrap';
import {BufferEditor} from "../buffers/BufferEditor";
import {getPlayerState} from "../player/selectors";

interface TaskAppStateToProps {
    readOnly: boolean,
    sourceMode: string,
    sourceRowHeight: number,
    error: string,
    getMessage: Function,
    geometry: any,
    panes: any,
    showStack: boolean,
    arduinoEnabled: boolean,
    showViews: boolean,
    showIO: boolean,
    windowHeight: any,
    currentStepperState: any,
    preventInput: any,
}

function mapStateToProps(state: AppStore): TaskAppStateToProps {
    const getMessage = state.getMessage;
    const geometry = state.mainViewGeometry;
    const panes = state.panes;
    const currentStepperState = state.stepper.currentStepperState;
    const error = currentStepperState && currentStepperState.error;
    const readOnly = !!currentStepperState;
    const {showIO, showViews, showStack, platform} = state.options;
    const arduinoEnabled = platform === 'arduino';

    /* TODO: make number of visible rows in source editor configurable. */
    const sourceRowHeight = Math.ceil(16 * 25); // 12*25 for /next

    let mode;
    switch (platform) {
        case 'arduino':
            mode = 'arduino';

            break;
        case 'python':
            mode = 'python';

            break;
        default:
            mode = 'c_cpp';

            break;
    }

    const sourceMode = mode;

    const player = getPlayerState(state);
    const preventInput = player.isPlaying;
    const windowHeight = state.windowHeight;

    return {
        readOnly, error, getMessage, geometry, panes, preventInput, sourceRowHeight,
        sourceMode, showStack, arduinoEnabled, showViews, showIO, windowHeight,
        currentStepperState,
    };
}

interface TaskAppDispatchToProps {
    dispatch: Function
}

interface TaskAppProps extends TaskAppStateToProps, TaskAppDispatchToProps {

}

class _TaskApp extends React.PureComponent<TaskAppProps> {
    render() {
        const {
            readOnly, sourceMode, sourceRowHeight,
            preventInput, error, getMessage, geometry, panes,
            windowHeight, currentStepperState,
            showStack, arduinoEnabled, showViews, showIO
        } = this.props;

        return (
            <Container fluid className="task">
                <div className="task-header">
                    <span className="task-header__quick">QUICK</span>
                    <span className="task-header__algo">ALGO</span>
                </div>

                <Row className="task-body" noGutters>
                    <Col md={3} className="task-menu-left">
                        <div className="task-mission">
                            <h1>Votre mission</h1>

                            <p>Programmez le robot ci-dessous pour qu'il atteigne l'étoile, en sautant de plateforme en plateforme.</p>
                        </div>

                        <hr/>

                        <div className="task-visualisation">
                            <h1>Visualisation 1</h1>
                        </div>

                        <div className="player-controls">
                            <StepperControls enabled={true}/>
                        </div>
                    </Col>
                    <Col md={9}>
                        <BufferEditor
                            buffer='source'
                            readOnly={readOnly}
                            shield={preventInput}
                            mode={sourceMode}
                            theme={'textmate'}
                            width='100%'
                            height='100%'
                        />

                        <div className="menu-app">
                            <MenuTask/>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    };
}

export const TaskApp = connect(mapStateToProps)(_TaskApp);
