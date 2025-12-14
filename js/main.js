

function initializeFadeEffect() {
    const links = document.querySelectorAll('.ext-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const url = link.getAttribute('href');

            document.getElementById('search-results').classList.remove('visible');

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

            setTimeout(() => {
                document.getElementById('search-results').replaceChildren();
                sessionStorage.setItem('searchInput', '');
                setTimeout(() => {
                    window.location.assign(url);
                }, 50);
            }, 500);
        });
    });
}


function toggleTheme() {
    let theme_color = '#ffffff';

    if (document.documentElement.classList.contains('dark-mode')) {
        document.getElementById('moon').style.display = 'none';
        document.getElementById('sun').style.display = 'flex';
        theme_color = '#000000';
    } else if (document.documentElement.classList.contains('light-mode')) {
        document.getElementById('sun').style.display = 'none';
        document.getElementById('moon').style.display = 'flex';
        theme_color = '#ffffff';
    }

    let metaTag = document.querySelector('meta[name="theme-color"]');
    if (!metaTag) {
        metaTag = document.createElement('meta');
        metaTag.name = 'theme-color';
        document.head.appendChild(metaTag);
    }
    metaTag.setAttribute('content', theme_color);

    const themeToggle = document.getElementsByClassName('theme-toggle')[0];
    themeToggle.addEventListener('click', function () {
        if (document.documentElement.classList.contains('dark-mode')) {
            document.getElementById('sun').style.display = 'none';
            document.getElementById('moon').style.display = 'flex';
            document.documentElement.classList.remove('dark-mode');
            document.documentElement.classList.add('light-mode');
            theme_color = '#ffffff';
        } else if (document.documentElement.classList.contains('light-mode')) {
            document.getElementById('moon').style.display = 'none';
            document.getElementById('sun').style.display = 'flex';
            document.documentElement.classList.remove('light-mode');
            document.documentElement.classList.add('dark-mode');
            theme_color = '#000000';
        }

        let metaTag = document.querySelector('meta[name="theme-color"]');
        if (!metaTag) {
            console.log('metaTag');
            metaTag = document.createElement('meta');
            metaTag.name = 'theme-color';
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', theme_color);

        if (document.documentElement.classList.contains('dark-mode'))
            localStorage.setItem('theme', 'dark-mode');
        else
            localStorage.setItem('theme', 'light-mode');
    });
}


function toogleNavbar() {
    const navbarCollapse = document.getElementById('navbarResponsive');
    const searchCollapse = document.getElementById('searchBar');
    const searchToggler = document.getElementById('btn-search');

    if (!navbarCollapse)
        return;

    navbarCollapse.addEventListener('show.bs.collapse', (e) => {
        const searchActive = searchCollapse && searchCollapse.classList.contains('active');
        if (searchActive) {
            e.target.style.transitionDelay = '0.6s';
        } else {
            e.target.style.transitionDelay = '';
        }
    });
}


const navbarObserver = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const searchCollapse = document.getElementById('searchBar');
            const searchInput = document.querySelector('#searchBar input');
            const searchIcon = document.querySelector('#searchBar svg');

            const isNavbarOpen = mutation.target.classList.contains('show');
            sessionStorage.setItem('isNavbarOpen', isNavbarOpen);

            if (isNavbarOpen) {
                searchCollapse.style.transitionDelay = '0.85s';
                searchInput.style.transitionDelay = '0.85s';
                searchIcon.style.transitionDelay = '0.85s';
            } else {
                searchCollapse.style.transitionDelay = '';
                searchInput.style.transitionDelay = '';
                searchIcon.style.transitionDelay = '';
            }
        }
    });
});


