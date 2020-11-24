import React from "react";

interface MemoryUsageProps {
    getMessage: any,
    heapSize: any
}

export class MemoryUsage extends React.PureComponent<MemoryUsageProps> {
    render() {
        const {getMessage, heapSize} = this.props;
        return (<div id='memory-usage' title={getMessage('MEMORY_USAGE')}>{heapSize}{" MiB"}</div>);
    }
}
