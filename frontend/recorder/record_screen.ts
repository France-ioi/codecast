import {RecordScreen} from "./RecordScreen";

export default function (bundle, deps) {
    bundle.use('RecorderControls', 'StepperView');

    function RecordScreenSelector(state, props) {
        const getMessage = state.get('getMessage');
        return {getMessage};
    }

    bundle.defineView('RecordScreen', RecordScreenSelector, RecordScreen);
};
