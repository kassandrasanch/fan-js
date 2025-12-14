// TODO
// check mobile
// snapping not working right
// fix element not found error
// add page loader

// DONE
// fix gradient like this and first text reveal not showing
// edit mobile nav order
// edit img in nav (asana)
// fix section split
// add wait for fonts to load before showing body.
// add nav to init.
// check to see if this fixes brand design principles nav spacing issue
// replace header video
// fix double span on splitTextIntoWords
// fix dot reveal
// fix gsap target not found errors
// re add nav bar animation

gsap.registerPlugin(ScrollTrigger, SplitText);

// console.log("hi from local");

const lenis = new Lenis({
    duration: 2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    wheelMultiplier: 0.7
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

lenis.on("scroll", () => ScrollTrigger.update());
// lenis.on("scroll", ({ scroll, limit }) => {
//     console.log("lenis", { scroll, limit });
// });
ScrollTrigger.addEventListener("refresh", () => {
    if (typeof lenis.resize === "function") {
        lenis.resize();
    }
});

const toggleSectionInfo = document.querySelector(".n_nav__sections");
const sections = document.querySelectorAll("section[data-section-number][data-section-title]");

function wireNav() {
    // console.log("FANATICS_SLIDERS", window.FANATICS_SLIDERS);

    if (wireNav._done) return;
    wireNav._done = true;

    const toggleSectionInfo = document.querySelector(".n_nav__sections");
    const navSectionsWindow = document.querySelector(".n_nav__sections-window");
    const navSectionsInner = document.querySelector(".n_nav__sections");

    // ---- ALL SECTION ANCHORS (all of these live inside sliders now) ----
    const sectionAnchors = Array.from(
        document.querySelectorAll("[data-section-number][data-section-title]")
    );
    if (!sectionAnchors.length) return;

    // ---- SLIDER METADATA (from initPageSlider) ----
    const sliders = window.FANATICS_SLIDERS || [];
    const sliderMetas = sliders.map(({ tl, slides, wrapper }) => ({
        tl,
        slides,
        wrapper
    }));

    // ---- BUILD NAV LABELS FROM sectionAnchors ----
    sectionAnchors.forEach((section, i) => {
        const rawNumber = section.getAttribute("data-section-number") || "";
        const title = section.getAttribute("data-section-title") || "";

        const container = document.createElement("div");
        container.className = "n_nav__section";

        const titleWrapper = document.createElement("div");
        titleWrapper.className = "n_nav__section-title";

        const numSpan = document.createElement("span");
        numSpan.className = "navbar_section-text__bold";

        if (i !== 0) {
            numSpan.textContent = rawNumber.toString().padStart(2, "0") + "\u00A0";
        } else {
            numSpan.textContent = "";
        }

        titleWrapper.appendChild(numSpan);
        if (i !== 0) titleWrapper.appendChild(document.createTextNode(title));

        container.appendChild(titleWrapper);
        toggleSectionInfo.appendChild(container);
    });

    // ---- MEASURE GHOST WIDTHS ----
    let sectionWidths = [];
    let sectionHeight = 0;

    function measureSectionWidths() {
        const oldGhost = document.querySelector(".n_nav__ghost");
        if (oldGhost) oldGhost.remove();

        const realSections = Array.from(document.querySelectorAll(".n_nav__section"));
        const ghostContainer = document.createElement("div");
        ghostContainer.className = "n_nav__ghost";
        ghostContainer.style.position = "absolute";
        ghostContainer.style.visibility = "hidden";
        ghostContainer.style.height = "auto";
        ghostContainer.style.overflow = "visible";
        ghostContainer.style.whiteSpace = "nowrap";
        ghostContainer.style.pointerEvents = "none";
        ghostContainer.style.top = "0";
        ghostContainer.style.left = "0";
        ghostContainer.style.zIndex = "-9999";
        document.body.appendChild(ghostContainer);

        realSections.forEach((sec) => {
            const clone = sec.cloneNode(true);
            clone.style.display = "block";
            clone.style.visibility = "visible";
            ghostContainer.appendChild(clone);
        });

        const ghostSections = Array.from(ghostContainer.querySelectorAll(".n_nav__section"));
        sectionHeight = ghostSections[1]?.getBoundingClientRect().height || 0;

        sectionWidths = ghostSections.map((el, i) => {
            if (i === 0) return 0;
            const elTitle = el.querySelector(".n_nav__section-title");
            return elTitle
                ? elTitle.getBoundingClientRect().width
                : el.getBoundingClientRect().width;
        });

        document.body.removeChild(ghostContainer);
    }

    measureSectionWidths();

    function setWindowHeight() {
        navSectionsWindow.style.height = sectionHeight + "px";
    }
    setWindowHeight();

    window.addEventListener("resize", () => {
        measureSectionWidths();
        setWindowHeight();
    });

    // ---- GO TO SECTION (ANIMATE NAV HUD) ----
    let currentIndex = -1;
    function goToSection(i) {
        if (typeof sectionWidths[i] === "undefined") return;
        if (i === currentIndex) return;
        currentIndex = i;

        gsap.to(navSectionsWindow, {
            width: sectionWidths[i] + "px",
            duration: 0.3,
            ease: "power4.out"
        });

        gsap.to(navSectionsInner, {
            y: -i * sectionHeight + "px",
            duration: 0.3,
            ease: "power4.out"
        });
    }

    navSectionsWindow.style.width = (sectionWidths[0] || 0) + "px";
    gsap.set(navSectionsInner, { yPercent: 0 });

    const anchorMeta = sectionAnchors.map((el, index) => {
        let sliderIndex = -1;
        let slideIndex = -1;

        sliderMetas.forEach((s, si) => {
            if (sliderIndex !== -1) return;
            if (s.wrapper.contains(el)) {
                sliderIndex = si;
                const slide = el.closest(".slide");
                slideIndex = slide ? s.slides.indexOf(slide) : -1;
            }
        });

        return { el, index, sliderIndex, slideIndex };
    });
    window.FAN_DEBUG_ANCHORS = anchorMeta;
    // console.table(
    //     anchorMeta.map((a) => ({
    //         title: a.el.getAttribute("data-section-title"),
    //         index: a.index,
    //         sliderIndex: a.sliderIndex,
    //         slideIndex: a.slideIndex
    //     }))
    // );

    // ---- BUILD RANGES PER SLIDER, THEN DRIVE NAV VIA TICKER ----
    const sliderNavData = [];

    sliderMetas.forEach((slider, si) => {
        const { tl } = slider;
        const duration = tl.duration();
        if (!duration) return;

        // anchors that belong to this slider
        const localAnchors = anchorMeta
            .filter((a) => a.sliderIndex === si && a.slideIndex >= 0)
            // keep DOM/nav order (Intro, Fans, Brand, …)
            .sort((a, b) => a.index - b.index);

        if (!localAnchors.length) return;

        // build [start,end) ranges in normalized timeline progress
        const ranges = localAnchors.map((a, j) => {
            const labelName = `no-snap-section-${a.slideIndex}`;
            const tStart = tl.labels[labelName];
            const start = typeof tStart === "number" ? tStart / duration : 0;

            const next = localAnchors[j + 1];
            let end = 1;
            if (next) {
                const nextLabel = `no-snap-section-${next.slideIndex}`;
                const tEnd = tl.labels[nextLabel];
                end = typeof tEnd === "number" ? tEnd / duration : 1;
            }

            return {
                sectionIndex: a.index, // index into sectionAnchors/nav
                start,
                end
            };
        });

        sliderNavData.push({ tl, ranges });
    });

    // Ticker: read each slider's ScrollTrigger progress and update nav
    gsap.ticker.add(() => {
        sliderNavData.forEach(({ tl, ranges }) => {
            const st = tl.scrollTrigger;
            if (!st || !st.isActive) return; // only care about the slider currently in view

            const p = st.progress; // 0–1 within THIS slider

            let active = ranges[0];
            for (const r of ranges) {
                if (p >= r.start && p < r.end) {
                    active = r;
                    break;
                }
            }

            goToSection(active.sectionIndex);
        });
    });

    // ---- NAV OPEN/CLOSE + CLICK HANDLERS ----
    const navToggle = document.querySelector(".n_nav__toggle");
    const navMenu = document.querySelector(".n_nav__menu");
    const navMenuPrimary = document.querySelector(".n_nav__menu-primary");
    const navHeader = document.querySelector(".n_nav__inner");
    const navBrand = document.querySelector(".n_nav__brand");

    const navLinks = document.querySelectorAll(".n_nav-menu__link");

    function onEscapeKey(e) {
        if (e.key === "Escape" || e.key === "Esc") closeNav();
    }

    function openNav() {
        lenis.stop();
        document.body.classList.add("nav-open");
        navToggle.setAttribute("aria-expanded", "true");
        document.addEventListener("keydown", onEscapeKey);

        gsap.timeline()
            .to(navMenu, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" })
            .to(navBrand, { opacity: 1, pointerEvents: "auto" }, "<");
        gsap.set(navHeader, { backgroundColor: "#e10600" });
    }

    function closeNav() {
        lenis.start();
        navToggle.setAttribute("aria-expanded", "false");
        gsap.set(navHeader, { backgroundColor: "transparent" });
        gsap.timeline()
            .to(navMenu, { y: -50, autoAlpha: 0, duration: 0.1, ease: "power4.in" })
            .to(navBrand, { opacity: 0, pointerEvents: "none" });
        document.body.classList.remove("nav-open");
        document.removeEventListener("keydown", onEscapeKey);
    }

    function toggleNav(e) {
        e.preventDefault();
        const expanded = navToggle.getAttribute("aria-expanded") === "true";
        if (expanded) closeNav();
        else openNav();
    }

    navToggle.addEventListener("click", toggleNav);

    navLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            const targetID = link.getAttribute("href");
            const targetElem = document.querySelector(targetID);
            if (!targetElem) return;

            gsap.to("body", {
                opacity: 0,
                duration: 0.1,
                onComplete() {
                    closeNav();

                    // 🔑 slider-aware scroll
                    scrollToSectionElem(targetElem);

                    gsap.to("body", { opacity: 1, duration: 0.3, delay: 1.2 });
                }
            });
        });
    });

    function setMenuPrimaryMargin() {
        const navHeaderHeight = navHeader.getBoundingClientRect().height;
        navMenuPrimary.style.marginTop = navHeaderHeight + "px";
    }
    setMenuPrimaryMargin();

    ScrollTrigger.addEventListener("refreshInit", measureSectionWidths);
    ScrollTrigger.addEventListener("refresh", setWindowHeight);

    // ---- helper: scroll to a section anchor, aware of sliders ----
    function scrollToSectionElem(targetElem) {
        // find meta for this anchor
        const meta = anchorMeta.find((m) => m.el === targetElem);
        if (!meta || meta.sliderIndex === -1) {
            // not inside a slider → basic behavior
            lenis.scrollTo(targetElem, {
                offset: 12,
                duration: 1.2,
                lock: true
            });
            return;
        }

        const slider = sliderMetas[meta.sliderIndex];
        if (!slider) {
            lenis.scrollTo(targetElem, {
                offset: 12,
                duration: 1.2,
                lock: true
            });
            return;
        }

        const { tl } = slider;
        const st = tl.scrollTrigger;
        const duration = tl.duration();
        if (!st || !duration) {
            // fallback
            lenis.scrollTo(targetElem, {
                offset: 12,
                duration: 1.2,
                lock: true
            });
            return;
        }

        // where in the timeline should this section start?
        let progress = 0;
        if (meta.slideIndex >= 0) {
            const labelName = `no-snap-section-${meta.slideIndex}`;
            const tStart = tl.labels[labelName];
            if (typeof tStart === "number") {
                progress = tStart / duration; // 0–1 within slider timeline
            }
        }

        // convert timeline progress → actual scrollY in the document
        const startY = st.start;
        const endY = st.end;
        const y = startY + progress * (endY - startY);

        const EXTRA_PX = 20;
        const targetY = y + EXTRA_PX;

        // let Lenis animate the real scroll position
        lenis.scrollTo(targetY, {
            duration: 1.2,
            lock: true
        });
    }

    // initial state
    goToSection(0);
}

