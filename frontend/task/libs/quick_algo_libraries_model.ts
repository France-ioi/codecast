import {QuickAlgoLibrary} from './quickalgo_library';
import {AppStore} from '../../store';
import {App} from '../../app_types';
import {getCurrentImmerState} from '../utils';

export class QuickAlgoLibraries {
    libraries: { [name: string]: { [environment: string]: QuickAlgoLibrary } } = {};

    addLibrary(library: QuickAlgoLibrary, name: string, environment: string) {
        if (!(name in this.libraries)) {
            this.libraries[name] = {};
        }
        this.libraries[name][environment] = library;
    }

    getContext(name: string = null, environment: string): QuickAlgoLibrary {
        if (name in this.libraries) {
            return this.libraries[name][environment];
        }

        return Object.keys(this.libraries).length ? this.libraries[Object.keys(this.libraries)[0]][environment] : null;
    }

    getMainContextName(environment: string): string|null {
        return Object.keys(this.libraries).length ? Object.keys(this.libraries)[0] : null;
    }

    unloadContext(environment: string): void {
        for (let name of Object.keys(this.libraries)) {
            const context = this.libraries[name][environment];
            if (context) {
                context.unload();
                delete this.libraries[name][environment];
            }
        }
    }

    reset(taskInfos = null, appState: AppStore = null) {
        this.applyOnLibraries('reset', [taskInfos, appState]);
    }

    applyOnLibraries(method, args) {
        for (let library of this.getAllLibraries()) {
            library[method].apply(library, args);
        }
    }

    getVisualization() {
        for (let library of this.getAllLibraries()) {
            if (library.getComponent()) {
                return library.getComponent();
            }
        }

        return null;
    }

    getSagas(app: App, environment: string) {
        const sagas = [];
        for (let library of this.getAllLibraries(environment)) {
            const librarySagas = library.getSaga(app);
            if (librarySagas) {
                sagas.push(librarySagas);
            }
        }

        return sagas;
    }

    getEventListeners() {
        let listeners = {} as { [key: string]: { module: string, method: string } };
        for (let [module, libraries] of Object.entries(this.libraries)) {
            for (let library of Object.values(libraries)) {
                const libraryListeners = library.getEventListeners();
                if (libraryListeners && Object.keys(libraryListeners).length) {
                    for (let [eventName, method] of Object.entries(libraryListeners)) {
                        listeners[eventName] = {module, method};
                    }
                }
            }
        }

        return listeners;
    }

    getAllLibraries(environment: string = null): QuickAlgoLibrary[] {
        if (environment) {
            return Object.values(this.libraries).reduce((prev, libs) => [...prev, ...(environment in libs ? [libs[environment]] : [])], []);
        } else {
            return Object.values(this.libraries).reduce((prev, libs) => [...prev, ...Object.values(libs)], []);
        }
    }

    getAllLibrariesByName(environment: string = null): {[name: string]: QuickAlgoLibrary} {
        const libraries = {};
        for (let name of Object.keys(this.libraries)) {
            if (!(environment in this.libraries[name])) {
                continue;
            }
            libraries[name] = this.libraries[name][environment];
        }

        return libraries;
    }

    getLibrariesInnerState(environment: string = null) {
        const innerState = {};
        for (let [name, library] of Object.entries(this.getAllLibrariesByName(environment))) {
            if (library.implementsInnerState()) {
                innerState[name] = getCurrentImmerState(library.getInnerState());
            }
        }

        return innerState;
    }
}

export const quickAlgoLibraries = new QuickAlgoLibraries();
window.quickAlgoLoadedLibraries = quickAlgoLibraries;
window.quickAlgoResponsive = true;
