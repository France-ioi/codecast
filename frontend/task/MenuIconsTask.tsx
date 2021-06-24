import React, {useState} from 'react';
import {Button} from '@blueprintjs/core';
import {FullscreenButton} from "../common/FullscreenButton";
import {SubtitlesPopup} from "../subtitles/SubtitlesPopup";
import {useAppSelector} from "../hooks";

interface MenuIconsTaskProps {
    toggleMenu: () => void,
}

export function MenuIconsTask(props: MenuIconsTaskProps) {
    const getMessage = useAppSelector(state => state.getMessage);
    const [subtitlesOpen, setSubtitlesOpen] = useState(false);

    return (
        <div id='menu'>
            <div className="menu-task-elements">
                <div className="menu-task-element is-blue">
                    <FullscreenButton />
                </div>
                <div className="menu-task-element">
                    <Button
                        onClick={() => setSubtitlesOpen(!subtitlesOpen)}
                        className='btn-cc'
                        title={getMessage('CLOSED_CAPTIONS_TOOLTIP').s}
                        text='CC'
                    />
                    <SubtitlesPopup open={subtitlesOpen} onClose={() => setSubtitlesOpen(false)}/>
                </div>
                <div className="menu-task-element">
                    <Button onClick={props.toggleMenu} icon='menu'/>
                </div>
            </div>
        </div>
    );
}
