// Coordinate the real outgoing fade with a reload; responses are never cached here.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function coverReloadingClient(event) {
    const url = new URL(event.request.url);
    url.hash = '';
    const clientID = event.clientId || event.replacesClientId;
    let client = clientID ? await self.clients.get(clientID) : undefined;
    if (!client || client.url.split('#')[0] !== url.href) {
        // Firefox does not expose the outgoing client ID on a reload.
        const clients = await self.clients.matchAll({type: 'window'});
        const matches = clients.filter(candidate => candidate.url.split('#')[0] === url.href);
        if (matches.length !== 1)
            return;
        client = matches[0];
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
