
const siteIndexURL = new URL('../index.json', document.currentScript.src).href;
const theme = localStorage.getItem('theme') || 'light-mode';
document.documentElement.classList.add(theme);
let theme_color = '#ffffff';
if (theme == 'light-mode')
    theme_color = '#ffffff';
else if (theme == 'dark-mode')
    theme_color = '#000000';
let metaTag = document.querySelector('meta[name="theme-color"]');
if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.name = 'theme-color';
    document.head.appendChild(metaTag);
}
metaTag.setAttribute('content', theme_color);


let pageNavigationPending = false;
let pageReloadPending = false;
let lastHistoryGesture = -Infinity;
let lastReloadGesture = -Infinity;
let pageMap;
let navType = detectReload();
let activePageURL = window.location.href;
let activePageKey;
let pageVisit;
const pageStates = new Map();
const pageDocuments = new Map();
const pageTimeouts = new Set();
const pageIntervals = new Set();
const pageAnimationFrames = new Set();
const pageAssetLoads = new Map();
const loadedPageScripts = new Set();
const pageStorageKeys = ['activeSection', 'scrollPosition', 'isSearchOpen', 'searchInput',
    'searchResults', 'searchResultsScrollTop', 'isNavbarOpen', 'filter-search',
    'pubtype', 'pubyear', 'cardtype', 'cardyear'];

function setPageTimeout(callback, delay) {
    const timer = setTimeout(() => {
        pageTimeouts.delete(timer);
        callback();
    }, delay);
    pageTimeouts.add(timer);
    return timer;
}

function setPageInterval(callback, delay) {
    const timer = setInterval(callback, delay);
    pageIntervals.add(timer);
    return timer;
}

function requestPageFrame(callback) {
    const frame = requestAnimationFrame(time => {
        pageAnimationFrames.delete(frame);
        callback(time);
    });
    pageAnimationFrames.add(frame);
    return frame;
}

function revealPage() {
    if (pageReloadPending)
        return;
    const root = document.documentElement;
    const bar = document.getElementById('myBar');
    bar?.classList.add('no-animations');
    requestPageFrame(() => {
        if (bar)
            progressBar();
        squeezeNavbar();
        requestPageFrame(() => {
            if (pageReloadPending)
                return;
            // Resolve the cover's starting opacity before changing the reveal classes.
            getComputedStyle(root, '::before').opacity;
            let fallback;
            const revealed = event => {
                if (event && (event.target !== root || event.pseudoElement !== '::before' ||
                    event.propertyName !== 'opacity' || root.classList.contains('fade-out')))
                    return;
                clearTimeout(fallback);
                root.removeEventListener('transitionend', revealed);
                if (!root.classList.contains('fade-out'))
                    bar?.classList.remove('no-animations');
            };
            root.addEventListener('transitionend', revealed);
            root.classList.remove('fade-out');
            root.classList.add('fade-in');
            pageNavigationPending = false;
            const duration = parseFloat(getComputedStyle(root, '::before').transitionDuration) * 1000 || 0;
            fallback = setTimeout(revealed, duration + 80);
            if (!duration) {
                revealed();
                // Commit the visible page before restoring normal transitions.
                getComputedStyle(root, '::before').opacity;
                root.classList.remove('gesture-navigation');
            }
        });
    });
}

function coverPage() {
    const root = document.documentElement;
    const bar = document.getElementById('myBar');
    if (bar) {
        // Freeze an in-progress scroll animation before fading the page out.
        bar.style.width = getComputedStyle(bar).width;
        bar.classList.add('no-animations');
    }
    const cover = getComputedStyle(root, '::before');
    const duration = parseFloat(cover.transitionDuration) * 1000 || 0;
    if (Number(cover.opacity) === 1) {
        root.classList.remove('fade-in');
        root.classList.add('fade-out');
        return Promise.resolve();
    }
    return new Promise(resolve => {
        let fallback;
        const done = () => {
            clearTimeout(fallback);
            root.removeEventListener('transitionend', onCovered);
            resolve();
        };
        const onCovered = event => {
            if (event.target === root && event.pseudoElement === '::before' &&
                event.propertyName === 'opacity')
                done();
        };
        root.addEventListener('transitionend', onCovered);
        root.classList.remove('fade-in');
        root.classList.add('fade-out');
        fallback = setTimeout(done, duration + 80);
    });
}

function savePageState() {
    const storage = Object.fromEntries(pageStorageKeys.map(key => [key, sessionStorage.getItem(key)]));
    storage.scrollPosition = String(window.scrollY);
    storage.searchInput = document.getElementById('search-input').value;
    storage.isNavbarOpen = String(document.getElementById('navbarResponsive').classList.contains('show'));
    storage.isSearchOpen = String(document.getElementById('searchBar').classList.contains('active'));
    pageStates.set(activePageKey, {storage});
}

