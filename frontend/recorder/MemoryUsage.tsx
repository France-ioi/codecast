import React from "react";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {getMessage} from "../lang";

interface MemoryUsageStateToProps {
    heapSize: string
}

function mapStateToProps(state: AppStore): MemoryUsageStateToProps {
    const {heapSize} = state.memoryUsage;

    return {
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
        const {heapSize} = this.props;
        return (<div title={getMessage('MEMORY_USAGE')}>{heapSize}{" MiB"}</div>);
    }
}

export const MemoryUsage = connect(mapStateToProps)(_MemoryUsage);
