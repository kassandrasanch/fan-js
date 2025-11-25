// TODO
// check mobile
// should we move them all into a slider anyway?

// DONE
// add wait for fonts to load before showing body.
// add nav to init.
// check to see if this fixes brand design principles nav spacing issue
// replace header video
// fix double span on splitTextIntoWords
// fix dot reveal
// fix gsap target not found errors

gsap.registerPlugin(ScrollTrigger, SplitText, GSDevTools);

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

const toggleSectionInfo = document.querySelector(".n_nav__sections");
const sections = document.querySelectorAll("section[data-section-number][data-section-title]");

const navLinks = document.querySelectorAll(".n_nav-menu__link");
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
                // 1 toggle nav open/closed
                closeNav();

                // 2 smooth scroll
                lenis.scrollTo(targetElem, {
                    offset: 0,
                    duration: 1.2,
                    lock: true,
                    onComplete() {
                        // 3 fade body back in
                        gsap.to("body", { opacity: 1, duration: 0.3 });
                    }
                });
            }
        });
    });
});

function wireNav() {
    if (wireNav._done) return; // idempotent guard
    wireNav._done = true;

    // ---- YOUR NAV CODE VERBATIM ----
    const toggleSectionInfo = document.querySelector(".n_nav__sections");
    const sections = document.querySelectorAll("section[data-section-number][data-section-title]");

    const navLinks = document.querySelectorAll(".n_nav-menu__link");
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
                    lenis.scrollTo(targetElem, {
                        offset: 0,
                        duration: 1.2,
                        lock: true,
                        onComplete() {
                            gsap.to("body", { opacity: 1, duration: 0.3 });
                        }
                    });
                }
            });
        });
    });

    sections.forEach((section, i) => setToggleSectionInfo(section, i));

    function setToggleSectionInfo(section, index) {
        const rawNumber = section.getAttribute("data-section-number") || "";
        const title = section.getAttribute("data-section-title") || "";
        const container = document.createElement("div");
        container.className = "n_nav__section";
        const titleWrapper = document.createElement("div");
        titleWrapper.className = "n_nav__section-title";
        const numSpan = document.createElement("span");
        numSpan.className = "navbar_section-text__bold";
        if (index !== 0) numSpan.textContent = rawNumber.toString().padStart(2, "0") + "\u00A0";
        else numSpan.textContent = "";
        titleWrapper.appendChild(numSpan);
        if (index !== 0) titleWrapper.appendChild(document.createTextNode(title));
        container.appendChild(titleWrapper);
        toggleSectionInfo.appendChild(container);
    }

    // 2. Measure ghost nav widths for each label
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

        realSections.forEach((sec, i) => {
            const clone = sec.cloneNode(true);
            clone.style.display = "block";
            clone.style.visibility = "visible";
            ghostContainer.appendChild(clone);
        });

        const ghostSections = Array.from(ghostContainer.querySelectorAll(".n_nav__section"));
        sectionHeight = ghostSections[1]?.getBoundingClientRect().height || 0;

        sectionWidths = ghostSections.map((el, i) => {
            if (i === 0) return 0;
            let elTitle = el.querySelector(".n_nav__section-title");
            let width = elTitle
                ? elTitle.getBoundingClientRect().width
                : el.getBoundingClientRect().width;
            return width;
        });

        document.body.removeChild(ghostContainer);
    }

    // Initial measure
    measureSectionWidths();

    // 3. Get the containers for sliding/width
    const navSectionsWindow = document.querySelector(".n_nav__sections-window");
    const navSectionsInner = document.querySelector(".n_nav__sections");
    const sectionElements = Array.from(document.querySelectorAll("section[data-section-number]"));

    // 4. Responsive: set height of window to a single slot
    function setWindowHeight(i = 0) {
        navSectionsWindow.style.height = sectionHeight + "px";
    }

    // Set initial height & measure widths on resize
    setWindowHeight();
    window.addEventListener("resize", () => {
        measureSectionWidths();
        setWindowHeight();
    });

    gsap.utils.toArray(sectionElements).forEach((pageSection, i) => {
        ScrollTrigger.create({
            trigger: pageSection,
            start: "top-=50 top",
            end: "bottom top",
            onEnter: () => goToSection(i),
            onEnterBack: () => goToSection(i),
            // markers: true,
            refreshPriority: -1,
            onLeaveBack: () => {
                if (i === 0) {
                    goToSection(0);
                } else {
                    goToSection(i - 1);
                }
            },
            onLeave: () => {
                if (i === sectionElements.length - 1) return;
                goToSection(i + 1);
            }
        });
    });

    function goToSection(i) {
        if (typeof sectionWidths[i] === "undefined") return;

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

    navSectionsWindow.style.width = sectionWidths[0] + "px";
    gsap.set(navSectionsInner, { yPercent: 0 });

    // navClick
    const navToggle = document.querySelector(".n_nav__toggle");
    const navMenu = document.querySelector(".n_nav__menu");
    const navMenuPrimary = document.querySelector(".n_nav__menu-primary");
    const navHeader = document.querySelector(".n_nav__inner");
    const navBrand = document.querySelector(".n_nav__brand");
    const mainWrapper = document.querySelector(".main-wrapper");

    let scrollPosition = 0;

    function onEscapeKey(e) {
        if (e.key === "Escape" || e.key === "Esc") {
            closeNav();
        }
    }

    function openNav() {
        lenis.stop();
        document.querySelector("body").classList.add("nav-open");
        navToggle.setAttribute("aria-expanded", "true");
        document.addEventListener("keydown", onEscapeKey);
        let tl = gsap.timeline();
        tl.to(navMenu, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" }).to(
            navBrand,
            { opacity: 1, pointerEvents: "auto" },
            "<"
        );
        gsap.set(navHeader, { backgroundColor: "#e10600" });
    }

    function closeNav() {
        lenis.start();
        navToggle.setAttribute("aria-expanded", "false");
        let tl = gsap.timeline();
        gsap.set(navHeader, { backgroundColor: "transparent" });
        tl.to(navMenu, { y: -50, autoAlpha: 0, duration: 0.1, ease: "power4.in" }).to(navBrand, {
            opacity: 0,
            pointerEvents: "none"
        });
        document.querySelector("body").classList.remove("nav-open");
    }

    function toggleNav(e) {
        e.preventDefault();
        const expanded = navToggle.getAttribute("aria-expanded") === "true";
        if (expanded) closeNav();
        else openNav();
    }

    navToggle.addEventListener("click", toggleNav);

    function setMenuPrimaryMargin() {
        const navHeaderHeight = navHeader.getBoundingClientRect().height;
        navMenuPrimary.style.marginTop = navHeaderHeight + "px";
    }
    setMenuPrimaryMargin();

    // ---- only additions: re-measure on ST lifecycle so "wrong section on load" goes away ----
    ScrollTrigger.addEventListener("refreshInit", measureSectionWidths);
    ScrollTrigger.addEventListener("refresh", setWindowHeight);
}

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