// Restore reload state behind the cover, then reveal the real document once.
const reloadStateKey = 'site-reload-state';

function rememberReloadState() {
    try {
        savePageState();
        sessionStorage.setItem(reloadStateKey, JSON.stringify({
            url: activePageURL,
            key: activePageKey,
            storage: pageStates.get(activePageKey).storage
        }));
    } catch (error) {
        sessionStorage.removeItem(reloadStateKey);
    }
}

function initializeReloadTransition() {
    if (!('serviceWorker' in navigator) || !window.isSecureContext)
        return;

    const chromium = navigator.userAgent.includes('Chrome/');
    const desktopWebKit = /Macintosh.*AppleWebKit/.test(navigator.userAgent) &&
        !chromium && navigator.maxTouchPoints === 0;
    const desktopFirefox = navigator.userAgent.includes('Firefox/') &&
        !navigator.userAgent.includes('Android');
    let beforeUnloadTime = -Infinity;
    let desktopReload;
    const markDeparture = () => {
        beforeUnloadTime = performance.now();
    };
    const cancelDesktopReload = () => {
        if (!desktopReload)
            return;
        desktopReload = undefined;
        pageReloadPending = false;
        pageNavigationPending = false;
    };
    if (desktopWebKit || chromium)
        window.addEventListener('beforeunload', markDeparture);
    if (desktopWebKit) {
        window.addEventListener('popstate', cancelDesktopReload);
        window.addEventListener('pageshow', event => {
            if (event.persisted)
                cancelDesktopReload();
        });
    }
    if (desktopFirefox) {
        // The address bar takes focus before Firefox navigates to the same URL.
        let departureListenerTimeout;
        const clearDepartureListener = () => {
            clearTimeout(departureListenerTimeout);
            window.removeEventListener('beforeunload', markDeparture);
        };
        window.addEventListener('blur', () => {
            clearTimeout(departureListenerTimeout);
            if (!document.hidden)
                window.addEventListener('beforeunload', markDeparture, {once: true});
        });
        window.addEventListener('focus', () => {
            // Pressing Enter returns focus to the document just before beforeunload.
            clearTimeout(departureListenerTimeout);
            departureListenerTimeout = setTimeout(clearDepartureListener, 250);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden)
                clearDepartureListener();
        });
    }

    navigator.serviceWorker.addEventListener('message', async event => {
        if (event.source !== navigator.serviceWorker.controller)
            return;
        const current = new URL(window.location.href);
        current.hash = '';
        const samePage = event.data?.url === current.href;
        if (event.data?.type === 'site-reload-restart') {
            if (desktopWebKit && samePage && !pageReloadPending) {
                const reload = {prepared: false};
                desktopReload = reload;
                pageReloadPending = true;
                pageNavigationPending = true;
                // WebKit resumes rendering after the first navigation returns 204.
                requestAnimationFrame(async () => {
                    if (desktopReload !== reload)
                        return;
                    rememberReloadState();
                    await coverPage();
                    if (desktopReload !== reload)
                        return;
                    reload.prepared = true;
                    window.location.reload();
                });
            }
            return;
        }
        if (event.data?.type === 'site-reload-cancel') {
            if (samePage && desktopReload?.prepared) {
                cancelDesktopReload();
                revealPage();
            }
            return;
        }
        if (event.data?.type === 'site-reload-complete') {
            const androidChromium = navigator.userAgentData?.platform === 'Android' ||
                /Android.*Chrome\//.test(navigator.userAgent);
            if (event.data.url === current.href && androidChromium &&
                !pageNavigationPending && !pageReloadPending) {
                // A same-document commit dismisses Chromium's native refresh indicator.
                history.replaceState(history.state, '', window.location.href);
            }
            return;
        }
        if (!event.ports[0])
            return;
        if (event.data?.type === 'site-reload-url') {
            event.ports[0].postMessage(current.href);
            event.ports[0].close();
            return;
        }
        const knownReload = event.data?.type === 'site-reload-mode';
        const gestureProbe = event.data?.type === 'site-reload-gesture';
        if (knownReload || gestureProbe || event.data?.type === 'site-reload-desktop') {
            const now = performance.now();
            const gesture = samePage && now - lastReloadGesture < 2500 &&
                (knownReload || (gestureProbe && document.visibilityState === 'visible'));
            const desktopReloadRequested = samePage && document.visibilityState === 'visible' &&
                now - beforeUnloadTime < 2500;
            if (samePage && (knownReload || gesture))
                lastReloadGesture = -Infinity;
            if (desktopReloadRequested)
                beforeUnloadTime = -Infinity;
            let mode = gesture ? 'unchanged' : 'reload';
            if (samePage && desktopReload?.prepared)
                mode = 'prepared';
            else if (!gesture && desktopReloadRequested)
                mode = desktopWebKit ? 'restart' : 'address-reentry';
            event.ports[0].postMessage(mode);
            event.ports[0].close();
            return;
        }
        if (event.data?.type !== 'site-reload-cover' || event.data.url !== current.href)
            return;

        rememberReloadState();
        pageReloadPending = true;
        pageNavigationPending = true;
        await coverPage();
        event.ports[0].postMessage('covered');
        event.ports[0].close();
    });

    // Hold the reload response until the outgoing document has faded out.
    const workerURL = new URL('page-transitions.js', siteIndexURL);
    return new Promise(resolve => {
        const done = () => {
            clearTimeout(timeout);
            navigator.serviceWorker.removeEventListener('controllerchange', controlled);
            resolve();
        };
        const controlled = () => {
            if (navigator.serviceWorker.controller)
                done();
        };
        const timeout = setTimeout(done, 2000);
        navigator.serviceWorker.addEventListener('controllerchange', controlled);
        navigator.serviceWorker.register(workerURL, {updateViaCache: 'none'}).then(controlled).catch(done);
        controlled();
    });
}

