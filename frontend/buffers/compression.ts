import {
    BufferType,
    Document,
} from './buffer_types';
import gzip from 'gzip-js';
import {documentToString, TextBufferHandler} from './document';

export function compressDocument(document: Document): Document {
    if (BufferType.Text !== document.type) {
        return document;
    }

    console.log('ici');
    const answer = documentToString(document);
    const zipped = gzip.zip(answer);
    const base64String = btoa(String.fromCharCode(...new Uint8Array(zipped)));
    console.log({zipped, base64String})

    return TextBufferHandler.documentFromString(base64String);
}

export function uncompressDocument(document: Document) {
    const base64String = documentToString(document);
    const bytes = Uint8Array.from(atob(base64String), c => c.charCodeAt(0));
    const unzipped = gzip.unzip(bytes);
    const value = unzipped.map(a => String.fromCharCode(a)).join('');
    console.log({base64String, unzipped, bytes, value})

    return TextBufferHandler.documentFromString(value);
}

