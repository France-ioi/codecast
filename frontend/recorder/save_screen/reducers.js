
export const saveScreenUploadStart = function (state, action) {
  return state.setIn(['save', 'busy'], true);
};

export const saveScreenPreparing = function (state, action) {
  return state.setIn(['save', 'prepare'], 'pending');
};

export const saveScreenPrepared = function (state, action) {
  return state.setIn(['save', 'prepare'], 'done');
};

export const saveScreenEventsUploading = function (state, action) {
  return state.setIn(['save', 'uploadEvents'], 'pending');
};

export const saveScreenEventsUploaded = function (state, action) {
  return state.update('save', save => save
    .set('uploadEvents', 'done').set('eventsUrl', action.url));
};

export const saveScreenAudioUploading = function (state, action) {
  return state.setIn(['save', 'uploadAudio'], 'pending');
};

export const saveScreenAudioUploaded = function (state, action) {
  return state.update('save', save => save
    .set('uploadAudio', 'done').set('audioUrl', action.url));
};

export const saveScreenUploadSucceeded = function (state, action) {
  // TODO: set recording id or URL.
  return state.update('save', save => save
    .set('busy', false).set('done', true).set('playerUrl', action.url));
};

export const saveScreenUploadFailed = function (state, action) {
  return state.update('save', save => save
    .set('busy', false).set('error', action.error));
};