function setupPageSlider(wrapper) {
    const slides = gsap.utils.toArray(wrapper.querySelectorAll(".slide"));
    const total = slides.length;

    if (!total) {
        return null;
    }

    const SLIDE_DURATION = 5; // seconds per slide

    const tops = slides.map((slide) =>
        ScrollTrigger.create({
            trigger: slide,
            start: "top top"
            // markers: true,
        })
    );

    // console.log(`tops`);
    // console.log(tops);

    // Build a scrubbed, pinned timeline: one viewport per slide
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: wrapper,
            pin: true,
            pinSpacing: true,
            scrub: 1,
            // markers: true,
            start: "top top",
            end: `+=${(total - 1) * window.innerHeight * 2}`,
            // end: () => "+=" + (total - 1) * window.innerHeight,
            invalidateOnRefresh: true,
            snap: (rawProgress) => {
                // raw progress is 0 to 1 over entire timeline
                // my function must return a number between 0 and 1
                // console.log(tl.labels);

                const labelEntries = Object.entries(tl.labels);

                const snapLabelEntries = labelEntries.filter(([name]) => /^slide-\d+$/.test(name));
                // Rebuild normalized label positions on every call
                const labels = snapLabelEntries
                    .map(([_, time]) => time / tl.duration())
                    .sort((a, b) => a - b);

                // console.log(
                //     "SNAP LABELS:",
                //     snapLabelEntries.map(([name, time]) => ({
                //         name,
                //         time,
                //         progress: Number((time / tl.duration()).toFixed(3))
                //     }))
                // );
                // Find which segment (slide) we're in: [labels[i], labels[i+1]]
                let segIndex = 0;
                for (let i = 0; i < labels.length - 1; i++) {
                    if (rawProgress >= labels[i] && rawProgress < labels[i + 1]) {
                        segIndex = i;
                        // console.log("segIndex", segIndex);
                        break;
                    }
                }

                const segStart = labels[segIndex];
                const segEnd = labels[segIndex + 1] ?? 1;
                const segLen = segEnd - segStart;

                // if current slide has text-reveal or scroll-accordion, treat as special
                const hasTextReveal = !!slides[segIndex].querySelector(".n_text-reveal-section");
                const isAccordion = !!slides[segIndex].querySelector(".n_scroll-accordion");
                const isColorsSection = !!slides[segIndex].querySelector(".colors-wrapper");
                const isFansSection = !!slides[segIndex].querySelector(".section-fans");
                const rippleGradient =
                    slides[segIndex].getAttribute("data-element") === "ripple-gradient";
                const isBigSlider = !!slides[segIndex].querySelector(".n_big-slider_wrapper");
                const isStackedSlider = !!slides[segIndex].querySelector(".n_stacked-slider");
                const isSpecialSlide =
                    hasTextReveal ||
                    isAccordion ||
                    isColorsSection ||
                    rippleGradient ||
                    isFansSection ||
                    isBigSlider ||
                    isStackedSlider;

                // NORMAL SLIDES
                if (!isSpecialSlide) {
                    const GLOBAL_THRESHOLD = 0.08;

                    let closest = labels[0];
                    labels.forEach((p) => {
                        if (Math.abs(p - rawProgress) < Math.abs(closest - rawProgress)) {
                            closest = p;
                        }
                    });

                    if (Math.abs(closest - rawProgress) < GLOBAL_THRESHOLD) {
                        return closest;
                    }

                    return rawProgress;
                }

                // FOR SPECIAL SLIDES: only snap near edges
                const EDGE_PORTION = 0.1;

                const leftSnapEnd = segStart + segLen * EDGE_PORTION; // first 10% of segment
                const rightSnapStart = segEnd - segLen * EDGE_PORTION; // last 10% of segment
                // middle 70% - no snapping

                if (rawProgress > leftSnapEnd && rawProgress < rightSnapStart) {
                    return rawProgress;
                }

                const distToStart = Math.abs(rawProgress - segStart);
                const distToEnd = Math.abs(rawProgress - segEnd);
                const target = distToStart < distToEnd ? segStart : segEnd;

                const LOCAL_THRESHOLD = segLen * 0.4;
                if (Math.abs(rawProgress - target) < LOCAL_THRESHOLD) {
                    return target;
                }

                return rawProgress;
            },
            id: "page-slider",
            onComplete: () => {}
        }
    });

    // setupSectionHeaders(slides, tl);
    slides.forEach((slide, i) => {
        // check if text reveals exist in the slide
        const textReveal = slide.querySelector(".n_text-reveal-section");
        const isPageHeader = textReveal && textReveal.getAttribute("element") === "page-header";
        const sectionHeader = slide.querySelector(".n_section-header");
        const fadeUps = slide.querySelectorAll(".slide-fade-up");
        const scrollAccordionEl = slide.querySelector(".n_scroll-accordion");
        const fansSection = slide.querySelector(".section-fans");
        const colorsSection = slide.querySelector(".colors-wrapper");
        const bigSliderWrapper = slide.querySelector(".n_big-slider_wrapper");
        const stackedSliderWrapper = slide.querySelector(".n_stacked-slider");
        const counterEl = slide.querySelector(".section-banner__counter");

        const label = `slide-${i}`;
        tl.addLabel(label);

        // check if is page header which is inside a text reveal
        if (isPageHeader) {
            const pageHeaderAni = setupPageHeaderAni(wrapper, tl);
            // this fades the initial video out
            // add to the beginning of the slide timeline
            tl.add(pageHeaderAni, ">");
        }

        // setting up directions
        const prev = slides[i - 1];

        // 1 slide the old container up or keep it for a stacked effect
        if (i > 0) {
            tl.to(prev, {
                yPercent: -100,
                duration: 4,
                ease: "power4.inOut"
            });
            // 2 pull the new container in from below
            tl.fromTo(
                slide,
                { yPercent: 100 },
                { yPercent: 0, ease: "power4.inOut", duration: 4 },
                label
            );
        }

        const slideInPlaceLabel = `no-snap-${label}-in-place`;

        if (i > 0) {
            tl.addLabel(slideInPlaceLabel, `>`);
        } else {
            // first slide is already in view, so content can start at the slide label
            tl.add(slideInPlaceLabel, label);
        }

        const isSectionStart =
            slide.hasAttribute("data-section-number") && slide.hasAttribute("data-section-title");

        if (isSectionStart) {
            const sectionLabel = `no-snap-section-${i}`;
            tl.addLabel(sectionLabel, slideInPlaceLabel);
        }

        // additional animations can be added here
        if (textReveal) {
            const textRevealTl = setupSliderTextReveal(slide, tl, isPageHeader);
            const SLIDE_TRANSITION_DURATION = i > 0 ? 4 : 0;
            const TEXT_REVEAL_OFFSET = SLIDE_TRANSITION_DURATION + 0.1;
            // const TEXT_REVEAL_OFFSET = SLIDE_TRANSITION_DURATION + 0.2;

            tl.add(textRevealTl, `${slideInPlaceLabel}+=${TEXT_REVEAL_OFFSET}`);
        }

        if (isPageHeader) {
            addPageHeaderAnimation(tl, wrapper, label);
        }

        // section header animation
        if (sectionHeader) {
            tl.sectionHeader(sectionHeader);
        }

        // fade-up elements animation
        if (fadeUps.length > 0) {
            // fadeUps.forEach((item) => {
            //     tl.sectionFadeUp(item);
            // });
            tl.sectionFadeUp(fadeUps);
        }

        // dot animation
        const dotWrapper = slide.querySelector(".dot-wrapper");
        if (dotWrapper) {
            addDotAnimation(dotWrapper, tl, label, 3.7);
        }

        if (fansSection) {
            const LOTTIE_OFFSET = 0.2;

            // 1) hook Lottie to the content label for THIS slide
            setupFanSansLottie(slide, tl, slideInPlaceLabel, i, LOTTIE_OFFSET);
            // console.log("FANS LOTTIE SET UP");

            // 2) ensure this slide's segment is long enough so Lottie isn't hyper-fast
            const FANS_MIN_SEGMENT = 10; // tweak this number to slow/speed Lottie

            const slideStart = tl.labels[label];
            const currentEnd = tl.duration();
            const currentLen = currentEnd - slideStart;

            if (currentLen < FANS_MIN_SEGMENT) {
                const pad = FANS_MIN_SEGMENT - currentLen;
                tl.to({}, { duration: pad }); // dummy tween to extend this slide's window
            }
        }

        if (scrollAccordionEl) {
            // initialize scroll accordion inside the slide
            addScrollAccordionAnimation(scrollAccordionEl, tl, label, 1);
        }

        if (colorsSection) {
            addColorPanelsAnimation(slide, tl, slideInPlaceLabel, 0.2);
        }

        if (bigSliderWrapper) {
            const BIG_OFFSET = 0.2; // start slightly after slide is in place
            const bigTl = createBigSliderTimeline(bigSliderWrapper);

            tl.add(bigTl, `${slideInPlaceLabel}+=${BIG_OFFSET}`);
        }

        if (stackedSliderWrapper) {
            const STACKED_OFFSET = 0.2; // or whatever feels best
            const stackedTl = createStackedSliderTimeline(stackedSliderWrapper);

            tl.add(stackedTl, `${slideInPlaceLabel}+=${STACKED_OFFSET}`);
        }
        if (counterEl) {
            const startFn = createCounterStartFn(slide);

            // Trigger the counter as soon as the slide is “in place”
            tl.add(() => {
                startFn();
            }, `${slideInPlaceLabel}+=0.2`);

            // OPTIONAL: stop it when exiting the slide window
            // tl.add(() => {
            //     clearInterval(counterInterval);
            // }, `${slideInPlaceLabel}+=5`); // change 5 to however long the window is
        }
    });
    // console.log("TL LABELS", tl.labels);
    return { tl, slides, wrapper };
    // GSDevTools.create({ animation: tl });
}