function toggleSearch() {
    const searchButton = document.getElementById('btn-search');
    const searchBar = document.getElementById('searchBar');

    const navbarCollapse = document.getElementById('navbarResponsive');

    searchButton.addEventListener('click', function () {
        const isNavbarOpen = navbarCollapse.classList.contains('show');

        searchBar.classList.toggle('active');
        searchButton.classList.toggle('active');

        sessionStorage.setItem('isSearchOpen', searchBar.classList.contains('active'));

        if (searchBar.classList.contains('active')) {
            const searchResults = document.getElementById('search-results');
            if (searchResults.children.length > 0) {
                searchResults.classList.add('visible');

                setTimeout(() => {
                    document.querySelectorAll('.search-hit').forEach(el => {
                        el.classList.add('visible');
                    });
                }, 100);
            }

            if (!isNavbarOpen)
                setTimeout(() => {
                    document.getElementById('search-input').focus();
                }, 400);

        }
    });
}


function collapseNavbar(event) {
    const navbarToggler = document.getElementsByClassName('navbar-toggler')[0];
    const navbarCollapse = document.getElementById('navbarResponsive');

    const themeToggler = document.getElementsByClassName('theme-toggle')[0];
    const searchToggler = document.getElementById('btn-search');
    const searchCollapse = document.getElementById('searchBar');

    const isNavbarOpen = navbarCollapse.classList.contains('show');

    if (isNavbarOpen && searchToggler.contains(event.target)) {

        const openSearch = () => {
            searchCollapse.classList.toggle('active');
            searchToggler.classList.toggle('active');
            sessionStorage.setItem('isSearchOpen', searchCollapse.classList.contains('active'));
            const searchResults = document.getElementById('search-results');

            if (searchResults.children.length > 0) {
                searchResults.classList.add('visible');

                document.querySelectorAll('.search-hit').forEach(el => {
                    el.classList.add('visible');
                });
            }
            /*
            let timeout = 400;
            let isFirstClick = sessionStorage.getItem('firstClick') !== 'false';
            const headerContainer = document.querySelector('.search-hit-header');

            if (isFirstClick && !headerContainer) {
                timeout = 700;
                sessionStorage.setItem('firstClick', 'false');
            } else
                timeout = 1200;
            */

            setTimeout(() => {
                document.getElementById('search-input').focus();
            }, 400);
        };

        const onHidden = () => {
            openSearch();
            navbarCollapse.removeEventListener('hidden.bs.collapse', onHidden);
            sessionStorage.setItem('isNavbarOpen', navbarCollapse.classList.contains('show'));
        };
        navbarCollapse.addEventListener('hidden.bs.collapse', onHidden);
        navbarToggler.click();
    }

    if (isNavbarOpen &&
        (!themeToggler.contains(event.target)) &&
        !navbarCollapse.contains(event.target) &&
        !navbarToggler.contains(event.target)) {
        navbarToggler.click();
        sessionStorage.setItem('isNavbarOpen', false);
    }

    setTimeout(() => {
        const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
        dropdownToggles.forEach(toggle => {
            const arrow = toggle.querySelector('.dropdown-arrow');
            const menu = toggle.nextElementSibling;
            if (menu.classList.contains('show'))
                arrow.classList.add('rotate');
            else
                arrow.classList.remove('rotate');
        });
    }, 100);
}


function toggleDropdown() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function () {
            const arrow = this.querySelector('.dropdown-arrow');
            const menu = this.nextElementSibling;

            if (menu.classList.contains('show')) {
                arrow.classList.add('rotate');
            } else {
                arrow.classList.remove('rotate');
            }
        });
    });
}


function collapseSearch(event) {
    const navbarToggler = document.getElementsByClassName('navbar-toggler')[0];
    const navbarCollapse = document.getElementById('navbarResponsive');
    
    const searchToggler = document.getElementById('btn-search');
    const searchCollapse = document.getElementById('searchBar');

    const isNavbarOpen = navbarCollapse.classList.contains('show');
    const isSearchOpen = searchCollapse.classList.contains('active');

    const cookieAlert = document.getElementsByClassName('cookie-window')[0];

    const themeToggler = document.getElementsByClassName('theme-toggle')[0];

    const searchInput = document.getElementById('search-input');

    if (isSearchOpen && !searchCollapse.contains(event.target) &&
        !searchInput.contains(event.target) &&
        !searchToggler.contains(event.target) &&
        !themeToggler.contains(event.target) &&
        !cookieAlert.contains(event.target)) {
        document.getElementById('search-results').classList.remove('visible');

        searchCollapse.classList.toggle('active');
        searchToggler.classList.toggle('active');
        sessionStorage.setItem('isSearchOpen', searchBar.classList.contains('active'));
    } 
}


