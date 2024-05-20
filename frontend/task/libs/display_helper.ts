import log from 'loglevel';
import {Codecast} from '../../app_types';
import {cancelModal, displayModal} from '../../common/prompt_modal';
import {ModalType} from '../../common/modal_slice';

export class DisplayHelper {
    public avatarType = 'none';

    async showPopupMessage(message, mode, yesButtonText, agreeFunc, noButtonText, avatarMood, defaultText, disagreeFunc) {
        log.getLogger('libraries').debug('popup message', defaultText, noButtonText);
        const result = await new Promise(resolve => {
            const mainStore = Codecast.environments['main'].store;
            mainStore.dispatch(displayModal({
                message,
                mode,
                defaultInput: defaultText,
                yesButtonText,
                noButtonText,
                callback: resolve
            }));
        });

        if (false !== result && agreeFunc) {
            if (mode === 'input') {
                agreeFunc(result);
            } else {
                agreeFunc();
            }
        }

        if (false === result && disagreeFunc) {
            disagreeFunc();
        }
    }

    async showPopupDialog(message, callback) {
        const dialog = `<div id="popupMessage" class="dialog-message" style="display: block">${message}</div>`;
        const mainStore = Codecast.environments['main'].store;
        mainStore.dispatch(displayModal({message: dialog, mode: ModalType.dialog}));

        // Wait next tick to make sure modal is rendered
        if (callback) {
            setTimeout(callback);
        }
    }

    async showKeypad(initialValue, position, callbackModify, callbackFinished, options) {
        const mainStore = Codecast.environments['main'].store;
        mainStore.dispatch(displayModal({
            mode: ModalType.keypad,
            callbackFinished,
            defaultInput: initialValue,
            position,
            callbackModify,
            options
        }));
    }

    set popupMessageShown(value) {
        log.getLogger('libraries').debug('change value', value);
        if (false === value) {
            const mainStore = Codecast.environments['main'].store;
            mainStore.dispatch(cancelModal());
        }
    }
}

export function* createDisplayHelper() {
    if (!window.displayHelper) {
        window.displayHelper = new DisplayHelper();
    }
}
