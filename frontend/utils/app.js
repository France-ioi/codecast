/**
 * Whether we currently are in offline local mode (launch from zip).
 *
 * @returns {boolean}
 */
export const isLocalMode = () => {
    return (window.hasOwnProperty('CODECAST_OFFLINE'));
}