function sectionNavigation() {
    let links;
    let home = false;
    if (window.location.href.includes('teaching')) {
        links = document.querySelectorAll('.info-link, .objectives-link, .syllabus-link, .exam-link, .registry-link, .material-link');
    } else {
        links = document.querySelectorAll('.about-link, .experience-link, .teaching-link, .publications-link, .talks-link, .contact-link');
        home = true;
    }

    links.forEach(link => {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            sectionClick = true;

            links.forEach(l => l.parentElement.classList.remove('active'));
            this.parentElement.classList.add('active');

            const sectionClass = Array.from(this.classList).find(cls =>
                cls.endsWith('-link') && !cls.startsWith('nav')
            );

            document.getElementById('search-results').classList.remove('visible');

            const searchButton = document.getElementById('btn-search');
            const searchBar = document.getElementById('searchBar');

            if (searchBar.classList.contains('active')) {
                searchBar.classList.remove('active');
                searchButton.classList.remove('active');
            }

            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                document.getElementsByClassName('navbar-toggler')[0].click();
            }
    
            setTimeout(() => {
                document.getElementById('search-results').replaceChildren();
                sessionStorage.setItem('searchInput', '');

                setTimeout(() => {
                    const targetId = sectionClass.replace('-link', '');
                    if (targetId === 'about' || targetId === 'info') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else {
                        const targetElement = document.getElementById(targetId);

                        if (targetElement) {
                            const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
                            let offsetPosition = elementPosition - 56;
                            if (!home)
                                offsetPosition -= 20;
                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            });
                        }
                    }
                    sessionStorage.setItem('activeSection', targetId);
                    setTimeout(() => sectionClick = false, 800);
                }, 50);
            }, 500);
        });
    });
}

function highlightActiveSection() {
    if (sectionClick)
        return;
    let links, sections;
    if (window.location.href.includes('teaching')) {
        links = document.querySelectorAll('.info-link, .objectives-link, .syllabus-link, .exam-link, .registry-link, .material-link');
        sections = Array.from(document.querySelectorAll('#info, #objectives, #syllabus, #exam, #registry, #material'));
    } else {
        links = document.querySelectorAll('.about-link, .experience-link, .teaching-link, .publications-link, .talks-link, .contact-link');
        sections = Array.from(document.querySelectorAll('#about, #experience, #teaching, #publications, #talks, #contact'));
    }

    links.forEach(l => l.parentElement.classList.remove('active'));

    let scrollValue = 60;
    let offset = 56;
    if (!window.location.href.includes('teaching')) {
        const aboutSection = document.querySelector('#about');
        const skillsSection = document.querySelector('#skills');
        let aboutHeight = aboutSection ? aboutSection.offsetHeight : 0;
        let skillsHeight = skillsSection ? skillsSection.offsetHeight : 0;
        scrollValue = aboutHeight + skillsHeight + offset / 4;
     } else {
        const infoSection = document.querySelector('#info');
        let infoHeight = infoSection ? infoSection.offsetHeight : 0;
        scrollValue = infoHeight + offset / 2;
    }

    if (window.scrollY < scrollValue) {
        const firstSection = sections[0];
        const firstLink = Array.from(links).find(link =>
            link.classList.contains(`${firstSection.id}-link`)
        );
        if (firstLink)
            sessionStorage.setItem('activeSection', firstSection.id);
            firstLink.parentElement.classList.add('active');
        return;
    }

    const scrollPosition = window.scrollY + offset;

    let found = false;

    sections.forEach(section => {
        let sectionTop = section.offsetTop;
        let sectionBottom = sectionTop + section.offsetHeight;

        if (window.location.href.includes('teaching')) {
            sectionTop -= (offset / 1.5);
            sectionBottom = sectionTop + (offset / 2.5) + section.offsetHeight;
        }

        if (!found && scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            const targetLink = Array.from(links).find(link =>
                link.classList.contains(`${section.id}-link`)
            );
            if (targetLink) {
                sessionStorage.setItem('activeSection', section.id);
                links.forEach(l => l.parentElement.classList.remove('active'));
                targetLink.parentElement.classList.add('active');
                found = true;
            }
        }
    });
}