async function preparePortrait() {
    const portrait = document.querySelector('.portrait-image .img');
    const portraitURL = portrait && getComputedStyle(portrait).backgroundImage
        .match(/^url\(["']?(.*?)["']?\)$/)?.[1];
    if (portraitURL) {
        const image = new Image();
        image.src = portraitURL;
        await image.decode().catch(() => {});
    }
}

async function prepareReload() {
    const stored = sessionStorage.getItem(reloadStateKey) || sessionStorage.getItem('site-reload-view');
    sessionStorage.removeItem(reloadStateKey);
    sessionStorage.removeItem('site-reload-view');
    if (performance.getEntriesByType('navigation')[0]?.type !== 'reload')
        return;

    let saved;
    try {
        const state = JSON.parse(stored);
        if (state?.url === window.location.href && state.key === activePageKey)
            saved = state.storage;
    } catch (error) {
        // The current session state remains available if an older entry is invalid.
    }

    if (saved) {
        for (const [key, value] of Object.entries(saved)) {
            if (value === null)
                sessionStorage.removeItem(key);
            else
                sessionStorage.setItem(key, value);
        }
    }
}

function disposePage() {
    pageTimeouts.forEach(clearTimeout);
    pageIntervals.forEach(clearInterval);
    pageAnimationFrames.forEach(cancelAnimationFrame);
    pageTimeouts.clear();
    pageIntervals.clear();
    pageAnimationFrames.clear();
    observer.disconnect();
    navbarObserver.disconnect();
    skillsObserver?.disconnect();
    pageMap?.remove();
    pageMap = undefined;
    if (window.Isotope)
        document.querySelectorAll('.articles, .cards').forEach(element => Isotope.data(element)?.destroy());
    document.querySelectorAll('.modal, [data-bs-toggle="tooltip"]').forEach(element => {
        bootstrap.Modal.getInstance(element)?.dispose();
        bootstrap.Tooltip.getInstance(element)?.dispose();
    });
    document.querySelectorAll('.modal-backdrop').forEach(element => element.remove());
}

async function loadPageAssets(page, url) {
    const styles = new Set(Array.from(document.querySelectorAll('link[rel="stylesheet"]'), link => link.href));
    const pendingStyles = [];
    for (const source of page.querySelectorAll('link[rel="stylesheet"]')) {
        const href = new URL(source.getAttribute('href'), url).href;
        if (styles.has(href)) {
            if (pageAssetLoads.has(href))
                pendingStyles.push(pageAssetLoads.get(href));
            continue;
        }
        const link = source.cloneNode();
        link.href = href;
        const loading = new Promise((resolve, reject) => {
            link.onload = resolve;
            link.onerror = reject;
        });
        pageAssetLoads.set(href, loading);
        pendingStyles.push(loading);
        document.head.appendChild(link);
        styles.add(href);
    }
    for (const source of page.querySelectorAll('script[src]')) {
        const src = new URL(source.getAttribute('src'), url).href;
        if (!new URL(src).pathname.includes('/js/assets/') || loadedPageScripts.has(src))
            continue;
        if (!pageAssetLoads.has(src)) {
            pageAssetLoads.set(src, new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }));
        }
        await pageAssetLoads.get(src);
        loadedPageScripts.add(src);
    }
    await Promise.all(pendingStyles);
}


async function closeNavigationPanels() {
    const toggler = document.querySelector('.navbar-toggler');
    const hasDropdown = toggler && getComputedStyle(toggler).display !== 'none';
    if (hasDropdown) {
        const menu = document.getElementById('navbarResponsive');
        const menuFinished = () => new Promise(resolve => {
            const done = () => {
                menu.removeEventListener('shown.bs.collapse', done);
                menu.removeEventListener('hidden.bs.collapse', done);
                resolve();
            };
            menu.addEventListener('shown.bs.collapse', done);
            menu.addEventListener('hidden.bs.collapse', done);
        });
        if (menu.classList.contains('collapsing'))
            await menuFinished();
        if (menu.classList.contains('show')) {
            const closed = menuFinished();
            menu.classList.remove('active-refreshed');
            bootstrap.Collapse.getOrCreateInstance(menu, {toggle: false}).hide();
            await closed;
        }
    }
    sessionStorage.setItem('isNavbarOpen', 'false');

    const menuAnimations = hasDropdown ? toggler.getAnimations({subtree: true}) : [];
    await Promise.all([
        closeSearchPanel(),
        Promise.allSettled(menuAnimations.map(animation => animation.finished))
    ]);
}

async function closeSearchPanel() {
    const search = document.getElementById('searchBar');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const searchButton = document.getElementById('btn-search');
    results.classList.remove('visible', 'refreshed');
    search.classList.remove('active', 'active-refreshed');
    searchButton.classList.remove('active', 'active-refreshed');
    sessionStorage.setItem('isSearchOpen', 'false');
    input.blur();
    const animations = [search, input, results, search.querySelector('svg')]
        .flatMap(element => element?.getAnimations() ?? []);
    await Promise.allSettled(animations.map(animation => animation.finished));
    if (!search.matches('.active, .active-refreshed'))
        input.blur();
}

async function navigateWithFade(url, {entryKey, animate = true, scrollTarget} = {}) {
    const destination = new URL(url, window.location.href);
    if (destination.origin !== window.location.origin) {
        window.location.assign(destination.href);
        return;
    }
    if (!entryKey && (pageNavigationPending || destination.href === activePageURL))
        return;

    if (!pageNavigationPending)
        savePageState();
    pageVisit?.abort();
    const visit = new AbortController();
    pageVisit = visit;
    pageNavigationPending = true;
    const pageURL = new URL(destination.href);
    pageURL.hash = '';

    try {
        await closeNavigationPanels();
        if (visit.signal.aborted)
            return;
        document.documentElement.classList.toggle('gesture-navigation', !animate);
        const content = pageDocuments.has(pageURL.href)
            ? Promise.resolve(pageDocuments.get(pageURL.href))
            : fetch(pageURL.href, {signal: visit.signal}).then(response => {
                if (!response.ok || new URL(response.url).origin !== destination.origin)
                    throw new Error('Page unavailable');
                return response.text();
            });
        const [html] = await Promise.all([content, animate ? coverPage() : undefined]);
        if (visit.signal.aborted)
            return;
        const page = new DOMParser().parseFromString(html, 'text/html');
        if (!Array.from(page.querySelectorAll('script[src]')).some(script =>
            new URL(script.getAttribute('src'), destination.href).pathname.endsWith('/js/main.js')))
            throw new Error('Use browser navigation for this document');
        await loadPageAssets(page, destination.href);
        if (visit.signal.aborted)
            return;
        pageDocuments.set(pageURL.href, html);
        disposePage();

        if (!entryKey) {
            entryKey = Date.now() + '-' + Math.random().toString(36).slice(2);
            history.pushState({sitePageKey: entryKey}, '', destination.href);
        }
        activePageKey = entryKey;
        activePageURL = destination.href;
        const saved = pageStates.get(entryKey);
        const metadata = 'title, meta[name="description"], meta[name="robots"], ' +
            'meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], script[type="application/ld+json"]';
        document.head.querySelectorAll(metadata).forEach(element => element.remove());
        page.head.querySelectorAll(metadata).forEach(element => document.head.appendChild(document.importNode(element, true)));
        page.body.querySelectorAll('script').forEach(script => script.remove());
        document.body.replaceWith(document.importNode(page.body, true));
        document.body.setAttribute('tabindex', '-1');
        document.body.focus({preventScroll: true});
        document.body.removeAttribute('tabindex');
        document.documentElement.classList.remove('fade-in', 'refreshed');
        sectionClick = false;
        old_search_length = -1;
        if (!saved)
            window.scrollTo({top: 0, behavior: 'instant'});
        await preparePortrait();
        if (visit.signal.aborted)
            return;
        if (saved) {
            for (const [key, value] of Object.entries(saved.storage)) {
                if (value === null)
                    sessionStorage.removeItem(key);
                else
                    sessionStorage.setItem(key, value);
            }
            sessionStorage.setItem('isNavbarOpen', 'false');
            sessionStorage.setItem('isSearchOpen', 'false');
            for (const key of ['searchInput', 'searchResults', 'searchResultsScrollTop', 'searchQuery'])
                sessionStorage.removeItem(key);
        }
        initializePage(Boolean(saved), scrollTarget);
        if (!saved && destination.hash) {
            const target = document.getElementById(decodeURIComponent(destination.hash.slice(1)));
            if (target)
                window.scrollTo({top: target.getBoundingClientRect().top + window.scrollY - 112, behavior: 'instant'});
        }
    } catch (error) {
        if (!visit.signal.aborted) {
            // Keep ordinary browser navigation available if fetching or parsing fails.
            if (scrollTarget)
                sessionStorage.setItem('scrollTo', scrollTarget);
            if (entryKey)
                window.location.replace(destination.href);
            else
                window.location.assign(destination.href);
        }
    }
}

function initializePageNavigation() {
    document.head.querySelectorAll('link[href]').forEach(link => link.href = link.href);
    activePageKey = history.state?.sitePageKey || Date.now() + '-' + Math.random().toString(36).slice(2);
    history.replaceState({...history.state, sitePageKey: activePageKey}, '', window.location.href);
    const initialURL = new URL(window.location.href);
    initialURL.hash = '';
    pageDocuments.set(initialURL.href, document.documentElement.outerHTML);
    document.querySelectorAll('script[src]').forEach(script => loadedPageScripts.add(script.src));
    window.addEventListener('pagehide', rememberReloadState);
    window.addEventListener('popstate', event => {
        let key = event.state?.sitePageKey;
        if (!key) {
            key = Date.now() + '-' + Math.random().toString(36).slice(2);
            history.replaceState({...event.state, sitePageKey: key}, '', window.location.href);
        }
        const gesture = event.hasUAVisualTransition || performance.now() - lastHistoryGesture < 1000;
        lastHistoryGesture = -Infinity;
        navigateWithFade(window.location.href, {entryKey: key, animate: !gesture});
    });
    initializePageGestures();
}


function initializePageGestures() {
    let start;
    document.addEventListener('touchstart', event => {
        lastHistoryGesture = lastReloadGesture = -Infinity;
        start = null;
        const target = event.target;
        if (event.touches.length !== 1 || target.closest(
            '.leaflet-container, input, textarea, select, [contenteditable="true"]'))
            return;
        for (let element = target; element && element !== document.body;
            element = element.parentElement) {
            if (element.scrollWidth > element.clientWidth &&
                /auto|scroll/.test(getComputedStyle(element).overflowX))
                return;
        }
        const touch = event.touches[0];
        start = {x: touch.clientX, y: touch.clientY, time: performance.now(),
            atTop: window.scrollY <= 0, horizontal: false, vertical: false, claimed: false, dx: 0};
    }, {passive: true});

    document.addEventListener('touchmove', event => {
        if (!start)
            return;
        if (event.touches.length !== 1) {
            start = null;
            lastHistoryGesture = lastReloadGesture = -Infinity;
            return;
        }
        const dx = event.touches[0].clientX - start.x;
        const dy = event.touches[0].clientY - start.y;
        if (!start.horizontal) {
            if (start.vertical || (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8)) {
                start.vertical = true;
                // Observe pull-to-refresh without cancelling the browser's gesture.
                if (start.atTop && window.scrollY <= 0 && dy > 8)
                    lastReloadGesture = performance.now();
                else
                    lastReloadGesture = -Infinity;
                return;
            }
            if (Math.abs(dx) <= 12 || Math.abs(dx) <= Math.abs(dy) * 1.5)
                return;
            start.horizontal = true;
        }
        start.dx = dx;
        lastHistoryGesture = performance.now();
        // Own only cancellable horizontal gestures, so the browser cannot also navigate.
        if (event.cancelable && !event.defaultPrevented) {
            event.preventDefault();
            start.claimed = true;
        }
    }, {passive: false});

    document.addEventListener('touchend', event => {
        const swipe = start;
        start = null;
        if (!swipe?.claimed)
            return;
        if (event.touches.length || Math.abs(swipe.dx) < 70 ||
            performance.now() - swipe.time > 1000 || pageNavigationPending || pageReloadPending) {
            lastHistoryGesture = -Infinity;
            return;
        }
        lastHistoryGesture = performance.now();
        history.go(swipe.dx > 0 ? -1 : 1);
    }, {passive: true});
    document.addEventListener('touchcancel', () => { start = null; }, {passive: true});
    window.addEventListener('popstate', () => { start = null; });
    document.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch')
            lastHistoryGesture = lastReloadGesture = -Infinity;
    }, {passive: true});
    document.addEventListener('keydown', () => {
        lastHistoryGesture = lastReloadGesture = -Infinity;
    });
}

