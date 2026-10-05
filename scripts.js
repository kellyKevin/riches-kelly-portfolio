/* =========================================================
   RICHES & KELLY
   GLOBAL CLIENT-SIDE APPLICATION
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       01. CONFIGURATION
       ===================================================== */

    const CONFIG = Object.freeze({
        localeStorageKey: "riches-kelly-locale",
        themeStorageKey: "riches-kelly-theme",

        defaultLocale: "en",

        supportedLocales: [
            "en",
            "fr",
            "es",
            "de",
            "pt",
            "it",
            "nl",
            "sw",
            "yo",
            "ig",
            "ar",
            "zh",
            "ja",
            "ko",
            "hi",
            "ru",
            "tr"
        ],

        localeDirectory: "locales",

        rtlLocales: [
            "ar"
        ]
    });


    /* =====================================================
       02. DOM HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));


    /* =====================================================
       03. APPLICATION STATE
       ===================================================== */

    const state = {
        locale: CONFIG.defaultLocale,
        translations: {},
        theme: "system",
        menuOpen: false,
        headerScrolled: false,
        projectFilter: "all"
    };


    /* =====================================================
       04. STORAGE
       ===================================================== */

    const storage = {
        get(key) {
            try {
                return window.localStorage.getItem(key);
            } catch {
                return null;
            }
        },

        set(key, value) {
            try {
                window.localStorage.setItem(key, value);
            } catch {
                // Storage may be unavailable in private/restricted contexts.
            }
        }
    };


    /* =====================================================
       05. MOTION
       ===================================================== */

    const prefersReducedMotion = () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    /* =====================================================
       06. LOCALE
       ===================================================== */

    const normaliseLocale = (locale) => {
        if (!locale) {
            return CONFIG.defaultLocale;
        }

        const language = locale
            .toLowerCase()
            .split("-")[0];

        return CONFIG.supportedLocales.includes(language)
            ? language
            : CONFIG.defaultLocale;
    };


    const getLocaleDirection = (locale) =>
        CONFIG.rtlLocales.includes(locale)
            ? "rtl"
            : "ltr";


    const detectLocale = () => {
        const storedLocale =
            storage.get(CONFIG.localeStorageKey);

        if (storedLocale) {
            return normaliseLocale(storedLocale);
        }

        const browserLanguages =
            Array.isArray(navigator.languages)
                ? navigator.languages
                : [navigator.language];

        for (const browserLocale of browserLanguages) {
            const normalised =
                normaliseLocale(browserLocale);

            if (
                normalised !== CONFIG.defaultLocale ||
                browserLocale?.toLowerCase().startsWith("en")
            ) {
                return normalised;
            }
        }

        return CONFIG.defaultLocale;
    };


    const updateDocumentLocale = (locale) => {
        document.documentElement.lang = locale;

        document.documentElement.dir =
            getLocaleDirection(locale);

        document.documentElement.dataset.locale =
            locale;
    };


    const getTranslation = (
        key,
        translations = state.translations
    ) => {
        if (!key) {
            return "";
        }

        return key
            .split(".")
            .reduce(
                (value, part) => value?.[part],
                translations
            );
    };


    const translatePage = () => {

        $$("[data-i18n]").forEach((element) => {

            const translation =
                getTranslation(
                    element.dataset.i18n
                );

            if (typeof translation === "string") {
                element.textContent =
                    translation;
            }
        });


        $$("[data-i18n-html]").forEach((element) => {

            const translation =
                getTranslation(
                    element.dataset.i18nHtml
                );

            if (typeof translation === "string") {
                element.innerHTML =
                    translation;
            }
        });


        $$("[data-i18n-placeholder]").forEach((element) => {

            const translation =
                getTranslation(
                    element.dataset.i18nPlaceholder
                );

            if (typeof translation === "string") {
                element.setAttribute(
                    "placeholder",
                    translation
                );
            }
        });


        $$("[data-i18n-aria-label]").forEach((element) => {

            const translation =
                getTranslation(
                    element.dataset.i18nAriaLabel
                );

            if (typeof translation === "string") {
                element.setAttribute(
                    "aria-label",
                    translation
                );
            }
        });


        $$("[data-i18n-title]").forEach((element) => {

            const translation =
                getTranslation(
                    element.dataset.i18nTitle
                );

            if (typeof translation === "string") {
                element.setAttribute(
                    "title",
                    translation
                );
            }
        });


        $$("[data-i18n-alt]").forEach((element) => {

            const translation =
                getTranslation(
                    element.dataset.i18nAlt
                );

            if (typeof translation === "string") {
                element.setAttribute(
                    "alt",
                    translation
                );
            }
        });


        const titleKey =
            document.body.dataset.pageTitleI18n;

        if (titleKey) {
            const translatedTitle =
                getTranslation(titleKey);

            if (typeof translatedTitle === "string") {
                document.title =
                    translatedTitle;
            }
        }
    };


    const updateLanguageSelectors = (locale) => {

        $$(
            "#languageSelect, [data-language-select]"
        ).forEach((select) => {

            select.value = locale;
        });
    };


    const loadLocale = async (locale) => {

        const normalised =
            normaliseLocale(locale);

        state.locale =
            normalised;

        updateDocumentLocale(
            normalised
        );

        /*
         * English is the source language.
         * The HTML itself contains the English strings.
         */
        if (normalised === "en") {

            state.translations = {};

            translatePage();

            updateLanguageSelectors(
                normalised
            );

            return;
        }


        try {

            const response =
                await fetch(
                    `${CONFIG.localeDirectory}/${normalised}.json`,
                    {
                        headers: {
                            Accept:
                                "application/json"
                        },

                        cache:
                            "no-cache"
                    }
                );


            if (!response.ok) {
                throw new Error(
                    `Locale "${normalised}" could not be loaded.`
                );
            }


            state.translations =
                await response.json();

            translatePage();

            updateLanguageSelectors(
                normalised
            );

        } catch (error) {

            console.warn(
                "[i18n]",
                error.message
            );

            state.translations = {};

            state.locale =
                CONFIG.defaultLocale;

            updateDocumentLocale(
                CONFIG.defaultLocale
            );

            translatePage();

            updateLanguageSelectors(
                CONFIG.defaultLocale
            );
        }
    };


    const initialiseLanguageSelector = () => {

        $$(
            "#languageSelect, [data-language-select]"
        ).forEach((select) => {

            select.addEventListener(
                "change",
                async (event) => {

                    const locale =
                        normaliseLocale(
                            event.target.value
                        );

                    storage.set(
                        CONFIG.localeStorageKey,
                        locale
                    );

                    await loadLocale(locale);
                }
            );
        });
    };


    /* =====================================================
       07. THEME
       ===================================================== */

    const getSystemTheme = () => {

        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light";
    };


    const applyTheme = (theme) => {

        const root =
            document.documentElement;

        const resolvedTheme =
            theme === "system"
                ? getSystemTheme()
                : theme;

        root.dataset.theme =
            resolvedTheme;

        root.classList.toggle(
            "dark",
            resolvedTheme === "dark"
        );

        root.classList.toggle(
            "light",
            resolvedTheme === "light"
        );


        $$(
            "[data-theme-toggle]"
        ).forEach((button) => {

            button.setAttribute(
                "aria-pressed",
                String(
                    resolvedTheme === "dark"
                )
            );

            button.setAttribute(
                "aria-label",
                resolvedTheme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
            );
        });


        $$(
            "[data-theme-icon]"
        ).forEach((icon) => {

            icon.classList.toggle(
                "is-dark",
                resolvedTheme === "dark"
            );
        });
    };


    const initialiseTheme = () => {

        const storedTheme =
            storage.get(
                CONFIG.themeStorageKey
            );

        state.theme =
            storedTheme === "light" ||
            storedTheme === "dark"
                ? storedTheme
                : "system";

        applyTheme(
            state.theme
        );


        $$(
            "[data-theme-toggle]"
        ).forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    const currentResolved =
                        state.theme === "system"
                            ? getSystemTheme()
                            : state.theme;

                    const nextTheme =
                        currentResolved === "dark"
                            ? "light"
                            : "dark";

                    state.theme =
                        nextTheme;

                    storage.set(
                        CONFIG.themeStorageKey,
                        nextTheme
                    );

                    applyTheme(
                        nextTheme
                    );
                }
            );
        });


        const mediaQuery =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            );


        mediaQuery.addEventListener(
            "change",
            () => {

                if (
                    state.theme ===
                    "system"
                ) {
                    applyTheme(
                        "system"
                    );
                }
            }
        );
    };


    /* =====================================================
       08. HEADER SCROLL STATE
       ===================================================== */

    const updateHeaderState = () => {

        const header =
            $(".site-header");

        if (!header) {
            return;
        }

        const shouldBeScrolled =
            window.scrollY > 24;


        if (
            shouldBeScrolled ===
            state.headerScrolled
        ) {
            return;
        }


        state.headerScrolled =
            shouldBeScrolled;

        header.classList.toggle(
            "is-scrolled",
            shouldBeScrolled
        );
    };


    const initialiseHeaderScroll = () => {

        let ticking = false;


        const update = () => {

            updateHeaderState();

            ticking = false;
        };


        window.addEventListener(
            "scroll",
            () => {

                if (ticking) {
                    return;
                }

                ticking = true;

                window.requestAnimationFrame(
                    update
                );
            },
            {
                passive: true
            }
        );


        update();
    };


    /* =====================================================
       09. MOBILE NAVIGATION
       ===================================================== */

    const initialiseMobileNavigation = () => {

        const menuButton =
            $(
                "[data-menu-toggle], #menuToggle, .menu-toggle"
            );

        const navigation =
            $(
                "[data-mobile-navigation], .site-navigation"
            );


        if (
            !menuButton ||
            !navigation
        ) {
            return;
        }


        const setMenuState = (open) => {

            state.menuOpen =
                open;

            menuButton.setAttribute(
                "aria-expanded",
                String(open)
            );

            menuButton.classList.toggle(
                "is-active",
                open
            );

            navigation.classList.toggle(
                "is-open",
                open
            );

            document.body.classList.toggle(
                "menu-open",
                open
            );
        };


        menuButton.setAttribute(
            "aria-expanded",
            "false"
        );


        menuButton.addEventListener(
            "click",
            () => {

                setMenuState(
                    !state.menuOpen
                );
            }
        );


        $$(
            ".navigation-link",
            navigation
        ).forEach((link) => {

            link.addEventListener(
                "click",
                () => {

                    setMenuState(
                        false
                    );
                }
            );
        });


        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key ===
                    "Escape"
                ) {

                    setMenuState(
                        false
                    );

                    menuButton.focus();
                }
            }
        );


        window.addEventListener(
            "resize",
            () => {

                if (
                    window.innerWidth >
                    800
                ) {
                    setMenuState(
                        false
                    );
                }
            }
        );
    };


    /* =====================================================
       10. ACTIVE NAVIGATION
       ===================================================== */

    const initialiseActiveNavigation = () => {

        const currentPath =
            window.location.pathname;

        const currentPage =
            currentPath
                .split("/")
                .filter(Boolean)
                .pop() ||
            "index.html";


        $$(".navigation-link").forEach(
            (link) => {

                const href =
                    link.getAttribute(
                        "href"
                    );

                if (
                    !href ||
                    href.startsWith("#") ||
                    href.startsWith("http")
                ) {
                    return;
                }


                const linkPage =
                    href
                        .split("/")
                        .filter(Boolean)
                        .pop() ||
                    "index.html";


                const isCurrent =
                    linkPage ===
                    currentPage;


                link.classList.toggle(
                    "is-active",
                    isCurrent
                );


                if (isCurrent) {

                    link.setAttribute(
                        "aria-current",
                        "page"
                    );

                } else {

                    link.removeAttribute(
                        "aria-current"
                    );
                }
            }
        );
    };


    /* =====================================================
       11. SMOOTH SCROLLING
       ===================================================== */

    const initialiseSmoothScrolling = () => {

        $$(
            'a[href^="#"]'
        ).forEach((anchor) => {

            anchor.addEventListener(
                "click",
                (event) => {

                    const href =
                        anchor.getAttribute(
                            "href"
                        );

                    if (
                        !href ||
                        href === "#"
                    ) {
                        return;
                    }


                    const target =
                        document.querySelector(
                            href
                        );

                    if (!target) {
                        return;
                    }


                    event.preventDefault();


                    const header =
                        $(".site-header");


                    const headerHeight =
                        header
                            ?.getBoundingClientRect()
                            .height || 0;


                    const targetTop =
                        target
                            .getBoundingClientRect()
                            .top +
                        window.scrollY -
                        headerHeight -
                        20;


                    window.scrollTo({
                        top:
                            Math.max(
                                0,
                                targetTop
                            ),

                        behavior:
                            prefersReducedMotion()
                                ? "auto"
                                : "smooth"
                    });


                    if (
                        !target.hasAttribute(
                            "tabindex"
                        )
                    ) {

                        target.setAttribute(
                            "tabindex",
                            "-1"
                        );
                    }


                    target.focus({
                        preventScroll:
                            true
                    });
                }
            );
        });
    };


    /* =====================================================
       12. PROJECT FILTERING
       ===================================================== */

    const initialiseProjectFiltering = () => {

        const filterButtons =
            $$(
                "[data-project-filter]"
            );

        const projectCards =
            $$(
                "[data-project-category]"
            );

        if (
            !filterButtons.length ||
            !projectCards.length
        ) {
            return;
        }


        const emptyState =
            $(
                "[data-project-empty]"
            );


        const countElement =
            $(
                "[data-project-count]"
            );


        const updateProjects = (
            filter
        ) => {

            state.projectFilter =
                filter;

            let visibleCount = 0;


            projectCards.forEach(
                (card) => {

                    const category =
                        card.dataset
                            .projectCategory
                            ?.toLowerCase() ||
                        "all";


                    const categories =
                        category
                            .split(",")
                            .map(
                                (value) =>
                                    value.trim()
                            );


                    const shouldShow =
                        filter === "all" ||
                        categories.includes(
                            filter
                        );


                    card.classList.toggle(
                        "is-hidden",
                        !shouldShow
                    );


                    if (shouldShow) {
                        visibleCount++;
                    }
                }
            );


            filterButtons.forEach(
                (button) => {

                    const isActive =
                        button.dataset
                            .projectFilter ===
                        filter;

                    button.classList.toggle(
                        "is-active",
                        isActive
                    );

                    button.setAttribute(
                        "aria-pressed",
                        String(isActive)
                    );
                }
            );


            if (countElement) {

                countElement.textContent =
                    visibleCount;
            }


            if (emptyState) {

                emptyState.hidden =
                    visibleCount !== 0;
            }
        };


        filterButtons.forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        updateProjects(
                            button.dataset
                                .projectFilter ||
                            "all"
                        );
                    }
                );
            }
        );


        updateProjects(
            "all"
        );
    };


    /* =====================================================
       13. REVEAL ANIMATIONS
       ===================================================== */

    const initialiseRevealAnimations = () => {

        const revealElements =
            $$(
                [
                    ".section-header",
                    ".team-member",
                    ".capability-card",
                    ".featured-project",
                    ".approach-item",
                    ".developer-profile",
                    ".skill-category",
                    ".value-card",
                    ".project-card",
                    ".technology-overview",
                    ".cta-panel",
                    ".external-profile-panel"
                ].join(",")
            );


        if (!revealElements.length) {
            return;
        }


        if (
            prefersReducedMotion() ||
            !("IntersectionObserver" in window)
        ) {

            revealElements.forEach(
                (element) => {

                    element.classList.add(
                        "is-visible"
                    );
                }
            );

            return;
        }


        const observer =
            new IntersectionObserver(
                (entries, currentObserver) => {

                    entries.forEach(
                        (entry) => {

                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }


                            entry.target.classList.add(
                                "is-visible"
                            );


                            currentObserver.unobserve(
                                entry.target
                            );
                        }
                    );
                },
                {
                    threshold:
                        0.1,

                    rootMargin:
                        "0px 0px -40px 0px"
                }
            );


        revealElements.forEach(
            (element) => {

                element.classList.add(
                    "reveal"
                );

                observer.observe(
                    element
                );
            }
        );
    };


    /* =====================================================
       14. MEDIA OPTIMIZATION
       ===================================================== */

    const initialiseMedia = () => {

        $$("img").forEach(
            (image) => {

                if (
                    !image.hasAttribute(
                        "decoding"
                    )
                ) {

                    image.setAttribute(
                        "decoding",
                        "async"
                    );
                }


                if (
                    !image.hasAttribute(
                        "loading"
                    )
                ) {

                    image.setAttribute(
                        "loading",
                        "lazy"
                    );
                }
            }
        );


        $$("iframe").forEach(
            (iframe) => {

                if (
                    !iframe.hasAttribute(
                        "loading"
                    )
                ) {

                    iframe.setAttribute(
                        "loading",
                        "lazy"
                    );
                }


                if (
                    !iframe.hasAttribute(
                        "referrerpolicy"
                    )
                ) {

                    iframe.setAttribute(
                        "referrerpolicy",
                        "strict-origin-when-cross-origin"
                    );
                }
            }
        );
    };


    /* =====================================================
       15. EXTERNAL LINKS
       ===================================================== */

    const secureExternalLinks = () => {

        $$(
            'a[target="_blank"]'
        ).forEach((link) => {

            link.setAttribute(
                "rel",
                "noopener noreferrer"
            );
        });
    };


    /* =====================================================
       16. CURRENT YEAR
       ===================================================== */

    const initialiseCurrentYear = () => {

        const year =
            new Date()
                .getFullYear();


        $$(
            "#currentYear"
        ).forEach((element) => {

            element.textContent =
                year;
        });
    };


    /* =====================================================
       17. PROJECT VIEW BUTTONS
       ===================================================== */

    const initialiseProjectButtons = () => {

        $$(".project-view").forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const url =
                            button.dataset
                                .link;

                        if (!url) {
                            return;
                        }


                        const confirmed =
                            window.confirm(
                                button.dataset
                                    .projectMessage ||
                                "Open this project?"
                            );


                        if (!confirmed) {
                            return;
                        }


                        window.open(
                            url,
                            "_blank",
                            "noopener,noreferrer"
                        );
                    }
                );
            }
        );
    };


    /* =====================================================
       18. WELCOME ALERTS
       ===================================================== */

    const initialiseAlerts = () => {

        const indexButton =
            $("#showAlertIndex");

        if (indexButton) {

            indexButton.addEventListener(
                "click",
                () => {

                    const title =
                        indexButton.dataset
                            .alertTitle ||
                        "Welcome to Riches & Kelly";

                    const message =
                        indexButton.dataset
                            .alertMessage ||
                        "Explore our work, engineering interests, and software projects.";


                    if (
                        typeof window.Swal !==
                        "undefined"
                    ) {

                        window.Swal.fire({
                            title,
                            text:
                                message,

                            confirmButtonText:
                                "Continue",

                            confirmButtonColor:
                                "#2563eb"
                        });

                    } else {

                        window.alert(
                            `${title}\n\n${message}`
                        );
                    }
                }
            );
        }


        const aboutButton =
            $("#showAlertAbout");

        if (aboutButton) {

            aboutButton.addEventListener(
                "click",
                () => {

                    const title =
                        aboutButton.dataset
                            .alertTitle ||
                        "About Riches & Kelly";

                    const message =
                        aboutButton.dataset
                            .alertMessage ||
                        "Learn more about our work, interests, and development journey.";


                    if (
                        typeof window.Swal !==
                        "undefined"
                    ) {

                        window.Swal.fire({
                            title,
                            text:
                                message,

                            confirmButtonText:
                                "Continue",

                            confirmButtonColor:
                                "#2563eb"
                        });

                    } else {

                        window.alert(
                            `${title}\n\n${message}`
                        );
                    }
                }
            );
        }
    };


    /* =====================================================
       19. KEYBOARD ACCESSIBILITY
       ===================================================== */

    const initialiseKeyboardAccessibility = () => {

        let keyboardUser =
            false;


        document.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key ===
                    "Tab"
                ) {

                    keyboardUser =
                        true;

                    document.documentElement
                        .classList.add(
                            "keyboard-user"
                        );
                }
            }
        );


        document.addEventListener(
            "mousedown",
            () => {

                if (!keyboardUser) {
                    return;
                }

                keyboardUser =
                    false;

                document.documentElement
                    .classList.remove(
                        "keyboard-user"
                    );
            },
            {
                passive: true
            }
        );
    };


    /* =====================================================
       20. LAZY OBSERVER
       ===================================================== */

    const initialiseLazyElements = () => {

        const elements =
            $$(
                "[data-lazy]"
            );


        if (
            !elements.length ||
            !("IntersectionObserver" in window)
        ) {
            return;
        }


        const observer =
            new IntersectionObserver(
                (entries, currentObserver) => {

                    entries.forEach(
                        (entry) => {

                            if (
                                !entry.isIntersecting
                            ) {
                                return;
                            }


                            const element =
                                entry.target;


                            const source =
                                element.dataset
                                    .lazy;


                            if (source) {

                                if (
                                    element.tagName ===
                                    "IMG"
                                ) {

                                    element.src =
                                        source;

                                } else {

                                    element.style
                                        .backgroundImage =
                                        `url("${source}")`;
                                }
                            }


                            element.removeAttribute(
                                "data-lazy"
                            );


                            currentObserver.unobserve(
                                element
                            );
                        }
                    );
                },
                {
                    rootMargin:
                        "200px"
                }
            );


        elements.forEach(
            (element) => {

                observer.observe(
                    element
                );
            }
        );
    };


    /* =====================================================
       21. PAGE VISIBILITY
       ===================================================== */

    const initialiseVisibilityHandling = () => {

        document.addEventListener(
            "visibilitychange",
            () => {

                if (
                    document.hidden
                ) {
                    return;
                }


                updateHeaderState();
            }
        );
    };


    /* =====================================================
       22. ERROR MONITORING
       ===================================================== */

    window.addEventListener(
        "error",
        (event) => {

            console.error(
                "[Portfolio Error]",
                event.error ||
                event.message
            );
        }
    );


    window.addEventListener(
        "unhandledrejection",
        (event) => {

            console.error(
                "[Portfolio Promise Error]",
                event.reason
            );
        }
    );


    /* =====================================================
       23. APPLICATION INITIALIZATION
       ===================================================== */

    const initialise = async () => {

        initialiseTheme();

        initialiseHeaderScroll();

        initialiseMobileNavigation();

        initialiseActiveNavigation();

        initialiseSmoothScrolling();

        initialiseLanguageSelector();

        initialiseProjectFiltering();

        initialiseRevealAnimations();

        initialiseMedia();

        initialiseLazyElements();

        initialiseProjectButtons();

        initialiseAlerts();

        initialiseCurrentYear();

        initialiseKeyboardAccessibility();

        initialiseVisibilityHandling();

        secureExternalLinks();


        state.locale =
            detectLocale();


        await loadLocale(
            state.locale
        );


        document.documentElement
            .classList.add(
                "js-ready"
            );
    };


    /* =====================================================
       24. START APPLICATION
       ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialise,
            {
                once: true
            }
        );

    } else {

        initialise();
    }

})();