// function initPageSlider() {
//     gsap.utils.toArray(".slider-wrapper").forEach(setupPageSlider);
// }
function initPageSlider() {
    const wrappers = gsap.utils.toArray(".slider-wrapper");

    wrappers.forEach((wrapper) => {
        wrapper.classList.add("js-slider");
    });
    const sliders = gsap.utils
        .toArray(".slider-wrapper")
        .map((wrapper) => setupPageSlider(wrapper))
        .filter(Boolean);
    window.FANATICS_SLIDERS = sliders;
}

gsap.registerEffect({
    name: "sectionHeader",
    effect: (target, config) => {
        const sectionHeader = target[0];
        const title = sectionHeader.querySelector(".n_section-header__title");
        const number = sectionHeader.querySelector(".n_section-header__number");

        if (!title || !number) return gsap.timeline(); // fail-safe

        const headers = [title, number];

        // initial state
        gsap.set(title, { color: "#E10600" });
        gsap.set(headers, { opacity: 0, yPercent: 30 });

        // animation
        const tl = gsap.timeline();
        tl.to(headers, {
            opacity: 1,
            yPercent: 0,
            duration: config.duration,
            ease: config.ease,
            stagger: config.stagger
        }).to(
            title,
            {
                color: "#FFFFFF",
                duration: config.duration
            },
            "<"
        );

        return tl;
    },
    defaults: {
        duration: 0.75,
        ease: "power4.out",
        stagger: 0.12
    },
    extendTimeline: true
});

gsap.registerEffect({
    name: "sectionFadeUp",
    effect: (targets, config) => {
        const items = gsap.utils.toArray(targets);
        if (!items.length) return gsap.timeline();

        const tl = gsap.timeline();

        // initial state
        // tl.set(items, { opacity: 0, yPercent: 30 });

        // fade-up animation (scrubbed by the parent timeline)
        tl.fromTo(
            items,
            {
                opacity: 0,
                yPercent: 30
            },
            {
                opacity: 1,
                yPercent: 0,
                duration: config.duration,
                ease: config.ease,
                stagger: config.stagger
            }
        );

        return tl;
    },
    defaults: {
        duration: 0.75,
        ease: "power2.out",
        stagger: 0.08
    },
    extendTimeline: true
});

function splitTextIntoWords(
    element,
    wrapClass = "text-reveal__word-wrap",
    wordClass = "text-reveal__word"
) {
    // If already split, just return existing words.
    const existing = element.querySelectorAll(`.${wordClass}`);
    if (existing.length) return existing;

    const split = new SplitText(element, {
        type: "words",
        wordsClass: wordClass, // let SplitText add the class
        linesClass: wrapClass
    });

    // Optional: store the instance if you ever need split.revert()
    element._splitInstance = split;

    return split.words; // these are already the wrappers you want
}

function prepareWords(words) {
    gsap.set(words, {
        yPercent: 100,
        opacity: 0,
        color: "#E10600"
    });
}

function animateWordsIn(words, endColor, duration = 1, stagger = 0.15) {
    // 0439 maybe make this a set and then a to?
    // gsap.set(words, {
    //     yPercent: 100,
    //     opacity: 0,
    //     color: "#E10600"
    // });
    // // Animate in
    // return gsap.timeline()
    //     .to(words, {
    //         yPercent: 0,
    //         opacity: 1,
    //         duration,
    //         ease: "power4.out",
    //         stagger
    //     })
    //     .to(words, {
    //         color: endColor,
    //         duration,
    //         stagger
    //     }, 0);
    return gsap
        .timeline()
        .fromTo(
            words,
            {
                yPercent: 100,
                opacity: 0,
                color: "#E10600"
            },
            {
                yPercent: 0,
                opacity: 1,
                duration,
                ease: "power4.out",
                stagger
            }
        )
        .to(
            words,
            {
                color: endColor,
                duration,
                stagger
            },
            0
        );
}


function animateWordsOut(words, { fast = false } = {}) {
    const tl = gsap.timeline();

    if (!fast) {
        // normal behavior: hold on screen for a bit
        tl.to({}, { duration: 1.2 });
    }

    tl.to(words, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8, 
        ease: "power3.inOut",
        stagger: 0.08 
    });

    return tl;
}

function fastSVGAni(fastSVGElement) {
    const paths = fastSVGElement.querySelectorAll("path");
    gsap.set(paths, { fill: "#e10600" });
    gsap.set(fastSVGElement, { opacity: 0, scale: 0.8 });

    const fastTl = gsap.timeline();

    // Animate SVG in
    fastTl.to(
        fastSVGElement,
        {
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: "power4.out"
        },
        "+=0.5"
    );
    fastTl.to(
        paths,
        {
            fill: "black",
            duration: 1,
            ease: "power2.inOut"
        },
        "<"
    );

    fastTl.to({}, { duration: 1.0 });

    fastTl.to(paths, {
        fill: "#e10600",
        duration: 0.5,
        ease: "power2.in"
    });
    fastTl.to(
        fastSVGElement,
        {
            opacity: 0,
            scale: 0.8,
            duration: 0.5,
            ease: "power2.in"
        },
        "<"
    );

    return fastTl;
}

