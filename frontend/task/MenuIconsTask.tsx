import React, {useState} from 'react';
import {Button} from '@blueprintjs/core';
import {FullscreenButton} from "../common/FullscreenButton";
import {SubtitlesPopup} from "../subtitles/SubtitlesPopup";
import {useAppSelector} from "../hooks";
import {getMessage} from "../lang";

interface MenuIconsTaskProps {
    toggleMenu: () => void,
    toggleDocumentation: () => void,
}

export function MenuIconsTask(props: MenuIconsTaskProps) {
    const [subtitlesOpen, setSubtitlesOpen] = useState(false);
    const subtitles = useAppSelector(state => state.subtitles);
    const playerData = useAppSelector(state => state.player.data);
    const showSubtitles = !subtitles.editing && playerData && playerData.subtitles && !!playerData.subtitles.length;
    const showDocumentation = useAppSelector(state => state.options.showDocumentation);
    const showFullScreen = useAppSelector(state => state.options.showFullScreen);
    const showMenu = useAppSelector(state => state.options.showMenu);

    return (
        <div id='menu'>
            <div className="menu-task-elements">
                {showFullScreen && <div className="menu-task-element is-blue">
                    <FullscreenButton />
                </div>}
                {showSubtitles &&
                    <div className="menu-task-element">
                      <Button
                        onClick={() => setSubtitlesOpen(!subtitlesOpen)}
                        className='btn-cc'
                        title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}
                        text='CC'
                      />
                      <SubtitlesPopup open={subtitlesOpen} onClose={() => setSubtitlesOpen(false)}/>
                    </div>
                }
                {showDocumentation && <div className="menu-task-element is-blue">
                    <Button onClick={props.toggleDocumentation} icon='help'/>
                </div>}
                {showMenu && <div className="menu-task-element">
                    <Button onClick={props.toggleMenu} icon='menu'/>
                </div>}
            </div>
        </div>
    );
}
