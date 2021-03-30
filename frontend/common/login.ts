import {ActionTypes} from "./actionTypes";
import {AppStore} from "../store";
import {Bundle} from "../linker";

export interface User {
    id: number,
    login: string,
    grants: {
        description: string,
        url: string,
        type: 's3',
        s3Bucket: string,
        s3Region: string,
        uploadPath: string
    }[]
}

export const initialStateUser = false as User | false;

export default function(bundle: Bundle) {
    bundle.defineAction(ActionTypes.LoginFeedback);
    bundle.addReducer(ActionTypes.LoginFeedback, (state: AppStore, {payload: {user, error}}): void => {
        if (!error) {
            window.localStorage.setItem('user', JSON.stringify(user));

            state.user = user;
        }
    });

    bundle.defineAction(ActionTypes.LogoutFeedback);
    bundle.addReducer(ActionTypes.LogoutFeedback, (state: AppStore): void => {
        window.localStorage.setItem('user', '');

        state.user = initialStateUser;
    });
}
