The *addReduder* function uses *immer* internally, so all reducers are written by mutating the state.

For replays, a subset of the store is used. Its type is *AppStoreReplay*. The main application store is of type *AppStore*, which extends *AppStore*.

