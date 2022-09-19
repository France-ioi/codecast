/**
 * Whether we currently are in offline local mode (launch from zip).
 *
 * @returns {boolean}
 */
export const isLocalMode = () => {
    return (window.hasOwnProperty('CODECAST_OFFLINE'));
}

export class DeferredPromise {
    public promise: Promise<unknown>;
    public resolve: Function;
    public reject: Function;

    constructor() {
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}