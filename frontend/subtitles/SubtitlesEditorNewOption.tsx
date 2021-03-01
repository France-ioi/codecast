import React from "react";
import {MenuItem} from "@blueprintjs/core";

interface SubtitlesEditorNewOptionProps {
    option: any,
    disabled: any,
    onSelect: Function,
}

export class SubtitlesEditorNewOption extends React.PureComponent<SubtitlesEditorNewOptionProps> {
    render() {
        const {option, disabled} = this.props;
        const text = <span>{option.label}</span>;
        return <MenuItem text={text} disabled={disabled} onClick={this._add}/>;
    }

    _add = () => {
        this.props.onSelect(this.props.option);
    };
}
