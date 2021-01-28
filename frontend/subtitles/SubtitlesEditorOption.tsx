import React from "react";
import {Intent, MenuItem} from "@blueprintjs/core";

interface SubtitlesEditorOptionProps {
    option: any,
    selected: any,
    onSelect: Function
}

export class SubtitlesEditorOption extends React.PureComponent<SubtitlesEditorOptionProps> {
    render() {
        const {option, selected} = this.props;
        const text = <span>{option.label}</span>;
        const icon = option.unsaved ? 'floppy-disk' : 'blank';
        const intent = selected ? Intent.PRIMARY : Intent.NONE;

        return (
            <MenuItem icon={icon} text={text} active={selected} intent={intent} onClick={this._select}/>
        );
    }

    _select = () => {
        this.props.onSelect(this.props.option);
    };
}
