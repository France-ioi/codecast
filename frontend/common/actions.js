
export const init = {
  type: 'System.Init',
  descr: "Sent when the application initializes."
};

export const error = {
  type: 'System.Error',
  descr: "Sent when a generic error has occurred."
};

export const switchToScreen = {
  type: 'System.SwitchToScreen',
  descr: "Switch to the specified screen."
};

export const sourceInit = 'Source.Init';
export const sourceEdit = 'Source.Edit';
export const sourceSelect = 'Source.Select';
export const sourceScroll = 'Source.Scroll';

export const inputInit = 'Input.Init';
export const inputEdit = 'Input.Edit';
export const inputSelect = 'Input.Select';
export const inputScroll = 'Input.Scroll';
