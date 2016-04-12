
import React from 'react';
import {connect} from 'react-redux';
import {Button, Input} from 'react-bootstrap';
import EpicComponent from 'epic-component';

import actions from '../actions';

export const SaveScreen = EpicComponent(self => {

  const onUpload = function () {
    self.props.dispatch({type: actions.saveScreenUploadStart});
  };

  self.render = function () {
    const {audioUrl, eventsUrl, busy, done, prepare, uploadEvents, uploadAudio, error} = self.props;
    return (
      <div>
        <p>
          <Button onClick={onUpload} disabled={busy || done}>
            {busy
              ? <i className="fa fa-spin fa-spinner"/>
              : (done
                  ? <i className="fa fa-check"/>
                  : <i className="fa fa-floppy-o"/>)}
          </Button>
        </p>
        <p>
          <Input type="text" label="URL évènements" readOnly value={eventsUrl}/>
        </p>
        <p>
          <Input type="text" label="URL audio" readOnly value={audioUrl}/>
        </p>
        {prepare === 'pending' && <p>Préparation de l'enregistrement…</p>}
        {uploadEvents === 'pending' && <p>Envoi des évènements en cours…</p>}
        {uploadAudio === 'pending' && <p>Envoi de l'audio en cours…</p>}
        {error && <p>Une erreur est survenue lors de l'enregistrement.</p>}
        {done && <p>Enregistrement terminé !</p>}
      </div>
    );
  };

});

function selector (state, props) {
  const save = state.get('save')
  const result = {};
  ['audioUrl', 'eventsUrl', 'busy', 'done', 'prepare', 'uploadEvents', 'uploadAudio', 'error'].forEach(function (key) {
    result[key] = save.get(key);
  })
  return result;
};

export default connect(selector)(SaveScreen);
