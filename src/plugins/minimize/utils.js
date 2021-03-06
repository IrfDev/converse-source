import { _converse, api, converse } from '@converse/headless/core';
import { __ } from 'i18n';

const u = converse.env.utils;


function getChatBoxWidth (view) {
    if (view.model.get('id') === 'controlbox') {
        // We return the width of the controlbox or its toggle,
        // depending on which is visible.
        if (u.isVisible(view)) {
            return u.getOuterWidth(view, true);
        } else {
            return u.getOuterWidth(_converse.controlboxtoggle.el, true);
        }
    } else if (!view.model.get('minimized') && u.isVisible(view)) {
        return u.getOuterWidth(view, true);
    }
    return 0;
}

function getShownChats () {
    return _converse.chatboxviews.filter(el =>
        // The controlbox can take a while to close,
        // so we need to check its state. That's why we checked the 'closed' state.
        !el.model.get('minimized') && !el.model.get('closed') && u.isVisible(el)
    );
}

function getMinimizedWidth () {
    const minimized_el = _converse.minimized_chats?.el;
    return _converse.chatboxes.pluck('minimized').includes(true) ? u.getOuterWidth(minimized_el, true) : 0;
}

function getBoxesWidth (newchat) {
    const new_id = newchat ? newchat.model.get('id') : null;
    const newchat_width = newchat ? u.getOuterWidth(newchat.el, true) : 0;
    return Object.values(_converse.chatboxviews.xget(new_id))
        .reduce((memo, view) => memo + getChatBoxWidth(view), newchat_width);
}

/**
 * This method is called when a newly created chat box will be shown.
 * It checks whether there is enough space on the page to show
 * another chat box. Otherwise it minimizes the oldest chat box
 * to create space.
 * @private
 * @method _converse.ChatBoxViews#trimChats
 * @param { _converse.ChatBoxView|_converse.ChatRoomView|_converse.ControlBoxView|_converse.HeadlinesBoxView } [newchat]
 */
export async function trimChats (newchat) {
    if (_converse.isTestEnv() || api.settings.get('no_trimming') || !api.connection.connected() || api.settings.get("view_mode") !== 'overlayed') {
        return;
    }
    const shown_chats = getShownChats();
    if (shown_chats.length <= 1) {
        return;
    }
    const body_width = u.getOuterWidth(document.querySelector('body'), true);
    if (getChatBoxWidth(shown_chats[0]) === body_width) {
        // If the chats shown are the same width as the body,
        // then we're in responsive mode and the chats are
        // fullscreen. In this case we don't trim.
        return;
    }
    await api.waitUntil('minimizedChatsInitialized');
    const minimized_el = _converse.minimized_chats?.el;
    if (minimized_el) {
        while ((getMinimizedWidth() + getBoxesWidth(newchat)) > body_width) {
            const new_id = newchat ? newchat.model.get('id') : null;
            const oldest_chat = getOldestMaximizedChat([new_id]);
            if (oldest_chat) {
                // We hide the chat immediately, because waiting
                // for the event to fire (and letting the
                // ChatBoxView hide it then) causes race
                // conditions.
                const view = _converse.chatboxviews.get(oldest_chat.get('id'));
                if (view) {
                    view.hide();
                }
                minimize(oldest_chat);
            } else {
                break;
            }
        }
    }
}

function getOldestMaximizedChat (exclude_ids) {
    // Get oldest view (if its id is not excluded)
    exclude_ids.push('controlbox');
    let i = 0;
    let model = _converse.chatboxes.sort().at(i);
    while (exclude_ids.includes(model.get('id')) || model.get('minimized') === true) {
        i++;
        model = _converse.chatboxes.at(i);
        if (!model) {
            return null;
        }
    }
    return model;
}

export function addMinimizeButtonToChat (view, buttons) {
    const data = {
        'a_class': 'toggle-chatbox-button',
        'handler': ev => minimize(ev, view.model),
        'i18n_text': __('Minimize'),
        'i18n_title': __('Minimize this chat'),
        'icon_class': "fa-minus",
        'name': 'minimize',
        'standalone': _converse.api.settings.get("view_mode") === 'overlayed'
    }
    const names = buttons.map(t => t.name);
    const idx = names.indexOf('close');
    return idx > -1 ? [...buttons.slice(0, idx), data, ...buttons.slice(idx)] : [data, ...buttons];
}

export function addMinimizeButtonToMUC (view, buttons) {
    const data = {
        'a_class': 'toggle-chatbox-button',
        'handler': ev => minimize(ev, view.model),
        'i18n_text': __('Minimize'),
        'i18n_title': __('Minimize this groupchat'),
        'icon_class': "fa-minus",
        'name': 'minimize',
        'standalone': _converse.api.settings.get("view_mode") === 'overlayed'
    }
    const names = buttons.map(t => t.name);
    const idx = names.indexOf('signout');
    return idx > -1 ? [...buttons.slice(0, idx), data, ...buttons.slice(idx)] : [data, ...buttons];
}


export function maximize (ev, chatbox) {
    if (ev?.preventDefault) {
        ev.preventDefault();
    } else {
        chatbox = ev;
    }
    u.safeSave(chatbox, {
        'hidden': false,
        'minimized': false,
        'time_opened': new Date().getTime()
    });
}

export function minimize (ev, model) {
    if (ev?.preventDefault) {
        ev.preventDefault();
    } else {
        model = ev;
    }
    // save the scroll position to restore it on maximize
    const view = _converse.chatboxviews.get(model.get('jid'));
    const scroll = view.querySelector('.chat-content__messages')?.scrollTop;
    if (scroll) {
        if (model.collection && model.collection.browserStorage) {
            model.save({ scroll });
        } else {
            model.set({ scroll });
        }
    }
    model.setChatState(_converse.INACTIVE);
    u.safeSave(model, {
        'hidden': true,
        'minimized': true,
        'time_minimized': new Date().toISOString()
    });
}

/**
 * Handler which gets called when a {@link _converse#ChatBox} has it's
 * `minimized` property set to false.
 *
 * Will trigger {@link _converse#chatBoxMaximized}
 * @returns {_converse.ChatBoxView|_converse.ChatRoomView}
 */
function onMaximized (model) {
    if (!model.isScrolledUp()) {
        model.clearUnreadMsgCounter();
    }
    model.setChatState(_converse.ACTIVE);
    /**
     * Triggered when a previously minimized chat gets maximized
     * @event _converse#chatBoxMaximized
     * @type { _converse.ChatBoxView }
     * @example _converse.api.listen.on('chatBoxMaximized', view => { ... });
     */
    api.trigger('chatBoxMaximized', model);
}

/**
 * Handler which gets called when a {@link _converse#ChatBox} has it's
 * `minimized` property set to true.
 *
 * Will trigger {@link _converse#chatBoxMinimized}
 * @returns {_converse.ChatBoxView|_converse.ChatRoomView}
 */
function onMinimized (model) {
    /**
     * Triggered when a previously maximized chat gets Minimized
     * @event _converse#chatBoxMinimized
     * @type { _converse.ChatBoxView }
     * @example _converse.api.listen.on('chatBoxMinimized', view => { ... });
     */
    api.trigger('chatBoxMinimized', model);
}

export function onMinimizedChanged (model) {
    if (model.get('minimized')) {
        onMinimized(model);
    } else {
        onMaximized(model);
    }
}
