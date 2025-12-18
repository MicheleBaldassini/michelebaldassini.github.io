
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
    if (savedSearch)
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

    a.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('search-results').classList.remove('visible');

        if (window.location.href === link.split('#')[0]) {
            const targetElement = document.getElementById(link.split('#')[1]);
            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
            const offsetPosition = elementPosition - 116;

            const searchButton = document.getElementById('btn-search');
            const searchBar = document.getElementById('searchBar');

            if (searchBar.classList.contains('active')) {
                searchBar.classList.remove('active');
                searchButton.classList.remove('active');
            }

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        } else {

            const searchButton = document.getElementById('btn-search');
            const searchBar = document.getElementById('searchBar');

            if (searchBar.classList.contains('active')) {
                searchBar.classList.remove('active');
                searchButton.classList.remove('active');
            }

            if (document.documentElement.classList.contains('fade-in'))
                document.documentElement.classList.remove('fade-in');

            if (!document.documentElement.classList.contains('fade-out'))
                document.documentElement.classList.add('fade-out');

            if (!document.documentElement.classList.contains('refreshed'))
                document.documentElement.classList.add('refreshed');

            const l = link.split('#')[0];
            const p = link.split('#')[1] || '';

            setTimeout(() => {
                document.getElementById('search-results').replaceChildren();
                sessionStorage.setItem('searchInput', '');

                setTimeout(() => {
                    window.location.assign(l);
                }, 50);
            }, 500);

            if (p !== '')
                sessionStorage.setItem('scrollTo', p);
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


if (window.location.href.includes('publications') ||
    window.location.href.includes('talks_and_awards')) {
    if ('scrollRestoration' in history)
        history.scrollRestoration = 'auto';
} else {
    if ('scrollRestoration' in history)
        history.scrollRestoration = 'manual';
}


navType = detectReload();

// sessionStorage.setItem('firstClick', 'true');

if (navType == true) {
    const savedScroll = sessionStorage.getItem('scrollPosition');

    requestAnimationFrame(() => {
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

        setTimeout(() => {
            navLinks.forEach(link => link.classList.remove('no-animations'));
            progress_bar.classList.remove('no-animations');
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

        if (!hasConsent())
            document.querySelector('.cookie-window').classList.remove('hidden');

        const savedResults = sessionStorage.getItem('searchResults');

        if (searchInput) {
            const searchHitsContainer = document.getElementById('search-results');
            const resultsArray = JSON.parse(savedResults);

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


window.addEventListener('scroll', function () {
    sessionStorage.setItem('scrollPosition', window.scrollY);
});