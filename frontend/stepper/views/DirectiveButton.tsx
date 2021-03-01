import React from "react";
import {Button} from "@blueprintjs/core";

interface DirectiveButtonProps {
    directive: any,
    controls: any,
    onSelect: Function
}

export class DirectiveButton extends React.PureComponent<DirectiveButtonProps> {
    render() {
        const {directive, controls} = this.props;
        const hide = controls.hide;

        return (
            <Button small minimal active={!hide} text={directive.key} onClick={this.onClick}/>
        );
    }

    onClick = () => {
        this.props.onSelect(this.props.directive.key);
    };
}
