import React from "react";
import {AnchorButton, Icon} from "@blueprintjs/core";

interface ExamplePickerProps {
    examplesUrl: string,
    disabled: boolean,
    getMessage: Function
}

export class ExamplePicker extends React.PureComponent<ExamplePickerProps> {
    render() {
        const {examplesUrl, disabled, getMessage} = this.props;
        if (disabled || !examplesUrl) return false;
        return (
            <div>
                <label className='bp3-label'>
                    {getMessage('EXAMPLES_LABEL')}
                    <AnchorButton href={examplesUrl} rightIcon='share'>
                        {getMessage('EXAMPLES_BUTTON_TITLE')}
                    </AnchorButton>
                </label>
                <p>
                    <Icon icon='warning-sign'/>{' '}
                    {getMessage('EXAMPLES_MESSAGE')}
                </p>
            </div>
        );
    }
}