function animateWordsOut(words, duration = 0.8, stagger) {
    const tl = gsap.timeline();
    tl.to({}, { duration: 1.2 });
    tl.to(words, {
        yPercent: 100,
        opacity: 0,
        duration,
        ease: "power3.inOut",
        stagger
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

function createWordTimeline(words, color, block, isLastBlock, isLastHeading) {
    const hasLogos = block.classList.contains("n_logo-reveal__block");
    let fastSVGElement = null;
    if (block.getAttribute("data-animate-special") === "fast-svg") {
        const section = block.closest(".n_text-reveal-section");
        fastSVGElement = section ? section.querySelector(".fast-svg") : null;
    }
    prepareWords(words);

    // debugger;
    const tl = animateWordsIn(words, color);

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
    } else {
        tl.add(animateWordsOut(words));
    }

    return tl;
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

function initVideoTextScrub(wrapper) {
    const panels = gsap.utils.toArray(
        wrapper.querySelectorAll(".ripple-gradient__bg-wrapper .ripple-gradient")
    );
    const total = panels.length;

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

    const masterTl = gsap.timeline({
        paused: true,
        defaults: { ease: "none" },
        scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: () => `+=${blocks.length * 700}`,
            pin: true,
            scrub: 1,

            toggleActions: "play reverse play reverse"
        }
    });

    const introTl = gsap.timeline();
    blocks.slice(0, 2).forEach((block, blkIdx) => {
        const headings = block.querySelectorAll(".n_text-reveal__heading");
        headings.forEach((h1, hIdx) => {
            const words = splitTextIntoWords(h1);
            prepareWords(words);
            const isLastHeading = hIdx === headings.length - 1;
            const isLastBlock = blkIdx === 1;
            introTl.add(createWordTimeline(words, "#ffffff", block, isLastBlock, isLastHeading));
        });
    });

    const videoTl = gsap.timeline();

    blocks.slice(2).forEach((block, i) => {
        const blockIndex = i + 2; // real index in `blocks`
        const headings = block.querySelectorAll(".n_text-reveal__heading");

        if (blockIndex === 2 && total >= 2) {
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
                {
                    xPercent: 100
                },
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
                    {
                        xPercent: -50
                    },
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
            prepareWords(words);
            const isLastBlock = blockIndex === totalBlocks - 1;
            const isLastHeading = headingIndex === headings.length - 1;
            const passLastHeading = isLastHeading && !isLastBlock;

            const wordAnim = createWordTimeline(
                words,
                "#ffffff",
                block,
                isLastBlock,
                passLastHeading
            );

            videoTl.add(wordAnim);
        });
    });

    masterTl.add(introTl);
    masterTl.add(videoTl);
}

function createVideoTextScrubTimeline(wrapper) {
    const panels = gsap.utils.toArray(
        wrapper.querySelectorAll(".ripple-gradient__bg-wrapper .ripple-gradient")
    );
    const total = panels.length;

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

    // NO scrollTrigger, NO paused
    const videoTextTl = gsap.timeline({
        defaults: { ease: "none" }
    });

    // --- introTl (first 2 blocks) ---
    const introTl = gsap.timeline();
    blocks.slice(0, 2).forEach((block, blkIdx) => {
        const headings = block.querySelectorAll(".n_text-reveal__heading");
        headings.forEach((h1, hIdx) => {
            const words = splitTextIntoWords(h1);
            prepareWords(words);
            const isLastHeading = hIdx === headings.length - 1;
            const isLastBlock = blkIdx === 1;
            introTl.add(createWordTimeline(words, "#ffffff", block, isLastBlock, isLastHeading));
        });
    });

    // --- videoTl (rest of blocks + ripple swap) ---
    const videoTl = gsap.timeline();

    blocks.slice(2).forEach((block, i) => {
        const blockIndex = i + 2; // real index in `blocks`
        const headings = block.querySelectorAll(".n_text-reveal__heading");

        if (blockIndex === 2 && total >= 2) {
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
            prepareWords(words);
            const isLastBlock = blockIndex === totalBlocks - 1;
            const isLastHeading = headingIndex === headings.length - 1;
            const passLastHeading = isLastHeading && !isLastBlock;

            const wordAnim = createWordTimeline(
                words,
                "#ffffff",
                block,
                isLastBlock,
                passLastHeading
            );

            videoTl.add(wordAnim);
        });
    });

    videoTextTl.add(introTl);
    videoTextTl.add(videoTl);

    // if you want it slower than the original scroll version:
    // comment out if too slow.
    videoTextTl.timeScale(0.9);

    return videoTextTl;
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

// 1 FIND TEXT REVEAL SECTIONS
function initTextRevealSections() {
    const sections = document.querySelectorAll(".n_text-reveal-section");

    sections.forEach((section) => {
        if (section._revealed) return; // only once
        section._revealed = true;

        revealText(section);
    });
}

// 0439 this makes you pause at section banners and headers

// gsap.utils.toArray(".section-banner, .n_section-header").forEach((el) => {
//     ScrollTrigger.create({
//         trigger: el,
//         start: "top top", // as soon as its top hits the top of the viewport
//         end: "+=100%", // pin for exactly one viewport-height of scrolling
//         pin: true,
//         pinSpacing: true
//         // markers: true
//     });
// });

// dot Animate

function dotAnimate() {
    gsap.set(".dot-wrapper", {
        clipPath: "circle(0% at 50% 100%)"
    });
    let dotAnimation = gsap.timeline({
        scrollTrigger: {
            trigger: ".dot-reveal-section .text-color-black",
            start: "top 40%",
            end: "+=300",
            toggleActions: "play none none reverse",
            scrub: 1
            // markers:true
        }
    });
    dotAnimation.to(".dot-wrapper", {
        // clipPath: "circle(120% at center)",
        clipPath: "circle(120% at 50% 100%)",
        duration: 1,
        ease: "power2.out"
    });
}

// dotAnimate();

function setMinHeight(textWrapper, textBlocks) {
    const heights = Array.from(textBlocks).map((block) => block.offsetHeight);

    const tallest = Math.max(...heights);

    textWrapper.style.minHeight = `${tallest}px`;
}

function initFanSansLottie() {
    const section = document.querySelector(".section-fans");
    const lottieContainer = section.querySelector(".section-fans__side--lottie");

    const textWrapper = section.querySelector(".section-fans__text-wrapper");
    const textBlocks = section.querySelectorAll(".section-fans__text");

    let currentFrame = 0;
    let lastActiveIndex = -1;
    let bgRevealed = false;

    const backgroundDivs = section.querySelectorAll(".section-fans__background-block");

    let accessibleFrame = section.querySelector(".section-fans__text").dataset.frame;

    setMinHeight(textWrapper, textBlocks);

    window.addEventListener("resize", () => {
        setMinHeight(textWrapper, textBlocks);
    });

    gsap.set(backgroundDivs, {
        opacity: 0
    });

    textBlocks.forEach((block, index) => {
        // const words = splitTextIntoWords(block);
        // prepareWords(words)

        gsap.set(block, {
            y: 100,
            opacity: 0,
            immediateRender: false
        });
    });

    let lottieAnimation = lottie.loadAnimation({
        container: lottieContainer,
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/685456f50615bd9f4e88f274_FanSans_Animation3_cleaned.json"
        // working test
        // path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/67e40ae7093e8d53e37e4f3a_FanSans_Animation3.json"
    });

    lottieAnimation.addEventListener("DOMLoaded", () => {
        const totalFrames = lottieAnimation.totalFrames;
        gsap.to(lottieAnimation, {
            frame: totalFrames - 1,
            ease: "none",
            scrollTrigger: {
                trigger: section,
                start: "top top",
                end: "+=2000", // control scroll length
                pin: true,
                scrub: true
            },
            onUpdate: () => {
                lottieAnimation.goToAndStop(lottieAnimation.frame, true);
            }
        });
    });

    // fix the blinking issue

    lottieAnimation.addEventListener("data_ready", () => {
        lottieAnimation.setSubframe(false);
    });

    // 1. Trigger text changes based on frame
    const frameTriggers = Array.from(textBlocks).map((el, index) => ({
        frame: parseInt(el.dataset.frame, 10),
        el,
        index
    }));

    let currentTextBlock = null;

    lottieAnimation.addEventListener("enterFrame", (e) => {
        currentFrame = e.currentTime;

        if (currentFrame < parseInt(accessibleFrame)) {
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
            gsap.set(el, {
                opacity: 0
            });
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
}

function scrollAccordion(accordionRoot) {
    // 1️⃣ Find elements relative to this accordion instance
    const titles = Array.from(accordionRoot.querySelectorAll(".n_accordion-title"));
    const defs = Array.from(accordionRoot.querySelectorAll(".panel__definition"));
    const wrapper = accordionRoot.querySelector(".panels-mask");
    const panelsInner = accordionRoot.querySelector(".panels-mask__inner");
    let currentIndex = 0;
    const time = 0.8;

    // 2️⃣ Hide initially for scroll-reveal
    // gsap.set(wrapper, { autoAlpha: 0 });

    // 3️⃣ ScrollTrigger to fade in
    ScrollTrigger.create({
        trigger: accordionRoot,
        start: "top 80%",
        end: "top 70%",
        onEnter: () => {
            gsap.to(wrapper, {
                autoAlpha: 1,
                duration: 0.8,
                ease: "power2.out"
            });
        },
        toggleActions: "play none none none"
    });

    // 4️⃣ Set uniform heights for all panels (for smooth scroll/pin effect)
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

    if (!accordionRoot.id) {
        accordionRoot.id = "accordion-" + Math.random().toString(36).slice(2, 10);
    }

    // 5️⃣ Pin and scrub animation (scroll-jacked accordion)
    ScrollTrigger.create({
        id: accordionRoot.id,
        trigger: accordionRoot,
        pin: true,
        start: "top top",
        scrub: 1,
        end: () => `+=${(titles.length - 1) * 500}`,
        onUpdate: (self) => {
            let newIndex = Math.floor(self.progress * titles.length);
            newIndex = Math.min(newIndex, titles.length - 1);
            if (newIndex !== currentIndex) {
                currentIndex = newIndex;
                activateTitle(currentIndex);
                moveDefinition(currentIndex);
            }
        }
    });

    // 6️⃣ Keyboard/Click accessibility: tab navigation!
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

    // 7️⃣ Animate and mark the active tab (ARIA, styles, focus)
    function activateTitle(index) {
        titles.forEach((t, j) => {
            t.classList.toggle("active", j === index);
            t.setAttribute("aria-selected", j === index ? "true" : "false");
            t.setAttribute("tabindex", j === index ? "0" : "-1");
        });
        defs.forEach((def, j) => {
            def.setAttribute("aria-hidden", j === index ? "false" : "true");
        });
        let activeTitle = titles[index];
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

    // 8️⃣ Animate definitions sliding
    function moveDefinition(index) {
        let maxHeight = Math.max(...defs.map((def) => def.scrollHeight));
        gsap.to(defs, {
            y: (i) => -(i - index) * maxHeight,
            autoAlpha: (i) => (i === index ? 1 : 0),
            duration: time,
            ease: "power4.out"
        });
    }

    // 9️⃣ Initialize first state
    activateTitle(0);
    moveDefinition(0);
}
// document.querySelectorAll(".n_scroll-accordion").forEach(scrollAccordion);

function initColorPanels() {
    let panels = gsap.utils.toArray(".section--colors .color-panel");

    let tl = gsap.timeline({
        scrollTrigger: {
            // scroller: scrollContainer,
            trigger: ".section--colors .colors",
            pin: ".section--colors .colors-wrapper",
            pinSpacing: true,
            scrub: 1,
            onUpdate: (self) => {
                updateActivePanel(self.progress);
            },
            end: "+=" + panels.length * 1000 // Adjust scroll length
        }
    });

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

    panels.forEach((panel, index) => {
        let isLast = index === panels.length - 1;
        const nextPanel = isLast ? false : panels[index + 1];
        let currentContent = panel.querySelector(".colors-content");
        let nextContent = nextPanel ? nextPanel.querySelector(".colors-content") : null;
        if (!isLast) {
            tl.to(currentContent, {
                clipPath: "inset(0 100% 0 0)", // from fully visible to clipped
                duration: 0.2,
                ease: "expo.inOut"
            });

            tl.to(panel, {
                width: "5%",
                ease: "expo.out"
            });

            tl.to(
                nextPanel,
                {
                    width: "100%", // Expand next panel
                    ease: "expo.out",
                    onStart: () => {
                        nextPanel.classList.add("active");
                        if (nextContent) {
                            // currentContent.classList.remove("hide");
                            // nextContent.classList.add("show"); // Add animation class
                        }
                    }
                },
                "<"
            ); // Sync animations
        } else {
            tl.to(panel, {
                width: "100%",
                duration: 0.5,
                ease: "expo.inOut"
            });
        }
    });
}

function stackedSlider(slider) {
    // const slides = slider.querySelectorAll('.n_stacked-slide');
    const slides = gsap.utils.toArray(slider.querySelectorAll(".n_stacked-slide"));
    const total = slides.length;
    const imgs = slides.map((s) => s.querySelector("img"));

    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: slider,
            pin: true,
            scrub: 1,
            start: "top top",
            end: `+=${(slides.length - 1) * 1500}`,

            snap: 1 / (total - 1)
        }
    });
    slides.forEach((slide, i) => {
        if (i === 0) return; // leave the first in-place to start

        const prev = slides[i - 1];
        const prevImg = imgs[i - 1];
        const curImg = imgs[i];

        // 1) slide the old container out to the left
        tl.to(prev, {
            xPercent: -100,
            duration: 1,
            ease: "power4.inOut"
        });

        if (prevImg) {
            // 2) push that old image out to the right
            tl.to(
                prevImg,
                {
                    xPercent: 100,
                    duration: 1,
                    ease: "power4.inOut"
                },
                "<"
            );
        }

        // 3) pull the new container in from the right
        tl.fromTo(
            slide,
            { xPercent: 100 },
            { xPercent: 0, duration: 1, ease: "power4.inOut" },
            "<"
        );

        // 4) pull its image in from the left
        tl.fromTo(
            curImg,
            { xPercent: -100 },
            { xPercent: 0, duration: 1, ease: "power4.inOut" },
            "<"
        );
    });

    // 1. Make it focusable
    slider.setAttribute("tabindex", "0");

    slider.addEventListener("keydown", (e) => {
        const st = tl.scrollTrigger;
        const start = st.start,
            end = st.end,
            scrollY = window.scrollY;

        // normalized progress [0‒1]
        const prog = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
        const per = 1 / (total - 1);
        let idx = Math.round(prog / per);

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            idx = Math.min(idx + 1, total - 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            idx = Math.max(idx - 1, 0);
        } else {
            return; // not an arrow key
        }

        e.preventDefault();

        // compute exact scroll position for that slide
        const targetScroll = start + (idx * (end - start)) / (total - 1);

        // tell ScrollTrigger to jump there
        st.scroll(targetScroll);

        const title = slides[idx].querySelector(".slide__title").textContent;
        document.getElementById("slider-status").textContent = `Slide ${
            idx + 1
        } of ${total}: ${title}`;
    });
}

function initStackedSliders() {
    const sections = document.querySelectorAll(".n_stacked-slider");

    sections.forEach((section) => {
        if (section._revealed) return; // only once
        section._revealed = true;

        stackedSlider(section);
    });
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
            duration: 1
        });

        // 2) push that old image out to the right
        if (prevImg) {
            tl.to(
                prevImg,
                {
                    xPercent: 100,
                    duration: 1
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
    tl.timeScale(0.2);

    return tl;
}
// function setupBigSlider(wrapper) {
//     // 1) Each “panel” is the .n_big-slide element
//     const panels = gsap.utils.toArray(wrapper.querySelectorAll(".n_big-slide"));
//     const total = panels.length;

//     // 2) Inside each panel we’ll animate both the <img> and the panel
//     const imgs = panels.map((p) => p.querySelector(".n_big-slide_img"));

//     // 4) Build a scrubbed, pinned timeline: one viewport per slide
//     const tl = gsap.timeline({
//         scrollTrigger: {
//             trigger: wrapper,
//             pin: true,
//             scrub: 1,
//             // markers: true,
//             start: "top top",
//             end: `+=${(total - 1) * window.innerHeight}`,
//             snap: 1 / (total - 1)
//         }
//     });

//     // 5) Sequence: slide out the old panel/image, bring in the new
//     panels.forEach((panel, i) => {
//         if (i === 0) return; // skip first panel

//         const prev = panels[i - 1],
//             prevImg = imgs[i - 1],
//             curImg = imgs[i];

//         // 1) slide the old container out to the left
//         tl.to(prev, {
//             xPercent: -100,
//             duration: 1,
//             ease: "power4.inOut"
//         });

//         // 2) push that old image out to the right
//         if (prevImg) {
//             tl.to(
//                 prevImg,
//                 {
//                     xPercent: 100,
//                     duration: 1,
//                     ease: "power4.inOut"
//                 },
//                 "<"
//             );
//         }

//         // 3) pull the new container in from the right
//         tl.fromTo(
//             panel,
//             { xPercent: 100 },
//             { xPercent: 0, duration: 1, ease: "power4.inOut" },
//             "<"
//         );
//         // 4) pull its image in from the left
//         if (curImg) {
//             tl.fromTo(
//                 curImg,
//                 { xPercent: -100 },
//                 { xPercent: 0, duration: 1, ease: "power4.inOut" },
//                 "<"
//             );
//         }
//     });
// }

function initBigSliderAnimations() {
    gsap.utils.toArray(".n_big-slider_wrapper").forEach(setupPageSlider);
}
// 11.20.25 notes
// weird bug where it will stop scrolling if i dont hard refresh. the gs dev tool bar is longer than where it stops so it is aware of the scroll but the page isnt scrolling. maybe something to do with the snap? bc it stopped on fans sans section which is a special section.
// okay refreshed without hard refresh and it is stuck in fans sans again BUT it scrolls down a little futher than last reload but then it snaps back up.
// update. it stopped at the fanatics logo section. so maybe not a snap issue?
// update: stopped at fanatics logo again
// make accordion tabbable

//done
// text reveal doesnt animate first block
// fix split text banner styling

// < // start at the beginning of prev tween
// +2 // start 2 seconds after the end of prev tween
// <0.5 // start 0.5 seconds after the beginning of prev tween
// containerAnimation: use this for the pinned photo stuff?
function setupPageSlider(wrapper) {
    // each slide is a .slide
    const slides = gsap.utils.toArray(wrapper.querySelectorAll(".slide"));
    const total = slides.length;

    // Collect all big-slider segments
    // collect all big sliders (supports >1)
    const bigSliders = slides
        .map((slide, index) => {
            const wrapper = slide.querySelector(".n_big-slider");
            if (!wrapper) return null;

            const panels = gsap.utils.toArray(wrapper.querySelectorAll(".n_big-slide"));
            return {
                index,
                panelCount: panels.length
            };
        })
        .filter(Boolean);

    const tops = slides.map((slide) =>
        ScrollTrigger.create({
            trigger: slide,
            start: "top top"
            // markers: true,
        })
    );

    console.log(`tops`);
    console.log(tops);

    // Build a scrubbed, pinned timeline: one viewport per slide
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: wrapper,
            pin: true,
            scrub: 1,
            markers: true,
            start: "top top",
            end: `+=${(total - 1) * window.innerHeight * 2}`,
            onUpdate: (self) => {
                console.log("[ST update]", {
                    progress: Number(self.progress.toFixed(4)),
                    scroll: self.scroll(),
                    direction: self.direction
                });
            },
            // added 11.21.25, should update to tolerate timeline changes so it doesnt just cache once
            // snap: (rawProgress) => {
            //     // Rebuild normalized label positions on every call
            //     const labels = slides
            //         .map((_, i) => tl.labels[`slide-${i}`] / tl.duration())
            //         .sort((a, b) => a - b);

            //     // Find which segment (slide) we're in: [labels[i], labels[i+1]]
            //     let segIndex = 0;
            //     for (let i = 0; i < labels.length - 1; i++) {
            //         if (rawProgress >= labels[i] && rawProgress < labels[i + 1]) {
            //             segIndex = i;
            //             break;
            //         }
            //     }

            //     const segStart = labels[segIndex];
            //     const segEnd = labels[segIndex + 1] ?? 1;
            //     const segLen = segEnd - segStart;

            //     const slide = slides[segIndex];

            //     // // Check for big slider

            //     // --- BIG SLIDER INTERNAL SNAP ---
            //     const activeBig = bigSliders.find((b) => b.index === segIndex);
            //     if (activeBig && activeBig.panelCount > 1) {
            //         const slideLabel = `slide-${segIndex}`;
            //         const inPlaceLabel = `${slideLabel}-in-place`;

            //         // region where the big slider is actually "in place"
            //         const internalStart =
            //             (tl.labels[inPlaceLabel] ?? tl.labels[slideLabel]) / tl.duration();
            //         const internalEnd = segEnd;
            //         const internalLen = internalEnd - internalStart;

            //         if (internalLen > 0) {
            //             const steps = activeBig.panelCount - 1;
            //             const internalSnapPoints = [];

            //             // only internal transitions, not the very start of the slide
            //             for (let j = 1; j <= steps; j++) {
            //                 const t = j / activeBig.panelCount; // 0..1 within big slider region
            //                 internalSnapPoints.push(internalStart + t * internalLen);
            //             }

            //             let closest = internalSnapPoints[0];
            //             internalSnapPoints.forEach((p) => {
            //                 if (Math.abs(p - rawProgress) < Math.abs(closest - rawProgress)) {
            //                     closest = p;
            //                 }
            //             });

            //             const INTERNAL_THRESHOLD = internalLen * 0.4; // tweak stickiness
            //             if (Math.abs(closest - rawProgress) < INTERNAL_THRESHOLD) {
            //                 return closest;
            //             }
            //         }

            //         // fall through to normal/special behavior if not inside the big-slider band
            //     }

            //     const hasTextReveal = !!slides[segIndex].querySelector(".n_text-reveal-section");
            //     const isAccordion = !!slides[segIndex].querySelector(".n_scroll-accordion");
            //     const hasFansSection = !!slides[segIndex].querySelector(".section-fans");
            //     const isColorsSection = !!slides[segIndex].querySelector(".colors-wrapper");
            //     const rippleGradient =
            //         slides[segIndex].getAttribute("data-element") === "ripple-gradient";
            //     const isBigSlider = !!slides[segIndex].querySelector(".n_big-slider_wrapper");
            //     // console.log('hasTextReveal', hasTextReveal);
            //     // console.log('found big slider?', isBigSlider);
            //     // console.log('rippleGradient', rippleGradient);
            //     // console.log('isColorsSection', isColorsSection);

            //     const isSpecialSlide =
            //         hasTextReveal ||
            //         isAccordion ||
            //         hasFansSection ||
            //         isColorsSection ||
            //         rippleGradient;

            //     // NORMAL SLIDES
            //     if (!isSpecialSlide) {
            //         const GLOBAL_THRESHOLD = 0.08;

            //         let closest = labels[0];
            //         labels.forEach((p) => {
            //             if (Math.abs(p - rawProgress) < Math.abs(closest - rawProgress)) {
            //                 closest = p;
            //             }
            //         });

            //         if (Math.abs(closest - rawProgress) < GLOBAL_THRESHOLD) {
            //             return closest;
            //         }

            //         return rawProgress;
            //     }

            //     // TEXT-REVEAL / ACCORDION SLIDES: only snap near edges
            //     const EDGE_PORTION = 0.2;

            //     const leftSnapEnd = segStart + segLen * EDGE_PORTION;
            //     const rightSnapStart = segEnd - segLen * EDGE_PORTION;

            //     if (rawProgress > leftSnapEnd && rawProgress < rightSnapStart) {
            //         return rawProgress;
            //     }

            //     const distToStart = Math.abs(rawProgress - segStart);
            //     const distToEnd = Math.abs(rawProgress - segEnd);
            //     const target = distToStart < distToEnd ? segStart : segEnd;

            //     const LOCAL_THRESHOLD = segLen * 0.4;
            //     if (Math.abs(rawProgress - target) < LOCAL_THRESHOLD) {
            //         return target;
            //     }

            //     return rawProgress;
            // },

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
        const rippleGradient = wrapper.getAttribute("data-element") === "ripple-gradient";
        const bigSliderWrapper = slide.querySelector(".n_big-slider");

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

        // 1) slide the old container up or keep it for a stacked effect
        if (i > 0) {
            tl.to(prev, {
                yPercent: -100,
                duration: 4,
                ease: "power4.inOut"
            });
            // 3) pull the new container in from below
            tl.fromTo(
                slide,
                { yPercent: 100 },
                { yPercent: 0, ease: "power4.inOut", duration: 4 },
                label
            );
        }

        const slideInPlaceLabel = `${label}-in-place`;

        if (i > 0) {
            tl.addLabel(slideInPlaceLabel, `>`);
        } else {
            // first slide is already in view, so content can start at the slide label
            tl.add(slideInPlaceLabel, label);
        }

        // if (i > 0) {

        // }

        // additional animations can be added here
        if (textReveal) {
            // console.log("TEXT REVEAL FOUND IN SLIDE", i);
            const textRevealTl = setupSliderTextReveal(slide, tl, isPageHeader);
            // textRevealTl.duration(SLIDE_DURATION * 0.8);
            // console.log(textRevealTl);
            const SLIDE_TRANSITION_DURATION = i > 0 ? 4 : 0;
            const TEXT_REVEAL_OFFSET = SLIDE_TRANSITION_DURATION + 0.2; // start animation at either 4s or 0s + .2s depending on if

            // tl.add(textRevealTl, label + "+=0.2"); // .2s delay after slide in
            tl.add(textRevealTl, `${label}+=${TEXT_REVEAL_OFFSET}`);
            console.log("text reveal duration:", textRevealTl.duration());
        }

        if (isPageHeader) {
            addPageHeaderAnimation(tl, wrapper, label);
        }

        // section header animation
        if (sectionHeader) {
            addSectionHeaderAnimation(tl, sectionHeader, label, 2);
        }

        // fade-up elements animation
        if (fadeUps.length > 0) {
            addSectionFadeUpAnimation(tl, fadeUps, label, 3.7);
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
    });
    GSDevTools.create({ animation: tl });
}
let pageSliderTl = null;

// did not work
// function initPageSlider() {
//     // kill old timeline if it exists
//     if (pageSliderTl) {
//         if (pageSliderTl.scrollTrigger) {
//             pageSliderTl.scrollTrigger.kill();
//         }
//         pageSliderTl.kill();
//         pageSliderTl = null;
//     }

//     // kill old ScrollTriggers with id "page-slider"
//     ScrollTrigger.getAll().forEach((st) => {
//         if (st.vars && st.vars.id === "page-slider") {
//             st.kill();
//         }
//     });

//     // build new timeline
//     gsap.utils.toArray(".slider-wrapper").forEach((wrapper) => {
//         pageSliderTl = setupPageSlider(wrapper);
//     });

//     // refresh ScrollTrigger
//     ScrollTrigger.refresh();
// }
function initPageSlider() {
    gsap.utils.toArray(".slider-wrapper").forEach(setupPageSlider);
}
function setupFanSansLottie(slide, tl, contentLabel, slideIndex, offsetSeconds = 0) {
    console.log("setupFanSansLottie called for label:", contentLabel);

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
    localTl.timeScale(0.3);

    // plug into master slider tl
    masterTl.add(localTl, `${label}+=${offset}`);
}

// function addColorPanelsAnimation(slide, masterTl, label, offset = 0.2) {
//     const panels = gsap.utils.toArray(
//         slide.querySelectorAll(".color-panel")
//     );

//     if (!panels.length) return;

//     const COLOR_MIN_SEGMENT = 18; // <<< make this bigger to slow the whole slide down

//     const localTl = gsap.timeline({
//         onUpdate: () => {
//             const progress = localTl.progress();
//             let activeIndex = Math.round(progress * panels.length - 0.5);

//             if (activeIndex >= panels.length) {
//                 activeIndex = panels.length - 1;
//             }

//             panels.forEach((panel, index) => {
//                 panel.classList.toggle("active", index === activeIndex);
//             });
//         }
//     });

//     panels.forEach((panel, index) => {
//         const isLast = index === panels.length - 1;
//         const nextPanel = isLast ? null : panels[index + 1];
//         const currentContent = panel.querySelector(".colors-content");
//         const nextContent = nextPanel
//             ? nextPanel.querySelector(".colors-content")
//             : null;

//         if (!isLast) {
//             // SLOW THESE DOWN
//             localTl.to(currentContent, {
//                 clipPath: "inset(0 100% 0 0)",
//                 duration: 3,          // was 0.2
//                 ease: "expo.inOut"
//             });

//             localTl.to(
//                 panel,
//                 {
//                     width: "5%",
//                     duration: 3,       // add duration, not just ease
//                     ease: "expo.out"
//                 },
//                 "<"
//             );

//             localTl.to(
//                 nextPanel,
//                 {
//                     width: "100%",
//                     duration:3,       // add duration
//                     ease: "expo.out",
//                     onStart: () => {
//                         nextPanel.classList.add("active");
//                         // if (nextContent) { ... }
//                     }
//                 },
//                 "<"
//             );
//         } else {
//             localTl.to(panel, {
//                 width: "100%",
//                 duration: 3.0,          // was 0.5
//                 ease: "expo.inOut"
//             });
//         }
//     });

//     // plug into master timeline
//     masterTl.add(localTl, `${label}+=${offset}`);

//     // --- EXACT SAME PATTERN AS FANS_MIN_SEGMENT ---
//     const slideStart = masterTl.labels[label];
//     const currentEnd = masterTl.duration();
//     const currentLen = currentEnd - slideStart;

//     if (currentLen < COLOR_MIN_SEGMENT) {
//         const pad = COLOR_MIN_SEGMENT - currentLen;
//         masterTl.to({}, { duration: pad }); // dummy tween to stretch this slide
//     }
// }
// function addColorPanelsAnimation(slide, masterTl, label, offset = 0.2) {
//     console.log('adding colors ani')
//     const panels = gsap.utils.toArray(
//         slide.querySelectorAll(".color-panel")
//     );

//     if (!panels.length) return;

//     const COLOR_MIN_SEGMENT = 14; // <<< make this bigger to slow the whole slide down

//     const localTl = gsap.timeline({
//         onUpdate: () => {
//             const progress = localTl.progress();
//             let activeIndex = Math.round(progress * panels.length - 0.5);

//             if (activeIndex >= panels.length) {
//                 activeIndex = panels.length - 1;
//             }

//             panels.forEach((panel, index) => {
//                 panel.classList.toggle("active", index === activeIndex);
//             });
//         }
//     });

//     panels.forEach((panel, index) => {
//         const isLast = index === panels.length - 1;
//         const nextPanel = isLast ? null : panels[index + 1];
//         const currentContent = panel.querySelector(".colors-content");
//         const nextContent = nextPanel
//             ? nextPanel.querySelector(".colors-content")
//             : null;

//         if (!isLast) {
//             // SLOW THESE DOWN
//             localTl.to(currentContent, {
//                 clipPath: "inset(0 100% 0 0)",
//                 duration: 0.6,          // was 0.2
//                 ease: "expo.inOut"
//             });

//             localTl.to(
//                 panel,
//                 {
//                     width: "5%",
//                     duration: 0.8,       // add duration, not just ease
//                     ease: "expo.out"
//                 },
//                 "<"
//             );

//             localTl.to(
//                 nextPanel,
//                 {
//                     width: "100%",
//                     duration: 0.8,       // add duration
//                     ease: "expo.out",
//                     onStart: () => {
//                         nextPanel.classList.add("active");
//                         // if (nextContent) { ... }
//                     }
//                 },
//                 "<"
//             );
//         } else {
//             localTl.to(panel, {
//                 width: "100%",
//                 duration: 1.0,          // was 0.5
//                 ease: "expo.inOut"
//             });
//         }
//     });

//     // plug into master timeline
//     masterTl.add(localTl, `${label}+=${offset}`);

//     // --- EXACT SAME PATTERN AS FANS_MIN_SEGMENT ---
//     const slideStart = masterTl.labels[label];
//     const currentEnd = masterTl.duration();
//     const currentLen = currentEnd - slideStart;

//     if (currentLen < COLOR_MIN_SEGMENT) {
//         const pad = COLOR_MIN_SEGMENT - currentLen;
//         masterTl.to({}, { duration: pad }); // dummy tween to stretch this slide
//     }
// }
// function addColorPanelsAnimation(slide, masterTl, label, offset = 0.2) {
//     const panels = gsap.utils.toArray(slide.querySelectorAll(".color-panel"));

//     if (!panels.length) return;

//     // local timeline that will be nested inside the slider tl
//     const localTl = gsap.timeline({
//         onUpdate: () => {
//             const progress = localTl.progress();
//             let activeIndex = Math.round(progress * panels.length - 0.5);

//             if (activeIndex >= panels.length) {
//                 activeIndex = panels.length - 1;
//             }

//             panels.forEach((panel, index) => {
//                 panel.classList.toggle("active", index === activeIndex);
//             });
//         }
//     });

//     panels.forEach((panel, index) => {
//         const isLast = index === panels.length - 1;
//         const nextPanel = isLast ? null : panels[index + 1];
//         const currentContent = panel.querySelector(".colors-content");
//         const nextContent = nextPanel ? nextPanel.querySelector(".colors-content") : null;

//         if (!isLast) {
//             // hide current content
//             localTl.to(currentContent, {
//                 clipPath: "inset(0 100% 0 0)",
//                 duration: 0.2,
//                 ease: "expo.inOut"
//             });

//             // shrink current panel
//             localTl.to(
//                 panel,
//                 {
//                     width: "5%",
//                     ease: "expo.out"
//                 },
//                 "<"
//             );

//             // grow next panel
//             localTl.to(
//                 nextPanel,
//                 {
//                     width: "100%",
//                     ease: "expo.out",
//                     onStart: () => {
//                         nextPanel.classList.add("active");
//                         // if you want to do content show/hide, do it here:
//                         // if (nextContent) {
//                         //     nextContent.classList.add("show");
//                         // }
//                     }
//                 },
//                 "<"
//             );
//         } else {
//             // last panel just fills out
//             localTl.to(panel, {
//                 width: "100%",
//                 duration: 0.5,
//                 ease: "expo.inOut"
//             });
//         }
//     });

//     // plug the local timeline into the main slider timeline
//     // label = slide label or "slide-X-in-place"
//     masterTl.add(localTl, `${label}+=${offset}`);

//     // optionally: force a minimum segment duration so it’s not hyper-fast
//     const MIN_SEGMENT = 15; // tweak
//     const slideStart = masterTl.labels[label];
//     const currentEnd = masterTl.duration();
//     const currentLen = currentEnd - slideStart;

//     if (currentLen < MIN_SEGMENT) {
//         const pad = MIN_SEGMENT - currentLen;
//         masterTl.to({}, { duration: pad });
//     }
// }

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

function addSectionFadeUpAnimation(tl, fadeUpElements, label, offset = 3.7) {
    fadeUpElements.forEach((item) => {
        const parentBanner = item.closest(".section-banner");
        const hasParentBanner = !!parentBanner;

        // Match your old behavior:
        // - if inside banner → delay reveal (startFrom = top 10%)
        // - else → normal behavior
        const startOffset = hasParentBanner ? "+=3.5" : "+=3.7";
        // tweak if needed — earlier or later

        // initial state
        gsap.set(item, { opacity: 0, y: 50 });

        // build the non-scrubbed tween
        const fadeTl = gsap.timeline({ paused: true });

        fadeTl.to(item, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });

        // hook into master timeline & fire at the right moment
        tl.add(() => {
            const dir = tl.scrollTrigger.direction;

            if (dir === 1) {
                fadeTl.restart(); // play normally
            } else {
                fadeTl.pause(0);
                gsap.set(item, { opacity: 0, y: 50 }); // reset
            }
        }, label + startOffset);
    });
}

function setupPageHeaderAni(wrapper, tl) {
    let fansVideo = wrapper.querySelector(".n_bg-video--fans");
    let logoVideo = wrapper.querySelector(".n_bg-video--logo");
    let flagVideo = wrapper.querySelector(".n-bg-video--flag");
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
    // console.log(wrapper);

    const endColor = wrapper.dataset.endColor || "#ffffff";
    const blocks = gsap.utils.toArray(
        wrapper.querySelectorAll(".n_text-reveal__block, .n_logo-reveal__block")
    );

    const masterTl = gsap.timeline({});

    let words;

    // duplicate
    // allHeadings.forEach((heading) => {
    //     words = splitTextIntoWords(heading);
    //     prepareWords(words);
    // });

    blocks.forEach((block, i) => {
        // console.log(blocks);
        let tl = gsap.timeline();
        tl.call(() => block.classList.add("active")).set(block, { zIndex: 2 });

        const headings = block.querySelectorAll(".n_text-reveal__heading");
        const hasLogos = block.classList.contains("n_logo-reveal__block");

        // check for typography special cases
        if (block.dataset.animateSpecial === "anton") {
            let specialTl = animateAnton(block, wrapper);
            masterTl.add(specialTl);
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

        // make sure its not a logo block
        if (headings.length > 1 && !hasLogos) {
            // this is running only for typography text reveal currently. ?? but logo reveal block worked fine with it. whatever. 11.24.25 1030am
            // 1) split each heading once, flatten into one big array of spans
            const allWords = Array.from(headings).flatMap((h1) => splitTextIntoWords(h1));

            // 2) prep them off-screen
            prepareWords(allWords);

            // 3) animate them all in at once
            tl.add(animateWordsIn(allWords, endColor, 0.05, 0.1));

            // 4) then animate them all out
            tl.add(animateWordsOut(allWords, 0.05, 0.1));

            // 5) cleanup & bail
            tl.call(() => block.classList.remove("active")).set(block, { zIndex: 0 });
            masterTl.add(tl);
            return;
        }

        headings.forEach((h1, headingIndex) => {
            // 1) Split the text into individual <span class="text-reveal__word">…</span>
            const words = splitTextIntoWords(h1);

            // Figure out if this is the very last heading of the very last block:
            const isLastBlock = i === blocks.length - 1;

            const isLastHeading = headingIndex === headings.length - 1;

            // console.log(`isLastHeading: ${isLastHeading}`)

            // 3) Build a mini‐timeline for “this one <h1>”.
            const wordAnim = createWordTimeline(words, endColor, block, isLastBlock, isLastHeading);

            // 4) Add THAT entire mini-timeline into “tl” (so headings run in series, one after the other)
            tl.add(wordAnim);
        });
        tl.call(() => block.classList.remove("active")).set(block, { zIndex: 0 });
        masterTl.add(tl);
    });
    return masterTl;
}

// const firstSlide = document.querySelector(".slide");
// const firstWords = firstSlide.querySelectorAll(".n_text-reveal__word");
// getComputedStyle(firstWords[0]).opacity;      // should be "0"
// getComputedStyle(firstWords[0]).transform;    // should contain "matrix(...)" translating down

function initStoryLottie() {
    const container = document.querySelector(".story__lottie");
    if (!container) return;

    // 1️⃣ load the animation (but don’t autoplay)
    const anim = lottie.loadAnimation({
        container,
        renderer: "svg",
        loop: false,
        autoplay: false,
        path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/6843520aa1e4f9f54b166004_2025_06_06_EASCI_Fanatics_ColorCascade_01.json"
    });

    // 2️⃣ once it’s ready, hook up GSAP/ScrollTrigger
    anim.addEventListener("DOMLoaded", () => {
        const totalFrames = anim.totalFrames;

        // start hidden
        gsap.set(container, { autoAlpha: 0 });

        // scrub timeline
        gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start: "top 80%",
                end: "+=500", // over the next 500px of scroll
                scrub: true
                //markers: true,
            }
        })
            // fade in quickly
            .to(container, { autoAlpha: 1, duration: 0.2 }, 0)
            // scrub frames
            .to(
                { frame: 0 },
                {
                    frame: totalFrames - 1,
                    ease: "none",
                    duration: 1, // normalized duration; real timing comes from scrub
                    onUpdate() {
                        const f = Math.round(this.targets()[0].frame);
                        anim.goToAndStop(f, true);
                    }
                },
                0
            );
    });
}

