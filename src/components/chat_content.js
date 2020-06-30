import "../components/message-history";
import xss from "xss/dist/xss";
import { CustomElement } from './element.js';
import { html } from 'lit-element';
import { unsafeHTML } from 'lit-html/directives/unsafe-html.js';


class ChatContent extends CustomElement {

    static get properties () {
        return {
            chatview: { type: Object},
            messages: { type: Array},
            notifications: { type: String }
        }
    }

    render () {
        const notifications = xss.filterXSS(this.notifications, {'whiteList': {}});
        return html`
            <converse-message-history
                .chatview=${this.chatview}
                .messages=${this.messages}>
            </converse-message-history>
            <div class="chat-content__notifications">${unsafeHTML(notifications)}</div>
        `;
    }
}

customElements.define('converse-chat-content', ChatContent);