function detectReload() {
    const navType = performance.getEntriesByType('navigation')[0].type;
    if (navType === 'reload' || navType === 'back_forward')
        return true;
    else
        return false;
}


function squeezeNavbar() {
    const navbars = document.querySelectorAll('.navbar');
    const isCompressed = window.scrollY > 60;

    navbars.forEach(navbar => {
        navbar.classList.toggle('compressed', isCompressed);
        navbar.classList.toggle('not-compressed', !isCompressed);
    });
}


function progressBar() {
    const bar = document.getElementById('myBar');
    const container = document.querySelector('.progress-container');
    
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;

    bar.style.width = scrolled + '%';

    if (scrolled > 10) {
        container.style.opacity = 1;
    } else {
        container.style.opacity = 0;
    }
}


function showMap() {
    const map = L.map('map', {keepBuffer: 10}).setView([43.721020, 10.389863], 15);
    pageMap = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        minZoom: 14,
        maxZoom: 16,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    const marker = L.marker([43.721020, 10.389863]).addTo(map);
    marker.bindPopup('<b>Dipartimento di Ingegneria dell&#39;Informazione</b><br>Largo Lucio Lazzarino 1, 56122, Pisa');
}


function hasConsent() {
    const stored = localStorage.getItem(COOKIE_KEY);
    if (!stored)
        return false;
    try {
        const data = JSON.parse(stored);
        const now = Date.now();
        return now < data.expires;
    } catch {
        return false;
    }
}


