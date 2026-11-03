// Coordinate the real outgoing fade with a reload; responses are never cached here.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

function currentClientURL(client) {
    return new Promise(resolve => {
        const channel = new MessageChannel();
        const finish = url => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve({client, url});
        };
        const timeout = setTimeout(() => finish(null), 400);
        channel.port1.onmessage = event => finish(event.data);
        try {
            client.postMessage({type: 'site-reload-url'}, [channel.port2]);
        } catch (error) {
            finish(null);
        }
    });
}

async function coverReloadingClient(event) {
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
            const locations = await Promise.all(clients.map(currentClientURL));
            const matches = locations.filter(candidate => candidate.url === url.href);
            if (matches.length !== 1)
                return;
            client = matches[0].client;
        }
    }

    await new Promise(resolve => {
        const channel = new MessageChannel();
        const finish = () => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve();
        };
        const timeout = setTimeout(finish, 1000);
        channel.port1.onmessage = event => {
            if (event.data === 'covered')
                finish();
        };
        try {
            client.postMessage({type: 'site-reload-cover', url: url.href}, [channel.port2]);
        } catch (error) {
            finish();
        }
    });
}

self.addEventListener('fetch', event => {
    if (event.request.mode !== 'navigate')
        return;
    const reload = event.request.isReloadNavigation ?? event.isReload;
    if (reload === false || (reload === undefined &&
        !['reload', 'no-cache'].includes(event.request.cache)))
        return;

    event.respondWith((async () => {
        // Fetch first: a failed request must not leave the current page covered.
        const response = await fetch(event.request);
        if (response.ok)
            await coverReloadingClient(event).catch(() => {});
        return response;
    })());
});
