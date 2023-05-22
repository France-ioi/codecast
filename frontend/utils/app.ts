/**
 * Whether we currently are in offline local mode (launch from zip).
 *
 * @returns {boolean}
 */
export const isLocalMode = () => {
    return (window.hasOwnProperty('CODECAST_OFFLINE'));
}

export class DeferredPromise<T> {
    public promise: Promise<T>;
    public resolve: (value: T) => void;
    public reject: Function;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
