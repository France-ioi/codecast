import React from "react";
import {AppStore} from "../store";
import {_LayoutIOPane} from "./layout/LayoutIOPane";
import {getCurrentStepperState} from "../stepper/selectors";
import {connect} from "react-redux";

function mapStateToProps(state: AppStore) {
    return {
        ioMode: state.ioPane.mode,
        hasStepper: !!getCurrentStepperState(state),
        getMessage: state.getMessage,
    };
}

export const TerminalIOPane = connect(mapStateToProps)(_LayoutIOPane);