function loopArrowDown() {
    currentTop = parseFloat(window.getComputedStyle(document.getElementsByClassName('down')[0]).top);
    const arrow = document.getElementsByClassName('down')[0];
    arrow.style.transition = 'top 0.8s';
    const animate = () => {
        arrow.style.top = `${currentTop}px`;
        setTimeout(() => {
            arrow.style.top = `${currentTop + 10}px`;
            setTimeout(animate, 800);
        }, 800);
    };
    animate();
}


function loopToTop() {
    const arrow = document.getElementsByClassName('to-top')[0];
    arrow.style.transition = 'bottom 0.8s';
    const animate = () => {
        arrow.style.bottom = `${currentBottom}px`;
        setTimeout(() => {
            arrow.style.bottom = `${currentBottom + 10}px`;
            setTimeout(animate, 800);
        }, 800);
    };
    animate();
}


function scrollToTop() {
    const toTop = document.getElementsByClassName('to-top')[0];
    toTop.addEventListener('click', function (event) {
        event.preventDefault();
        window.scrollTo({top: 0, behavior: 'smooth'});
        this.blur();
    });
}


function toggleSkills() {
    const skills = document.querySelectorAll('.skill-item');
    const animateSkill = (skill) => {
        const circle = skill.querySelector('.progress');
        const percent = skill.dataset.percent;
        const percentText = skill.querySelector('.skill-percent');
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
        let count = 0;
        const timer = setInterval(() => {
            if (count >= percent) {
                clearInterval(timer);
            } else {
                count++;
                percentText.textContent = count + '%';
            }
        }, 15);
    };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                animateSkill(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    skills.forEach(skill => observer.observe(skill));
}


function toggleBibEntry() {
    const buttons = document.querySelectorAll('.btn-modal');
    buttons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const articleReference = document.querySelectorAll('.article-reference')[index].textContent.trim();
            const formattedContent = articleReference
                .split('\n')
                .map((line, index, lines) => {
                    if (index > 0 && index < lines.length - 1) {
                        return '  ' + line.trim();
                    }
                    return line.trim();
                })
                .join('\n');

            document.querySelector('.reference').textContent = formattedContent;
        });
    });

    document.querySelector('.btn-copy').addEventListener('click', function () {
        const tooltip = new bootstrap.Tooltip(this, {
            title: 'Copied',
            placement: 'top',
            trigger: 'manual'
        });
        const bibEntryText = document.querySelector('.reference').textContent;
        navigator.clipboard.writeText(bibEntryText)
            .then(() => {
                tooltip.show();
                setTimeout(() => {
                    tooltip.hide();
                }, 1000);
            });
    });

    document.querySelector('.btn-download').addEventListener('click', function () {
        const bibEntryText = document.querySelector('.reference').textContent;
        const blob = new Blob([bibEntryText], { type: 'application/x-bibtex' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'entry.bib';
        link.click();
    });

}


const fuseOptions = {
    shouldSort: true,
    includeMatches: true,
    tokenize: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        { 
            name: 'title', weight: 0.8
        },
        {
            name: 'info', weight: 0.6
        },
        {
            name: 'section', weight: 0.4
        },
        {
            name: 'link', weight: 0.2
        },
    ],
};

var old_search_length = -1;

