import React from 'react';
import {getTaskMetadata} from "./platform/platform";
import {getMessage} from "../lang";

export function TaskAbout() {
    const metadata = getTaskMetadata();

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
