/* =========================================================
   RICHES & KELLY PORTFOLIO
   Global Client-Side Application Logic
   ========================================================= */

(() => {
    "use strict";

    /* =====================================================
       CONFIGURATION
       ===================================================== */

    const CONFIG = Object.freeze({
        localeStorageKey: "riches-kelly-locale",
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
        scrollOffset: 90,
        revealThreshold: 0.12
    });

    /* =====================================================
       DOM HELPERS
       ===================================================== */

    const $ = (selector, parent = document) =>
        parent.querySelector(selector);

    const $$ = (selector, parent = document) =>
        Array.from(parent.querySelectorAll(selector));

    const prefersReducedMotion = () =>
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* =====================================================
       APPLICATION STATE
       ===================================================== */

    const state = {
        locale: CONFIG.defaultLocale,
        translations: {},
        headerScrolled: false
    };

    /* =====================================================
       CONSOLE GREETING
       ===================================================== */

    console.info(
        "%cRiches & Kelly",
        "font-size: 20px; font-weight: 700;"
    );

    console.info(
        "%cWelcome to the portfolio.",
        "font-size: 13px;"
    );

    /* =====================================================
       SAFE STORAGE
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
       LOCALE / INTERNATIONALIZATION
       ===================================================== */

    const localeDirection = (locale) => {
        const rtlLanguages = new Set([
            "ar",
            "he",
            "fa",
            "ur"
        ]);

        return rtlLanguages.has(locale.split("-")[0])
            ? "rtl"
            : "ltr";
    };

    const normaliseLocale = (locale) => {
        if (!locale) {
            return CONFIG.defaultLocale;
        }

        const language = locale.toLowerCase().split("-")[0];

        return CONFIG.supportedLocales.includes(language)
            ? language
            : CONFIG.defaultLocale;
    };

    const detectLocale = () => {
        const savedLocale = storage.get(CONFIG.localeStorageKey);

        if (savedLocale) {
            return normaliseLocale(savedLocale);
        }

        const browserLanguages = Array.isArray(navigator.languages)
            ? navigator.languages
            : [navigator.language];

        for (const browserLocale of browserLanguages) {
            const detected = normaliseLocale(browserLocale);

            if (
                detected !== CONFIG.defaultLocale ||
                browserLocale?.toLowerCase().startsWith("en")
            ) {
                return detected;
            }
        }

        return CONFIG.defaultLocale;
    };

    const updateDocumentLocale = (locale) => {
        document.documentElement.lang = locale;
        document.documentElement.dir = localeDirection(locale);

        document.documentElement.dataset.locale = locale;
    };

    const getTranslation = (key, translations = state.translations) => {
        if (!key) {
            return "";
        }

        return key
            .split(".")
            .reduce((value, part) => value?.[part], translations);
    };

    const translateElement = (element) => {
        const key = element.dataset.i18n;

        if (!key) {
            return;
        }

        const translation = getTranslation(key);

        if (typeof translation === "string") {
            element.textContent = translation;
        }
    };

    const translateAttributes = () => {
        $$("[data-i18n-placeholder]").forEach((element) => {
            const value = getTranslation(
                element.dataset.i18nPlaceholder
            );

            if (typeof value === "string") {
                element.setAttribute("placeholder", value);
            }
        });

        $$("[data-i18n-aria-label]").forEach((element) => {
            const value = getTranslation(
                element.dataset.i18nAriaLabel
            );

            if (typeof value === "string") {
                element.setAttribute("aria-label", value);
            }
        });

        $$("[data-i18n-title]").forEach((element) => {
            const value = getTranslation(
                element.dataset.i18nTitle
            );

            if (typeof value === "string") {
                element.setAttribute("title", value);
            }
        });

        $$("[data-i18n-alt]").forEach((element) => {
            const value = getTranslation(
                element.dataset.i18nAlt
            );

            if (typeof value === "string") {
                element.setAttribute("alt", value);
            }
        });
    };

    const applyTranslations = () => {
        $$("[data-i18n]").forEach(translateElement);

        translateAttributes();

        const titleKey = document.body.dataset.pageTitleI18n;

        if (titleKey) {
            const translatedTitle = getTranslation(titleKey);

            if (typeof translatedTitle === "string") {
                document.title = translatedTitle;
            }
        }
    };

    const loadLocale = async (locale) => {
        const normalised = normaliseLocale(locale);

        updateDocumentLocale(normalised);

        /*
         * English can work without an external translation file.
         * Additional translations are loaded from:
         *
         * locales/fr.json
         * locales/es.json
         * locales/de.json
         * ...
         */

        if (normalised === CONFIG.defaultLocale) {
            state.translations = {};
            applyTranslations();
            updateLanguageSelector(normalised);
            return;
        }

        try {
            const response = await fetch(
                `${CONFIG.localeDirectory}/${normalised}.json`,
                {
                    headers: {
                        Accept: "application/json"
                    },
                    cache: "no-cache"
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Unable to load locale: ${normalised}`
                );
            }

            state.translations = await response.json();

            applyTranslations();
            updateLanguageSelector(normalised);
        } catch (error) {
            console.warn(
                `[i18n] Falling back to English. ${error.message}`
            );

            state.translations = {};
            updateDocumentLocale(CONFIG.defaultLocale);
            updateLanguageSelector(CONFIG.defaultLocale);
        }
    };

    const setLocale = async (locale) => {
        const normalised = normaliseLocale(locale);

        state.locale = normalised;

        storage.set(
            CONFIG.localeStorageKey,
            normalised
        );

        await loadLocale(normalised);
    };

    const updateLanguageSelector = (locale) => {
        $$(
            "#languageSelect, [data-language-select]"
        ).forEach((select) => {
            if (select.value !== locale) {
                select.value = locale;
            }
        });
    };

    const initialiseLanguageSelector = () => {
        $$(
            "#languageSelect, [data-language-select]"
        ).forEach((select) => {
            select.addEventListener("change", async (event) => {
                await setLocale(event.target.value);
            });
        });
    };

    /* =====================================================
       NAVIGATION
       ===================================================== */

    const initialiseActiveNavigation = () => {
        const currentPage =
            window.location.pathname.split("/").pop() ||
            "index.html";

        $$(".navigation-link, nav a").forEach((link) => {
            const href = link.getAttribute("href");

            if (!href || href.startsWith("#")) {
                return;
            }

            const linkPage = href.split("/").pop();

            if (linkPage === currentPage) {
                link.classList.add("is-active");
                link.setAttribute("aria-current", "page");
            }
        });
    };

    const updateHeaderState = () => {
        const header = $(".site-header, header");

        if (!header) {
            return;
        }

        const shouldBeScrolled = window.scrollY > 40;

        if (shouldBeScrolled === state.headerScrolled) {
            return;
        }

        state.headerScrolled = shouldBeScrolled;

        header.classList.toggle(
            "is-scrolled",
            shouldBeScrolled
        );
    };

    /* =====================================================
       MOBILE NAVIGATION
       ===================================================== */

    const initialiseMobileNavigation = () => {
        const menuButton = $(
            "[data-menu-toggle], #menuToggle, .menu-toggle"
        );

        const navigation = $(
            "[data-mobile-navigation], .site-navigation, nav"
        );

        if (!menuButton || !navigation) {
            return;
        }

        menuButton.setAttribute("aria-expanded", "false");

        const closeMenu = () => {
            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            menuButton.classList.remove("is-active");
            navigation.classList.remove("is-open");
        };

        const toggleMenu = () => {
            const isOpen =
                menuButton.getAttribute("aria-expanded") === "true";

            menuButton.setAttribute(
                "aria-expanded",
                String(!isOpen)
            );

            menuButton.classList.toggle(
                "is-active",
                !isOpen
            );

            navigation.classList.toggle(
                "is-open",
                !isOpen
            );
        };

        menuButton.addEventListener("click", toggleMenu);

        $$(".navigation-link, nav a", navigation).forEach((link) => {
            link.addEventListener("click", closeMenu);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });
    };

    /* =====================================================
       SMOOTH SCROLLING
       ===================================================== */

    const initialiseSmoothScrolling = () => {
        $$('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener("click", (event) => {
                const href = anchor.getAttribute("href");

                if (!href || href === "#") {
                    return;
                }

                const target = document.querySelector(href);

                if (!target) {
                    return;
                }

                event.preventDefault();

                const header =
                    $(".site-header, header");

                const headerHeight =
                    header?.getBoundingClientRect().height || 0;

                const targetTop =
                    target.getBoundingClientRect().top +
                    window.scrollY -
                    Math.max(
                        headerHeight,
                        CONFIG.scrollOffset
                    );

                window.scrollTo({
                    top: Math.max(0, targetTop),
                    behavior: prefersReducedMotion()
                        ? "auto"
                        : "smooth"
                });

                if (
                    !target.hasAttribute("tabindex")
                ) {
                    target.setAttribute(
                        "tabindex",
                        "-1"
                    );
                }

                target.focus({
                    preventScroll: true
                });
            });
        });
    };

    /* =====================================================
       SCROLL REVEAL
       ===================================================== */

    const initialiseRevealAnimations = () => {
        const revealElements = $$(
            [
                ".intro",
                ".about-us",
                ".projects-list",
                ".project-item",
                ".project-card",
                ".person-card",
                ".skills",
                ".capabilities",
                ".cta-section"
            ].join(",")
        );

        if (!revealElements.length) {
            return;
        }

        if (
            prefersReducedMotion() ||
            !("IntersectionObserver" in window)
        ) {
            revealElements.forEach((element) => {
                element.classList.add("is-visible");
            });

            return;
        }

        const observer = new IntersectionObserver(
            (entries, currentObserver) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    entry.target.classList.add(
                        "is-visible"
                    );

                    currentObserver.unobserve(
                        entry.target
                    );
                });
            },
            {
                threshold: CONFIG.revealThreshold,
                rootMargin: "0px 0px -50px 0px"
            }
        );

        revealElements.forEach((element) => {
            element.classList.add("reveal");
            observer.observe(element);
        });
    };

    /* =====================================================
       PROJECT LINKS
       ===================================================== */

    const initialiseProjectButtons = () => {
        $$(".project-view").forEach((button) => {
            button.addEventListener("click", async () => {
                const projectLink =
                    button.dataset.link ||
                    button.getAttribute("data-link");

                if (!projectLink) {
                    console.warn(
                        "[Projects] No project URL was provided."
                    );

                    return;
                }

                const title =
                    button.dataset.projectTitle ||
                    "Project Details";

                const message =
                    button.dataset.projectMessage ||
                    "You are about to view more details for this project.";

                const openProject = () => {
                    window.open(
                        projectLink,
                        "_blank",
                        "noopener,noreferrer"
                    );
                };

                if (
                    typeof window.Swal === "undefined"
                ) {
                    openProject();
                    return;
                }

                const result =
                    await window.Swal.fire({
                        title,
                        text: message,
                        imageUrl: "images/back.jpg",
                        imageAlt:
                            "Project preview",
                        showCancelButton: true,
                        confirmButtonText:
                            "Proceed",
                        cancelButtonText:
                            "Cancel",
                        confirmButtonColor:
                            "#2563eb",
                        reverseButtons:
                            document.documentElement.dir ===
                            "rtl"
                    });

                if (result.isConfirmed) {
                    openProject();
                }
            });
        });
    };

    /* =====================================================
       SWEETALERT HELPERS
       ===================================================== */

    const showWelcomeAlert = ({
        title,
        text,
        confirmButtonText = "OK"
    }) => {
        if (
            typeof window.Swal === "undefined"
        ) {
            window.alert(`${title}\n\n${text}`);
            return;
        }

        window.Swal.fire({
            title,
            text,
            imageUrl: "images/back.jpg",
            imageWidth: 300,
            imageHeight: 200,
            imageAlt: "Welcome image",
            confirmButtonText,
            confirmButtonColor: "#2563eb"
        });
    };

    const initialiseAlerts = () => {
        const alertBtnIndex =
            $("#showAlertIndex");

        if (alertBtnIndex) {
            alertBtnIndex.addEventListener(
                "click",
                () => {
                    showWelcomeAlert({
                        title:
                            "Welcome to Our Portfolio!",
                        text:
                            "Explore our projects and learn more about our journey through the ALX program.",
                        confirmButtonText:
                            "OK"
                    });
                }
            );
        }

        const alertBtnAbout =
            $("#showAlertAbout");

        if (alertBtnAbout) {
            alertBtnAbout.addEventListener(
                "click",
                () => {
                    showWelcomeAlert({
                        title:
                            "Welcome to Our About Page!",
                        text:
                            "We are thrilled to have you here. Explore our journey and get to know us better.",
                        confirmButtonText:
                            "Thank you!"
                    });
                }
            );
        }
    };

    /* =====================================================
       CURRENT YEAR
       ===================================================== */

    const initialiseCurrentYear = () => {
        const currentYear =
            new Date().getFullYear();

        $$("#currentYear").forEach((element) => {
            element.textContent = currentYear;
        });
    };

    /* =====================================================
       EXTERNAL LINKS
       ===================================================== */

    const secureExternalLinks = () => {
        $$("a[target='_blank']").forEach((link) => {
            link.setAttribute(
                "rel",
                "noopener noreferrer"
            );
        });
    };

    /* =====================================================
       ACCESSIBILITY
       ===================================================== */

    const initialiseAccessibility = () => {
        /*
         * Prevent accidental focus styling from being lost
         * when users navigate with a keyboard.
         */

        document.addEventListener(
            "keydown",
            (event) => {
                if (event.key === "Tab") {
                    document.documentElement.classList.add(
                        "keyboard-user"
                    );
                }
            },
            { once: true }
        );

        document.addEventListener(
            "mousedown",
            () => {
                document.documentElement.classList.remove(
                    "keyboard-user"
                );
            },
            { passive: true }
        );
    };

    /* =====================================================
       LAZY MEDIA / IFRAMES
       ===================================================== */

    const initialiseLazyMedia = () => {
        $$("img").forEach((image) => {
            if (
                !image.hasAttribute("loading") &&
                !image.complete
            ) {
                image.setAttribute(
                    "loading",
                    "lazy"
                );
            }

            if (
                !image.hasAttribute("decoding")
            ) {
                image.setAttribute(
                    "decoding",
                    "async"
                );
            }
        });

        $$("iframe").forEach((iframe) => {
            if (
                !iframe.hasAttribute("loading")
            ) {
                iframe.setAttribute(
                    "loading",
                    "lazy"
                );
            }
        });
    };

    /* =====================================================
       PERFORMANCE
       ===================================================== */

    const initialiseScrollPerformance = () => {
        let ticking = false;

        const update = () => {
            updateHeaderState();
            ticking = false;
        };

        window.addEventListener(
            "scroll",
            () => {
                if (!ticking) {
                    window.requestAnimationFrame(
                        update
                    );

                    ticking = true;
                }
            },
            {
                passive: true
            }
        );

        update();
    };

    /* =====================================================
       ERROR REPORTING
       ===================================================== */

    window.addEventListener(
        "error",
        (event) => {
            console.error(
                "[Portfolio Error]",
                event.error || event.message
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
       INITIALISE APPLICATION
       ===================================================== */

    const initialise = async () => {
        initialiseActiveNavigation();
        initialiseMobileNavigation();
        initialiseSmoothScrolling();
        initialiseRevealAnimations();
        initialiseProjectButtons();
        initialiseAlerts();
        initialiseCurrentYear();
        secureExternalLinks();
        initialiseAccessibility();
        initialiseLazyMedia();
        initialiseScrollPerformance();
        initialiseLanguageSelector();

        state.locale = detectLocale();

        await loadLocale(state.locale);

        document.documentElement.classList.add(
            "js-ready"
        );
    };

    if (
        document.readyState === "loading"
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