import React, {Component, ReactElement} from 'react'
import {Alert, Intent} from '@blueprintjs/core'
import {createRoot} from 'react-dom/client';


export type ShowAlertProps = {
    handleClose?: (isConfirm: boolean) => void
    text?: string
    resolve?: (result: boolean) => void,
    intent?: Intent,
    children?: React.ReactNode,
}

export type ShowConfirmProps = {
    handleClose?: (isConfirm: boolean) => void
    text?: string
    resolve?: (result: boolean) => void,
    intent?: Intent,
    confirmText?: string,
    cancelText?: string,
    children?: React.ReactNode,
}

export const showAlert = (props: ShowAlertProps) => {
    return new Promise((resolve) => {
        renderOnDoc((handleClose) => {
            return <AlertWrapper {...{ ...props, handleClose, resolve }} />
        })
    })
}

export const askConfirmation = (props: ShowConfirmProps) => {
    return new Promise<boolean>((resolve) => {
        renderOnDoc((handleClose) => {
            return <AlertWrapper {...{
                ...props,
                handleClose,
                resolve,
                cancelButtonText: props.cancelText,
                confirmButtonText: props.confirmText,
                canEscapeKeyCancel: true,
                canOutsideClickCancel: true,
            }}/>
        })
    })
}

class AlertWrapper extends Component<ShowAlertProps | ShowConfirmProps> {
    state = {isOpen: true};

    render() {
        const {
            children,
            handleClose,
            intent = Intent.PRIMARY,
            resolve,
            text,
            ...rest
        } = this.props

        return (
            <Alert
                isOpen={this.state.isOpen}
                intent={intent}
                onCancel={() => {
                    if (handleClose) handleClose(false)
                    this.setState({ isOpen: false })
                    if (resolve) resolve(false)
                }}
                onConfirm={() => {
                    if (handleClose) handleClose(true)
                    this.setState({ isOpen: false })
                    if (resolve) resolve(true)
                }}
                {...rest}
            >
                {children || text}
            </Alert>
        )
    }
}

export const renderOnDoc = (fn: (props: () => void) => ReactElement) => {
    const elemDiv = document.createElement('div')
    document.body.appendChild(elemDiv);
    const root = createRoot(elemDiv);

    const handleClose = () => {
        setTimeout(() => {
            root.unmount();
            document.body.removeChild(elemDiv)
        })
    }
    root.render(fn(handleClose));
}
