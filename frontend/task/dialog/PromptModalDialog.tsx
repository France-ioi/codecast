import {Dialog, Icon} from "@blueprintjs/core";
import React, {useEffect, useState} from "react";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {getMessage} from "../../lang";
import {cancelModal, validateModal} from "../../common/prompt_modal";
import {ModalType} from "../../common/modal_slice";
import {NumericKeypad} from "../blocks/NumericKeypad";
import {TralalereBox} from "../../tralalere/TralalereBox";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faTimes} from "@fortawesome/free-solid-svg-icons";
import log from 'loglevel';

export function PromptModalDialog() {
    const modalData = useAppSelector(state => state.modal);
    const options = useAppSelector(state => state.options);
    const dispatch = useDispatch();

    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        log.getLogger('prompt').debug('change input value', modalData.defaultInput);
        setInputValue(modalData.defaultInput ? modalData.defaultInput : '');
    }, [modalData.defaultInput, modalData.open]);

    const validate = (e) => {
        e.preventDefault();
        dispatch(validateModal(inputValue));
    };

    const cancel = () => {
        if (ModalType.keypad === modalData.mode) {
            modalData.callbackFinished(inputValue, true);
        }

        dispatch(cancelModal());
    };

    const canClose = ModalType.dialog === modalData.mode || ModalType.keypad === modalData.mode;

    const onClose = () => {
        if (canClose) {
            cancel();
        }
    }

    log.getLogger('prompt').debug('modal data type', modalData.mode, modalData.open);

    let keypad = (
        <NumericKeypad
            initialValue={modalData.defaultInput}
            position={modalData.position}
            callbackModify={(value) => {
                setInputValue(value);
                modalData.callbackModify(value);
            }}
            callbackFinished={(value) => {
                setInputValue(value);
                modalData.callbackFinished(value, true);
                dispatch(validateModal(value));
            }}
            options={modalData.options}
        />
    );

    if ('tralalere' === options.app) {
        keypad = (
            <div className="numeric-keypad" style={modalData.position}>
                <TralalereBox>
                    <div className="keypad-close">
                        <div className="tralalere-button" onClick={cancel}>
                            <FontAwesomeIcon icon={faTimes}/>
                        </div>
                    </div>
                    {keypad}
                </TralalereBox>
            </div>
        )
    } else {
        keypad = (
            <div className="numeric-keypad" style={modalData.position}>
                {keypad}
            </div>
        )
    };

    return (
        <Dialog
            transitionDuration={ModalType.keypad === modalData.mode ? 0 : undefined}
            transitionName={ModalType.keypad === modalData.mode ? "none" : undefined}
            isOpen={modalData.open}
            className={`simple-dialog mode-${modalData.mode}`}
            canOutsideClickClose={canClose}
            canEscapeKeyClose={canClose}
            backdropClassName={`dialog-backdrop dialog-backdrop-${modalData.mode}`}
            onClose={onClose}
            key={modalData.id}
        >
            <div dangerouslySetInnerHTML={{__html: modalData.message}}></div>

            <form onSubmit={validate}>
                {ModalType.input === modalData.mode &&
                    <div className="text-center mb-2 mt-4">
                        <input autoFocus type="text" className='modal-input bp4-input bp4-fill' value={inputValue} onChange={(event) => setInputValue(event.target.value)}></input>
                    </div>
                }

                {ModalType.dialog !== modalData.mode && ModalType.keypad !== modalData.mode &&
                    <div className="simple-dialog-buttons">
                        <button type="submit" className="simple-dialog-button">
                            <Icon icon="small-tick" iconSize={24}/>
                            <span>{modalData.yesButtonText ? modalData.yesButtonText : getMessage((modalData.noButtonText || ModalType.input === modalData.mode ? 'VALIDATE' : 'ALRIGHT'))}</span>
                        </button>

                        {modalData.noButtonText &&
                            <button className="simple-dialog-button ml-2" onClick={cancel}>
                                <span>{modalData.noButtonText}</span>
                            </button>
                        }
                    </div>
                }

                {ModalType.keypad === modalData.mode && keypad}
            </form>
        </Dialog>
    );
}
