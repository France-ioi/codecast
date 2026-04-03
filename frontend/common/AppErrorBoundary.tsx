import React from "react";
import {Dialog} from "@blueprintjs/core";
import {Error} from "@blueprintjs/icons";
import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {connect} from "react-redux";
import {getMessage} from "../lang";

interface AppErrorBoundaryStateToProps {
    lastError: any,
}

function mapStateToProps(state: AppStore): AppErrorBoundaryStateToProps {
    return {
        lastError: state.lastError,
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
        const {lastError, children} = this.props;
        if (!lastError) {
            return children;
        }

        const {source, error, info} = lastError;
        const closable = false !== lastError.closable;

        return (
            <div className='error-wrapper'>
                <Dialog
                    icon={<Error/>}
                    isOpen={true}
                    onClose={this._clearError}
                    isCloseButtonShown={closable}
                    canEscapeKeyClose={closable}
                    canOutsideClickClose={closable}
                    title={getMessage('AN_ERROR_OCCURRED')}
                >
                    <div className='bp6-dialog-body'>
                        {source && <p>{"Source: "}{source}</p>}
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
