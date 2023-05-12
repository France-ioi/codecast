import {TypedUseSelectorHook, useSelector} from 'react-redux'
import type {AppStore} from './store'
// eslint-disable-next-line
import {SelectEffect, Tail} from 'redux-saga/effects';
import {SagaGenerator, select} from 'typed-redux-saga';

export const useAppSelector: TypedUseSelectorHook<AppStore> = useSelector

export function appSelect(): SagaGenerator<AppStore, SelectEffect>;
export function appSelect<Fn extends (state: AppStore, ...args: any[]) => any>(
    selector?: Fn,
    ...args: Tail<Parameters<Fn>>
): SagaGenerator<ReturnType<Fn>, SelectEffect>;

export function appSelect(selector?: (state: AppStore, ...args: any[]) => any, ...args) {
    return undefined !== selector ? select(selector, ...args) : select();
}
