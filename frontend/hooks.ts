import {TypedUseSelectorHook, useSelector} from 'react-redux'
import type {AppStore} from './store'

export const useAppSelector: TypedUseSelectorHook<AppStore> = useSelector
