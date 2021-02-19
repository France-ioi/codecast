import {ActionTypes} from "./actionTypes";
import produce from "immer";
import {AppStore} from "../store";

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

export default function(bundle) {
    bundle.defineAction(ActionTypes.LoginFeedback);
    bundle.addReducer(ActionTypes.LoginFeedback, produce((draft: AppStore, {payload: {user, error}}): void => {
        if (!error) {
            window.localStorage.user = JSON.stringify(user);

            draft.user = user;
        }
    }));

    bundle.defineAction(ActionTypes.LogoutFeedback);
    bundle.addReducer(ActionTypes.LogoutFeedback, produce((draft: AppStore): void => {
        window.localStorage.user = '';

        draft.user = initialStateUser;
    }));
}
