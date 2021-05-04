import { _converse, api } from '@converse/headless/core';
import { component } from 'haunted';
import { html } from 'lit-html';

export const ConverseBrandByline = () => {
    const is_fullscreen = api.settings.get('view_mode') === 'fullscreen';
    return html`
        ${is_fullscreen ? html`` : ''}
    `;
};

api.elements.define('converse-brand-byline', component(ConverseBrandByline, { 'useShadowDOM': false }));
