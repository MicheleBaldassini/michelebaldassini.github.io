// Coordinate normal reload fades; gesture refreshes keep the current document.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const restartResponses = new Map();

function canReplaceDocument(response) {
    return response?.type === 'opaqueredirect' ||
        (response?.ok && ![204, 205].includes(response.status));
}

function messageClient(client, type, url, wait = 400) {
    return new Promise(resolve => {
        const channel = new MessageChannel();
        const finish = value => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve(value);
        };
        const timeout = setTimeout(() => finish(null), wait);
        channel.port1.onmessage = event => finish(event.data);
        try {
            client.postMessage({type, url}, [channel.port2]);
        } catch (error) {
            finish(null);
        }
    });
}

async function reloadPage(event, knownReload, modeRequest) {
    const url = new URL(event.request.url);
    url.hash = '';
    const clientID = event.clientId || event.replacesClientId;
    let client = clientID ? await self.clients.get(clientID) : undefined;
    let mode;
    if (!client) {
        // Client.url keeps the initial document URL after an internal navigation.
        // Firefox also omits the outgoing client ID, so ask the pages themselves.
        const clients = await self.clients.matchAll({type: 'window'});
        if (clients.length === 1) {
            client = clients[0];
        } else {
            const locations = await Promise.all(clients.map(async client => ({
                client, url: await messageClient(client, 'site-reload-url')
            })));
            const matches = locations.filter(candidate => candidate.url === url.href);
            if (matches.length === 1) {
                client = matches[0].client;
            } else if (!knownReload && matches.length > 1) {
                const candidates = await Promise.all(matches.map(async ({client}) => ({
                    client, mode: await messageClient(client, 'site-reload-desktop', url.href)
                })));
                const confirmed = candidates.filter(({mode}) =>
                    ['restart', 'prepared', 'address-reentry'].includes(mode));
                if (confirmed.length === 1)
                    ({client, mode} = confirmed[0]);
            }
        }
    }

    if (client && mode === undefined)
        mode = await messageClient(client, modeRequest, url.href);
    if (mode === 'restart') {
        try {
            const response = await fetch(event.request);
            if (canReplaceDocument(response)) {
                // Finish reading the document before WebKit cancels the first navigation.
                if (response.body)
                    await response.clone().arrayBuffer();
                const pending = {url: url.href, response};
                restartResponses.set(client.id, pending);
                setTimeout(() => {
                    if (restartResponses.get(client.id) === pending)
                        restartResponses.delete(client.id);
                }, 5000);
                client.postMessage({type: 'site-reload-restart', url: url.href});
            }
        } catch (error) {
            // Leave the current page visible if the document could not be fetched.
        }
        return new Response(null, {status: 204, headers: {'Cache-Control': 'no-store'}});
    }
    if (mode === 'prepared') {
        const pending = restartResponses.get(client.id);
        if (pending?.url === url.href) {
            restartResponses.delete(client.id);
            return pending.response;
        }
    }
    if (mode === 'unchanged') {
        const refresh = fetch(event.request).catch(() => {});
        // Chromium can start dismissing its indicator while the request runs.
        client.postMessage({type: 'site-reload-complete', url: url.href});
        await refresh;
        return new Response(null, {status: 204, headers: {'Cache-Control': 'no-store'}});
    }
    // Fetch first: a failed request must not leave the current page covered.
    const response = await fetch(event.request).catch(error => {
        if (mode !== 'prepared')
            throw error;
        return null;
    });
    if (mode === 'prepared' && !canReplaceDocument(response)) {
        client.postMessage({type: 'site-reload-cancel', url: url.href});
        return new Response(null, {status: 204, headers: {'Cache-Control': 'no-store'}});
    }
    if ((knownReload || mode === 'address-reentry') && mode !== 'prepared' &&
        response.ok && ![204, 205].includes(response.status) && client)
        await messageClient(client, 'site-reload-cover', url.href, 1000);
    return response;
}

self.addEventListener('fetch', event => {
    if (event.request.mode !== 'navigate')
        return;
    const reload = event.request.isReloadNavigation ?? event.isReload;
    const knownReload = reload === true || (reload === undefined &&
        ['reload', 'no-cache'].includes(event.request.cache));
    // Some browser controls send an ordinary document request for the current URL.
    const userAgent = navigator.userAgent;
    const chromium = userAgent.includes('Chrome/');
    const android = userAgent.includes('Android');
    const ordinaryDocument = event.request.cache === 'default' && event.request.destination === 'document';
    const possibleWebKitReload = ordinaryDocument && reload === undefined &&
        userAgent.includes('AppleWebKit') && !chromium &&
        (!event.request.referrer || userAgent.includes('Macintosh'));
    const possibleAddressReentry = ordinaryDocument && !event.request.referrer &&
        (chromium || (userAgent.includes('Firefox/') && !android));
    if (knownReload || possibleWebKitReload || possibleAddressReentry) {
        const checkDesktopDeparture = (possibleAddressReentry && !android) || event.request.referrer;
        const modeRequest = knownReload ? 'site-reload-mode' :
            (checkDesktopDeparture ? 'site-reload-desktop' : 'site-reload-gesture');
        event.respondWith(reloadPage(event, knownReload, modeRequest));
    }
});
