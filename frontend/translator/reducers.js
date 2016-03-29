
import {loadTranslated} from './utils';

export function translateSourceSucceeded (state, action) {
  const {source, syntaxTree} = action;
  const translated = loadTranslated(source, syntaxTree);
  return {...state, translated};
};
