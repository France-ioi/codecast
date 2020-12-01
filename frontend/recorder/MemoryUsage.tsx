import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../store";

interface MemoryUsageStateToProps {
    getMessage: Function,
    heapSize: string
}

function mapStateToProps(state: AppStore): MemoryUsageStateToProps {
    const getMessage = state.get('getMessage');
    const {heapSize} = state.get('memoryUsage');

    return {
        getMessage,
        heapSize: (heapSize / (1024 * 1024)).toFixed(1)
    };
}

interface MemoryUsageDispatchToProps {
    dispatch: Function
}

interface MemoryUsageProps extends MemoryUsageStateToProps, MemoryUsageDispatchToProps {

}

export class _MemoryUsage extends React.PureComponent<MemoryUsageProps> {
    render() {
        const {getMessage, heapSize} = this.props;
        return (<div id='memory-usage' title={getMessage('MEMORY_USAGE')}>{heapSize}{" MiB"}</div>);
    }
}

export const MemoryUsage = connect(mapStateToProps)(_MemoryUsage);
