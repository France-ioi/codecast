import {
    BufferType,
    Document,
} from './buffer_types';
import { gzip, ungzip } from 'pako';
import {documentToString, TextBufferHandler} from './document';

function addBase64LineBreaks(s: string): string {
    // openssl base64 -d expects, by default, line breaks every 76 characters
    // (the -A option would also work in general)
    return s.match(/.{1,76}/g)?.join('\n') ?? s;
}

export function compressDocument(document: Document): Document {
    if (BufferType.Text !== document.type) {
        return document;
    }

    const answer = documentToString(document);
    const zipped = gzip(answer);
    const base64String = addBase64LineBreaks(btoa(Array.from(new Uint8Array(zipped), b => String.fromCharCode(b)).join('')));

    return TextBufferHandler.documentFromString(base64String);
}

export function uncompressDocument(document: Document): Document {
    const base64String = documentToString(document);
    const bytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    const unzipped = ungzip(bytes);
    const value = String.fromCharCode(...unzipped);

    return TextBufferHandler.documentFromString(value);
}