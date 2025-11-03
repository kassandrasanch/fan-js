gsap.registerPlugin(ScrollTrigger, SplitText);

console.log("hi scroll update");

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

// Display the body
document.querySelector("body").style.display = "block";

// Fade in the body after scripts load
gsap.fromTo("body", { opacity: 0 }, { opacity: 1, duration: 0.5 });

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

    // First one: no text
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
    // Defensive remove old ghost
    const oldGhost = document.querySelector(".n_nav__ghost");
    if (oldGhost) oldGhost.remove();

    // Clone visible nav sections to offscreen ghost
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

    ghostSections.forEach((el, i) => {
        const title = el.innerText.trim();
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

// 0439 do i measure sections heights here?
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
            // console.log(`on onLeaveBack index ${i}`)
            if (i === 0) {
                goToSection(0);
            } else {
                goToSection(i - 1);
            }
        },
        // Optional (for completeness):
        onLeave: () => {
            // console.log(`leaving section ${i}`)
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

    // Add Escape listener
    document.addEventListener("keydown", onEscapeKey);

    let tl = gsap.timeline();
    tl.to(navMenu, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" }).to(
        navBrand,
        { opacity: 1, pointerEvents: "auto" },
        "<"
    );
    gsap.set(navHeader, {
        backgroundColor: "#e10600"
    });
}

function closeNav() {
    lenis.start();
    navToggle.setAttribute("aria-expanded", "false");

    let tl = gsap.timeline();
    gsap.set(navHeader, {
        backgroundColor: "transparent"
    });
    tl.to(navMenu, { y: -50, autoAlpha: 0, duration: 0.1, ease: "power4.in" }).to(navBrand, {
        opacity: 0,
        pointerEvents: "none"
    });

    document.querySelector("body").classList.remove("nav-open");
}

function toggleNav(e) {
    e.preventDefault();
    // debugger;
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    if (expanded) {
        closeNav();
    } else {
        openNav();
    }
}

navToggle.addEventListener("click", toggleNav);

function setMenuPrimaryMargin() {
    const navHeaderHeight = navHeader.getBoundingClientRect().height;
    navMenuPrimary.style.marginTop = navHeaderHeight + "px";
}
setMenuPrimaryMargin();

function splitTextIntoWords(
    element,
    wrapClass = "text-reveal__word-wrap",
    wordClass = "text-reveal__word"
) {
    const split = new SplitText(element, {
        type: "words",
        linesClass: wrapClass
    });

    split.words.forEach((word) => {
        const span = document.createElement("span");
        span.classList.add(wordClass);
        span.innerHTML = word.innerHTML;
        word.innerHTML = "";
        word.appendChild(span);
    });
    return element.querySelectorAll(`.${wordClass}`);
}

function prepareWords(words) {
    gsap.set(words, {
        yPercent: 100,
        opacity: 0,
        color: "#E10600"
    });
}

function animateWordsIn(words, endColor) {
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
                duration: 1,
                ease: "power4.out",
                stagger: 0.15
            }
        )
        .to(
            words,
            {
                color: endColor,
                duration: 1,
                stagger: 0.15
            },
            0
        );
}