function createWordTimeline(words, color, block, isLastBlock, isLastHeading, isFirstBlock = false) {
    const hasLogos = block.classList.contains("n_logo-reveal__block");
    let fastSVGElement = null;
    if (block.getAttribute("data-animate-special") === "fast-svg") {
        const section = block.closest(".n_text-reveal-section");
        fastSVGElement = section ? section.querySelector(".fast-svg") : null;
    }

    let hideLastBlock = block.getAttribute("data-animate-special") === "hide-on-end";
    let hideOnStart = block.getAttribute("data-animate-special") === "hide-on-start";

    // console.log('hideOnStart:', hideOnStart);

    // console.log(words)
    let wordsArray = words.slice(1);
    // prepareWords(wordsArray);
    // if (!isFirstBlock) {
    //     prepareWords(wordsArray);
    // }

    let tl = gsap.timeline();
    // debugger;
    // if (!isFirstBlock ) {
    //      tl = animateWordsIn(words, color);
    // }
    // if(hideOnStart){
    //     tl = animateWordsIn(words, color);
    // }
    if (!isFirstBlock || hideOnStart) {
        tl.add(animateWordsIn(words, color));
    }

    // else {
    //     // gsap.from(words, {
    //     //     yPercent: 100,
    //     //     opacity: 0,
    //     //     duration: .25,
    //     //     backgroundColor: "#E10600",
    //     // })
    // }

    if (!isLastHeading) {
        return tl;
    }

    if (fastSVGElement) {
        tl.add(fastSVGAni(fastSVGElement));
    }

    if (hasLogos) {
        let logoLists = [...block.querySelectorAll(".n_logo-row__logos")];
        let logoTl = gsap.timeline();

        logoLists.forEach((logoList, i) => {
            let parentWidth = logoList.parentElement.offsetWidth;
            let innerWidth = logoList.offsetWidth;
            let maxMove = Math.max(innerWidth - parentWidth, 0);
            let direction = i % 2 === 0 ? 1 : -1;

            gsap.set(logoList, {
                left: direction === 1 ? "100%" : `-${innerWidth}px`,
                opacity: 0
            });

            logoTl.to(
                logoList,
                {
                    left: direction === 1 ? `-${maxMove}px` : "0%",
                    opacity: 1,
                    duration: 3,
                    ease: "expo.out"
                },
                0
            );
        });
        tl.add(logoTl, "+=0.5");

        tl.to({}, { duration: 1.2 });
        if (!isLastBlock) {
            tl.to(
                block.querySelector(".n_logo-reveal__inner"),
                {
                    opacity: 0,
                    scale: 0.95,
                    duration: 1,
                    ease: "power3.inOut"
                },
                "+=1"
            );
        }
    } else if (isLastBlock && !hideLastBlock) {
    } else {
        // let outTl = animateWordsOut(words);
        // if (isFirstBlock) {
        //     outTl.timeScale(2);
        //     // outTl = animateWordsOut(words, 0.3, 0.03)
        // }
        const outTl = animateWordsOut(words, { fast: isFirstBlock });
        tl.add(outTl);
        // tl.add(animateWordsOut(words));
    }

    return tl;
}

function setupFanSansLottie(slide, tl, contentLabel, slideIndex, offsetSeconds = 0) {
    const section = slide.matches(".section-fans") ? slide : slide.querySelector(".section-fans");
    if (!section) return;

    const lottieContainer = section.querySelector(".section-fans__side--lottie");
    const textWrapper = section.querySelector(".section-fans__text-wrapper");
    const textBlocks = section.querySelectorAll(".section-fans__text");
    const backgroundDivs = section.querySelectorAll(".section-fans__background-block");

    if (!lottieContainer || !textWrapper || !textBlocks.length) return;

    let currentFrame = 0;
    let lastActiveIndex = -1;
    let bgRevealed = false;
    const accessibleFrame = section.querySelector(".section-fans__text").dataset.frame;

    setMinHeight(textWrapper, textBlocks);
    window.addEventListener("resize", () => setMinHeight(textWrapper, textBlocks));

    gsap.set(backgroundDivs, { opacity: 0 });

    textBlocks.forEach((block) => {
        gsap.set(block, {
            y: 100,
            opacity: 0,
            immediateRender: false
        });
    });

    const lottieAnimation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/685456f50615bd9f4e88f274_FanSans_Animation3_cleaned.json"
    });

    lottieAnimation.addEventListener("data_ready", () => {
        lottieAnimation.setSubframe(false);
    });

    const frameTriggers = Array.from(textBlocks).map((el, index) => ({
        frame: parseInt(el.dataset.frame, 10),
        el,
        index
    }));

    let currentTextBlock = null;

    lottieAnimation.addEventListener("enterFrame", (e) => {
        currentFrame = e.currentTime;

        if (currentFrame < parseInt(accessibleFrame, 10)) {
            gsap.to(backgroundDivs, {
                opacity: 0,
                y: 20,
                duration: 0.15,
                ease: "power2.inOut"
            });
        }

        const active = frameTriggers
            .filter((trigger) => currentFrame >= trigger.frame)
            .sort((a, b) => b.frame - a.frame)[0];

        if (!active || active.index === lastActiveIndex) return;

        lastActiveIndex = active.index;

        if (currentTextBlock) currentTextBlock.kill();

        textBlocks.forEach((el) => {
            gsap.set(el, { opacity: 0 });
        });

        currentTextBlock = gsap.to(active.el, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });

        if (!bgRevealed && currentFrame >= parseInt(accessibleFrame, 10)) {
            bgRevealed = true;
            gsap.fromTo(
                backgroundDivs,
                {
                    width: "0%",
                    transformOrigin: "center center"
                },
                {
                    opacity: 1,
                    width: "100%",
                    duration: 1,
                    ease: "power4.out"
                }
            );
        }
    });

    lottieAnimation.addEventListener("DOMLoaded", () => {
        const totalFrames = lottieAnimation.totalFrames;
        ScrollTrigger.refresh();

        // console.log("FanSans DOMLoaded for", contentLabel);

        const contentStart = tl.labels[contentLabel] + offsetSeconds;
        const slideStartLabel = `slide-${slideIndex}`;
        const nextSlideLabel = `slide-${slideIndex + 1}`;

        const slideStart = tl.labels[slideStartLabel];
        const slideEnd =
            typeof tl.labels[nextSlideLabel] === "number"
                ? tl.labels[nextSlideLabel]
                : tl.duration();

        const END_PADDING = 0.2;
        let lottieDur = slideEnd - contentStart - END_PADDING;
        if (lottieDur < 0.3) lottieDur = 0.3;

        // console.log({
        //     contentStart,
        //     slideStart,
        //     slideEnd,
        //     lottieDur
        // });

        const lottieTween = gsap.to(lottieAnimation, {
            frame: totalFrames - 1,
            ease: "none",
            duration: lottieDur,
            onUpdate() {
                lottieAnimation.goToAndStop(lottieAnimation.frame, true);
            }
        });

        tl.add(lottieTween, contentStart);
    });
}

function resetAndPlay(vid) {
    if (!vid) return;
    const doStart = () => {
        try {
            vid.pause();
        } catch {}
        try {
            vid.currentTime = 0;
        } catch {}
        const p = vid.play?.();
        if (p && typeof p.catch === "function") p.catch(() => {});
    };
    if (vid.readyState >= 2) {
        doStart();
    } else {
        const onMeta = () => {
            vid.removeEventListener("loadedmetadata", onMeta);
            doStart();
        };
        vid.addEventListener("loadedmetadata", onMeta);
        vid.load?.();
    }
}

function createVideoTextScrubTimeline(wrapper) {
    const panels = gsap.utils.toArray(
        wrapper.querySelectorAll(".ripple-gradient__bg-wrapper .ripple-gradient")
    );
    const totalPanels = panels.length;

    gsap.set(panels, { xPercent: (i) => (i === 0 ? 0 : 100) });

    const prevVid = panels[0]?.querySelector("video");
    const curVid = panels[1]?.querySelector("video");
    gsap.set([prevVid, curVid], { xPercent: 0 });

    const video = wrapper.querySelector("video");
    const blocks = gsap.utils.toArray(wrapper.querySelectorAll(".n_text-reveal__block"));
    const totalBlocks = blocks.length;

    if (video) {
        video.preload = "metadata";
        video.playsInline = true;
        video.muted = true;
    }

    const videoTextTl = gsap.timeline({ defaults: { ease: "none" } });

    // --- INTRO TL (blocks 0 and 1) ---
    const introTl = gsap.timeline();

    blocks.slice(0, 2).forEach((block, blkIdx) => {
        const blockIndex = blkIdx; // 0 or 1
        const isFirstBlock = blockIndex === 0;
        const isLastBlock = blockIndex === totalBlocks - 1;
        const headings = block.querySelectorAll(".n_text-reveal__heading");

        headings.forEach((h1, hIdx) => {
            const words = splitTextIntoWords(h1);

            // 🔑 FIRST BLOCK: do NOT prepare words → they stay visible
            if (!isFirstBlock) {
                prepareWords(words);
            }

            const isLastHeading = hIdx === headings.length - 1;

            introTl.add(
                createWordTimeline(
                    words,
                    "#ffffff",
                    block,
                    isLastBlock,
                    isLastHeading,
                    isFirstBlock // <- tell it this is the first one
                )
            );
        });
    });

    // --- VIDEO TL (blocks 2+) ---
    const videoTl = gsap.timeline();

    blocks.slice(2).forEach((block, i) => {
        const blockIndex = i + 2; // real index
        const isFirstBlock = blockIndex === 0; // always false here, but explicit
        const isLastBlock = blockIndex === totalBlocks - 1;
        const headings = block.querySelectorAll(".n_text-reveal__heading");

        // ripple swap when entering block 2
        if (blockIndex === 2 && totalPanels >= 2) {
            videoTl.addLabel("rippleSwap");

            videoTl.to(
                panels[0],
                {
                    xPercent: -100,
                    duration: 1,
                    ease: "power4.inOut"
                },
                "rippleSwap"
            );

            videoTl.fromTo(
                panels[1],
                { xPercent: 100 },
                {
                    xPercent: 0,
                    duration: 1,
                    ease: "power4.inOut"
                },
                "rippleSwap"
            );

            if (prevVid) {
                videoTl.to(
                    prevVid,
                    {
                        xPercent: 50,
                        duration: 1,
                        ease: "power4.inOut"
                    },
                    "rippleSwap"
                );
            }
            if (curVid) {
                videoTl.fromTo(
                    curVid,
                    { xPercent: -50 },
                    {
                        xPercent: 0,
                        duration: 1,
                        ease: "power4.inOut"
                    },
                    "rippleSwap"
                );
            }
        }

        headings.forEach((h1, headingIndex) => {
            const words = splitTextIntoWords(h1);

            // all later blocks behave like normal text reveal
            prepareWords(words);

            const isLastHeading = headingIndex === headings.length - 1;

            videoTl.add(
                createWordTimeline(
                    words,
                    "#ffffff",
                    block,
                    isLastBlock,
                    isLastHeading,
                    isFirstBlock // false for these
                )
            );
        });
    });

    videoTextTl.add(introTl);
    videoTextTl.add(videoTl);

    // optional
    videoTextTl.timeScale(0.9);

    return videoTextTl;
}


