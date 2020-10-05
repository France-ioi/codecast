export function toHtml (content) {
    // Sanitize and wrap html content.
    const el = document.createElement('div');
    el.innerHtml = `<div>${content}</div>`;
    return {__html: el.innerHtml};
}
