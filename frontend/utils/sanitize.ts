export function toHtml(content) {
    // Sanitize and wrap html content.
    const el = document.createElement('div');
    el.innerHTML = `<div>${content}</div>`;
    return {__html: el.innerHTML};
}
