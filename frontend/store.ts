import {Store} from "redux";
import {Map} from 'immutable';

export interface AppStore extends Store, Map<string, any> {

}