function initIsotope() {
    const savedSearch = sessionStorage.getItem('filter-search');
    if (savedSearch && document.querySelector('.filter-search'))
        document.querySelector('.filter-search').value = savedSearch;

    Array.from(document.getElementsByClassName('pub-filters')).forEach(element => {
        const savedValue = sessionStorage.getItem(element.getAttribute('data-filter-group'));
        if (savedValue)
            element.value = savedValue;
    });

    if (window.location.href.includes('publications')) {
        const filters = {};
        let searchRegex, combinedFilter;

        const isotopeInstance = new Isotope(document.querySelector('.articles'), {
            itemSelector: '.isotope-item',
            percentPosition: true,
            masonry: {
                columnWidth: '.isotope-item'
            },
            transitionDuration: '0.5s',
            filter: function (element) {
                const matchesSearch = !searchRegex || element.textContent.match(searchRegex);
                const matchesFilters = !combinedFilter || element.matches(combinedFilter);
                return matchesSearch && matchesFilters;
            },
        });

        const searchInput = document.querySelector('.filter-search');
        searchInput.addEventListener('keyup', function () {
            searchRegex = new RegExp(searchInput.value, 'gi');
            isotopeInstance.arrange({
                transitionDuration: '0.5s'
            });

            sessionStorage.setItem('filter-search', searchInput.value);
        });

        const elements = document.getElementsByClassName('pub-filters');

        Array.from(elements).forEach(element => {
            const filterGroup = element.getAttribute('data-filter-group');
            filters[filterGroup] = element.value;
        });

        combinedFilter = Object.values(filters).join('').replace('*', '');
        if (navType == true)
            isotopeInstance.arrange({
                transitionDuration: 0
            });
        else
            isotopeInstance.arrange({
                transitionDuration: '0.5s'
            });

        Array.from(elements).forEach(element => {
            element.addEventListener('change', function (event) {
                const filterElement = event.target;
                const filterGroup = filterElement.getAttribute('data-filter-group');
                filters[filterGroup] = filterElement.value;

                combinedFilter = Object.values(filters).join('').replace('*', '');
                isotopeInstance.arrange({
                    transitionDuration: '0.5s'
                });

                sessionStorage.setItem(filterGroup, filterElement.value);
            });
        });
    }

    if (window.location.href.includes('talks_and_awards')) {
        const filters = {};
        let combinedFilter;

        const isotopeInstance = new Isotope(document.querySelector('.cards'), {
            itemSelector: '.isotope-item',
            percentPosition: true,
            masonry: {
                columnWidth: '.isotope-item'
            },
            transitionDuration: '0.5s',
            filter: function (element) {
                const matchesFilters = !combinedFilter || element.matches(combinedFilter);
                return matchesFilters;
            }
        });

        const elements = document.getElementsByClassName('pub-filters');

        Array.from(elements).forEach(element => {
            const filterGroup = element.getAttribute('data-filter-group');
            filters[filterGroup] = element.value;
        });

        combinedFilter = Object.values(filters).join('').replace('*', '');
        if (navType == true)
            isotopeInstance.arrange({
                transitionDuration: 0
            });
        else
            isotopeInstance.arrange({
                transitionDuration: '0.5s'
            });

        Array.from(elements).forEach(element => {
            element.addEventListener('change', function (event) {
                const filterElement = event.target;
                const filterGroup = filterElement.getAttribute('data-filter-group');
                filters[filterGroup] = filterElement.value;

                combinedFilter = Object.values(filters).join('').replace('*', '');
                isotopeInstance.arrange({
                    transitionDuration: '0.5s'
                });

                sessionStorage.setItem(filterGroup, filterElement.value);
            });
        });
    }
}


