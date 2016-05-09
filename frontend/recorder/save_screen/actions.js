
export default function (m) {

  m.action('saveScreenUploadStart', 'Save.Prepare.Start');
  m.action('saveScreenPreparing', 'Save.Prepare.Pending');
  m.action('saveScreenPrepared', 'Save.Prepare.Completed');
  m.action('saveScreenEventsUploading', 'Save.Events.Upload.Pending');
  m.action('saveScreenEventsUploaded', 'Save.Events.Upload.Success');
  m.action('saveScreenAudioUploading', 'Save.Audio.Upload.Pending');
  m.action('saveScreenAudioUploaded', 'Save.Audio.Upload.Success');
  m.action('saveScreenUploadSucceeded', 'Save.Success');
  m.action('saveScreenUploadFailed', 'Save.Failure');

};
