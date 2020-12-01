import React from "react";
import {Dialog} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {connect} from "react-redux";

interface AppErrorBoundaryProps {
    lastError: any,
    children: any,
    dispatch: Function
}

class _AppErrorBoundary extends React.Component<AppErrorBoundaryProps> {
    render() {
        const {lastError, children} = this.props;
        if (!lastError) {
            return children;
        }
        const {source, error, info} = lastError;
        return (
            <div className='error-wrapper'>
                <Dialog
                    icon="error"
                    isOpen={true}
                    onClose={this._clearError}
                    title={"Something went wrong"}
                >
                    <div className='bp3-dialog-body'>
                        <p>{"Source: "}{source}</p>
                        <p style={{fontWeight: 'bold'}}>{(error || '').toString()}</p>
                        {source === 'react' &&
                        <pre>{"Component stack:"}{info.componentStack}</pre>}
                    </div>
                </Dialog>
                {source !== 'react' &&
                <div className='error-wrapper'>{children}</div>}
            </div>
        );
    }

    componentDidCatch(error, info) {
        this.props.dispatch({type: ActionTypes.Error, payload: {source: 'react', error, info}});
    }

    _clearError = () => {
        this.props.dispatch({type: ActionTypes.ErrorClear});
    };
}

function mapStateToProps(state: AppStore) {
    return {
        lastError: state.get('lastError')
    };
}

export const AppErrorBoundary = connect(mapStateToProps, null)(_AppErrorBoundary);