function createSearchHitElement({key, title, info, type, link}) {
    const destination = new URL(link, siteIndexURL);
    if (destination.origin !== window.location.origin &&
        destination.hostname.replace(/^www\./, '') === 'michelebaldassini.github.io') {
        // Keep this site's indexed links on the host and base path currently in use.
        destination.href = new URL(destination.pathname.replace(/^\/+/, '') + destination.search + destination.hash,
            new URL('./', siteIndexURL)).href;
    }
    const searchHit = document.createElement('div');
    searchHit.className = 'search-hit';
    searchHit.id = `summary-${key}`;

    const contentContainer = document.createElement('div');
    contentContainer.className = 'search-hit-content';

    const nameContainer = document.createElement('div');
    nameContainer.className = 'search-hit-title';

    const a = document.createElement('a');
    a.href = 'javascript:void(0);';
    a.textContent = title;

    a.addEventListener('click', async function (e) {
        e.preventDefault();
        if (pageNavigationPending || pageReloadPending)
            return;

        const current = new URL(window.location.href);
        const pagePath = url => url.pathname.replace(/\/index\.html$/, '/').replace(/\/+$/, '');
        const targetID = decodeURIComponent(destination.hash.slice(1));
        if (current.origin === destination.origin && pagePath(current) === pagePath(destination)) {
            const searchBar = document.getElementById('searchBar');
            await closeSearchPanel();
            if (!searchBar.isConnected || pageNavigationPending || pageReloadPending)
                return;
            sessionStorage.removeItem('scrollTo');
            const targetElement = document.getElementById(targetID);
            const offsetPosition = targetElement
                ? targetElement.getBoundingClientRect().top + window.scrollY - 116
                : 0;
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        } else {
            const pageURL = new URL(destination.href);
            pageURL.hash = '';
            navigateWithFade(pageURL.href, {scrollTarget: targetID});
        }
    });
    
    const metadata = document.createElement('div');
    metadata.className = 'search-hit-type';
    metadata.textContent = type;

    const description = document.createElement('div');
    description.className = 'search-hit-info';
    description.textContent = info;

    nameContainer.appendChild(a);
    nameContainer.appendChild(metadata);
    nameContainer.appendChild(description);
    contentContainer.appendChild(nameContainer);
    searchHit.appendChild(contentContainer);

    return searchHit;
}


