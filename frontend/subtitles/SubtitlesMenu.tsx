import React from "react";
import {Button} from "@blueprintjs/core";
import { PortalWithState } from 'react-portal';
import {SubtitlesPopup} from "./SubtitlesPopup";
import {AppStore} from "../store";
import {connect} from "react-redux";

interface FullscreenButtonStateToProps {
    hidden: boolean,
    getMessage: Function
}

function mapStateToProps(state: AppStore): FullscreenButtonStateToProps {
    const getMessage = state.get('getMessage');
    let hidden = false;

    const subtitles = state.get('subtitles');
    if (subtitles.editing) {
        hidden = true;
    }

    const playerData = state.getIn(['player', 'data']);
    if (!playerData || !playerData.subtitles || playerData.subtitles.length === 0) {
        hidden = true;
    }

    return {
        getMessage,
        hidden
    };
}

interface SubtitlesMenuDispatchToProps {
    dispatch: Function
}

interface SubtitlesMenuProps extends FullscreenButtonStateToProps, SubtitlesMenuDispatchToProps {

}

class _SubtitlesMenu extends React.PureComponent<SubtitlesMenuProps> {
    render() {
        const {hidden, getMessage} = this.props;
        if (hidden) {
            return false;
        }

        return (
            <PortalWithState closeOnOutsideClick closeOnEsc>
                {({openPortal, closePortal, portal}) => (
                    <React.Fragment>
                        <Button
                            onClick={openPortal}
                            className='btn-cc'
                            title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}
                            text='CC'
                        />
                        {portal(
                            <SubtitlesPopup closePortal={closePortal}/>
                        )}
                    </React.Fragment>
                )}
            </PortalWithState>
        );
    }
}

export const SubtitlesMenu = connect(mapStateToProps)(_SubtitlesMenu);