initStoryLottie();

let counterInterval;

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

// console.log('COUNTER')
// console.log(document.querySelector('.section-banner__counter').parentElement)

// let bannerEl = document.querySelector(".section-banner__counter").parentElement;

// console.log(bannerEl.nextElementSibling)

ScrollTrigger.create({
    trigger: ".section-banner__counter",
    start: "top 80%",
    endTrigger: "#wink-section",
    end: "bottom top",
    // markers: true,
    onEnter: startCount,
    onEnterBack: startCount, // ok to re‐run, because we clear the old one
    // onLeave: () => {
    //   clearInterval(counterInterval); // stop it when you scroll past
    //   document.querySelector('.counter-text').textContent = '';
    // },
    onLeave: () => clearInterval(counterInterval), // stop when bottom leaves
    onLeaveBack: () => clearInterval(counterInterval),
    invalidateOnRefresh: true
});

function initScrollingSlider() {
    const sliderSection = document.querySelector(".n_scrolling-slider");
    const slidesContainer = sliderSection.querySelector(".scrolling-slider__track");
    const slides = gsap.utils.toArray(slidesContainer.querySelectorAll(".scrolling-slider__slide"));
    const sliderHeaderWrap = sliderSection.querySelector(".scrolling-slider__intro");

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
            end: `+=${scrollDist * 3}`, // twice the distance for more scrolls
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

// initScrollingSlider();

// n_section-header

// gsap.utils.toArray(".section-fade-up").forEach((section) => {
//     // console.log(section)
//     let parentBanner = section.closest(".section-banner");
//     let hasParentBanner = parentBanner ? true : false;
//     // if (parentBanner) {
//     //   console.log('has parentBanner')

//     //   console.log(parentBanner)

//     // } else {
//     //   console.log(`no parent banner`)
//     // }
//     // console.log(hasParentBanner)
//     let startFrom = hasParentBanner ? "top 10%" : "top top";
//     let toggleAct = hasParentBanner ? "play reverse play reverse" : "play none play complete";
//     gsap.fromTo(
//         section,
//         { opacity: 0, y: 50 }, // start
//         {
//             opacity: 1,
//             y: 0,
//             duration: 0.5,
//             ease: "power2.out",
//             scrollTrigger: {
//                 trigger: hasParentBanner ? parentBanner : section,
//                 // start: "top 80%", // reveal when near 80% viewport
//                 start: startFrom,
//                 // toggleActions: "play none play complete",
//                 toggleActions: toggleAct
//                 // markers: true,
//                 // scrub: true
//             }
//         }
//     );
// });

// const sectionHeaders = document.querySelectorAll(".n_section-header");
// // console.log(`sectionHeaders`)
// // console.log(sectionHeaders)
// sectionHeaders.forEach((section, i) => {
//     let header = section.querySelector(".n_section-header__title");
//     let number = section.querySelector(".n_section-header__number");

//     gsap.set(header, {
//         color: "#E10600"
//     });
//     gsap.set([header, number], {
//         opacity: 0,
//         yPercent: 30
//     });

//     let tl = gsap.timeline({
//         scrollTrigger: {
//             trigger: section,
//             start: "top 40%",
//             end: "bottom center",
//             toggleActions: "play none none reset"
//         }
//     });

//     tl.to([header, number], {
//         opacity: 1,
//         yPercent: 0,
//         duration: 0.75,
//         ease: "power4.out",
//         stagger: 0.12
//     });
//     tl.to(
//         header,
//         {
//             color: "#FFFFFF"
//         },
//         "<"
//     );
// });

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

async function init() {
    await waitForFonts();
    await waitForVideos();

    initPageSlider();

    // initTextRevealSections();
    // initFanSansLottie();
    // initColorPanels();
    // initStackedSliders();
    // initBigSliderAnimations();
    // initScrollingSlider();
    // wireNav();

    // Display the body
    document.querySelector("body").style.display = "block";

    // Fade in the body after scripts load
    gsap.fromTo("body", { opacity: 0 }, { opacity: 1, duration: 0.5 });
}

window.addEventListener("load", init);

setTimeout(() => {
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
}, 600);

// extra refresh when fonts report late (Safari, etc.)
Promise.resolve(document.fonts?.ready).finally(() =>
    requestAnimationFrame(() => ScrollTrigger.refresh())
);
