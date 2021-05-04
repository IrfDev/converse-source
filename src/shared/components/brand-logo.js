import { api } from '@converse/headless/core';
import { component } from 'haunted';
import { html } from 'lit-html';

export const ConverseBrandLogo = () => {
    const is_fullscreen = api.settings.get('view_mode') === 'fullscreen';
    return html`
        <div className="row justify-content-center">
            <a class="brand-heading d-block" target="_blank">
                <img class="img-fluid w-25" src="/images/staytus-logo-white.png" alt="" />
                <h4 class="text-light">
                    Welcome to the Hotelier Web Chat
                </h4>
            </a>
        </div>
    `;
};

api.elements.define('converse-brand-logo', component(ConverseBrandLogo, { 'useShadowDOM': false }));