function startSearch(force, fuseInstance) {

    const searchQueryInput = document.getElementById('search-input');
    const searchHits = document.getElementById('search-results');
    const query = searchQueryInput.value;

    const results = fuseInstance.search(query);

    if (results.length > 0)
        searchHits.style.transitionDelay = '0.15s';
    else
        searchHits.style.transitionDelay = '';

    if (old_search_length == results.length || 
        (old_search_length > 5 && results.length > 5)) {
        searchHits.style.transitionDelay = '10s';
    }

    old_search_length = results.length;
    
    searchHits.classList.remove('visible');
    
    if (query.length < 1)
        setTimeout(() => {
            document.querySelectorAll('.search-hit').forEach(el => {
                el.classList.remove('visible');
            });
        }, 500);

    setTimeout(() => {
        if (query.length < 1)
            setTimeout(() => {
                searchHits.replaceChildren();
            }, 500);

        if (!force && query.length < fuseOptions.minMatchCharLength)
            return;

        searchHits.querySelectorAll('.search-hit').forEach(el => el.remove());

        parseResults(query, results);
    }, 300);
}


function parseResults(query, results) {
    const searchHitsContainer = document.getElementById('search-results');

    let headerContainer;
    let found = true;

    headerContainer = document.querySelector('.search-hit-header');
    if (!headerContainer) {
        found = false;
        headerContainer = document.createElement('div');
        headerContainer.className = 'search-hit-header';
    }

    headerContainer.textContent = results.length > 0
        ? `${results.length} results found`
        : `No results found`;

    if (!found)
        searchHitsContainer.append(headerContainer);

    function saveScrollPosition() {
        sessionStorage.setItem(
            'searchResultsScrollTop',
            searchHitsContainer.scrollTop
        );
    }

    const resultsToSave = [];
    if (results.length > 0) {
        results.forEach((result, index) => {
            const {item} = result;
            const searchHitElement = createSearchHitElement({
                key: index,
                title: item.title,
                info: item.info,
                type: item.section,
                link: item.link
            });
            searchHitsContainer.appendChild(searchHitElement);
        
            resultsToSave.push({
                title: item.title,
                info: item.info,
                type: item.section,
                link: item.link
            });
        });
        searchHitsContainer.removeEventListener('scroll', saveScrollPosition);
        searchHitsContainer.addEventListener('scroll', saveScrollPosition);

    } else {
        searchHitsContainer.removeEventListener('scroll', saveScrollPosition);
        sessionStorage.removeItem('searchResultsScrollTop');
    }

    setTimeout(() => {
        document.querySelectorAll('.search-hit').forEach(el => {
            el.style.transitionDelay = '';
            el.classList.add('visible');
        });
    }, 100);

    searchHitsContainer.style.transition = '';
    searchHitsContainer.style.transitionDelay = '';
    searchHitsContainer.classList.add('visible');
    
    sessionStorage.setItem('searchQuery', query);
    sessionStorage.setItem('searchResults', JSON.stringify(resultsToSave));
}