const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const el = entry.target;
            el.style.transitionDelay = `${Math.random() * 0.3}s`;
            el.classList.add('visible');
            observer.unobserve(el);
        }
    });
}, { threshold: 0.2 });


const COOKIE_KEY = 'cookies';


function restorePageState(restoring) {
    navType = restoring;
    if ('scrollRestoration' in history)
        history.scrollRestoration = 'manual';

    if (navType == true) {
        const savedScroll = sessionStorage.getItem('scrollPosition');

        requestPageFrame(() => {
            initIsotope();
            window.scrollTo({top: savedScroll, behavior: 'instant'});

            document.querySelectorAll('.fade-up').forEach(el => {
                const rect = el.getBoundingClientRect();
                const elBottom = rect.bottom;
                const viewportBottom = window.innerHeight + ((rect.bottom - rect.top) * 0.8);

                if (elBottom < viewportBottom) {
                    el.classList.add('visible-refresh');
                } else
                    observer.observe(el);
            });

            const navbarCollapse = document.getElementById('navbarResponsive');
            const navbarToggler = document.getElementsByClassName('navbar-toggler')[0];
            const isNavbarOpen = sessionStorage.getItem('isNavbarOpen') === 'true';
            if (isNavbarOpen) {
                navbarCollapse.classList.add('active-refreshed');
                navbarToggler.classList.remove('collapsed');
                navbarCollapse.classList.add('show');
                document.querySelectorAll('.navbar').forEach(navbar => {
                    navbar.classList.add('navbar-show');
                });
            }

            const searchInput = sessionStorage.getItem('searchInput');
            document.getElementById('search-input').value = searchInput;

            document.getElementById('search-input').addEventListener('focus', () => {
                const val = document.getElementById('search-input').value;
                document.getElementById('search-input').setSelectionRange(val.length, val.length);
            });

            const searchButton = document.getElementById('btn-search');
            const searchBar = document.getElementById('searchBar');
            const isSearchOpen = sessionStorage.getItem('isSearchOpen') === 'true';
            if (isSearchOpen) {
                searchButton.classList.add('active-refreshed');
                searchBar.classList.add('active-refreshed');
                document.getElementById('search-input').focus();
                document.getElementById('search-input').click();
                if ('virtualKeyboard' in navigator) {
                    navigator.virtualKeyboard.show();
                }
            }

            squeezeNavbar();

            if (!window.location.href.includes('publications') &&
                !window.location.href.includes('teaching') &
                !window.location.href.includes('talks_and_awards') &
                !window.location.href.includes('experience'))
                showMap();

            const navLinks = document.querySelectorAll('.nav-link');
            const progress_bar = document.querySelector('.progress-bar');
            const skillItems = document.querySelectorAll('.skill-item');

            navLinks.forEach(link => link.classList.add('no-animations'));

            progress_bar.classList.add('no-animations');
            progressBar();

            if (skillItems) {
         
                skillItems.forEach(item => {
                    item.classList.add('no-animations');

                    const circle = item.querySelector('.progress');
                    const percent = parseInt(item.getAttribute('data-percent'));
                    const percentText = item.querySelector('.skill-percent');

                    if (circle) {
                        const radius = circle.r.baseVal.value;
                        const circumference = radius * 2 * Math.PI;
                        const offset = circumference - (percent / 100) * circumference;

                        circle.style.transition = 'none';
                        circle.style.strokeDasharray = circumference;
                        circle.style.strokeDashoffset = offset;
                    }
                    percentText.textContent = percent + '%';
                });
            }

            setPageTimeout(() => {
                navLinks.forEach(link => link.classList.remove('no-animations'));
                if (skillItems)
                    skillItems.forEach(item => {
                        item.classList.remove('no-animations');
                        const circle = item.querySelector('.progress');
                        circle.style.transition = '';
                    });
            }, 100);

            const activeSection = sessionStorage.getItem('activeSection');
                if (activeSection !== null && activeSection !== '') {
                    const targetLink = Array.from(navLinks).find(link =>
                        link.classList.contains(`${activeSection}-link`)
                    );
                    if (targetLink)
                        targetLink.parentElement.classList.add('active');
                }

            const banner = document.querySelector('.cookie-window');
            if (!hasConsent())
                banner.classList.remove('hidden');
            else {
                banner.classList.add('hidden');
                banner.addEventListener('transitionend', () => {
                    banner.style.display = 'none';
                }, { once: true });
            }

            const savedResults = sessionStorage.getItem('searchResults');

            if (searchInput) {
                const searchHitsContainer = document.getElementById('search-results');
                const resultsArray = JSON.parse(savedResults || '[]');

                const headerContainer = document.createElement('div');
                headerContainer.className = 'search-hit-header';

                headerContainer.textContent =
                    resultsArray.length > 0
                        ? `${resultsArray.length} results found`
                        : `No results found`;

                searchHitsContainer.append(headerContainer);

                if (savedResults) {
                    resultsArray.forEach((item, index) => {
                        const searchHitElement = createSearchHitElement({
                            key: index,
                            title: item.title,
                            info: item.info,
                            type: item.type,
                            link: item.link
                        });
                        searchHitsContainer.appendChild(searchHitElement);
                    });
                }

                if (resultsArray.length > 0 || searchHitsContainer.textContent == `No results found`) {
                    headerContainer.classList.add('refreshed');
                }

                if (resultsArray.length > 0) {
                    const savedScroll = sessionStorage.getItem('searchResultsScrollTop');
                    if (savedScroll) {
                        searchHitsContainer.scrollTop = savedScroll;
                        searchHitsContainer.classList.add('refreshed');
                        document.querySelectorAll('.search-hit').forEach(el => {
                            el.classList.add('refreshed');
                        });
                    } else {
                        searchHitsContainer.classList.add('refreshed');
                        document.querySelectorAll('.search-hit').forEach(el => {
                            el.classList.add('refreshed');
                        });
                    }

                    function saveScrollPosition() {
                        sessionStorage.setItem(
                            'searchResultsScrollTop',
                            searchHitsContainer.scrollTop
                        );
                    }
                    searchHitsContainer.removeEventListener('scroll', saveScrollPosition);
                    searchHitsContainer.addEventListener('scroll', saveScrollPosition);
                } else
                    searchHitsContainer.classList.add('refreshed');
            }

            document.documentElement.classList.add('refreshed');
        });
    } else {
        sessionStorage.removeItem('activeSection');
        sessionStorage.removeItem('scrollPosition');
        sessionStorage.removeItem('isSearchOpen');
        sessionStorage.removeItem('searchInput');
        sessionStorage.removeItem('searchResults');
        sessionStorage.removeItem('isNavbarOpen');
        // sessionStorage.removeItem('firstClick');

        if (window.location.href.includes('publications')) {
            sessionStorage.removeItem('filter-search');
            sessionStorage.removeItem('pubtype');
            sessionStorage.removeItem('pubyear');
        }
    
        if (window.location.href.includes('talks_and_awards')) {
            sessionStorage.removeItem('cardtype');
            sessionStorage.removeItem('cardyear');
        }
    }


}


window.addEventListener('scroll', function () {
    sessionStorage.setItem('scrollPosition', window.scrollY);
});

const reloadTransitionReady = initializeReloadTransition();
