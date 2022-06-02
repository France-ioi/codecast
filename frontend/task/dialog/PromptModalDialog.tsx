import {Dialog, Icon} from "@blueprintjs/core";
import React, {useEffect, useState} from "react";
import {useAppSelector} from "../../hooks";
import {useDispatch} from "react-redux";
import {getMessage} from "../../lang";
import {cancelModal, validateModal} from "../../common/prompt_modal";
import {ModalType} from "../../common/modal_slice";

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
        dispatch(cancelModal());
    };

    const canClose = ModalType.dialog === modalData.mode;

    const onClose = () => {
        if (canClose) {
            cancel();
        }
    }

    return (
        <Dialog isOpen={modalData.open} className="simple-dialog" canOutsideClickClose={canClose} canEscapeKeyClose={canClose} onClose={onClose}>
            <div dangerouslySetInnerHTML={{__html: modalData.message}}></div>

            {ModalType.input === modalData.mode &&
                <div className="text-center mb-4">
                    <input type="text" className='modal-input bp3-input bp3-fill' value={inputValue} onChange={(event) => setInputValue(event.target.value)}></input>
                </div>
            }

            {ModalType.dialog !== modalData.mode &&
              <div className="simple-dialog-buttons">
                  <button className="simple-dialog-button" onClick={validate}>
                      <Icon icon="small-tick" iconSize={24}/>
                      <span>{getMessage(modalData.noButtonText ? 'VALIDATE' : 'ALRIGHT')}</span>
                  </button>

                  {modalData.noButtonText &&
                    <button className="simple-dialog-button ml-2" onClick={cancel}>
                        <span>{modalData.noButtonText}</span>
                    </button>
                  }
              </div>
            }
        </Dialog>
    );
}