function animateWordsOut(words, delay = 1.2) {
    const tl = gsap.timeline();
    tl.to({}, { duration: 1.2 });
    tl.to(words, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut",
        stagger: 0.1
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
            end: () => `+=${blocks.length * 1400}`,
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

function revealText(wrapper) {
    const allHeadings = wrapper.querySelectorAll(".n_text-reveal__heading");

    const isPageHeader = wrapper.getAttribute("element") === "page-header";
    const isRippleGradient = wrapper.getAttribute("data-element") === "ripple-gradient";

    if (isRippleGradient) {
        initVideoTextScrub(wrapper);
        return;
    }

    const endColor = wrapper.dataset.endColor || "#ffffff";
    const blocks = gsap.utils.toArray(
        wrapper.querySelectorAll(".n_text-reveal__block, .n_logo-reveal__block")
    );

    // 2.2) CREATE MASTER TIMELINE
    const masterTl = gsap.timeline({
        scrollTrigger: {
            trigger: wrapper,
            start: "top top",
            end: () => `+=${blocks.length * 1400}`,
            pin: true,
            scrub: 1,
            markers: true,

            toggleActions: "play reverse play reverse"
        }
    });

    let words;

    allHeadings.forEach((h1) => {
        words = splitTextIntoWords(h1);
        masterTl.add(prepareWords(words));
    });

    let fansVideo, logoVideo, flagVideo;

    // If this is your “page-header” style, fade out the fans video up front:
    if (isPageHeader) {
        fansVideo = wrapper.querySelector(".n_bg-video--fans");
        logoVideo = wrapper.querySelector(".n_bg-video--logo");
        flagVideo = wrapper.querySelector(".n-bg-video--flag");

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
            masterTl.add(preFade, 0);
            // → this “preFade” sub‐timeline runs immediately (at position 0 of masterTl)
        }
    }

    // 2.3) Loop over every block in this section:
    blocks.forEach((block, i) => {
        // 2.3.a) Create a small per‐block sub‐timeline (“tl”):

        const tl = gsap.timeline();
        tl.call(() => block.classList.add("active")).set(block, { zIndex: 2 });

        const headings = block.querySelectorAll(".n_text-reveal__heading");
        // console.log(headings)

        // const wordGroups = headings.map(h1 => splitTextIntoWords(h1));
        // const allWords = wordGroups.flat();

        // CHECK FOR ANTON
        if (block.dataset.animateSpecial === "anton") {
            let antonTl = animateAnton(block);
            masterTl.add(antonTl);
            return;
        }

        if (block.dataset.animateSpecial === "instrument") {
            let instrumentTl = animateInstrument(block);
            masterTl.add(instrumentTl);
            return;
        }

        if (block.dataset.animateSpecial === "inter") {
            let interTl = animateInter(block);
            masterTl.add(interTl);
            return;
        }

        if (block.dataset.animateSpecial === "bk-switch--white") {
            let specialTl = animateBk(block);
            masterTl.add(specialTl);
            return;
        }

        if (block.dataset.animateSpecial === "like-this") {
            let specialTl = animateLikeThis(block, wrapper);
            masterTl.add(specialTl);
            return;
        }

        if (block.dataset.animateSpecial === "logomark") {
            let specialTl = animateLogoMark(block, wrapper);
            masterTl.add(specialTl);
            return;
        }

        const hasLogos = block.classList.contains("n_logo-reveal__block");

        // make sure its not a logo block
        if (headings.length > 1 && !hasLogos) {
            // 1) split each heading once, flatten into one big array of spans
            const allWords = Array.from(headings).flatMap((h1) => splitTextIntoWords(h1));

            // 2) prep them off-screen
            tl.add(prepareWords(allWords));

            // 3) animate them all in at once
            tl.add(animateWordsIn(allWords, endColor));

            // 4) then animate them all out
            tl.add(animateWordsOut(allWords));

            // 5) cleanup & bail
            tl.call(() => block.classList.remove("active")).set(block, { zIndex: 0 });
            masterTl.add(tl);
            return;
        }

        // 2.3.c) — Normal (non-Anton) blocks:
        // Find every <h1 class="n_text-reveal__heading"> inside this block:
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

        // 2.3.c.v) Once all headings in that block have run, remove .active & reset zIndex:

        tl.call(() => block.classList.remove("active"));

        tl.set(block, { zIndex: 0 });
        masterTl.to(block, {
            border: "unset"
        });

        // 2.3.c.vi) Finally, insert this block’s “tl” into the master timeline:
        masterTl.add(tl);
    });

    // 2.4) (If isPageHeader && there is a logoVideo, you do one more “fade in the logo”
    const totalDuration = masterTl.duration();
    if (isPageHeader && logoVideo) {
        const lastLine = blocks[blocks.length - 1];
        const lastWords = lastLine.querySelectorAll("text-reveal__Word");

        masterTl.to(lastWords, {
            yPercent: 100,
            opacity: 0,
            duration: 0.8,
            ease: "power3.inOut",
            stagger: 0.1
        });
        masterTl.to(logoVideo, {
            opacity: 1,
            duration: 2,
            ease: "power2.out"
        });
    }
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

// 1 FIND TEXT REVEAL SECTIONS
function initTextRevealSections() {
    const sections = document.querySelectorAll(".n_text-reveal-section");

    sections.forEach((section) => {
        if (section._revealed) return; // only once
        section._revealed = true;

        revealText(section);
    });
}

// 0439

// let scrollPanels = gsap.utils.toArray(".section-banner, .n_section-header, .n_text-reveal-section");
// panels here
let scrollPanels = gsap.utils.toArray(".section-banner, .n_section-header, .section-split ");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// try 4 10.30.25 works when scrolling down but not up
// issues
// nav zindex issue
// scrollbar not showing full height issue
// text sections
// what abt panels that are taller/shorter than viewport?
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// use observer in text reveal anis?

// need direction
// need observer
// need currentIndex

// ---- DEBUG SETUP (paste near the top) ----
const DEBUG = true;
const dbg = (...args) => DEBUG && console.log("[DBG]", ...args);
let observer;
// little on-screen HUD
let hud;
let outerIndex;
if (DEBUG) {
    hud = document.createElement("div");
    hud.style.cssText = `
    position:fixed; right:8px; top:8px; z-index:99999;
    font:12px/1.3 monospace; background:rgba(0,0,0,.7); color:#0f0;
    padding:6px 8px; border-radius:6px; pointer-events:none; white-space:pre;
  `;
    document.body.appendChild(hud);
}
const updateHUD = () => {
    if (!DEBUG || !hud) return;

    hud.textContent =
        `allowScroll: ${allowScroll}\n` +
        // `sectionIndices: ${JSON.stringify(sectionIndices)}\n` +
        `enabled: ${observer.isEnabled}\n` +
        `currentIndex: ${currentIndex}\n` +
        `animating: ${animating}\n` +
        `outerIndex: ${outerIndex}\n` +
        `scrollY: ${Math.round(window.scrollY)}`;
};

// ------------------------------------------

let allowScroll = true;
const scrollTimeout = gsap.delayedCall(1, () => (allowScroll = true)).pause();
let currentIndex = -1;
let animating;
let direction;

let swipePanels = gsap.utils.toArray(
    ".observer-section .section-banner, .observer-section .n_section-header, .observer-section .section-split"
);
console.log(swipePanels);
// gsap.set(swipePanels, { zIndex: (j) => swipePanels.length - j });
const clamp = gsap.utils.clamp(0, swipePanels.length - 1);
// gsap.set(swipePanels, {
//     yPercent: (i) => (i === 0 ? 0 : 100),
//     // zIndex: (j) => swipePanels.length - j
// });
gsap.set(swipePanels, {
    yPercent: (i) => (i === 0 ? 0 : 100),
    autoAlpha: (i) => (i === 0 ? 1 : 0),
    willChange: "transform"
});

function goToPanel(index, direction) {
    if (animating) return; // re-entry guard

    index = clamp(index);
    outerIndex = index; // for HUD consistency
    const prev = currentIndex;
    const d = direction === -1 ? -1 : 1; // -1 = scrolling up, 1 = down

    dbg("goToPanel()", { prev, index, direction });
    animating = true;
    updateHUD();

    // Make sure the incoming is visible and above before animating.
    gsap.set(swipePanels[index], { autoAlpha: 1, zIndex: 1000 });

    const tl = gsap.timeline({
        defaults: { duration: 1.0, ease: "power1.inOut" },
        onComplete: () => {
            // Hide and drop the previous AFTER the transition finishes.
            if (prev >= 0) gsap.set(swipePanels[prev], { autoAlpha: 0, zIndex: 0 });
            // Normalize the new active's z-index so we don't stack endlessly.
            gsap.set(swipePanels[index], { zIndex: 100 });
            animating = false;
            updateHUD();
        }
    });

    if (prev < 0) {
        // FIRST RUN: no outgoing panel. Just bring the first one in.
        // tl.fromTo(swipePanels[index], { yPercent: 100 * d }, { yPercent: 0 });
    } else {
        // NORMAL RUN: move prev out and next in simultaneously.
        tl.to(swipePanels[prev], { yPercent: -100 * d }, 0).fromTo(
            swipePanels[index],
            { yPercent: 100 * d },
            { yPercent: 0 },
            0
        );
    }

    // fade up handling
    // ---- NEW: fade-up handling ----
    // Reset outgoing panel's fades so they're ready if we come back
    if (prev >= 0) {
        const prevFades = swipePanels[prev].querySelectorAll(".section-fade-up");
        if (prevFades.length) {
            gsap.set(prevFades, { y: 50, autoAlpha: 0 }); // no immediate flicker
        }
    }

    // Play incoming panel's fades after it starts sliding in
    const nextFades = swipePanels[index].querySelectorAll(".section-fade-up");
    if (nextFades.length) {
        // Option A: opacity + overlap (direction-aware)
        const fadeOffset = d === -1 ? ">-0.35" : ">-0.25";
        tl.fromTo(
            nextFades,
            { y: 50, autoAlpha: 0, immediateRender: false },
            { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: "power2.out" },
            fadeOffset
        );
    }
    // ---- end fade-up handling ----

    // Update active index immediately after scheduling tweens.
    currentIndex = index;
    updateHUD();
}

observer = Observer.create({
    type: "wheel,touch,pointer",
    wheelSpeed: -1,
    tolerance: 10,
    preventDefault: true,
    onDown: () => {
        console.log("ondown");
        if (currentIndex === 0) {
            updateHUD();
            console.log(`first panel`);
        } else {
            updateHUD();
            // console.log(`NOT first panel, panel: ${currentIndex}`);
            !animating && goToPanel(currentIndex - 1, -1);
            // goToPanel(currentIndex - 1, -1);
        }
    },
    onUp: () => {
        console.log(`onup`);
        if (currentIndex === swipePanels.length - 1) {
            console.log("DISABLE OBSERVER ON LAST PANEL");
            updateHUD();
            // console.log("onup last");
            setTimeout(() => {
                observer.disable();
            }, 1000);
        } else {
            updateHUD();
            !animating && goToPanel(currentIndex + 1, 1);
            // goToPanel(currentIndex + 1, 1);
        }
    }
});

observer.disable();

const tl = gsap.timeline({
    scrollTrigger: {
        trigger: ".observer-section",
        markers: true,
        start: "top top",
        pin: true,
        // scrub: true,

        // end: () => "+=" + Math.max(0, swipePanels.length - 1) * 100 + "%",
        end: () => "+=" + Math.max(0, swipePanels.length - 1) * window.innerHeight,
        //  anticipatePin: 1,
        //  pinSpacing: false,
        // end: 'bottom bottom',
        onEnter: () => {
            console.log("SCROLLTRIGGER ENTER");
            observer.enable();
            // currentIndex = 0;
            updateHUD();
            goToPanel(0, 1);
        },
        onEnterBack: () => {
            // entering from bottom back to top
            console.log("SCROLLTRIGGER ENTERBACK");
            observer.enable();

            // let lastIndex = swipePanels.length - 1;
            // updateHUD();
            // goToPanel(lastIndex, -1);
            // Only “jump” to last when we’re reinitializing
            if (currentIndex < 0) {
                const lastIndex = swipePanels.length - 1;
                // Use direction: 1 so the panel comes in from +100 → 0 (matches initial gsap.set)
                goToPanel(lastIndex, 1);
            }
        },
        onLeave: () => {
            console.log("SCROLLTRIGGER LEAVE");
            observer.disable();
        },
        onLeaveBack: () => {
            // leaving from top back to bottom
            console.log("SCROLLTRIGGER LEAVEBACK");
            currentIndex = -1;
            updateHUD();
            observer.disable();
        }
    }
});

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // try 3 10.30.25
// // issues
// // nav zindex issue
// // scrollbar not showing full height issue
// // text sections
// // what abt panels that are taller/shorter than viewport?
// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // use observer in text reveal anis?

// // need direction
// // need observer
// // need currentIndex

// // ---- DEBUG SETUP (paste near the top) ----
// const DEBUG = true;
// const dbg = (...args) => DEBUG && console.log("[DBG]", ...args);
// let observer;
// // little on-screen HUD
// let hud;
// let outerIndex;
// if (DEBUG) {
//     hud = document.createElement("div");
//     hud.style.cssText = `
//     position:fixed; right:8px; top:8px; z-index:99999;
//     font:12px/1.3 monospace; background:rgba(0,0,0,.7); color:#0f0;
//     padding:6px 8px; border-radius:6px; pointer-events:none; white-space:pre;
//   `;
//     document.body.appendChild(hud);
// }
// const updateHUD = () => {
//     if (!DEBUG || !hud) return;
//     hud.textContent =
//         `allowScroll: ${allowScroll}\n` +
//         // `sectionIndices: ${JSON.stringify(sectionIndices)}\n` +
//         `enabled: ${observer.isEnabled}\n` +
//         `currentIndex: ${currentIndex}\n` +
//         `animating: ${animating}\n` +
//         `outerIndex: ${outerIndex}\n` +
//         `scrollY: ${Math.round(window.scrollY)}`;
// };

// // ------------------------------------------

// let allowScroll = true;
// const scrollTimeout = gsap.delayedCall(1, () => (allowScroll = true)).pause();
// let currentIndex = -1;
// let animating;
// let direction;

// let swipePanels = gsap.utils.toArray(
//     ".observer-section .section-banner, .observer-section .n_section-header, .observer-section .section-split"
// );
// console.log(swipePanels);
// let wrap = gsap.utils.wrap(0, swipePanels.length);
// // gsap.set(swipePanels, { zIndex: (j) => swipePanels.length - j });
// gsap.set(swipePanels, {
//     yPercent: (i) => (i === 0 ? 0 : 100),
//     // zIndex: (j) => swipePanels.length - j
// });
// function goToPanel(index, direction) {
//     // currentIndex = from | index = to
//     index = wrap(index);
//     // direction = direction || (index > currentIndex ? 1 : -1);
//     outerIndex = index; //for syncing index with outer scope
//     console.log("-----------------");
//     let dFactor = direction === -1 ? -1 : 1;
//     console.log(
//         `goToPanel: CURRENT INDEX: ${currentIndex} | index=${index} |  direction=${direction} | dfactor=${
//             direction === -1 ? -1 : 1
//         } | fromTop=${direction === -1}`
//     );
//     animating = true;
//     updateHUD();

//     // const tl = gsap.timeline({
//     //     scrollTrigger: {
//     //         trigger: ".observer-section",
//     //         markers: true,
//     //         start: "top top",
//     //         pin: true,
//     //         scrub: true,
//     //         // pinSpacing: false,
//     //         end: () => `+=${swipePanels.length * 100}%`
//     //     }
//     // });

//     console.log(`direction: ${direction}`);

//     const tl = gsap.timeline({
//         defaults: {
//             duration: 1.25,
//             ease: 'power1.inOut'
//         },
//         onComplete: () => {
//             animating = false;
//             updateHUD();
//         }
//     });
//     console.log(`swipePanels[currentIndex]`);
//     console.log(swipePanels[currentIndex]);
//     console.log(`swipePanels[index]`);
//     console.log(swipePanels[index]);

//     if (currentIndex >= 0) {
//         console.log("NOT first time");
//         console.log(100 * dFactor);
//         gsap.set(swipePanels[currentIndex], {
//             zIndex: 0
//         });
//         tl.to(swipePanels[currentIndex], {
//             yPercent: -100 * dFactor,
//             background: 'blue'
//         }).set(swipePanels[currentIndex], {
//             autoAlpha: 0
//         });

//         // gsap.set(swipePanels[index], {
//         //     yPercent: 100 * dFactor,
//         //     autoAlpha: 1,
//         //     background: 'red'
//         // });
//         // tl.to(swipePanels[index + 1], { yPercent: 0, duration: 1, ease: "power4.inOut" });
//         updateHUD();
//     }

//     gsap.set(swipePanels[index], {
//         autoAlpha: 1,
//         zIndex: 1
//     });
//     if (currentIndex >= 0) {
//         tl.to(
//             swipePanels[currentIndex],
//             {
//                 yPercent: 0,
//                 duration: 1,
//                 ease: "power4.inOut"
//             }
//         )
//         .fromTo(
//             swipePanels[index],
//             { yPercent: 100 * dFactor, autoAlpha: 1 },
//             { yPercent: 0, duration: 1, ease: "power4.inOut" },
//             0
//         );
//     }

//     currentIndex = index;
//     console.log("AFTER SET currentIndex = index");
//     console.log(`currentIndex: ${currentIndex} | index: ${index}`);
//     updateHUD();

//     // dbg("goToPanel()", {
//     //     from: currentIndex,
//     //     to: index,
//     //     direction,
//     //     allowScroll,
//     //     animating
//     // });
// }

// observer = Observer.create({
//     type: "wheel,touch,pointer",
//     wheelSpeed: -1,
//     tolerance: 10,
//     preventDefault: true,
//     onDown: () => {
//         console.log("ondown");
//         if (currentIndex === 0) {
//             updateHUD();
//             console.log(`first panel`);
//         } else {
//             updateHUD();
//             // console.log(`NOT first panel, panel: ${currentIndex}`);
//             !animating && goToPanel(currentIndex - 1, -1);
//             // goToPanel(currentIndex - 1, -1);
//         }
//     },
//     onUp: () => {
//         console.log(`onup`);
//         if (currentIndex === swipePanels.length - 1) {
//             updateHUD();
//             // console.log("onup last");
//             setTimeout(() => {
//                 observer.disable();
//             }, 1000);
//         } else {
//             updateHUD();
//             !animating && goToPanel(currentIndex + 1, 1);
//             // goToPanel(currentIndex + 1, 1);
//         }
//     }
// });

// observer.disable();

// const tl = gsap.timeline({
//     scrollTrigger: {
//         trigger: ".observer-section",
//         markers: true,
//         start: "top top",
//         pin: true,
//         // scrub: true,
//         // end: () => `+=${swipePanels.length * 100}%`,
//         end: () => `+=${Math.max(1, swipePanels.length) * 100}%`,
//         //  anticipatePin: 1,
//         //  pinSpacing: false,
//         // end: 'bottom bottom',
//         onEnter: () => {
//             console.log("SCROLLTRIGGER ENTER");
//             observer.enable();
//             // currentIndex = 0;
//             updateHUD();
//             goToPanel(0, 1);
//         },
//         onEnterBack: () => {
//             // entering from bottom back to top
//             console.log("SCROLLTRIGGER ENTERBACK");
//             observer.enable();

//             let lastIndex = swipePanels.length - 1;
//             updateHUD();
//             goToPanel(lastIndex, -1);
//         },
//         onLeave: () => {
//             console.log("SCROLLTRIGGER LEAVE");
//             observer.disable();
//         },
//         onLeaveBack: () => {
//             // leaving from top back to bottom
//             console.log("SCROLLTRIGGER LEAVEBACK");
//             currentIndex = -1;
//             updateHUD();
//             observer.disable();
//         }
//     }
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// try 2
// issues
// nav zindex issue
// scrollbar not showing full height issue
// text sections
// what abt panels that are taller/shorter than viewport?
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// use observer in text reveal anis?

// need direction
// need observer
// need currentIndex

// ---- DEBUG SETUP (paste near the top) ----
// const DEBUG = true;
// const dbg = (...args) => DEBUG && console.log("[DBG]", ...args);
// let observer;
// // little on-screen HUD
// let hud;
// let outerIndex;
// if (DEBUG) {
//     hud = document.createElement("div");
//     hud.style.cssText = `
//     position:fixed; right:8px; top:8px; z-index:99999;
//     font:12px/1.3 monospace; background:rgba(0,0,0,.7); color:#0f0;
//     padding:6px 8px; border-radius:6px; pointer-events:none; white-space:pre;
//   `;
//     document.body.appendChild(hud);
// }
// const updateHUD = () => {
//     if (!DEBUG || !hud) return;
//     hud.textContent =
//         `allowScroll: ${allowScroll}\n` +
//         // `sectionIndices: ${JSON.stringify(sectionIndices)}\n` +
//         `enabled: ${observer.isEnabled}\n` +
//         `currentIndex: ${currentIndex}\n` +
//         `animating: ${animating}\n` +
//         `outerIndex: ${outerIndex}\n` +
//         `scrollY: ${Math.round(window.scrollY)}`;
// };

// // ------------------------------------------

// let allowScroll = true;
// const scrollTimeout = gsap.delayedCall(1, () => (allowScroll = true)).pause();
// let currentIndex = -1;
// let animating;

// let swipePanels = gsap.utils.toArray(
//     ".observer-section .section-banner, .observer-section .n_section-header, .observer-section .section-split"
// );
// // console.log(swipePanels);
// let wrap = gsap.utils.wrap(0, swipePanels.length);
// gsap.set(swipePanels, { zIndex: (j) => swipePanels.length - j });
// function goToPanel(index, direction) {
//     // currentIndex = from | index = to
//     index = wrap(index);
//     outerIndex = index; //for syncing index with outer scope
//     console.log("-----------------");
//     let dFactor = direction === -1 ? -1 : 1;
//     console.log(
//         `goToPanel: index=${index}, CURRENT INDEX: ${currentIndex} |  direction=${direction} | dfactor=${
//             direction === -1 ? -1 : 1
//         } | fromTop=${direction === -1}`
//     );
//     animating = true;
//     updateHUD();

//     // const tl = gsap.timeline({
//     //     scrollTrigger: {
//     //         trigger: ".observer-section",
//     //         markers: true,
//     //         start: "top top",
//     //         pin: true,
//     //         scrub: true,
//     //         // pinSpacing: false,
//     //         end: () => `+=${swipePanels.length * 100}%`
//     //     }
//     // });

//     console.log(`direction: ${direction}`);

//     const tl = gsap.timeline({
//         onComplete: () => {
//             animating = false;
//             updateHUD();
//         }
//     });
//     console.log(`swipePanels[currentIndex]`);
//     console.log(swipePanels[currentIndex]);
//     console.log(`swipePanels[index] + 1`);
//     console.log(swipePanels[index + 1]);

//     if (currentIndex < 0) {
//         console.log('first time setup');
//         console.log(100 * dFactor);
//         gsap.set(swipePanels[index], {
//             yPercent: 100 * dFactor,
//             autoAlpha: 1,
//             background: 'red'
//         });
//         tl.to(swipePanels[index + 1], { yPercent: 0, duration: 1, ease: "power4.inOut" });
//         updateHUD();
//     } else {
//         tl.to(swipePanels[currentIndex], {
//             yPercent: -100 * dFactor,
//             duration: 1,
//             ease: "power4.inOut"
//         }, 0)
//         .fromTo(swipePanels[index], { yPercent: 100 * dFactor, autoAlpha: 1 }, { yPercent: 0, duration: 1, ease: "power4.inOut" }, 0);
//     }

//     // swipePanels.forEach((panel, i) => {
//     //     // console.log(`panel`)
//     //     // console.log(panel)

//     //     const prev = swipePanels[i - 1];

//     //     console.log(prev);

//     //     if (!prev) {
//     //         return;
//     //     }
//     //     tl.fromTo(
//     //         panel,
//     //         { yPercent: 100 },
//     //         { yPercent: 0, duration: 1, ease: "power4.inOut" },

//     //     );

//     // });

//     currentIndex = index;

//     dbg("goToPanel()", {
//         from: currentIndex,
//         to: index,
//         direction,
//         allowScroll,
//         animating
//     });
// }

// // goToPanel(0);

// observer = Observer.create({
//     type: "wheel,touch,pointer",
//     wheelSpeed: 1,
//     tolerance: 10,
//     preventDefault: true,
//     onDown: () => {
//         console.log("ondown");
//         if (currentIndex === 0) {
//             updateHUD();
//             console.log(`first panel`);
//         } else {
//             updateHUD();
//             // console.log(`NOT first panel, panel: ${currentIndex}`);
//             !animating && goToPanel(currentIndex - 1, -1);
//             // goToPanel(currentIndex - 1, -1);
//         }
//     },
//     onUp: () => {
//         console.log(`onup`);
//         if (currentIndex === swipePanels.length - 1) {
//             updateHUD();
//             // console.log("onup last");
//             setTimeout(() => {
//                 observer.disable();
//             }, 1000);
//         } else {
//             updateHUD();
//             !animating && goToPanel(currentIndex + 1, 1);
//             // goToPanel(currentIndex + 1, 1);
//         }
//     }
// });

// observer.disable();

// const tl = gsap.timeline({
//     scrollTrigger: {
//         trigger: ".observer-section",
//         markers: true,
//         start: "top top",
//         pin: true,
//         // scrub: true,
//         // end: () => `+=${swipePanels.length * 100}%`,
//         end: () => `+=${Math.max(1, swipePanels.length) * 100}%`,
//         //  anticipatePin: 1,
//         //  pinSpacing: false,
//         // end: 'bottom bottom',
//         onEnter: () => {
//             console.log("SCROLLTRIGGER ENTER");
//             observer.enable();
//             // currentIndex = 0;
//             updateHUD();
//             goToPanel(0, 1);
//         },
//         onEnterBack: () => {
//             // entering from bottom back to top
//             console.log("SCROLLTRIGGER ENTERBACK");
//             observer.enable();

//             let lastIndex = swipePanels.length - 1;
//             updateHUD();
//             goToPanel(lastIndex, -1);
//         },
//         onLeave: () => {
//             console.log("SCROLLTRIGGER LEAVE");
//             observer.disable();
//         },
//         onLeaveBack: () => {
//             // leaving from top back to bottom
//             console.log("SCROLLTRIGGER LEAVEBACK");
//             currentIndex = -1;
//             updateHUD();
//             observer.disable();
//         }
//     }
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// try 1 basic working but not observed
// issues
// nav zindex issue
// scrollbar not showing full height issue
// text sections
// what abt panels that are taller/shorter than viewport?
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// use observer in text reveal anis?

// need direction
// need observer
// need currentIndex

// ---- DEBUG SETUP (paste near the top) ----
// const DEBUG = true;
// const dbg = (...args) => DEBUG && console.log("[DBG]", ...args);
// let observer;
// // little on-screen HUD
// let hud;
// if (DEBUG) {
//     hud = document.createElement("div");
//     hud.style.cssText = `
//     position:fixed; right:8px; top:8px; z-index:99999;
//     font:12px/1.3 monospace; background:rgba(0,0,0,.7); color:#0f0;
//     padding:6px 8px; border-radius:6px; pointer-events:none; white-space:pre;
//   `;
//     document.body.appendChild(hud);
// }
// const updateHUD = () => {
//     if (!DEBUG || !hud) return;
//     hud.textContent =
//         `allowScroll: ${allowScroll}\n` +
//         `sectionIndices: ${JSON.stringify(sectionIndices)}\n` +
//         `enabled: ${observer.isEnabled}\n` +
//         `currentIndex: ${currentIndex}\n` +
//         `scrollY: ${Math.round(window.scrollY)}`;
// };

// // ------------------------------------------

// let allowScroll = true;
// const scrollTimeout = gsap.delayedCall(1, () => (allowScroll = true)).pause();
// let currentSection = 0;
// let currentIndex = -1;
// const sectionIndices = [0, 0]; // an array that stores the current “panel index” for each section on the page
// const sectionsPanels = [];
// const sectionsLimits = [];
// let animating;

// let swipePanels = gsap.utils.toArray(
//     ".observer-section .section-banner, .observer-section .n_section-header, .observer-section .section-split"
// );
// console.log(swipePanels);
// let wrap = gsap.utils.wrap(0, swipePanels.length);

// // set z-index levels for the swipe panels
// // gsap.set(swipePanels, {
// //     zIndex: (i) => i
// // });

// // for every panel except the first one, set its yPercent to 100 (offscreen below)
// // gsap.set(swipePanels, { autoAlpha: 0 });
// // gsap.set(swipePanels, { yPercent: (i) => (i === 0 ? 0 : 100) });

// // function goToPanel(index, direction) {
// //     // currentIndex = from | index = to
// //     index = wrap(index);
// //     console.log("-----------------");
// //     console.log(
// //         `goToPanel(): index=${index}, CURRENT INDEX: ${currentIndex} |  direction=${direction} | dfactor=${direction === -1 ? -1 : 1} | fromTop=${direction === -1}`
// //     );
// //     animating = true;

// //     // direction = 1 for down, -1 for up
// //     let fromTop = direction === -1; // true if scrolling up, false if down
// //     let dFactor = fromTop ? -1 : 1; // direction factor for yPercent calculations

// //     let tl = gsap.timeline({
// //         defaults: { duration: 1.25, ease: "power1.inOut" },
// //         onComplete: () => { animating = false;
// //             updateHUD();
// //             console.log('ANIMATION COMPLETE');
// //         }

// //     });

// //     // // if scrolling down and not the first panel, set zIndex of current panel to 0
// //     if (currentIndex > 0) {
// //         console.log('NOT FIRST PANEL')
// //         updateHUD()
// //         gsap.set(swipePanels[index], {
// //             zIndex: 0,

// //             // yPercent: -15 * dFactor
// //         });
// //         tl.to(swipePanels[index], {
// //             border: "4px solid red"
// //         });
// //     }

// //     gsap.set(swipePanels[index], { autoAlpha: 1, zIndex: 1 });
// //     // gsap.set(swipePanels[index], { zIndex: 999 });

// //     if (currentIndex >= 0) {
// //         updateHUD()
// //         console.log(`moving yPercent = ${-100 * dFactor} for panel index ${currentIndex}`);
// //         tl.fromTo(
// //             swipePanels[currentIndex],
// //             {
// //                 yPercent: (i) => (i ? -100 * dFactor : 100 * dFactor)
// //             },
// //             {
// //                 yPercent: 0
// //             }
// //         );
// //     }

// //     // tl.fromTo(swipePanels[index], { yPercent: 100 * dFactor }, { yPercent: 0 }, 0);

// //     currentIndex = index;

// //     dbg("goToPanel()", {
// //         currentSection,
// //         from: sectionIndices[currentSection],
// //         to: index,
// //         direction,
// //         allowScroll,
// //         animating
// //     });
// // }

// function goToPanel(index, direction) {
//     // currentIndex = from | index = to
//     index = wrap(index);
//     console.log("-----------------");
//     console.log(
//         `goToPanel(): index=${index}, CURRENT INDEX: ${currentIndex} |  direction=${direction} | dfactor=${
//             direction === -1 ? -1 : 1
//         } | fromTop=${direction === -1}`
//     );
//     animating = true;

//     const tl = gsap.timeline({
//         scrollTrigger: {
//             trigger: ".observer-section",
//             markers: true,
//             start: "top top",
//             pin: true,
//             scrub: true,
//             // pinSpacing: false,
//             end: () => `+=${swipePanels.length * 100}%`
//         }
//     });

//     swipePanels.forEach((panel, i) => {
//         console.log(`panel`)
//         console.log(panel)
//         // if (i === 0) {
//         //     return;
//         // }

//         console.log(`panel`)
//         console.log(panel)

//         const prev = swipePanels[i - 1];
//         const prevImg = swipePanels[i - 1];
//         const curImg = swipePanels[i];

//         console.log(prev);

//         if (!prev) {
//             return;
//         }
//         tl.fromTo(
//             panel,
//             { yPercent: 100 },
//             { yPercent: 0, duration: 1, ease: "power4.inOut" },

//         );

//     });

//     currentIndex = index;

//     dbg("goToPanel()", {
//         currentSection,
//         from: sectionIndices[currentSection],
//         to: index,
//         direction,
//         allowScroll,
//         animating
//     });
// }

// goToPanel(0);

// observer = Observer.create({
//     type: "wheel,touch,pointer",
//     wheelSpeed: 1,
//     tolerance: 10,
//     preventDefault: true,
//     onDown: () => {
//         console.log("ondown");
//         if (currentIndex === 0) {
//             console.log(`first panel`);
//         } else {
//             // console.log(`NOT first panel, panel: ${currentIndex}`);
//             !animating && goToPanel(currentIndex - 1, -1);
//         }
//     },
//     onUp: () => {
//         console.log(`onup`);
//         if (currentIndex === swipePanels.length - 1) {
//             // console.log("onup last");
//             setTimeout(() => {
//                 observer.disable();
//             }, 1000);
//         } else {
//             !animating && goToPanel(currentIndex + 1, 1);
//         }
//     }
// });

// observer.disable();

// const tl = gsap.timeline({
//     scrollTrigger: {
//         trigger: ".observer-section",
//         markers: true,
//         start: "top top",
//         pin: true,
//         scrub: true,
//         end: () => `+=${swipePanels.length * 100}%`
//         // end: 'bottom bottom',
//         // onEnter: () => {
//         //     console.log("enter");
//         //     observer.enable();
//         //     // currentIndex = 0;
//         //     updateHUD()
//         //     goToPanel(0, 1);
//         // },
//         // onEnterBack: () => {
//         //     // entering from bottom back to top
//         //     console.log("enterback");
//         //     observer.enable();

//         //     let lastIndex = swipePanels.length - 1;
//         //     updateHUD()
//         //     goToPanel(3, -1);
//         // },
//         // onLeave: () => {
//         //     console.log("leave");
//         //     observer.disable();
//         // },
//         // onLeaveBack: () => {
//         //     // leaving from top back to bottom
//         //     console.log("leaveback");
//         //     observer.disable();
//         // }
//     }
// });
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const panelSections = gsap.utils.toArray("section");
// const panelSections = gsap.utils.toArray(".observer-section");

// try 0 Left off here. its not working. added scrolltimeout back in but still jacked
// issues
// nav zindex issue
// scrollbar not showing full height issue
// text sections
// what abt panels that are taller/shorter than viewport?

// use observer in text reveal anis?

// need direction
// need observer
// need currentIndex

// ---- DEBUG SETUP (paste near the top) ----
// const DEBUG = true;
// const dbg = (...args) => DEBUG && console.log("[DBG]", ...args);

// // little on-screen HUD
// let hud;
// if (DEBUG) {
//     hud = document.createElement("div");
//     hud.style.cssText = `
//     position:fixed; right:8px; top:8px; z-index:99999;
//     font:12px/1.3 monospace; background:rgba(0,0,0,.7); color:#0f0;
//     padding:6px 8px; border-radius:6px; pointer-events:none; white-space:pre;
//   `;
//     document.body.appendChild(hud);
// }
// const updateHUD = () => {
//     if (!DEBUG || !hud) return;
//     hud.textContent =
//         `allowScroll: ${allowScroll}\n` +
//         `currentSection: ${currentSection}\n` +
//         `sectionIndices: ${JSON.stringify(sectionIndices)}\n` +
//         `enabled: ${intentObserver.isEnabled}\n` +
//         `scrollY: ${Math.round(window.scrollY)}`;
// };
// // ------------------------------------------

// let allowScroll = true;
// const scrollTimeout = gsap.delayedCall(1, () => (allowScroll = true)).pause();
// let currentSection = 0;
// const sectionIndices = [0, 0]; // an array that stores the current “panel index” for each section on the page
// const sectionsPanels = [];
// const sectionsLimits = [];
// let animating;

// // const panelSections = gsap.utils.toArray("section");
// const panelSections = gsap.utils.toArray(".observer-section");
// function goToPanel(index, isScrollingDown) {
//   const limit = sectionsLimits[currentSection];
//   const last = limit - 1;

//   dbg("goToPanel()", {
//     currentSection,
//     from: sectionIndices[currentSection],
//     to: index,
//     last,
//     isScrollingDown,
//     allowScroll
//   });

//   // --- Boundary handling ---
//   if (!isScrollingDown && index < 0) {
//     dbg("LEAVING SECTION UP: disable observer & resume native scroll");
//     intentObserver.disable();
//     allowScroll = true;
//     updateHUD();
//     return;
//   }

//   if (isScrollingDown && index > last) {
//     dbg("LEAVING SECTION DOWN: disable observer & resume native scroll");
//     intentObserver.disable();
//     allowScroll = true;
//     updateHUD();
//     return;
//   }

//   // --- Cooldown gate ---
//   if (!allowScroll) {
//     dbg("BLOCKED: allowScroll=false (cooldown active)");
//     updateHUD();
//     return;
//   }

//   allowScroll = false;
//   scrollTimeout.restart(true); // reset 0.6–1s cooldown
//   updateHUD();

//   // --- Determine panel to animate ---
//   const fromIndex = sectionIndices[currentSection];
//   const target = isScrollingDown
//     ? sectionsPanels[currentSection][fromIndex]   // slide current out
//     : sectionsPanels[currentSection][index];      // bring previous back

//   dbg("Animating", {
//     target,
//     yPercent: isScrollingDown ? -100 : 0,
//     index
//   });

//   // --- Animate panel ---
//   gsap.killTweensOf(target);
//   gsap.to(target, {
//     yPercent: isScrollingDown ? -100 : 0,
//     duration: 0.75,
//     onStart: () => {
//       dbg("tween start");
//       updateHUD();
//     },
//     onComplete: () => {
//       dbg("tween complete -> unlock");
//       allowScroll = true;
//       updateHUD();
//     }
//   });

//   // --- Store new index ---
//   sectionIndices[currentSection] = index;
//   dbg("Set sectionIndices[currentSection] =", index);
//   updateHUD();
// }

// const intentObserver = ScrollTrigger.observe({
//     type: "wheel,touch,pointer",
//     tolerance: 10,
//     preventDefault: true,
//     onUp: () => allowScroll && goToPanel(sectionIndices[currentSection] - 1, false),
//     onDown: () => allowScroll && goToPanel(sectionIndices[currentSection] + 1, true),
//     onEnable(self) {
//         const savedScroll = self.scrollY();
//         self._restoreScroll = () => self.scrollY(savedScroll);
//         document.addEventListener("scroll", self._restoreScroll, { passive: false });

//         allowScroll = false; // match the original demo behavior
//         scrollTimeout.restart(true); // <-- small initial cooldown on entry
//     },
//     onDisable(self) {
//         document.removeEventListener("scroll", self._restoreScroll);
//         allowScroll = true;
//     },
//     ignore: ".section--intro"
// });

// intentObserver.disable();

// const sectionTriggers = [];

// panelSections.forEach((section, i) => {
//     const panels = gsap.utils.toArray(
//         ".section-banner, .n_section-header, .section-split",
//         section
//     );
//     if (panels.length <= 0) return;

//     sectionsPanels[i] = panels; // panels in this section
//     sectionsLimits[i] = panels.length; // number of panels in this section

//     // console.log(`sectionsPanels[i]`);
//     // console.log(sectionsPanels[i]);
//     // console.log(`sectionsLimits[i]`);
//     // console.log(sectionsLimits[i]);

//     console.log(`panels`);
//     console.log(panels);

//     gsap.set(panels, { zIndex: (j) => panels.length - j }); // This tells GSAP to assign each panel a zIndex value based on its position in the array.

//     const st = ScrollTrigger.create({
//         trigger: section,
//         start: "top top",
//         end: "+=200",
//         pin: true,
//         markers: true,
//         onEnter: (self) => {
//             if (intentObserver.isEnabled) {
//                 return;
//             } // in case the native scroll jumped past the end and then we force it back to where it should be.
//             self.scroll(self.start + 1); // jump to just one pixel past the start of this section so we can hold there.
//             intentObserver.enable(); // STOP native scrolling
//             currentSection = i;
//         },
//         onEnterBack: (self) => {
//             if (intentObserver.isEnabled) {
//                 return;
//             } // in case the native scroll jumped backward past the start and then we force it back to where it should be.
//             self.scroll(self.end - 1); // jump to one pixel before the end of this section so we can hold there.
//             intentObserver.enable(); // STOP native scrolling
//             currentSection = i;
//         },
//         // onLeave() {
//         //     // leaving downward
//         //     if (intentObserver.isEnabled) intentObserver.disable();
//         //     console.log(`currentSection after leave: ${currentSection}`);
//         // },
//         // onLeaveBack() {
//         //     // leaving upward
//         //     if (intentObserver.isEnabled) intentObserver.disable();
//         // }
//     });
//     sectionTriggers[i] = st;
// });

// console.log(panelSections);

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
        }
    });
    dotAnimation.to(".dot-wrapper", {
        // clipPath: "circle(120% at center)",
        clipPath: "circle(120% at 50% 100%)",
        duration: 1,
        ease: "power2.out"
    });
}

