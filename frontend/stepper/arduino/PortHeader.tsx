import React from "react";

interface PortHeaderProps {
    defn: any,
    brief?: any
}

export class PortHeader extends React.PureComponent<PortHeaderProps> {
    render() {
        const {defn, brief} = this.props;
        const {label, digital, analog} = defn;
        return (
            <div className='arduino-port-header' style={{minHeight: brief ? '21px' : '63px'}}>
                <span className='arduino-port-index'>{label}</span>
                {!brief && digital && <span className='arduino-port-digital'>{digital}</span>}
                {!brief && analog && <span className='arduino-port-analog'>{analog}</span>}
            </div>
        );
    };
}
