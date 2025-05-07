import {
    BufferType,
    Document,
} from './buffer_types';
import { gzip, ungzip } from 'pako';
import {documentToString, TextBufferHandler} from './document';

export function compressDocument(document: Document): Document {
    if (BufferType.Text !== document.type) {
        return document;
    }

    const answer = documentToString(document);
    const zipped = gzip(answer);
    const base64String = btoa(String.fromCharCode(...new Uint8Array(zipped)));

    return TextBufferHandler.documentFromString(base64String);
}

export function uncompressDocument(document: Document) {
    const base64String = documentToString(document);
    const bytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    const unzipped = ungzip(bytes);
    const value = String.fromCharCode(...unzipped);

    return TextBufferHandler.documentFromString(value);
}

