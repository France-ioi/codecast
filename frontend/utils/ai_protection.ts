import {useEffect, useState} from 'react';
import {useAppSelector} from '../hooks';
import { createContext } from 'react';
import {callPlatformLog} from '../submission/submission_actions';
import {useDispatch} from 'react-redux';

export enum AiProtectionStatus {
    Ok = 'ok',
    NoFocus = 'no_focus',
    NoFullScreen = 'no_full_screen',
}

export const AiProtectionContext = createContext(AiProtectionStatus.Ok);

const AI_PROTECTION_CHECK_FOCUS_INTERVAL = 200; // ms
export const AI_PROTECTION_CLIPBOARD_KEY = 'aiProtectionClipboard';

// SHA-256 of the bypass code, kept as a hash so the code can't be recovered by reading the source.
const AI_PROTECTION_BYPASS_CODE_HASH = 'd4d58d4b8edc0fb2a897a678705052b8d543e924005bd33a751f69c31b4f84e8';
const AI_PROTECTION_BYPASS_CODE_LENGTH = 18;

async function sha256Hex(text: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));

    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function writeStoredClipboard(value: string): void {
    try {
        localStorage.setItem(AI_PROTECTION_CLIPBOARD_KEY, value);
    } catch (e) {
    }
}

function getSelectedText(): string {
    const selection = (window.getSelection ? window.getSelection() : document.getSelection());

    return selection ? selection.toString() : '';
}

// Replace the current selection with `text` in a way that works across browsers. Passing an
// empty string deletes the selection (used to perform a cut manually). execCommand is unreliable
// outside contenteditable (and unsupported in some older browsers), so inputs and textareas are
// handled manually.
function replaceSelection(text: string): void {
    const active = document.activeElement as (HTMLInputElement | HTMLTextAreaElement | null);

    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        const value = active.value;
        const start = active.selectionStart ?? value.length;
        const end = active.selectionEnd ?? value.length;

        if (typeof active.setRangeText === 'function') {
            active.setRangeText(text, start, end, 'end');
        } else {
            active.value = value.slice(0, start) + text + value.slice(end);
            const caret = start + text.length;
            active.setSelectionRange(caret, caret);
        }

        // Notify frameworks/listeners (e.g. React) that the field value changed.
        active.dispatchEvent(new Event('input', {bubbles: true}));

        return;
    }

    // Contenteditable / rich-text targets: execCommand is the broadest-support option.
    if (typeof document.execCommand === 'function') {
        if (text) {
            document.execCommand('insertText', false, text);
        } else {
            document.execCommand('delete');
        }
    }
}

export function useAiProtection(): AiProtectionStatus {
    const [hasFocus, setHasFocus] = useState(() => document.hasFocus());
    const [bypass, setBypass] = useState(false);
    const dispatch = useDispatch();

    const aiProtectionOptions = useAppSelector(state => state.task.currentTask?.gridInfos?.aiProtection ?? {});
    const fullScreenActive = useAppSelector(state => state.fullscreen.active);

    const handleContextMenu = e => {
        e.preventDefault();
    };

    const logAiProtection = (details: any) => {
        dispatch(callPlatformLog(['ai_protection', details], 'force'));
    };

    useEffect(() => {
        if (aiProtectionOptions.logFullScreen) {
            logAiProtection(fullScreenActive ? 'fullscreen_on' : 'fullscreen_off');
        }
    }, [fullScreenActive]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (aiProtectionOptions.logFocus || aiProtectionOptions.forceFocus) {
            interval = setInterval(() => {
                const newFocus = document.hasFocus();
                if (newFocus !== hasFocus && aiProtectionOptions.logFocus) {
                    logAiProtection(newFocus ? 'focus_in' : 'focus_out');
                }
                setHasFocus(newFocus);
            }, AI_PROTECTION_CHECK_FOCUS_INTERVAL);
        }

        if (aiProtectionOptions.disableRightClickMenu) {
            document.addEventListener('contextmenu', handleContextMenu);
        }

        // Intercept copy: store the selection in localStorage, but keep it out of the clipboard.
        const handleCopy = (e: ClipboardEvent) => {
            const selection = getSelectedText();
            if (selection) {
                writeStoredClipboard(selection);
            }
            // Prevent the browser from writing the selection to the system clipboard.
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', '');
            }
        };

        let lastTyped = [];
        const handleUserKeyPress = (e) => {
            lastTyped.push(e.key);
            lastTyped = lastTyped.slice(Math.max(0, lastTyped.length - AI_PROTECTION_BYPASS_CODE_LENGTH), lastTyped.length);
            if (lastTyped.length === AI_PROTECTION_BYPASS_CODE_LENGTH) {
                sha256Hex(lastTyped.join('')).then(hash => {
                    if (hash === AI_PROTECTION_BYPASS_CODE_HASH) {
                        setBypass(true);
                    }
                });
            }
        };

        // Intercept cut: keep it out of the system clipboard (store it instead) but still
        // let the selected text be removed, which we must do ourselves since preventDefault
        // also cancels the native deletion.
        const handleCut = (e: ClipboardEvent) => {
            const selection = getSelectedText();
            if (selection) {
                writeStoredClipboard(selection);
            }
            e.preventDefault();
            if (e.clipboardData) {
                e.clipboardData.setData('text/plain', '');
            }
            if (selection) {
                replaceSelection('');
            }
        };

        if (aiProtectionOptions.disableExternalCopyPaste) {
            document.addEventListener('copy', handleCopy);
            document.addEventListener('cut', handleCut);
        }

        window.addEventListener('keypress', handleUserKeyPress);

        return () => {
            clearInterval(interval);

            if (aiProtectionOptions.disableRightClickMenu) {
                document.removeEventListener('contextmenu', handleContextMenu);
            }

            if (aiProtectionOptions.disableExternalCopyPaste) {
                document.removeEventListener('copy', handleCopy);
                document.removeEventListener('cut', handleCut);
            }

            window.removeEventListener("keydown", handleUserKeyPress);
        };
    }, [aiProtectionOptions, fullScreenActive, hasFocus]);

    if (bypass) {
        return AiProtectionStatus.Ok;
    }

    if (aiProtectionOptions.forceFullScreen && !fullScreenActive) {
        return AiProtectionStatus.NoFullScreen;
    }

    if (aiProtectionOptions.forceFocus && !hasFocus) {
        return AiProtectionStatus.NoFocus;
    }

    return AiProtectionStatus.Ok;
}
