import React from "react";
import {Dialog} from "@blueprintjs/core";
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {connect} from "react-redux";

interface AppErrorBoundaryStateToProps {
    lastError: any,
    getMessage: Function,
}

function mapStateToProps(state: AppStore): AppErrorBoundaryStateToProps {
    return {
        lastError: state.lastError,
        getMessage: state.getMessage,
    };
}

interface AppErrorBoundaryDispatchToProps {
    dispatch: Function
}

interface AppErrorBoundaryProps extends AppErrorBoundaryStateToProps, AppErrorBoundaryDispatchToProps {
    children?: any,
}

class _AppErrorBoundary extends React.Component<AppErrorBoundaryProps> {
    render() {
        const {lastError, children, getMessage} = this.props;
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
                    title={getMessage('AN_ERROR_OCCURRED')}
                >
                    <div className='bp3-dialog-body'>
                        <p>{"Source: "}{source}</p>
                        <p style={{fontWeight: 'bold'}}>{(error || '').toString()}</p>
                        {source === 'react' &&
                            <pre>{"Component stack:"}{info.componentStack}</pre>
                        }
                    </div>
                </Dialog>
                {source !== 'react' &&
                    <div className='error-wrapper'>{children}</div>
                }
            </div>
        );
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        this.props.dispatch({type: ActionTypes.Error, payload: {source: 'react', error, info}});
    }

    _clearError = () => {
        this.props.dispatch({type: ActionTypes.ErrorClear});
    };
}

export const AppErrorBoundary = connect(mapStateToProps)(_AppErrorBoundary);
