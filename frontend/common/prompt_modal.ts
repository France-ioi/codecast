import {race, put, take, takeEvery, call} from "typed-redux-saga";
import {Bundle} from "../linker";
import {modalHide, modalShow, ModalType, PromptModalOptions} from "./modal_slice";
import {PayloadAction} from "@reduxjs/toolkit";
import log from 'loglevel';

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
    log.getLogger('prompt').debug('show popup', modalOptions);
    yield* put(modalShow(modalOptions));

    const {validate, newDisplay} = yield* race({
        validate: take<PayloadAction<{inputValue?: string}>>(ModalActionTypes.Validate),
        cancel: take(ModalActionTypes.Cancel),
        newDisplay: take(ModalActionTypes.Display),
    });

    log.getLogger('prompt').debug('validation', validate);
    if (!newDisplay) {
        yield* put(modalHide());
    }

    if (validate) {
        if ([ModalType.keypad, ModalType.input].includes(modalOptions.mode)) {
            return validate.payload.inputValue;
        }

        return !!validate;
    } else {
        return false;
    }
}

export default function(bundle: Bundle) {
    bundle.addSaga(function* () {
        yield* takeEvery<PayloadAction<PromptModalOptions>>(ModalActionTypes.Display, function* ({payload}) {
            log.getLogger('prompt').debug('catch action display');
            const result = yield* call(showPopupMessageSaga, payload);
            if (payload.callback) {
                payload.callback(result);
            }
        });
    });
}

