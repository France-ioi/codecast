import React from "react";
import {AnchorButton, Icon} from "@blueprintjs/core";
import {connect} from "react-redux";
import {AppStore} from "../store";
import {getMessage} from "../lang";

interface ExamplePickerStateToProps {
    examplesUrl: string,
}

function mapStateToProps(state: AppStore): ExamplePickerStateToProps
{
    const {fullExamplesUrl} = state.examples;

    return {examplesUrl: fullExamplesUrl};
}

interface ExamplePickerDispatchToProps {
    dispatch: Function
}

interface ExamplePickerProps extends ExamplePickerStateToProps, ExamplePickerDispatchToProps {
    disabled?: boolean
}

class _ExamplePicker extends React.PureComponent<ExamplePickerProps> {
    render() {
        const {examplesUrl, disabled} = this.props;
        if (disabled || !examplesUrl) {
            return false;
        }

        return (
            <div>
                <label className='bp4-label'>
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

export const ExamplePicker = connect(mapStateToProps)(_ExamplePicker);