function createStackedSliderTimeline(slider) {
    const slides = gsap.utils.toArray(slider.querySelectorAll(".n_stacked-slide"));
    const total = slides.length;
    if (!total) return gsap.timeline(); // safety

    const imgs = slides.map((s) => s.querySelector("img"));

    // initial positions
    slides.forEach((slide, i) => {
        if (i === 0) {
            gsap.set(slide, { xPercent: 0 });
        } else {
            gsap.set(slide, { xPercent: 100 });
        }
    });

    imgs.forEach((img, i) => {
        if (!img) return;
        if (i === 0) {
            gsap.set(img, { xPercent: 0 });
        } else {
            gsap.set(img, { xPercent: -100 });
        }
    });

    const tl = gsap.timeline({
        defaults: {
            duration: 1.5,
            ease: "power4.inOut"
        }
    });

    slides.forEach((slide, i) => {
        if (i === 0) return; // first slide is our starting point

        const prev = slides[i - 1];
        const prevImg = imgs[i - 1];
        const curImg = imgs[i];

        // 1) slide the old container out to the left
        tl.to(prev, {
            xPercent: -100
        });

        // 2) push that old image out to the right
        if (prevImg) {
            tl.to(
                prevImg,
                {
                    xPercent: 100
                },
                "<"
            );
        }

        // 3) pull the new container in from the right
        tl.fromTo(slide, { xPercent: 100 }, { xPercent: 0 }, "<");

        // 4) pull its image in from the left
        if (curImg) {
            tl.fromTo(curImg, { xPercent: -100 }, { xPercent: 0 }, "<");
        }
    });
    tl.timeScale(0.4);
    return tl;
}

function createBigSliderTimeline(wrapper) {
    // each “panel” is the .n_big-slide element
    const panels = gsap.utils.toArray(wrapper.querySelectorAll(".n_big-slide"));
    const total = panels.length;
    if (!total) return gsap.timeline(); // safety

    // inside each panel we’ll animate the image
    const imgs = panels.map((p) => p.querySelector(".n_big-slide_img"));

    // initial positions (match scroll version behavior)
    panels.forEach((panel, i) => {
        gsap.set(panel, { xPercent: i === 0 ? 0 : 100 });
    });
    imgs.forEach((img, i) => {
        if (!img) return;
        gsap.set(img, { xPercent: i === 0 ? 0 : -100 });
    });

    // pure timeline, NO scrollTrigger
    const tl = gsap.timeline({
        defaults: { ease: "power4.inOut" }
    });

    panels.forEach((panel, i) => {
        if (i === 0) return; // first is already in view

        const prev = panels[i - 1];
        const prevImg = imgs[i - 1];
        const curImg = imgs[i];

        // 1) slide the old container out to the left
        tl.to(prev, {
            xPercent: -100,
            duration: 1.5
        });

        // 2) push that old image out to the right
        if (prevImg) {
            tl.to(
                prevImg,
                {
                    xPercent: 100,
                    duration: 1.5
                },
                "<"
            );
        }

        // 3) pull the new container in from the right
        tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 1 }, "<");

        // 4) pull its image in from the left
        if (curImg) {
            tl.fromTo(curImg, { xPercent: -100 }, { xPercent: 0, duration: 1 }, "<");
        }
    });

    // optional: slow the whole thing down
    tl.timeScale(0.4);

    return tl;
}

let counterInterval;

function createCounterStartFn(slide) {
    // console.log("createCounterStartFn called for slide:", slide);
    return function start() {
        const el = slide.querySelector(".section-banner__counter .counter-text");
        if (!el) return;

        const from = 999_899;
        const to = 999_999_999;
        const tickMs = 30;

        let val = from;
        clearInterval(counterInterval);

        el.textContent = val.toLocaleString();

        counterInterval = setInterval(() => {
            if (val >= to) {
                clearInterval(counterInterval);
                return;
            }
            val += 1;
            el.textContent = val.toLocaleString();
        }, tickMs);
    };
}

function createScrollingSliderTimeline(sliderSection) {
    const slidesContainer = sliderSection.querySelector(".scrolling-slider__track");
    const slides = gsap.utils.toArray(slidesContainer.querySelectorAll(".scrolling-slider__slide"));
    const sliderHeaderWrap = sliderSection.querySelector(".scrolling-slider__intro");

    if (!slides.length || !slidesContainer) {
        return gsap.timeline(); // safety
    }

    // measure layout
    const totalWidth = slidesContainer.scrollWidth;
    const visibleWidth = sliderSection.clientWidth;
    const scrollDist = Math.max(totalWidth - visibleWidth + 200, 0);

    // initial states
    gsap.set(slides, { opacity: 0.5 });
    // if you want header anim as part of this tl, uncomment and tweak:
    // gsap.set(sliderHeaderWrap, { yPercent: 100, opacity: 0 });

    const tl = gsap.timeline();

    // fade in slides
    tl.to(slides, {
        opacity: 1,
        duration: 1.5,
        stagger: 0.3,
        ease: "power2.out"
    });

    // horizontal scroll of the track if there's anything to scroll
    if (scrollDist > 0) {
        tl.to(
            slidesContainer,
            {
                x: -scrollDist,
                duration: slides.length * 1.8,
                ease: "power1.inOut"
            },
            "<"
        );
    }

    // optional: small tail at the end if you want breathing room
    tl.to(sliderSection, {
        opacity: 1,
        duration: 0.8
    });

    return tl;
}

function animateAnton(block) {
    let antonTl = gsap.timeline();

    // 1) Grab both <h1> elements inside this block:
    const headings = block.querySelectorAll(".n_text-reveal__heading");
    const headingArray = Array.from(headings);
    let antonContainer = block.querySelector(".n_text-reveal__special.anton--lower");
    let antonUpperContainer = block.querySelector(".n_text-reveal__special.anton--upper");
    let wrapper = block.querySelector(".n_text-reveal__headings");

    function setUniformHeights() {
        const maxH = Math.ceil(
            Math.max(...headingArray.map((t) => t.getBoundingClientRect().height))
        );
        headingArray.forEach((t) => (t.style.height = `${maxH}px`));
        wrapper.style.height = `${maxH}px`;
    }
    setUniformHeights();
    window.addEventListener("resize", setUniformHeights);

    // gsap.set(wrapper, {
    //   background: "red"
    // })

    const animLower = lottie.loadAnimation({
        container: antonContainer,
        renderer: "svg",
        loop: true,
        autoplay: false,
        path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/68b1ed95b77827f61fecf8cd_Fan_Impact(Lowercase).json"
    });

    const animUpper = lottie.loadAnimation({
        container: antonUpperContainer,
        renderer: "svg",
        loop: true,
        autoplay: false,
        path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/68b1ed953d81bfc59a631db0_Fan_Impact(UpperCase).json"
    });

    const words1 = splitTextIntoWords(headings[0]);
    const words2 = splitTextIntoWords(headings[1]);

    gsap.set([antonContainer, antonUpperContainer], {
        yPercent: 100,
        opacity: 0
    });

    antonTl.to(antonContainer, {
        yPercent: 0,
        opacity: 1
    });

    antonTl.add(() => {
        animLower.play();
    });

    antonTl.add(animateWordsIn(words1, "#ffffff"));
    antonTl.add(animateWordsOut(words1));

    antonTl.to(antonContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut"
    });

    antonTl.to(antonUpperContainer, {
        yPercent: 0,
        opacity: 1
    });

    antonTl.add(() => {
        animUpper.play();
    }, "<");

    antonTl.add(animateWordsIn(words2, "#ffffff"));

    antonTl.add(animateWordsOut(words2));

    antonTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
    });

    antonTl.to(antonUpperContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut"
    });

    return antonTl;
}
// fan impact lazy load version
// function animateAnton(block) {
//     let antonTl = gsap.timeline();

//     const headings = block.querySelectorAll(".n_text-reveal__heading");
//     const headingArray = Array.from(headings);
//     const antonContainer = block.querySelector(".n_text-reveal__special.anton--lower");
//     const antonUpperContainer = block.querySelector(".n_text-reveal__special.anton--upper");
//     const wrapper = block.querySelector(".n_text-reveal__headings");

//     function setUniformHeights() {
//         const maxH = Math.ceil(
//             Math.max(...headingArray.map((t) => t.getBoundingClientRect().height))
//         );
//         headingArray.forEach((t) => (t.style.height = `${maxH}px`));
//         wrapper.style.height = `${maxH}px`;
//     }
//     setUniformHeights();
//     window.addEventListener("resize", setUniformHeights);

//     const words1 = splitTextIntoWords(headings[0]);
//     const words2 = splitTextIntoWords(headings[1]);

