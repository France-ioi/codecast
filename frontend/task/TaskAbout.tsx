import React from 'react';
import {getTaskMetadata} from "./platform/platform";
import {getMessage} from "../lang";
import {useAppSelector} from "../hooks";
import {AppStore} from "../store";

export const selectDisplayAbout = (state: AppStore) => {
    return state.task.currentTask || (state.player && state.player.data && state.player.data.version && Number(state.player.data.version.split('.')[0]) < 7);
}

export function TaskAbout() {
    const metadata = getTaskMetadata();

    const recordingVersion = useAppSelector(state => {
        if (state.player && state.player.data && state.player.data.version) {
            let versionComponents = state.player.data.version.split('.').map(Number);

            return versionComponents[0];
        }

        return null;
    });

    if (null !== recordingVersion && 7 > recordingVersion) {
        return (
            <div className="task-license">
                <p>Content authored by Petra Bonfert-Taylor (Dartmouth College) and Rémi Sharrock (Télécom Paris) under Creative Commons CC BY-NC-SA 3.0 license.</p>

                <img src={require('./about/logo_dartmouth.png').default}/>
                <img src={require('./about/logo_telecom_paris_tech.png').default}/>

                <hr/>

                <p>Codecast is developed by France-ioi under MIT License.</p>
            </div>
        );
    }

    return (
        <div className="task-license">
            {!!metadata.authors &&
              <React.Fragment>
                  <p>{getMessage('ABOUT_AUTHORS')}</p>
                  <p>{metadata.authors}</p>
                  {!!(metadata.translators && metadata.translators.length) &&
                    <React.Fragment>
                        <p>{getMessage('ABOUT_TRANSLATORS')}</p>
                        <p>{metadata.translators.join(', ')}</p>
                    </React.Fragment>
                  }
              </React.Fragment>
            }

            {!!metadata.license && <p>{getMessage('ABOUT_LICENSE')} {metadata.license}</p>}
            <p>{getMessage('ABOUT_CODECAST')}</p>
        </div>
    );
}
