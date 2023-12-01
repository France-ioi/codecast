/**
 * Whether we currently are in offline local mode (launch from zip).
 *
 * @returns {boolean}
 */
export const isLocalMode = () => {
    return (window.hasOwnProperty('CODECAST_OFFLINE'));
}

function randomIntFromInterval(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getRandomId(): string {
    let rand = String(randomIntFromInterval(100000, 999999999));
    rand += String(randomIntFromInterval(1000000, 999999999));

    return rand;
}

export class DeferredPromise<T> {
    public promise: Promise<T>;
    public resolve: (value?: T) => void;
    public reject: Function;

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
