/*global mock, converse */

const { sizzle, u } = converse.env;

describe("A Chat Message", function () {

    it("will render images from their URLs", mock.initConverse(['chatBoxesFetched'], {}, async function (done, _converse) {
        await mock.waitForRoster(_converse, 'current');
        const base_url = 'https://conversejs.org';
        let message = base_url+"/logo/conversejs-filled.svg";
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);
        spyOn(view.model, 'sendMessage').and.callThrough();
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-image').length, 1000)
        expect(view.model.sendMessage).toHaveBeenCalled();
        let msg = sizzle('.chat-content .chat-msg:last .chat-msg__text').pop();
        expect(msg.innerHTML.replace(/<!---->/g, '').trim()).toEqual(
            `<a class="chat-image__link" target="_blank" rel="noopener" href="${base_url}/logo/conversejs-filled.svg">`+
                `<img class="chat-image img-thumbnail" src="https://conversejs.org/logo/conversejs-filled.svg">`+
            `</a>`);

        message += "?param1=val1&param2=val2";
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-image').length === 2, 1000);
        expect(view.model.sendMessage).toHaveBeenCalled();
        msg = sizzle('.chat-content .chat-msg:last .chat-msg__text').pop();
        expect(msg.innerHTML.replace(/<!---->/g, '').trim()).toEqual(
            `<a class="chat-image__link" target="_blank" rel="noopener" href="${base_url}/logo/conversejs-filled.svg?param1=val1&amp;param2=val2">`+
                `<img class="chat-image img-thumbnail" src="${message.replace(/&/g, '&amp;')}">`+
            `</a>`);

        // Test now with two images in one message
        message += ' hello world '+base_url+"/logo/conversejs-filled.svg";
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-image').length === 4, 1000);
        expect(view.model.sendMessage).toHaveBeenCalled();
        msg = sizzle('.chat-content .chat-msg:last .chat-msg__text').pop();
        expect(msg.textContent.trim()).toEqual('hello world');
        expect(msg.querySelectorAll('img.chat-image').length).toEqual(2);

        // Configured image URLs are rendered
        _converse.api.settings.set('image_urls_regex', /^https?:\/\/(?:www.)?(?:imgur\.com\/\w{7})\/?$/i);
        message = 'https://imgur.com/oxymPax';
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-image').length === 5, 1000);
        expect(view.querySelectorAll('.chat-content .chat-image').length).toBe(5);

        // Check that the Imgur URL gets a .png attached to make it render
        await u.waitUntil(() => Array.from(view.querySelectorAll('.chat-content .chat-image')).pop().src.endsWith('png'), 1000);
        done();
    }));

    it("will render images from approved URLs only",
        mock.initConverse(
            ['chatBoxesFetched'], {'show_images_inline': ['conversejs.org']},
            async function (done, _converse) {

        await mock.waitForRoster(_converse, 'current');
        const base_url = 'https://conversejs.org';
        let message = 'https://imgur.com/oxymPax.png';
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);
        spyOn(view.model, 'sendMessage').and.callThrough();
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-msg').length === 1);

        message = base_url+"/logo/conversejs-filled.svg";
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-msg').length === 2, 1000);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-image').length === 1, 1000)
        expect(view.querySelectorAll('.chat-content .chat-image').length).toBe(1);
        done();
    }));

    it("will fall back to rendering images as URLs",
        mock.initConverse(
            ['chatBoxesFetched'], {},
            async function (done, _converse) {

        await mock.waitForRoster(_converse, 'current');
        const base_url = 'https://conversejs.org';
        const message = base_url+"/logo/non-existing.svg";
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);
        spyOn(view.model, 'sendMessage').and.callThrough();
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('.chat-content .chat-image').length, 1000)
        expect(view.model.sendMessage).toHaveBeenCalled();
        const msg = sizzle('.chat-content .chat-msg:last .chat-msg__text').pop();
        await u.waitUntil(() => msg.innerHTML.replace(/<!---->/g, '').trim() ==
            `<a target="_blank" rel="noopener" href="https://conversejs.org/logo/non-existing.svg">https://conversejs.org/logo/non-existing.svg</a>`, 1000);
        done();
    }));

    it("will fall back to rendering URLs that match image_urls_regex as URLs",
        mock.initConverse(
            ['rosterGroupsFetched', 'chatBoxesFetched'], {
                'show_images_inline': ['twimg.com'],
                'image_urls_regex': /^https?:\/\/(www.)?(pbs\.twimg\.com\/)/i
            },
            async function (done, _converse) {

        await mock.waitForRoster(_converse, 'current');
        const message = "https://pbs.twimg.com/media/string?format=jpg&name=small";
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);
        spyOn(view.model, 'sendMessage').and.callThrough();
        await mock.sendMessage(view, message);
        expect(view.model.sendMessage).toHaveBeenCalled();
        await u.waitUntil(() => view.querySelector('.chat-content .chat-msg'), 1000);
        const msg = view.querySelector('.chat-content .chat-msg .chat-msg__text');
        await u.waitUntil(() => msg.innerHTML.replace(/<!---->/g, '').trim() ==
            `<a target="_blank" rel="noopener" href="https://pbs.twimg.com/media/string?format=jpg&amp;name=small">https://pbs.twimg.com/media/string?format=jpg&amp;name=small</a>`, 1000);
        done();
    }));

    it("will respect a changed setting when re-rendered",
        mock.initConverse(
            ['chatBoxesFetched'], {'show_images_inline': true},
            async function (done, _converse) {

        const { api } = _converse;
        await mock.waitForRoster(_converse, 'current');
        const message = 'https://imgur.com/oxymPax.png';
        const contact_jid = mock.cur_names[0].replace(/ /g,'.').toLowerCase() + '@montague.lit';
        await mock.openChatBoxFor(_converse, contact_jid);
        const view = _converse.api.chatviews.get(contact_jid);
        await mock.sendMessage(view, message);
        await u.waitUntil(() => view.querySelectorAll('converse-chat-message-body .chat-image').length === 1);
        api.settings.set('show_images_inline', false);
        view.querySelector('converse-chat-message').requestUpdate();
        await u.waitUntil(() => view.querySelector('converse-chat-message-body .chat-image') === null);
        expect(true).toBe(true);
        done();
    }));
});
