// Coordinate normal reload fades; gesture refreshes keep the current document.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

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

async function reloadPage(event, knownReload) {
    const url = new URL(event.request.url);
    url.hash = '';
    const clientID = event.clientId || event.replacesClientId;
    let client = clientID ? await self.clients.get(clientID) : undefined;
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
            if (matches.length === 1)
                client = matches[0].client;
        }
    }

    const mode = client && await messageClient(client,
        knownReload ? 'site-reload-mode' : 'site-reload-gesture', url.href);
    if (mode === 'unchanged') {
        const refresh = fetch(event.request).catch(() => {});
        // Chromium can start dismissing its indicator while the request runs.
        client.postMessage({type: 'site-reload-complete', url: url.href});
        await refresh;
        return new Response(null, {status: 204, headers: {'Cache-Control': 'no-store'}});
    }
    // Fetch first: a failed request must not leave the current page covered.
    const response = await fetch(event.request);
    if (knownReload && response.ok && client)
        await messageClient(client, 'site-reload-cover', url.href, 1000);
    return response;
}

self.addEventListener('fetch', event => {
    if (event.request.mode !== 'navigate')
        return;
    const reload = event.request.isReloadNavigation ?? event.isReload;
    const knownReload = reload === true || (reload === undefined &&
        ['reload', 'no-cache'].includes(event.request.cache));
    // WebKit's native refresh can arrive as an ordinary document request.
    const possibleWebKitReload = reload === undefined && event.request.cache === 'default' &&
        event.request.destination === 'document' && !event.request.referrer &&
        navigator.userAgent.includes('AppleWebKit') && !navigator.userAgent.includes('Chrome/');
    if (knownReload || possibleWebKitReload)
        event.respondWith(reloadPage(event, knownReload));
});
