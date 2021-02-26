The *addReduder* function uses *immer* internally, so all reducers are written by mutating the state.

The same apply to event played from records, with the exceptions of *stepper.restart*, *stepper.step*, *stepper.progress* and *stepper.idle* events.'

For replays, a subset of the store is used. Its type is *AppStoreReplay*. The main application store is of type *AppStore*, which extends *AppStoreReplay*.

Performance tricks for immer : https://immerjs.github.io/immer/docs/performance#pre-freeze-data
Especially the given ones :
- When you add a large object to the state, freeze it if you can
- Use original() if you need to perform expensive search on the state

Immer is currently not used for C/arduino effects and builtins.
