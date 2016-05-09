
import React from 'react';
import {Button, Input} from 'react-bootstrap';
import EpicComponent from 'epic-component';

export default function (m) {

  const {actions} = m;

  m.view('SaveScreen', EpicComponent(self => {

    const onUpload = function () {
      self.props.dispatch({type: actions.saveScreenUploadStart});
    };

    self.render = function () {
      const {audioUrl, eventsUrl, playerUrl, busy, done, prepare, uploadEvents, uploadAudio, error} = self.props;
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
          {done &&
            <div>
              <p>Enregistrement terminé !</p>
              <Input type="text" label="Lien pour la lecture" readOnly value={playerUrl}/>
            </div>}
        </div>
      );
    };

  }));

};
