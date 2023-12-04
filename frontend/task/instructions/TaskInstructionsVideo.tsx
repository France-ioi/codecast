import React, {useState} from 'react';

export interface TaskInstructionsVideoProps {
    url: string,
    style: React.CSSProperties,
    children: JSX.Element | JSX.Element[],
}

export function TaskInstructionsVideo(props: TaskInstructionsVideoProps) {
    const {url, style} = props;

    const [videoShown, setVideoShown] = useState(false);

    const onClick = () => {
        setVideoShown(true);
    };

    return (
        <div className={`task-instructions-video ${videoShown ? 'is-shown' : 'is-not-shown'}`} onClick={onClick}>
            {videoShown ?
                <video controls src={url} autoPlay style={style}/>
                :
                <div style={style}>
                    {props.children}
                </div>
            }
        </div>
    );
}