//     gsap.set([antonContainer, antonUpperContainer], {
//         yPercent: 100,
//         opacity: 0
//     });

//     // --- LOTTIE: lazy-load + cache ---
//     let animLower = null;
//     let animUpper = null;

//     function ensureLowerLoaded() {
//         if (animLower) return;
//         animLower = lottie.loadAnimation({
//             container: antonContainer,
//             renderer: "svg",
//             loop: true,
//             autoplay: false,
//             path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/68b1ed95b77827f61fecf8cd_Fan_Impact(Lowercase).json"
//         });
//     }

//     function ensureUpperLoaded() {
//         if (animUpper) return;
//         animUpper = lottie.loadAnimation({
//             container: antonUpperContainer,
//             renderer: "svg",
//             loop: true,
//             autoplay: false,
//             path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/68b1ed953d81bfc59a631db0_Fan_Impact(UpperCase).json"
//         });
//     }

//     // --- TIMELINE ---
//     antonTl.to(antonContainer, {
//         yPercent: 0,
//         opacity: 1
//     });

//     // first time we hit this, it will load + then play
//     antonTl.add(() => {
//         ensureLowerLoaded();
//         animLower.play();
//     });

//     antonTl.add(animateWordsIn(words1, "#ffffff"));
//     antonTl.add(animateWordsOut(words1));

//     antonTl.to(antonContainer, {
//         yPercent: 100,
//         opacity: 0,
//         duration: 0.8,
//         ease: "power3.inOut"
//     });

//     antonTl.to(antonUpperContainer, {
//         yPercent: 0,
//         opacity: 1
//     });

//     antonTl.add(() => {
//         ensureUpperLoaded();
//         animUpper.play();
//     }, "<");

//     antonTl.add(animateWordsIn(words2, "#ffffff"));
//     antonTl.add(animateWordsOut(words2));

//     antonTl.call(() => {
//         block.classList.remove("active");
//         block.style.zIndex = "0";
//     });

//     antonTl.to(antonUpperContainer, {
//         yPercent: 100,
//         opacity: 0,
//         duration: 0.8,
//         ease: "power3.inOut"
//     });

//     return antonTl;
// }


// function animateInstrument(block) {
//     const heading = block.querySelector(".n_text-reveal__heading");
//     const specialContainer = block.querySelector(".n_text-reveal__special");
//     const lottieEl = block.querySelector("#instrument-lottie"); // Renamed to avoid confusion
//     const path = lottieEl.getAttribute("data-src");

//     const words = splitTextIntoWords(heading);

//     let instrumentTl = gsap.timeline();

//     instrumentTl.add(prepareWords(words));

//     gsap.set(specialContainer, {
//         yPercent: 100,
//         opacity: 0
//     });

//     instrumentTl.to(specialContainer, {
//         yPercent: 0,
//         opacity: 1
//     });

//     instrumentTl.add(animateWordsIn(words, "#ffffff"));

//     instrumentTl.add(animateWordsOut(words));

//     instrumentTl.to(specialContainer, {
//         yPercent: 100,
//         opacity: 0,
//         duration: 0.8,
//         ease: "power3.inOut"
//     });
//     instrumentTl.call(() => {
//         block.classList.remove("active");
//         block.style.zIndex = "0";
//     });

//     return instrumentTl;
// }
function animateInstrument(block) {
    const heading = block.querySelector(".n_text-reveal__heading");
    const specialContainer = block.querySelector(".n_text-reveal__special");
    const lottieEl = block.querySelector("#instrument-lottie"); // Renamed to avoid confusion
    const path = lottieEl.getAttribute("data-src");

    const words = splitTextIntoWords(heading);

    let instrumentTl = gsap.timeline();

    instrumentTl.add(prepareWords(words));

    gsap.set(specialContainer, {
        yPercent: 100,
        opacity: 0
    });

    instrumentTl.to(specialContainer, {
        yPercent: 0,
        opacity: 1
    });

    instrumentTl.add(animateWordsIn(words, "#ffffff"));

    instrumentTl.add(animateWordsOut(words));

    instrumentTl.to(specialContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut"
    });
    instrumentTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
    });

    return instrumentTl;
}

function animateInter(block) {
    const heading = block.querySelector(".n_text-reveal__heading");
    const specialContainer = block.querySelector(".n_text-reveal__special");

    const words = splitTextIntoWords(heading);
    prepareWords(words);

    let interTl = gsap.timeline();

    gsap.set(specialContainer, {
        yPercent: 100,
        opacity: 0
    });

    interTl.to(specialContainer, {
        yPercent: 0,
        opacity: 1
    });

    interTl.add(animateWordsIn(words, "#ffffff"));

    interTl.add(animateWordsOut(words));

    interTl.to(specialContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut"
    });

    interTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
    });

    return interTl;
}

function animateBk(block) {
    const heading = block.querySelector(".n_text-reveal__heading");

    const words = splitTextIntoWords(heading);

    let specialTl = gsap.timeline();

    specialTl.add(prepareWords(words));

    specialTl.to(
        block.closest(".n_text-reveal-section"),
        {
            background: "white",
            duration: 1
        }, // zero-duration set immediately
        0 // position: at the very start of this block’s mini-timeline
    );

    specialTl.add(animateWordsIn(words, "#000000"));

    specialTl.add(animateWordsOut(words));

    specialTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
    });

    return specialTl;
}

function animateLikeThis(block, wrapper) {
    const heading = block.querySelector(".n_text-reveal__heading");

    const words = splitTextIntoWords(heading);

    const extra = wrapper.querySelector(".special__split");
    const typographyFans = wrapper.querySelector(".special__typography-fans");

    gsap.set(extra, {
        opacity: 0,
        zIndex: -4
    });

    gsap.set(typographyFans, {
        zIndex: -4,
        clipPath: "inset(0% 100% 0% 0%)"
    });

    gsap.set(extra.querySelector(".special__split-row--top"), {
        xPercent: -50
    });
    gsap.set(extra.querySelector(".special__split-row--bottom"), {
        xPercent: 50
    });
    // let

    let specialTl = gsap.timeline();

    specialTl.add(prepareWords(words));

    specialTl.to(extra, {
        opacity: 1,
        zIndex: 2
    });
    specialTl.to(extra.querySelector(".special__split-row--bottom"), {
        xPercent: 0,
        duration: 2
    });
    specialTl.to(
        extra.querySelector(".special__split-row--top"),
        {
            xPercent: 0,
            duration: 2
        },
        "<"
    );

    specialTl.to(extra, {
        duration: 1
    });
    specialTl.to(extra.querySelector(".special__split-row--bottom"), {
        xPercent: -100,
        duration: 1
    });
    specialTl.to(
        extra.querySelector(".special__split-row--top"),
        {
            xPercent: 100,
            duration: 1
        },
        "<"
    );
    specialTl.set(extra, {
        opacity: 0,
        zIndex: -4
    });

    specialTl.add(animateWordsIn(words, "#000000"));

    specialTl.add(animateWordsOut(words));

    specialTl.to(typographyFans, {
        clipPath: "inset(0% 0% 0% 0%)",
        zIndex: 3,
        duration: 1
    });

    specialTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
    });

    return specialTl;
}

function addColorPanelsAnimation(slide, masterTl, label, offset = 0.2) {
    // match old selector semantics, just scoped to this slide
    const panels = gsap.utils.toArray(slide.querySelectorAll(".color-panel"));

    if (!panels.length) return;

    // === same logic as old updateActivePanel ===
    function updateActivePanel(progress) {
        let activeIndex = Math.round(progress * panels.length - 0.5);

        // Ensure the last panel stays active at the end
        if (activeIndex >= panels.length - 1) {
            activeIndex = panels.length - 1; // Keep last panel active
        }

        panels.forEach((panel, index) => {
            if (index === activeIndex) {
                panel.classList.add("active");
            } else {
                panel.classList.remove("active");
            }
        });
    }

    // build local timeline, then wire onUpdate (so we can reference localTl)
    const localTl = gsap.timeline();

    localTl.eventCallback("onUpdate", () => {
        updateActivePanel(localTl.progress());
    });

    // === same tween structure as OLD initColorPanels ===
    panels.forEach((panel, index) => {
        const isLast = index === panels.length - 1;
        const nextPanel = isLast ? null : panels[index + 1];
        const currentContent = panel.querySelector(".colors-content");
        const nextContent = nextPanel ? nextPanel.querySelector(".colors-content") : null;

        if (!isLast) {
            // content clip
            localTl.to(currentContent, {
                clipPath: "inset(0 100% 0 0)", // from fully visible to clipped
                duration: 0.2, // same as old
                ease: "expo.inOut"
            });

            // shrink current panel (no explicit duration in old => 0.5 default)
            localTl.to(panel, {
                width: "5%",
                ease: "expo.out"
            });

            // grow next panel
            localTl.to(
                nextPanel,
                {
                    width: "100%", // Expand next panel
                    ease: "expo.out",
                    onStart: () => {
                        nextPanel.classList.add("active");
                        if (nextContent) {
                            // currentContent.classList.remove("hide");
                            // nextContent.classList.add("show");
                        }
                    }
                },
                "<" // sync like old
            );
        } else {
            // last panel
            localTl.to(panel, {
                width: "100%",
                duration: 0.5, // same as old
                ease: "expo.inOut"
            });
        }
    });

    // === globally slow the old behavior down ===
    // 0.3 = ~3.3x slower; tweak to taste (0.5 = 2x slower, 0.2 = 5x slower)
    // 0439 LOVE time scale
    localTl.timeScale(0.15);

    // plug into master slider tl
    masterTl.add(localTl, `${label}+=${offset}`);
}

