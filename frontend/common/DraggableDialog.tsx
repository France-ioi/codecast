import React from "react";
import {Rnd} from "react-rnd";
import {Dialog} from "@blueprintjs/core";

export function DraggableDialog({
    width: defaultDialogWidth = 400,
    height: defaultDialogHeight = 450,
    rndProps,
    ...rest
}) {
    const w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName("body")[0],
        windowWidth = w.innerWidth || e.clientWidth || g.clientWidth,
        windowHeight = w.innerHeight || e.clientHeight || g.clientHeight;
    return (
        <div
            className="error-dialog"
            style={{ top: 0, left: 0, position: "fixed" }}
        >
            <Rnd
                enableResizing={false}
                bounds={"body"}
                default={{
                    x: Math.max((windowWidth - defaultDialogWidth) / 2, 0),
                    y: Math.max((windowHeight - defaultDialogHeight) / 2, 0),
                    width: 'auto',
                    height: 'auto',
                }}
                dragHandleClassName={"bp3-dialog-header"}
                {...rndProps}
            >
                <Dialog isOpen={true} usePortal={false} {...rest} />
            </Rnd>
        </div>
    );
}