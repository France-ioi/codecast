import {race, put, take, takeEvery, call} from "typed-redux-saga";
import {Bundle} from "../linker";
import {modalHide, modalShow, PromptModalOptions} from "./modal_slice";
import {PayloadAction} from "@reduxjs/toolkit";

enum ModalActionTypes {
    Display = 'modal/display',
    Validate = 'modal/validate',
    Cancel = 'modal/cancel',
}

export const displayModal = (modalOptions: PromptModalOptions) => ({
    type: ModalActionTypes.Display,
    payload: modalOptions,
});

export const validateModal = (inputValue: string) => ({
    type: ModalActionTypes.Validate,
    payload: {
        inputValue,
    },
});

export const cancelModal = () => ({
    type: ModalActionTypes.Cancel,
});

export function* showPopupMessageSaga(modalOptions: PromptModalOptions) {
    console.log('show popup', modalOptions);
    yield* put(modalShow(modalOptions));

    const {validate, newDisplay} = yield* race({
        validate: take<PayloadAction<{inputValue?: string}>>(ModalActionTypes.Validate),
        cancel: take(ModalActionTypes.Cancel),
        newDisplay: take(ModalActionTypes.Display),
    });

    console.log('validation', validate);
    if (!newDisplay) {
        yield* put(modalHide());
    }

    if (validate) {
        return validate.payload.inputValue;
    } else {
        return false;
    }
}

export default function(bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery<PayloadAction<PromptModalOptions>>(ModalActionTypes.Display, function* ({payload}) {
            console.log('catch action display');
            const result = yield* call(showPopupMessageSaga, payload);
            if (payload.callback) {
                payload.callback(result);
            }
        });
    });
}

