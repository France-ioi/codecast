import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {QuickAlgoContext} from "./index";

function mapStateToProps(state: AppStore) {
    return {
        context: state.task && state.task.context ? state.task.context : null
    };
}

interface ContextVisualizationProps {
    context: QuickAlgoContext,
}

export class _ContextVisualization extends React.PureComponent<ContextVisualizationProps> {
    componentDidMount() {
        if (this.props.context) {
            this.props.context.reset();
        }
    }

    render() {
        return (
            <div className="task-visualisation">
                <div id="grid"/>
            </div>
        );
    }

    static computeDimensions(width: number, height: number) {
        return {
            taken: {width, height},
            minimum: {width: 200, height: 200},
        }
    }
}

export const ContextVisualization = connect(mapStateToProps)(_ContextVisualization);
