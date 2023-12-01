import {QuickalgoLibraryCall} from '../../stepper/api';
import log from 'loglevel';

class MainQuickAlgoLogger {
    private quickalgoLibraryCalls: QuickalgoLibraryCall[] = [];

    logQuickAlgoLibraryCall(quickalgoLibraryCall: QuickalgoLibraryCall) {
        log.getLogger('libraries').debug('LOG ACTION', quickalgoLibraryCall);
        this.quickalgoLibraryCalls.push(quickalgoLibraryCall);
    }

    clearQuickAlgoLibraryCalls() {
        log.getLogger('libraries').debug('clear quickalgo calls');
        this.quickalgoLibraryCalls = [];
    }

    getQuickAlgoLibraryCalls(): QuickalgoLibraryCall[] {
        log.getLogger('libraries').debug('get quickalgo calls', this.quickalgoLibraryCalls);
        return [...this.quickalgoLibraryCalls];
    }

    setQuickAlgoLibraryCalls(calls: QuickalgoLibraryCall[]) {
        this.quickalgoLibraryCalls = calls;
    }
}

export const mainQuickAlgoLogger = new MainQuickAlgoLogger();
