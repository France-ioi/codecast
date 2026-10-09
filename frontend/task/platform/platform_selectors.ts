import {createSelector} from '@reduxjs/toolkit';
import jwt from 'jsonwebtoken';
import type {AppStore} from '../../store';
import type {TaskTokenPayload} from '../task_types';

// This selector lives apart from platform.ts, which is in an import cycle with the selectors of the
// submissions: it is evaluated when the module is loaded, so it must not depend on a module that
// may still be initializing
export const selectTaskTokenPayload = createSelector(
    [(state: AppStore) => state.platform.taskToken],
    (token): TaskTokenPayload|null => {
        if (!token) {
            return null;
        }

        return jwt.decode(token) as TaskTokenPayload;
    },
);
