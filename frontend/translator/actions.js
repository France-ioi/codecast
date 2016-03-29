
export const translateSource = {
  type: 'Translator.Translate',
  description: "Requested translation of given {source}."
};

export const translateSourceSucceeded = {
  type: 'Translator.Translate.Succeeded',
  description: "Succeeded translating {source} to {syntaxTree}."
};

export const translateSourceFailed = {
  type: 'Translator.Translate.Failed',
  description: "Failed to translate {source} with {error}."
};
