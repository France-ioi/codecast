import {Dialog, Icon} from "@blueprintjs/core";
import React, {useEffect, useState} from "react";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {getMessage} from "../../lang";
import {cancelModal, validateModal} from "../../common/prompt_modal";
import {ModalType} from "../../common/modal_slice";
import {NumericKeypad} from "../blocks/NumericKeypad";

export function PromptModalDialog() {
    const modalData = useAppSelector(state => state.modal);
    const dispatch = useDispatch();

    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        console.log('change input value');
        setInputValue(modalData.defaultInput);
    }, [modalData.defaultInput, modalData.open]);

    const validate = () => {
        dispatch(validateModal(inputValue));
    };

    const cancel = () => {
        if (ModalType.keypad === modalData.mode) {
            validate();
            return;
        }

        dispatch(cancelModal());
    };

    const canClose = ModalType.dialog === modalData.mode || ModalType.keypad === modalData.mode;

    const onClose = () => {
        if (canClose) {
            cancel();
        }
    }

    return (
        <Dialog
            transitionName={ModalType.keypad === modalData.mode ? "none" : null}
            isOpen={modalData.open}
            className={`simple-dialog mode-${modalData.mode}`}
            canOutsideClickClose={canClose}
            canEscapeKeyClose={canClose}
            backdropClassName={`dialog-backdrop dialog-backdrop-${modalData.mode}`}
            onClose={onClose}
            key={modalData.id}
        >
            <div dangerouslySetInnerHTML={{__html: modalData.message}}></div>

            {ModalType.input === modalData.mode &&
                <div className="text-center mb-4">
                    <input type="text" className='modal-input bp3-input bp3-fill' value={inputValue} onChange={(event) => setInputValue(event.target.value)}></input>
                </div>
            }

            {ModalType.dialog !== modalData.mode && ModalType.keypad !== modalData.mode &&
                <div className="simple-dialog-buttons">
                    <button className="simple-dialog-button" onClick={validate}>
                        <Icon icon="small-tick" iconSize={24}/>
                        <span>{modalData.yesButtonText ? modalData.yesButtonText : getMessage((modalData.noButtonText ? 'VALIDATE' : 'ALRIGHT'))}</span>
                    </button>

                    {modalData.noButtonText &&
                      <button className="simple-dialog-button ml-2" onClick={cancel}>
                          <span>{modalData.noButtonText}</span>
                      </button>
                    }
                </div>
            }

            {ModalType.keypad === modalData.mode &&
                <NumericKeypad
                    initialValue={modalData.defaultInput}
                    position={modalData.position}
                    callbackModify={(value) => {
                        setInputValue(value);
                        modalData.callbackModify(value);
                    }}
                    callbackFinished={(value) => {
                        setInputValue(value);
                        dispatch(validateModal(value));
                    }}
                />
            }
        </Dialog>
    );
}