async function initSearch(indexURI) {
    try {
        const response = await fetch(indexURI);
        const data = await response.json();
        const fuseInstance = new Fuse(data, fuseOptions);

        document.getElementById('search-input').addEventListener('keyup', (event) => {
            clearTimeout(event.target.searchTimer);
            sessionStorage.setItem('searchInput', document.getElementById('search-input').value);
            if (event.key === 'Enter') {
                startSearch(true, fuseInstance);
            } else {
                event.target.searchTimer = setTimeout(() => {
                    startSearch(false, fuseInstance);
                }, 375);
            }
        });
        document.getElementById('search-input').addEventListener('mousedown', (event) => {
            setTimeout(() => {
                const val = document.getElementById('search-input').value;
                document.getElementById('search-input').setSelectionRange(val.length, val.length);
            }, 0);
        });


        document.getElementById('search-input').addEventListener('touchend', () => {
            setTimeout(() => {
                const val = document.getElementById('search-input').value;
                document.getElementById('search-input').setSelectionRange(val.length, val.length);
            }, 0);
        });


        document.getElementById('search-input').addEventListener('input', () => {
            setTimeout(() => {
                const val = document.getElementById('search-input').value;
                document.getElementById('search-input').setSelectionRange(val.length, val.length);
            }, 0);
        });

        /*
        if (navType == true) {
            const mousedownOnce = () => {
                clearTimeout(event.target.searchTimer);
                sessionStorage.setItem('searchInput', document.getElementById('search-input').value);
                if (event.key === 'Enter') {
                    startSearch(true, fuseInstance);
                } else {
                    event.target.searchTimer = setTimeout(() => {
                        startSearch(false, fuseInstance);
                    }, 250);
                }
                document.getElementById('search-input').removeEventListener('mousedown', mousedownOnce);
            }
            document.getElementById('search-input').addEventListener('mousedown', mousedownOnce);

            const touchendOnce = () => {
                clearTimeout(event.target.searchTimer);
                sessionStorage.setItem('searchInput', document.getElementById('search-input').value);
                if (event.key === 'Enter') {
                    startSearch(true, fuseInstance);
                } else {
                    event.target.searchTimer = setTimeout(() => {
                        startSearch(false, fuseInstance);
                    }, 250);
                }
                document.getElementById('search-input').removeEventListener('touchend', touchendOnce);
            }
            document.getElementById('search-input').addEventListener('touchend', touchendOnce);
        }
        */
    } catch (error) {
        console.error('initSearch:', error);
    }
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


function setConsent() {
    const expires = Date.now() + COOKIE_DURATION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(COOKIE_KEY, JSON.stringify({ accepted: true, expires }));
}



var timeout_toTop;
var timeout_animate;
var currentTop;
var currentBottom;
var sectionClick = false;


const COOKIE_DURATION_DAYS = 365;


document.addEventListener('DOMContentLoaded', function () {
    const banner = document.querySelector('.cookie-window');
    const btn = document.querySelector('.cookie-btn');

    btn.addEventListener('click', () => {
        setConsent();
        banner.classList.add('hidden');
    });

    currentBottom = parseFloat(window.getComputedStyle(document.getElementsByClassName('to-top')[0]).bottom);

    toggleTheme();
    if (navType == false) {
        if (!hasConsent())
            banner.classList.remove('hidden');
        initializeFadeEffect();
        squeezeNavbar();
    }

    if (navType == true) {
        document.getElementById('search-input').addEventListener('focus', () => {
            const val = document.getElementById('search-input').value;
            document.getElementById('search-input').setSelectionRange(val.length, val.length);
        });
        setTimeout(() => {
            const searchButton = document.getElementById('btn-search');
            const searchBar = document.getElementById('searchBar');

            if (searchBar.classList.contains('active-refreshed')) {
                searchBar.classList.toggle('active');
                searchButton.classList.toggle('active');

                sessionStorage.setItem('isSearchOpen', searchBar.classList.contains('active'));

                setTimeout(() => {
                    searchButton.classList.remove('active-refreshed');
                    searchBar.classList.remove('active-refreshed');
                }, 10);
            }

            const navBar = document.getElementById('navbarResponsive');
            if (navBar.classList.contains('active-refreshed')) {
                navBar.classList.add('show');

                sessionStorage.setItem('isNavbarOpen', navBar.classList.contains('show'));

                setTimeout(() => {
                    navBar.classList.remove('active-refreshed');
                }, 10);
            }

            setTimeout(() => {
                const searchResults = document.getElementById('search-results');
                const searchHitHeader = document.querySelector('.search-hit-header');
                const searchHit = document.querySelectorAll('.search-hit');
                if (searchResults.children.length > 0) {
                    searchResults.classList.add('visible');
                    if (searchHitHeader)
                        searchHitHeader.classList.add('visible');
                    if (searchHit)
                        searchHit.forEach(el => {
                            el.classList.add('visible');
                        });
                }
                document.getElementById('search-results').classList.remove('refreshed');
                if (searchHitHeader)
                    searchHitHeader.classList.remove('refreshed');
                if (searchHit)
                    searchHit.forEach(el => {
                    el.classList.remove('refreshed');
                });
            }, 10);            
        }, 100);
    }

    navbarObserver.observe(document.getElementById('navbarResponsive'), { attributes: true });

    toggleSearch();
    toogleNavbar();
    toggleDropdown();
    scrollToTop();
    loopToTop();

    document.addEventListener('click', function (event) {
        collapseSearch(event);
        collapseNavbar(event);
    });

    window.addEventListener('scroll', function () {
        squeezeNavbar();
        progressBar();

        if (!window.location.href.includes('publications') &&
            !window.location.href.includes('talks_and_awards') && 
            !window.location.href.includes('experience') && 
            !window.location.href.match(/teaching\/?$/))
            highlightActiveSection();
    });

    if (navType == false) {
        if (window.location.href.includes('publications') ||
            window.location.href.includes('talks_and_awards'))
            initIsotope();
    }

    if (!window.location.href.includes('teaching') &&
        !window.location.href.includes('talks_and_awards') &&
        !window.location.href.includes('experience'))
        toggleBibEntry();

    if (!window.location.href.includes('publications') &&
        !window.location.href.includes('talks_and_awards') &&
        !window.location.href.includes('experience') &&
        !window.location.href.match(/teaching\/?$/)) {
        if (navType == false)
            highlightActiveSection();

        sectionNavigation();
    }
    if (!window.location.href.includes('publications') &&
        !window.location.href.includes('teaching') &&
        !window.location.href.includes('talks_and_awards') &&
        !window.location.href.includes('experience')) {
        if (navType == false) {
            showMap();
        }
        loopArrowDown();
    }

    let indexURI = 'index.json';
    if (window.location.href.includes('publications') ||
        window.location.href.includes('talks_and_awards') || 
        window.location.href.includes('experience') ||
        window.location.href.match(/teaching\/?$/))
        indexURI = '../' + indexURI;
    if (window.location.href.includes('teaching'))
        indexURI = '../../' + indexURI;
    
    initSearch(indexURI);

    const p = sessionStorage.getItem('scrollTo');
    if (p !== null && p !== '') {
        const targetElement = document.getElementById(p);
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition - 112;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'instant'
        });
        sessionStorage.removeItem('scrollTo');

        document.querySelectorAll('.fade-up').forEach(el => {

            const rect = el.getBoundingClientRect();
            const elBottom = rect.bottom;
            const viewportBottom = window.innerHeight + ((rect.bottom - rect.top) * 0.01);

            if (elBottom < viewportBottom) {
                el.classList.add('visible-refresh');
            } else
                observer.observe(el);
        });

        document.querySelector('.progress-bar').classList.add('no-animations');
        progressBar();

        const skillItems = document.querySelectorAll('.skill-item');

        const hasVisibleSkill = Array.from(skillItems).some(item =>
          item.classList.contains('visible-refresh')
        );

        if (hasVisibleSkill) {
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
    } else {
        if (navType == false) {
            document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
            toggleSkills();
        }
    }

});


window.addEventListener('unload', (event) => {
    if (document.documentElement.classList.contains('fade-in'))
        document.documentElement.classList.remove('fade-in');
    if (document.documentElement.classList.contains('fade-out'))
        document.documentElement.classList.remove('fade-out');
});


window.addEventListener('pagehide', (event) => {
    if (document.documentElement.classList.contains('fade-in'))
        document.documentElement.classList.remove('fade-in');
    if (document.documentElement.classList.contains('fade-out'))
        document.documentElement.classList.remove('fade-out');
});


window.addEventListener('pageshow', (event) => {
    if (navType != true) {
        if (!document.documentElement.classList.contains('fade-in'))
            document.documentElement.classList.add('fade-in');
    }
});