dotAnimate();

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
document.querySelectorAll(".n_scroll-accordion").forEach(scrollAccordion);

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

function setupBigSlider(wrapper) {
    // 1) Each “panel” is the .n_big-slide element
    const panels = gsap.utils.toArray(wrapper.querySelectorAll(".n_big-slide"));
    const total = panels.length;

    // 2) Inside each panel we’ll animate both the <img> and the panel
    const imgs = panels.map((p) => p.querySelector(".n_big-slide_img"));

    // 4) Build a scrubbed, pinned timeline: one viewport per slide
    const tl = gsap.timeline({
        scrollTrigger: {
            trigger: wrapper,
            pin: true,
            scrub: 1,
            // markers: true,
            start: "top top",
            end: `+=${(total - 1) * window.innerHeight}`,
            snap: 1 / (total - 1)
        }
    });

    // 5) Sequence: slide out the old panel/image, bring in the new
    panels.forEach((panel, i) => {
        if (i === 0) return; // skip first panel

        const prev = panels[i - 1],
            prevImg = imgs[i - 1],
            curImg = imgs[i];

        // 1) slide the old container out to the left
        tl.to(prev, {
            xPercent: -100,
            duration: 1,
            ease: "power4.inOut"
        });

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
        // 3) pull the new container in from the right
        tl.fromTo(
            panel,
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
}

function initBigSliderAnimations() {
    gsap.utils.toArray(".n_big-slider_wrapper").forEach(setupBigSlider);
}

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

// initScrollingSlider();

// n_section-header
// ADD THIS BACK
// og
// gsap.utils.toArray(".section-fade-up").forEach((section) => {
//     // console.log(section)
//     let parentBanner = section.closest(".section-banner");
//     let hasParentBanner = parentBanner ? true : false;
//     console.log(`hasParentBanner: ${hasParentBanner}`);
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
//                 toggleActions: toggleAct,
//                 markers: true,
//                 // scrub: true
//             }
//         }
//     );
// });

const sectionHeaders = document.querySelectorAll(".n_section-header");
// console.log(`sectionHeaders`)
// console.log(sectionHeaders)

// ADD THIS BACK
sectionHeaders.forEach((section, i) => {
    let header = section.querySelector(".n_section-header__title");
    let number = section.querySelector(".n_section-header__number");

    gsap.set(header, {
        color: "#E10600"
    });
    gsap.set([header, number], {
        opacity: 0,
        yPercent: 30
    });

    let tl = gsap.timeline({
        scrollTrigger: {
            trigger: section,
            start: "top 40%",
            end: "bottom center",
            toggleActions: "play none none reset"
        }
    });

    tl.to([header, number], {
        opacity: 1,
        yPercent: 0,
        duration: 0.75,
        ease: "power4.out",
        stagger: 0.12
    });
    tl.to(
        header,
        {
            color: "#FFFFFF"
        },
        "<"
    );

    let markerTl = gsap.timeline({
        scrollTrigger: {
            trigger: header,
            start: "top top",
            end: "bottom top",
            // scrub: 1,
            // markers: true,
            toggleActions: "play none none reset"
        }
    });
    // markerTl.to()
});

initTextRevealSections();
// initFanSansLottie();
// initColorPanels();
// initStackedSliders();
// initBigSliderAnimations();
// // initStoryLottie()
// initScrollingSlider()

setTimeout(() => {
    ScrollTrigger.sort();

    ScrollTrigger.refresh();
}, 600);
// ScrollTrigger.normalizeScroll(true);
// https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/6843520aa1e4f9f54b166004_2025_06_06_EASCI_Fanatics_ColorCascade_01.json
Promise.resolve(document.fonts?.ready).finally(() =>
    requestAnimationFrame(() => ScrollTrigger.refresh())
);