// 1 FIND TEXT REVEAL SECTIONS
function initTextRevealSections() {
    const sections = document.querySelectorAll(".n_text-reveal-section");

    sections.forEach((section) => {
        if (section._revealed) return; // only once
        section._revealed = true;

        revealText(section);
    });
}

function setMinHeight(textWrapper, textBlocks) {
    const heights = Array.from(textBlocks).map((block) => block.offsetHeight);

    const tallest = Math.max(...heights);

    textWrapper.style.minHeight = `${tallest}px`;
}

function addPageHeaderAnimation(tl, wrapper, label) {
    let logoVideo = wrapper.querySelector(".n_bg-video--logo");
    const blocks = gsap.utils.toArray(
        wrapper.querySelectorAll(".n_text-reveal__block, .n_logo-reveal__block")
    );
    const lastLine = blocks[blocks.length - 1];
    const lastWords = lastLine.querySelectorAll(".text-reveal__word");

    tl.to(lastWords, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.1
    });
    tl.to(logoVideo, {
        opacity: 1,
        duration: 2,
        ease: "power2.out"
    });
}

function addScrollAccordionAnimation(accordionRoot, tl, label, offset = 1) {
    const titles = Array.from(accordionRoot.querySelectorAll(".n_accordion-title"));
    const defs = Array.from(accordionRoot.querySelectorAll(".panel__definition"));
    const wrapper = accordionRoot.querySelector(".panels-mask");
    const panelsInner = accordionRoot.querySelector(".panels-mask__inner");
    let currentIndex = 0;
    const time = 0.8;

    if (!titles.length || !defs.length || !wrapper || !panelsInner) return;

    // 1) uniform heights (same as before)
    function setUniformHeights() {
        requestAnimationFrame(() => {
            let maxHeight = Math.ceil(
                Math.max(...defs.map((def) => def.getBoundingClientRect().height))
            );
            defs.forEach((def) => (def.style.height = maxHeight + "px"));
            panelsInner.style.height = maxHeight + "px";
        });
    }
    setUniformHeights();
    window.addEventListener("resize", () => {
        setUniformHeights();
        moveDefinition(currentIndex);
    });

    // 2) initial visibility (no ScrollTrigger fade-in; you can add a tl.from if you want)
    gsap.set(wrapper, { autoAlpha: 1 });

    // 3) keyboard / click behavior (unchanged)
    titles.forEach((tab, i) => {
        tab.addEventListener("click", (e) => {
            e.preventDefault();
            activateTitle(i);
            moveDefinition(i);
            tab.focus();
        });
        tab.addEventListener("keydown", (e) => {
            if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                let next = (i + 1) % titles.length;
                titles[next].focus();
                activateTitle(next);
                moveDefinition(next);
            }
            if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                let prev = (i - 1 + titles.length) % titles.length;
                titles[prev].focus();
                activateTitle(prev);
                moveDefinition(prev);
            }
            if (e.key === "Home") {
                e.preventDefault();
                titles[0].focus();
                activateTitle(0);
                moveDefinition(0);
            }
            if (e.key === "End") {
                e.preventDefault();
                titles[titles.length - 1].focus();
                activateTitle(titles.length - 1);
                moveDefinition(titles.length - 1);
            }
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                activateTitle(i);
                moveDefinition(i);
            }
        });
    });

    function activateTitle(index) {
        titles.forEach((t, j) => {
            t.classList.toggle("active", j === index);
            t.setAttribute("aria-selected", j === index ? "true" : "false");
            t.setAttribute("tabindex", j === index ? "0" : "-1");
        });
        defs.forEach((def, j) => {
            def.setAttribute("aria-hidden", j === index ? "false" : "true");
        });
        const activeTitle = titles[index];
        gsap.fromTo(
            activeTitle,
            { autoAlpha: 1, x: 50 },
            {
                autoAlpha: 1,
                x: 0,
                duration: time,
                ease: "power4.out"
            }
        );
    }

    function moveDefinition(index) {
        let maxHeight = Math.max(...defs.map((def) => def.scrollHeight));
        gsap.to(defs, {
            y: (i) => -(i - index) * maxHeight,
            autoAlpha: (i) => (i === index ? 1 : 0),
            duration: time,
            ease: "power4.out"
        });
    }

    // init
    activateTitle(0);
    moveDefinition(0);

    // 4) hook into the slider timeline instead of its own ScrollTrigger
    const proxy = { p: 0 };
    const steps = titles.length;

    // how long (in slider-TL time) you want to spend "inside" this accordion:
    // const segmentDuration = (steps - 1) * 0.6; // tweak as you like
    const segmentDuration = (steps - 1) * 4.5; // speed or slow down

    tl.fromTo(
        proxy,
        { p: 0 },
        {
            p: 1,
            duration: segmentDuration,
            ease: "none",
            onUpdate() {
                let newIndex = Math.floor(proxy.p * steps);
                newIndex = Math.min(newIndex, steps - 1);
                if (newIndex !== currentIndex) {
                    currentIndex = newIndex;
                    activateTitle(currentIndex);
                    moveDefinition(currentIndex);
                }
            }
        },
        label + "+=" + offset // when in this slide you want the accordion to start responding
    );
}

function addSectionHeaderAnimation(tl, sectionHeader, label, offset = 2) {
    const title = sectionHeader.querySelector(".n_section-header__title");
    const number = sectionHeader.querySelector(".n_section-header__number");
    const headers = [title, number];

    if (!title || !number) return;

    // initial state
    gsap.set(title, { color: "#E10600" });
    gsap.set(headers, { opacity: 0, yPercent: 30 });

    // non-scrubbed timeline for THIS slide's header
    const headerTl = gsap.timeline({ paused: true });

    headerTl
        .to(headers, {
            opacity: 1,
            yPercent: 0,
            duration: 0.75,
            ease: "power4.out",
            stagger: 0.12
        })
        .to(
            title,
            {
                color: "#FFFFFF",
                duration: 0.75
            },
            "<"
        );

    // hook into the scrubbed master TL
    tl.add(() => {
        const dir = tl.scrollTrigger.direction; // 1 = down, -1 = up

        if (dir === 1) {
            // scrolling DOWN into this point → play anim
            headerTl.restart();
        } else if (dir === -1) {
            // scrolling UP → reset so it can replay
            headerTl.pause(0);
            gsap.set(title, { color: "#E10600" });
            gsap.set(headers, { opacity: 0, yPercent: 30 });
        }
    }, label + "+=" + offset); // offset in seconds from slide label
}

function addDotAnimation(dotWrapper, tl, label, offset = 3.7) {
    // initial state
    gsap.set(dotWrapper, {
        clipPath: "circle(0% at 50% 100%)"
    });

    // add scrubbed tween into the main TL
    tl.to(
        dotWrapper,
        {
            clipPath: "circle(120% at 50% 100%)",
            duration: 2,
            ease: "power2.out"
        },
        label + "+=" + offset // or wherever you want it to start in that slide
    );
}

// function addSectionFadeUpAnimation(tl, fadeUpElements, label, offset = 3.7) {
//     fadeUpElements.forEach((item) => {
//         const parentBanner = item.closest(".section-banner");
//         const hasParentBanner = !!parentBanner;

//         // Match your old behavior:
//         // - if inside banner → delay reveal (startFrom = top 10%)
//         // - else → normal behavior
//         const startOffset = hasParentBanner ? "+=3.5" : "+=3.7";
//         // tweak if needed — earlier or later

//         // initial state
//         gsap.set(item, { opacity: 0, y: 50 });

//         // build the non-scrubbed tween
//         const fadeTl = gsap.timeline({ paused: true });

//         fadeTl.to(item, {
//             opacity: 1,
//             y: 0,
//             duration: 0.5,
//             ease: "power2.out"
//         });

//         // hook into master timeline & fire at the right moment
//         tl.add(() => {
//             const dir = tl.scrollTrigger.direction;

//             if (dir === 1) {
//                 fadeTl.restart(); // play normally
//             } else {
//                 fadeTl.pause(0);
//                 gsap.set(item, { opacity: 0, y: 50 }); // reset
//             }
//         }, label + startOffset);
//     });
// }

function setupPageHeaderAni(wrapper, tl) {
    let fansVideo = wrapper.querySelector(".n_bg-video--fans");
    let logoVideo = wrapper.querySelector(".n_bg-video--logo");
    // let flagVideo = wrapper.querySelector(".n-bg-video--flag");
    gsap.set([logoVideo], {
        opacity: 0,
        y: 0
    });

    const preFade = gsap.timeline();

    if (fansVideo) {
        preFade.to(fansVideo, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.out",
            onComplete: () => {}
        });
        preFade.to(fansVideo, {
            zIndex: "-10",
            pointerEvents: "none"
        });
        tl.add(preFade, 0);
        // → this “preFade” sub‐timeline runs immediately (at position 0 of masterTl)
    }
}

