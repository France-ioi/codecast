import React from 'react';
import {Dialog} from '@blueprintjs/core';

export default function (bundle) {
    bundle.defineAction('error', 'Error');
    bundle.defineAction('clearError', 'Error.Clear');
    bundle.addReducer('error', errorReducer);
    bundle.addReducer('clearError', clearErrorReducer);
    bundle.defineView('AppErrorBoundary', AppErrorBoundarySelector, AppErrorBoundary);
}

function AppErrorBoundarySelector(state) {
    const lastError = state.get('lastError');
    const actionTypes = state.get('actionTypes');
    return {lastError, actionTypes};
}

class AppErrorBoundary extends React.Component {
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
        const {dispatch, actionTypes} = this.props;
        dispatch({type: actionTypes.error, payload: {source: 'react', error, info}});
    }

    _clearError = () => {
        const {dispatch, actionTypes} = this.props;
        this.props.dispatch({type: actionTypes.clearError});
    };
}

function errorReducer(state, {payload}) {
    console.log("GENERIC ERROR", payload);
    return state.set('lastError', payload);
}

function clearErrorReducer(state, _action) {
    return state.set('lastError', undefined);
}
