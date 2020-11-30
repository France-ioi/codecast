import React from "react";
import {Button} from "@blueprintjs/core";
import { PortalWithState } from 'react-portal';

interface SubtitlesMenuProps {
    hidden: any,
    getMessage: any,
    SubtitlesPopup: any
}

export class SubtitlesMenu extends React.PureComponent<SubtitlesMenuProps> {
    render() {
        const {hidden, getMessage, SubtitlesPopup} = this.props;
        if (hidden) {
            return false;
        }

        return (
            <PortalWithState closeOnOutsideClick closeOnEsc>
                {({openPortal, closePortal, portal}) => (
                    <React.Fragment>
                        <Button onClick={openPortal} className='btn-cc' title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}
                                text='CC'/>
                        {portal(
                            <SubtitlesPopup closePortal={closePortal}/>
                        )}
                    </React.Fragment>
                )}
            </PortalWithState>
        );
    }
}