// TEXT REVEAL IN SLIDER
function setupSliderTextReveal(wrapper, tl, isPageHeader) {
    const allHeadings = wrapper.querySelectorAll(".n_text-reveal__heading");
    const isRippleGradient = wrapper.getAttribute("data-element") === "ripple-gradient";

    if (isRippleGradient) {
        // build the special video/text TL instead of normal text reveal
        return createVideoTextScrubTimeline(wrapper);
    }

    const endColor = wrapper.dataset.endColor || "#ffffff";
    const blocks = gsap.utils.toArray(
        wrapper.querySelectorAll(".n_text-reveal__block, .n_logo-reveal__block")
    );

    const masterTl = gsap.timeline({});

    let words;

    blocks.forEach((block, i) => {
        const hasLogos = block.classList.contains("n_logo-reveal__block");
        // console.log(blocks);
        let tl = gsap.timeline();
        tl.call(() => block.classList.add("active")).set(block, { zIndex: 2 });

        const headings = block.querySelectorAll(".n_text-reveal__heading");

        // check for special cases
        if (block.dataset.animateSpecial === "logomark") {
            let specialTl = animateLogoMark(block, wrapper);
            masterTl.add(specialTl);
            return;
        }

        // make sure its not a logo block
        // if (headings.length > 1 && !hasLogos) {
        //     // this never runs
        //     // 1) split each heading once, flatten into one big array of spans
        //     const allWords = Array.from(headings).flatMap((h1) => splitTextIntoWords(h1));

        //     // 2) prep them off-screen
        //     prepareWords(allWords);

        //     // 3) animate them all in at once
        //     tl.add(animateWordsIn(allWords, endColor, 0.05, 0.1));

        //     // 4) then animate them all out
        //     tl.add(animateWordsOut(allWords, 0.05, 0.1));

        //     // 5) cleanup & bail
        //     tl.call(() => block.classList.remove("active")).set(block, { zIndex: 0 });
        //     masterTl.add(tl);
        //     return;
        // }

        if (block.dataset.animateSpecial === "anton") {
            masterTl.add(animateAnton(block));
            return;
        }

        if (block.dataset.animateSpecial === "instrument") {
            masterTl.add(animateInstrument(block, wrapper));
            return;
        }

        if (block.dataset.animateSpecial === "inter") {
            masterTl.add(animateInter(block, wrapper));
            return;
        }

        if (block.dataset.animateSpecial === "bk-switch--white") {
            let specialTl = animateBk(block);
            masterTl.add(specialTl);
            return;
        }

        if (block.dataset.animateSpecial === "like-this") {
            masterTl.add(animateLikeThis(block, wrapper));
            return;
        }

        // check for special cases
        if (block.dataset.animateSpecial === "logomark") {
            let specialTl = animateLogoMark(block, wrapper);
            masterTl.add(specialTl);
            return;
        }

        headings.forEach((h1, headingIndex) => {
            // 1) Split the text into individual <span class="text-reveal__word">…</span>
            const words = splitTextIntoWords(h1);

            // Figure out if this is the very last heading of the very last block:
            const isLastBlock = i === blocks.length - 1;
            const isFirstBlock = i === 0;
            // if(isLastBlock){
            //     console.log('LAST BLOCK')
            //     console.log(block)
            //     console.log(words)
            // }

            const isLastHeading = headingIndex === headings.length - 1;

            // console.log(`isLastHeading: ${isLastHeading}`)

            // 3) Build a mini‐timeline for “this one <h1>”.
            const wordAnim = createWordTimeline(
                words,
                endColor,
                block,
                isLastBlock,
                isLastHeading,
                isFirstBlock
            );

            // 4) Add THAT entire mini-timeline into “tl” (so headings run in series, one after the other)
            tl.add(wordAnim);
        });
        tl.call(() => block.classList.remove("active")).set(block, { zIndex: 0 });
        masterTl.add(tl);
    });
    return masterTl;
}

function startCount() {
    const el = document.querySelector(".section-banner__counter .counter-text");
    if (!el) return;
    const from = 999_899;
    const to = 999_999_999;
    const tickMs = 30; // update every 0.5 s
    let val = from;

    // wipe any previous interval
    clearInterval(counterInterval);

    el.textContent = val.toLocaleString();

    counterInterval = setInterval(() => {
        if (val >= to) {
            clearInterval(counterInterval);
            return;
        }
        val += 1;
        el.textContent = val.toLocaleString();
    }, tickMs);
}


function initScrollingSlider() {
    const sliderSection = document.querySelector(".n_scrolling-slider");
    const slidesContainer = sliderSection.querySelector(".scrolling-slider__track");
    const slides = gsap.utils.toArray(slidesContainer.querySelectorAll(".scrolling-slider__slide"));

    // calculate widths
    const totalWidth = slidesContainer.scrollWidth;
    const visibleWidth = sliderSection.clientWidth; // includes any padding
    const scrollDist = totalWidth - visibleWidth + 200; // how far we actually need to move

    // 1 initial states
    gsap.set(slides, { opacity: 0.5 });
    // gsap.set(sliderHeaderWrap, { yPercent: 100, opacity: 0 });

    // 2 scrubbed, pinned timeline
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: sliderSection,
            start: "top top",
            end: `+=${scrollDist * 2}`, // twice the distance for more scrolls
            pin: true,
            scrub: 3,
            invalidateOnRefresh: true
            // markers: true
        }
    });

    // ) header reveal (outside of the scrub timeline)
    // gsap.to(sliderHeaderWrap, {

    //   opacity: 1,
    //   duration: 1.2,
    //   ease: 'power4.out',
    //   delay: 0.15
    // });

    // 4 fade in all slides once we start scrolling
    tl.to(
        slides,
        {
            opacity: 1,
            duration: 1.5,
            stagger: 0.3,
            ease: "power2.out"
        },
        "<"
    );

    // 5  slide the track left by exactly scrollDist
    tl.to(
        slidesContainer,
        {
            x: -scrollDist,
            duration: slides.length * 1.8, // stretch this out proportional to # of slides
            ease: "power1.inOut"
        },
        "<"
    );

    // 6 unpin
    tl.to(sliderSection, {
        opacity: 1,
        duration: 0.8
    });
}

function animateLogoMark(block, wrapper) {
    const heading = block.querySelector(".n_text-reveal__heading");
    const extra = wrapper.querySelector(".logomark");

    const words = splitTextIntoWords(heading);

    gsap.set(extra, {
        zIndex: -4,
        clipPath: "inset(0% 100% 0% 0%)"
    });

    let specialTl = gsap.timeline();

    specialTl.add(prepareWords(words));

    specialTl.to(extra, {
        clipPath: "inset(0% 0% 0% 0%)",
        zIndex: 3,
        duration: 1
    });

    specialTl.to(extra, {
        duration: 1
    });

    specialTl.add(animateWordsIn(words, "#000000"));

    specialTl.add(animateWordsOut(words));

    specialTl.to(extra, {
        y: 150,
        zIndex: -5,
        opacity: 0,
        duration: 1
    });

    specialTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
    });

    return specialTl;
    // masterTl.add(specialTl);

    // return;
}

gsap.utils.toArray(".section-fade-up").forEach((section) => {
    // console.log(section)
    let parentBanner = section.closest(".section-banner");
    let hasParentBanner = parentBanner ? true : false;
    // console.log(`hasParentBanner: ${hasParentBanner}`);
    // if (parentBanner) {
    //   console.log('has parentBanner')

    //   console.log(parentBanner)

    // } else {
    //   console.log(`no parent banner`)
    // }
    // console.log(hasParentBanner)
    let startFrom = hasParentBanner ? "top 10%" : "top top";
    let toggleAct = hasParentBanner ? "play reverse play reverse" : "play none play complete";
    gsap.fromTo(
        section,
        { opacity: 0, y: 50 }, // start
        {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
                trigger: hasParentBanner ? parentBanner : section,
                // start: "top 80%", // reveal when near 80% viewport
                start: startFrom,
                // toggleActions: "play none play complete",
                toggleActions: toggleAct
                // markers: true
                // scrub: true
            }
        }
    );
});

function waitForFonts(timeout = 5000) {
    if (!document.fonts || document.fonts.status === "loaded") return Promise.resolve();
    return Promise.race([
        document.fonts.ready,
        new Promise((res) => setTimeout(res, timeout)) // fallback
    ]);
}

// wait for header/hero videos that affect layout
function waitForVideos(selectors = ".n_header video, .page-header video", timeout = 6000) {
    const vids = Array.from(document.querySelectorAll(selectors));
    if (!vids.length) return Promise.resolve();

    return Promise.race([
        Promise.allSettled(
            vids.map((v) => {
                if (v.readyState >= 3) return Promise.resolve(); // HAVE_FUTURE_DATA+
                return new Promise((res) => {
                    v.addEventListener("loadeddata", res, { once: true });
                    v.addEventListener("error", res, { once: true });
                });
            })
        ),
        new Promise((res) => setTimeout(res, timeout)) // don't hang forever
    ]);
}
let hasInitialized = false;
async function init() {
    if (hasInitialized) {
        console.log("[Fanatics] init skipped – already ran");
        return;
    }
    
    gsap.to('html', {
        autoAlpha: 1
    })
    await waitForFonts();
    await waitForVideos();

    initPageSlider();
    initScrollingSlider();

    wireNav();
    // Display the body
    // document.querySelector("body").style.display = "block";

    // Fade in the body after scripts load
    // gsap.to("body", { opacity: 1, duration: 0.5 });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
}

window.addEventListener("load", init);

setTimeout(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
}, 600);

// extra refresh when fonts report late (Safari, etc.)
Promise.resolve(document.fonts?.ready).finally(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
});

// window.addEventListener("load", () => {
// gsap.to("body", { opacity: 1, duration: 0.5 });
// })
