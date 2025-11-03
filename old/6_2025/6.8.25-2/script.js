console.log('loaded phase updated2!!');

gsap.registerPlugin(ScrollTrigger, TextPlugin, SplitText, DrawSVGPlugin, ScrollSmoother,
  GSDevTools, Flip);

const lenis = new Lenis({
  duration: 2, // Adjust smooth scrolling speed
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing function
  smooth: true,
  wheelMultiplier: 0.7,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

// Tell ScrollTrigger to update when Lenis scrolls
lenis.on("scroll", () => ScrollTrigger.update());

// Display the body 
document.querySelector('body').style.display = "block";

// Fade in the body after scripts load
gsap.fromTo('body', { opacity: 0 }, { opacity: 1, duration: 0.5 });

// nav
// will assume page sections have id="fans" data-section-number="1" data-section-title="Brand Identity"

// 1. Build out nav sections in button from page sections:
const toggleSectionInfo = document.querySelector('.n_nav__sections');
const sections = document.querySelectorAll('section[data-section-number][data-section-title]');

const navLinks = document.querySelectorAll('.n_nav-menu__link');
navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const targetID = link.getAttribute('href');
    const targetElem = document.querySelector(targetID);
    if (!targetElem) return;
    gsap.to('body', {
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
            gsap.to('body', { opacity: 1, duration: 0.3 });
          }
        });
      }
    });
  })
})

sections.forEach((section, i) => setToggleSectionInfo(section, i));

function setToggleSectionInfo(section, index) {
  const rawNumber = section.getAttribute('data-section-number') || '';
  const title = section.getAttribute('data-section-title') || '';
  const container = document.createElement('div');
  container.className = 'n_nav__section';
  const titleWrapper = document.createElement('div');
  titleWrapper.className = 'n_nav__section-title';
  const numSpan = document.createElement('span');
  numSpan.className = 'navbar_section-text__bold';

  // First one: no text
  if (index !== 0) numSpan.textContent = rawNumber.toString().padStart(2, '0') + '\u00A0';
  else numSpan.textContent = '';
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
  const oldGhost = document.querySelector('.n_nav__ghost');
  if (oldGhost) oldGhost.remove();

  // Clone visible nav sections to offscreen ghost
  const realSections = Array.from(document.querySelectorAll('.n_nav__section'));
  const ghostContainer = document.createElement('div');
  ghostContainer.className = 'n_nav__ghost';
  ghostContainer.style.position = 'absolute';
  ghostContainer.style.visibility = 'hidden';
  ghostContainer.style.height = 'auto';
  ghostContainer.style.overflow = 'visible';
  ghostContainer.style.whiteSpace = 'nowrap';
  ghostContainer.style.pointerEvents = 'none';
  ghostContainer.style.top = '0';
  ghostContainer.style.left = '0';
  ghostContainer.style.zIndex = '-9999';
  document.body.appendChild(ghostContainer);

  realSections.forEach((sec, i) => {
    const clone = sec.cloneNode(true);
    clone.style.display = 'block';
    clone.style.visibility = 'visible';
    ghostContainer.appendChild(clone);
  });

  const ghostSections = Array.from(ghostContainer.querySelectorAll('.n_nav__section'));
  sectionHeight = ghostSections[1]?.getBoundingClientRect().height || 0;

  sectionWidths = ghostSections.map((el, i) => {
    if (i === 0) return 0;
    let elTitle = el.querySelector('.n_nav__section-title');
    let width = elTitle ? elTitle.getBoundingClientRect().width : el.getBoundingClientRect()
      .width;

    return width;
  });

  ghostSections.forEach((el, i) => {
    const title = el.innerText.trim();
    // console.log(`Section ${i}: ${sectionWidths[i]}px — "${title}"`);
  });

  document.body.removeChild(ghostContainer);
}

// Initial measure
measureSectionWidths();

// 3. Get the containers for sliding/width
const navSectionsWindow = document.querySelector('.n_nav__sections-window');
const navSectionsInner = document.querySelector('.n_nav__sections');
const sectionElements = Array.from(document.querySelectorAll('section[data-section-number]'));

// 4. Responsive: set height of window to a single slot
function setWindowHeight(i = 0) {
  navSectionsWindow.style.height = sectionHeight + "px";
}

// Set initial height & measure widths on resize
setWindowHeight();
window.addEventListener('resize', () => {
  measureSectionWidths();
  setWindowHeight();
});

// 5. ScrollTrigger for sliding + width (use yPercent for inner)
gsap.utils.toArray(sectionElements).forEach((pageSection, i) => {
  // console.log(pageSection)
  ScrollTrigger.create({
    trigger: pageSection,
    start: "top-=50 top",
    end: 'bottom top',
    onEnter: () => goToSection(i),
    onEnterBack: () => goToSection(i),
    // markers: true,
    refreshPriority: -1,
    onLeaveBack: () => {
      console.log(`on onLeaveBack index ${i}`)
      if (i === 0) {
        goToSection(0); // Revert to icon-only slot when above first section
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

// 6. Animation logic: slide up, set width (icon only is index 0)
function goToSection(i) {
  // Defensive for out-of-range
  if (typeof sectionWidths[i] === "undefined") return;

  // Set width of button
  gsap.to(navSectionsWindow, {
    width: sectionWidths[i] + 'px',
    duration: 0.3,
    ease: 'power4.out'
  });

  // Slide .n_nav__sections vertically (yPercent)
  gsap.to(navSectionsInner, {
    y: -i * sectionHeight + 'px',

    duration: 0.3,
    ease: 'power4.out'
  });
}

// 7. Set initial state on load (icon slot)
navSectionsWindow.style.width = sectionWidths[0] + 'px';
gsap.set(navSectionsInner, { yPercent: 0 });

// navClick
const navToggle = document.querySelector('.n_nav__toggle');
const navMenu = document.querySelector('.n_nav__menu');
const navMenuPrimary = document.querySelector('.n_nav__menu-primary');
const navHeader = document.querySelector('.n_nav__inner');
const navBrand = document.querySelector('.n_nav__brand');
const mainWrapper = document.querySelector('.main-wrapper')

let scrollPosition = 0;

function openNav() {
  lenis.stop();
  document.querySelector('body').classList.add('nav-open');
  navToggle.setAttribute('aria-expanded', 'true');
  let tl = gsap.timeline()
  tl.to(navMenu, { y: 0, autoAlpha: 1, duration: 0.3, ease: "power4.out" })

    .to(navBrand, { opacity: 1, pointerEvents: "auto" }, "<");
  gsap.set(navHeader, {
    backgroundColor: "#e10600"
  })
}

function closeNav() {
  lenis.start();
  // navMenu.removeT

  // window.scrollTo(0, scrollPosition); // Restore scroll!
  navToggle.setAttribute('aria-expanded', 'false');

  let tl = gsap.timeline()
  gsap.set(navHeader, {
    backgroundColor: 'transparent'
  })
  tl.to(navMenu, { y: -50, autoAlpha: 0, duration: 0.1, ease: "power4.in" })
    .to(navBrand, { opacity: 0, pointerEvents: "none" })

  document.querySelector('body').classList.remove('nav-open');

}

function toggleNav(e) {
  e.preventDefault();
  // debugger;
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  if (expanded) {
    closeNav();
  } else {
    openNav();
  }
}

navToggle.addEventListener('click', toggleNav);

function setMenuPrimaryMargin() {
  const navHeaderHeight = navHeader.getBoundingClientRect().height;
  navMenuPrimary.style.marginTop = navHeaderHeight + 'px';
}
setMenuPrimaryMargin();

// helpers
// SplitType text with class '.reveal-line' 
// 1) Helper: split each .reveal-line into .line-item__inner words
function splitTextIntoWords(element, wrapClass = 'text-reveal__word-wrap', wordClass =
  'text-reveal__word') {
  const split = new SplitText(element, {
    type: 'words',
    linesClass: wrapClass
  });

  split.words.forEach(word => {
    const span = document.createElement('span');
    span.classList.add(wordClass);
    span.innerHTML = word.innerHTML;
    word.innerHTML = '';
    word.appendChild(span);
  });
  return element.querySelectorAll(`.${wordClass}`);
}

// animations
// prepare words 
function prepareWords(words) {
  // Each block’s words start “hidden below” and bright red:
  gsap.set(words, {
    yPercent: 100,
    opacity: 0,
    color: "#E10600",
    immediateRender: false,
  });
}
// words in
function animateWordsIn(words, color) {
  const tl = gsap.timeline();
  // 1) Bring words in—slide up + fade in
  tl.to(words, {
    yPercent: 0,
    opacity: 1,
    duration: 1,
    ease: "power4.out",
    stagger: 0.15
  })
  tl.to(words, {
    color,
    duration: 1,
    // if i want red for longer, add more stagger here
    stagger: 0.15
  }, "<")

  return tl;
}

function animateWordsOut(words, delay = 1.2) {
  const tl = gsap.timeline()
  // hold
  tl.to({}, { duration: 1.2 })

  // out (skip on last block)
  tl.to(words, {
    yPercent: 100,
    opacity: 0,
    duration: 0.8,
    ease: "power3.inOut",
    stagger: 0.1
  })

  return tl;
}

function fastSVGAni(fastSVGElement) {
  const paths = fastSVGElement.querySelectorAll("path");
  gsap.set(paths, { fill: "#e10600" });
  gsap.set(fastSVGElement, { opacity: 0, scale: 0.8 });

  const fastTl = gsap.timeline()

  // Animate SVG in
  fastTl.to(fastSVGElement, {
    opacity: 1,
    scale: 1,
    duration: 1,
    ease: "power4.out"
  }, "+=0.5");
  fastTl.to(paths, {
    fill: "black",
    duration: 1,
    ease: "power2.inOut"
  }, "<");

  // Hold on screen a bit
  fastTl.to({}, { duration: 1.0 });

  // Animate out to red & scale down
  fastTl.to(paths, {
    fill: "#e10600",
    duration: 0.5,
    ease: "power2.in"
  });
  fastTl.to(fastSVGElement, {
    opacity: 0,
    scale: 0.8,
    duration: 0.5,
    ease: "power2.in"
  }, "<");

  return fastTl;
}

function createWordTimeline(words, color, block, isLastBlock, isLastHeading) {
  // if (isLastBlock) {
  //   console.log(`is last block`)
  //   console.log(block)
  // }

  const hasLogos = block.classList.contains('n_logo-reveal__block');
  // console.log(hasLogos)
  // const color = block.dataset.endColor || '#ffffff';

  let fastSVGElement = null;
  if (block.getAttribute('data-animate-special') === 'fast-svg') {
    const section = block.closest('.n_text-reveal-section');
    fastSVGElement = section ? section.querySelector('.fast-svg') : null;

  }

  // prepareWords(words);

  const tl = animateWordsIn(words, color)

  // If this heading is NOT the last in its block, we simply stop here:
  if (!isLastHeading) {
    return tl;
  }

  // 2) Fast SVG Animation (if present)
  if (fastSVGElement) {
    tl.add(fastSVGAni(fastSVGElement))
  }

  // 3) if logos
  if (hasLogos) {
    // console.log(`hasLogos`)

    let logoLists = [...block.querySelectorAll('.n_logo-row__logos')];
    let logoTl = gsap.timeline();

    logoLists.forEach((logoList, i) => {
      let parentWidth = logoList.parentElement.offsetWidth;
      let innerWidth = logoList.offsetWidth;
      let maxMove = Math.max(innerWidth - parentWidth, 0);
      let direction = i % 2 === 0 ? 1 : -1; // alternate direction

      gsap.set(logoList, {
        left: direction === 1 ? "100%" : `-${innerWidth}px`,
        opacity: 0
      });

      // logos move horizontally
      logoTl.to(logoList, {
        left: direction === 1 ? `-${maxMove}px` : "0%",
        opacity: 1,
        duration: 3,
        ease: "expo.out"
      }, 0);
    });
    // Insert sub-timeline slightly after text
    tl.add(logoTl, "+=0.5");

    // end logo
    // hold text
    tl.to({}, { duration: 1.2 })
    if (!isLastBlock) {
      // console.log('not last block')
      // console.log(block)
      // console.log(words)

      tl.to(block.querySelector('.n_logo-reveal__inner'), {
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: "power3.inOut"
      }, "+=1")
    }
  } else {

    tl.add(animateWordsOut(words));

  }

  return tl;
}

// 2) Core reveal function (one per section)
function revealText(wrapper) {
  const isPageHeader = wrapper.getAttribute('element') === 'page-header';
  const endColor = wrapper.dataset.endColor || '#ffffff';
  // const blocks = wrapper.querySelectorAll('.n_text-reveal__block');
  const blocks = gsap.utils.toArray(
    wrapper.querySelectorAll('.n_text-reveal__block, .n_logo-reveal__block')
  );

  // 2.2) CREATE MASTER TIMELINE
  const masterTl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      start: 'top top',
      end: () => `+=${blocks.length * 1400}`,
      pin: true,
      scrub: 1,

      toggleActions: 'play reverse play reverse',
    }
  });

  let fansVideo, logoVideo, flagVideo;

  // If this is your “page-header” style, fade out the fans video up front:
  if (isPageHeader) {
    fansVideo = wrapper.querySelector('.n_bg-video--fans');
    logoVideo = wrapper.querySelector('.n_bg-video--logo')
    flagVideo = wrapper.querySelector('.n-bg-video--flag')

    gsap.set([logoVideo], {
      opacity: 0,
      y: 0,
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
        zIndex: '-10',
        pointerEvents: "none"
      })
      masterTl.add(preFade, 0);
      // → this “preFade” sub‐timeline runs immediately (at position 0 of masterTl)
    }
  }

  // 2.3) Loop over every block in this section:
  blocks.forEach((block, i) => {
    // console.log(block)
    // masterTl.to(block, {
    //   border: "2px solid lime"
    // })

    // 2.3.a) Create a small per‐block sub‐timeline (“tl”):

    const tl = gsap.timeline()
    tl.call(() => block.classList.add('active'))
      .set(block, { zIndex: 2 })

    const headings = block.querySelectorAll('.n_text-reveal__heading');

    // CHECK FOR ANTON
    if (block.dataset.animateSpecial === 'anton') {
      // 1) Grab both <h1> elements inside this block:
      const headings = block.querySelectorAll('.n_text-reveal__heading');
      const headingArray = Array.from(headings);
      let antonContainer = block.querySelector('.n_text-reveal__special')
      let wrapper = block.querySelector('.n_text-reveal__headings')

      function setUniformHeights() {
        const maxH = Math.ceil(
          Math.max(...headingArray.map(t => t.getBoundingClientRect().height))
        );
        headingArray.forEach(t => t.style.height = `${maxH}px`);
        wrapper.style.height = `${maxH}px`;
      }
      setUniformHeights();
      window.addEventListener('resize', setUniformHeights);

      // gsap.set(wrapper, {
      //   background: "red"
      // })

      const anim = lottie.loadAnimation({
        container: antonContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/681e136a89a8d5eb0a1fb2ac_antontest.json'
      });

      const words1 = splitTextIntoWords(headings[0]);
      const words2 = splitTextIntoWords(headings[1]);

      prepareWords(words1)
      prepareWords(words2)

      let hasTriggered = false;

      let antonTl = gsap.timeline();

      gsap.set(antonContainer, {
        yPercent: 100,
        opacity: 0
      })

      antonTl.to(antonContainer, {
        yPercent: 0,
        opacity: 1
      })

      antonTl.add(animateWordsIn(words1, "#ffffff"));
      antonTl.add(animateWordsOut(words1));
      antonTl.add(animateWordsIn(words2, "#ffffff"));

      antonTl.add(animateWordsOut(words2));

      antonTl.to(antonContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut",
      })

      masterTl.add(antonTl);

      return;
    }

    if (block.dataset.animateSpecial === 'instrument') {
      const heading = block.querySelector('.n_text-reveal__heading');
      const specialContainer = block.querySelector('.n_text-reveal__special')

      // const anim = lottie.loadAnimation({
      //   container: specialContainer,
      //   renderer: 'svg',
      //   loop: true,
      //   autoplay: true,
      //   // path: 'https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/684209ffb4d9ca145c1e8747_instrument.json'
      //   path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/684209ffb4d9ca145c1e8747_instrument.json"
      // });

      // inst
      // https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/684209ffb4d9ca145c1e8747_instrument.json
      //inter 
      //https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/682c834314f9cd1015f54fb9_02_03_Type_Inter_04_V1.lottie

      const words = splitTextIntoWords(heading)
      prepareWords(words)

      let instTl = gsap.timeline();

      gsap.set(specialContainer, {
        yPercent: 100,
        opacity: 0
      })

      instTl.to(specialContainer, {
        yPercent: 0,
        opacity: 1,
      })

      instTl.add(animateWordsIn(words, "#ffffff"));

      instTl.add(animateWordsOut(words));

      instTl.to(specialContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut",
      })
      instTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
      });

      masterTl.add(instTl);

      return;

    }

    if (block.dataset.animateSpecial === 'inter') {
      const heading = block.querySelector('.n_text-reveal__heading');
      const specialContainer = block.querySelector('.n_text-reveal__special')
      // inter https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/6842ed593e9f473841048177_inter.json
      // const anim = lottie.loadAnimation({
      //   container: specialContainer,
      //   renderer: 'svg',
      //   loop: true,
      //   autoplay: true,
      //   // path: 'https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/684209ffb4d9ca145c1e8747_instrument.json'
      //   path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/6842ed593e9f473841048177_inter.json"
      // });

      const words = splitTextIntoWords(heading)
      prepareWords(words)

      let instTl = gsap.timeline();

      gsap.set(specialContainer, {
        yPercent: 100,
        opacity: 0
      })

      instTl.to(specialContainer, {
        yPercent: 0,
        opacity: 1,
      })

      instTl.add(animateWordsIn(words, "#ffffff"));

      instTl.add(animateWordsOut(words));

      instTl.to(specialContainer, {
        yPercent: 100,
        opacity: 0,
        duration: 0.8,
        ease: "power3.inOut",
      })

      instTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
      });

      masterTl.add(instTl);

      return;

    }

    if (block.dataset.animateSpecial === 'bk-switch--white') {

      const heading = block.querySelector('.n_text-reveal__heading');

      const words = splitTextIntoWords(heading)
      prepareWords(words)

      let instTl = gsap.timeline();

      instTl.to(
        block.closest('.n_text-reveal-section'), {
          background: "white",
          duration: 1
        }, // zero-duration set immediately
        0 // position: at the very start of this block’s mini-timeline
      );

      instTl.add(animateWordsIn(words, "#000000"));

      instTl.add(animateWordsOut(words));

      instTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
      });

      masterTl.add(instTl);

      return;

    }

    if (block.dataset.animateSpecial === 'like-this') {

      const heading = block.querySelector('.n_text-reveal__heading');

      const words = splitTextIntoWords(heading)
      prepareWords(words)

      const extra = wrapper.querySelector('.special__split');
      const typographyFans = wrapper.querySelector('.special__typography-fans')
      console.log(extra)
      gsap.set(extra, {
        opacity: 0,
        zIndex: -4,

      })

      gsap.set(typographyFans, {
        zIndex: -4,
        clipPath: "inset(0% 100% 0% 0%)",
      })

      gsap.set(extra.querySelector('.special__split-row--top'), {
        xPercent: -50
      })
      gsap.set(extra.querySelector('.special__split-row--bottom'), {
        xPercent: 50
      })
      // let

      let specialTl = gsap.timeline();

      specialTl.to(extra, {
        opacity: 1,
        zIndex: 2
      })
      specialTl.to(extra.querySelector('.special__split-row--bottom'), {
        xPercent: 0,
        duration: 2
      })
      specialTl.to(extra.querySelector('.special__split-row--top'), {
        xPercent: 0,
        duration: 2
      }, "<")

      specialTl.to(extra, {
        duration: 1
      })
      specialTl.to(extra.querySelector('.special__split-row--bottom'), {
        xPercent: -100,
        duration: 1
      })
      specialTl.to(extra.querySelector('.special__split-row--top'), {
        xPercent: 100,
        duration: 1
      }, "<")
      specialTl.set(extra, {
        opacity: 0,
        zIndex: -4

      })

      specialTl.add(animateWordsIn(words, "#000000"));

      specialTl.add(animateWordsOut(words));

      specialTl.to(typographyFans, {
        clipPath: "inset(0% 0% 0% 0%)",
        zIndex: 3,
        duration: 1,
      })

      specialTl.call(() => {
        block.classList.remove("active");
        block.style.zIndex = "0";
      });

      masterTl.add(specialTl);

      return;

    }

    // 2.3.c) — Normal (non-Anton) blocks:
    // Find every <h1 class="n_text-reveal__heading"> inside this block:
    headings.forEach((h1, headingIndex) => {
      // 1) Split the text into individual <span class="text-reveal__word">…</span>
      const words = splitTextIntoWords(h1);

      // 2) Immediately position all words offscreen/red:
      prepareWords(words)

      // Figure out if this is the very last heading of the very last block:
      const isLastBlock = (i === blocks.length - 1);

      const isLastHeading = headingIndex === headings.length - 1;

      // 3) Build a mini‐timeline for “this one <h1>”.
      const wordAnim = createWordTimeline(words, endColor, block, isLastBlock,
        isLastHeading);

      // 4) Add THAT entire mini-timeline into “tl” (so headings run in series, one after the other)
      tl.add(wordAnim);
    });

    // 2.3.c.v) Once all headings in that block have run, remove .active & reset zIndex:

    tl.call(() => block.classList.remove('active'))

    tl.set(block, { zIndex: 0 })
    masterTl.to(block, {
      border: "unset"
    })

    // 2.3.c.vi) Finally, insert this block’s “tl” into the master timeline:
    masterTl.add(tl);

    // Because each block’ s sub‐ timeline(tl) is added to masterTl in order, they run in
    //   series as you scroll down(due to scrub: 1).In other words,
    //   Block #1’s timeline runs first; then Block # 2’ s,
    //   and so on— each pinned section taking up roughly 1400 px worth of scroll.

  });

  // 2.4) (If isPageHeader && there is a logoVideo, you do one more “fade in the logo”
  const totalDuration = masterTl.duration();
  if (isPageHeader && logoVideo) {
    const lastLine = blocks[blocks.length - 1];
    const lastWords = lastLine.querySelectorAll('text-reveal__Word');

    masterTl.to(lastWords, {
      yPercent: 100,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.inOut',
      stagger: 0.1
    })
    masterTl.to(logoVideo, {
      opacity: 1,
      duration: 2,
      ease: "power2.out"
    });
  }
}

// 1 FIND TEXT REVEAL SECTIONS
function initTextRevealSections() {
  const sections = document.querySelectorAll('.n_text-reveal-section');

  sections.forEach(section => {
    if (section._revealed) return; // only once
    section._revealed = true;

    revealText(section);
  });
}

// dot Animate

function dotAnimate() {
  // console.log(document.querySelector(".dot-reveal-section .text-color-black"))
  let dotAnimation = gsap.timeline({
    scrollTrigger: {
      // trigger: ".dot-reveal-section",
      trigger: ".dot-reveal-section .text-color-black",
      start: "top 40%",
      // end: "top 20%",
      end: "+=300",
      toggleActions: "play none none reverse",
      // pin: ".dot-wrapper",
      // pinSpacing: false

    }
  });
  dotAnimation.to('.dot-wrapper', {
    // clipPath: "circle(120% at center)",
    clipPath: "circle(120% at 50% 75%)",
    duration: 1,
    ease: "power2.out"

  })
}

dotAnimate();

function scrollAccordion(accordionRoot) {
  // 1️⃣ Find elements relative to this accordion instance
  const titles = Array.from(accordionRoot.querySelectorAll('.n_accordion-title'));
  const defs = Array.from(accordionRoot.querySelectorAll('.panel__definition'));
  const wrapper = accordionRoot.querySelector('.panels-mask');
  const panelsInner = accordionRoot.querySelector('.panels-mask__inner');
  let currentIndex = 0;
  const time = .8;

  // 2️⃣ Hide initially for scroll-reveal
  gsap.set(wrapper, { autoAlpha: 0 });

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
    toggleActions: "play none none none",
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
    accordionRoot.id = 'accordion-' + Math.random().toString(36).slice(2, 10);
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
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      activateTitle(i);
      moveDefinition(i);
      tab.focus();

      // ScrollTrigger sync!
      // const trigger = ScrollTrigger.getById(accordionRoot.id);

      // if (trigger) {
      //   const totalPanels = titles.length;
      //   const start = trigger.start;
      //   const end = trigger.end;
      //   // Avoid divide-by-zero if only one panel
      //   const ratio = totalPanels > 1 ? (i / (totalPanels - 1)) : 0;
      //   const newScroll = start + ((end - start) * ratio);
      //   window.scrollTo({ top: newScroll, behavior: "smooth" });
      // }

    });
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        let next = (i + 1) % titles.length;
        titles[next].focus();
        activateTitle(next);
        moveDefinition(next);
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        let prev = (i - 1 + titles.length) % titles.length;
        titles[prev].focus();
        activateTitle(prev);
        moveDefinition(prev);
      }
      if (e.key === 'Home') {
        e.preventDefault();
        titles[0].focus();
        activateTitle(0);
        moveDefinition(0);
      }
      if (e.key === 'End') {
        e.preventDefault();
        titles[titles.length - 1].focus();
        activateTitle(titles.length - 1);
        moveDefinition(titles.length - 1);
      }
      if (e.key === 'Enter' || e.key === ' ') {
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
      t.setAttribute('aria-selected', j === index ? "true" : "false");
      t.setAttribute('tabindex', j === index ? "0" : "-1");
    });
    defs.forEach((def, j) => {
      def.setAttribute('aria-hidden', j === index ? "false" : "true");
    });
    let activeTitle = titles[index];
    gsap.fromTo(
      activeTitle, { autoAlpha: 0, x: 50 }, {
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
document.querySelectorAll('.n_scroll-accordion').forEach(scrollAccordion);

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
      })

      tl.to(panel, {
        width: "5%",
        ease: "expo.out",
      });

      tl.to(nextPanel, {
        width: "100%", // Expand next panel
        ease: "expo.out",
        onStart: () => {
          nextPanel.classList.add("active")
          if (nextContent) {
            // currentContent.classList.remove("hide");
            // nextContent.classList.add("show"); // Add animation class
          }
        },
      }, "<"); // Sync animations
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
  const slides = gsap.utils.toArray(slider.querySelectorAll('.n_stacked-slide'));
  const total = slides.length;
  const imgs = slides.map(s => s.querySelector('img'));

  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: slider,
      pin: true,
      scrub: 1,
      start: "top top",
      end: `+=${(slides.length - 1) * 1500}`,
      markers: true,
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
      ease: 'power4.inOut'
    });

    // 2) push that old image out to the right
    tl.to(prevImg, {
      xPercent: 100,
      duration: 1,
      ease: 'power4.inOut'
    }, '<');

    // 3) pull the new container in from the right
    tl.fromTo(slide, { xPercent: 100 }, { xPercent: 0, duration: 1, ease: 'power4.inOut' },
      '<'
    );

    // 4) pull its image in from the left
    tl.fromTo(curImg, { xPercent: -100 }, { xPercent: 0, duration: 1, ease: 'power4.inOut' },
      '<'
    );
  });

  // 1. Make it focusable
  slider.setAttribute('tabindex', '0');

  slider.addEventListener('keydown', e => {
    const st = tl.scrollTrigger;
    const start = st.start,
      end = st.end,
      scrollY = window.scrollY;

    // normalized progress [0‒1]
    const prog = Math.max(0, Math.min(1, (scrollY - start) / (end - start)));
    const per = 1 / (total - 1);
    let idx = Math.round(prog / per);

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      idx = Math.min(idx + 1, total - 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      idx = Math.max(idx - 1, 0);
    } else {
      return; // not an arrow key
    }

    e.preventDefault();

    // compute exact scroll position for that slide
    const targetScroll = start + idx * (end - start) / (total - 1);

    // tell ScrollTrigger to jump there
    st.scroll(targetScroll);

    const title = slides[idx]
      .querySelector('.slide__title')
      .textContent;
    document.getElementById('slider-status').textContent =
      `Slide ${idx + 1} of ${total}: ${title}`;
  });

}

function initStackedSliders() {
  const sections = document.querySelectorAll('.n_stacked-slider');

  sections.forEach(section => {
    if (section._revealed) return; // only once
    section._revealed = true;

    stackedSlider(section);
  });
}

// PERFECT SLIDER
// function stackedSlider(slider) {
//   // const slides = slider.querySelectorAll('.n_stacked-slide');
//   const slides = gsap.utils.toArray(slider.querySelectorAll('.n_stacked-slide'));
//   const total = slides.length;
//   const imgs = slides.map(s => s.querySelector('img'));

//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: slider,
//       pin: true,
//       scrub: 1,
//       start: "top top",
//       end: `+=${(slides.length - 1) * 1500}`,
//       markers: true,
//       snap: 1 / (total - 1)
//     }
//   });
//   slides.forEach((slide, i) => {
//     if (i === 0) return; // leave the first in-place to start

//     const prev = slides[i - 1];
//     const prevImg = imgs[i - 1];
//     const curImg = imgs[i];

//     // 1) slide the old container out to the left
//     tl.to(prev, {
//       xPercent: -100,
//       duration: 1,
//       ease: 'power4.inOut'
//     });

//     // 2) push that old image out to the right
//     tl.to(prevImg, {
//       xPercent: 100,
//       duration: 1,
//       ease: 'power4.inOut'
//     }, '<');

//     // 3) pull the new container in from the right
//     tl.fromTo(slide, { xPercent: 100 }, { xPercent: 0, duration: 1, ease: 'power4.inOut' },
//       '<'
//     );

//     // 4) pull its image in from the left
//     tl.fromTo(curImg, { xPercent: -100 }, { xPercent: 0, duration: 1, ease: 'power4.inOut' },
//       '<'
//     );
//   });
// }

// function initStackedSliders() {
//   const sections = document.querySelectorAll('.n_stacked-slider');

//   sections.forEach(section => {
//     if (section._revealed) return; // only once
//     section._revealed = true;

//     stackedSlider(section);
//   });
// }

// initColorPanels()

// function playFanSansLottie() {
//   let section = document.querySelector('.fan-sans-lottie-section');
//   const textBlocks = section.querySelectorAll(".lottie-text-fade .heading-style-h2");
//   let currentFrame = 0;
//   let lastActiveIndex = -1;
//   const wrapper = section.querySelector(".lottie-text-fade");
//   let blocks = section.querySelectorAll('.background-block');
//   let accessibleFrame = section.querySelector('.accessible-frame').dataset.frame;
//   gsap.set(blocks, {
//     opacity: 0
//   })

//   setTextFadeMinHeight(wrapper, textBlocks);

//   let lottieAnimation = lottie.loadAnimation({
//     container: document.querySelector(".lottie-element"),
//     renderer: "svg",
//     loop: false,
//     autoplay: false,
//     path: "https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/67e40ae7093e8d53e37e4f3a_FanSans_Animation3.json"
//   });

//   window.addEventListener("resize", () => {
//     setTextFadeMinHeight(wrapper, textBlocks)
//   });

//   // ✅ ⬇️ Scrub Lottie with scroll after it's loaded
//   lottieAnimation.addEventListener("DOMLoaded", () => {
//     const totalFrames = lottieAnimation.totalFrames;

//     gsap.to(lottieAnimation, {
//       frame: totalFrames - 1,
//       ease: "none",
//       scrollTrigger: {
//         trigger: section,
//         start: "top top",
//         end: "+=2000", // control scroll length
//         pin: true,
//         scrub: true,
//       },
//       onUpdate: () => {
//         lottieAnimation.goToAndStop(lottieAnimation.frame, true);
//       }
//     });
//   });

//   // ✅ Trigger text changes based on frame
//   const frameTriggers = Array.from(textBlocks).map((el, index) => ({
//     frame: parseInt(el.dataset.frame, 10),
//     el,
//     index
//   }));

//   let currentTextTween = null; // 🧠 track active animation

//   lottieAnimation.addEventListener("enterFrame", (e) => {
//     currentFrame = e.currentTime;

//     if (currentFrame < parseInt(accessibleFrame)) {
//       gsap.to(blocks, {
//         opacity: 0,
//         // y: 20,
//         duration: 0.15,
//         ease: "power2.inOut"
//       });
//     }

//     const active = frameTriggers
//       .filter(trigger => currentFrame >= trigger.frame)
//       .sort((a, b) => b.frame - a.frame)[0];

//     if (!active || active.index === lastActiveIndex) return;

//     lastActiveIndex = active.index;

//     if (currentTextTween) currentTextTween.kill();

//     textBlocks.forEach(el => {
//       gsap.set(el, {
//         opacity: 0,
//         // y: 20

//       });
//     });

//     // currentTextTween = gsap.to(active.el, {
//     //   opacity: 1,
//     //   y: 0,
//     //   duration: 0.5,
//     //   ease: "power2.out"
//     // });

//     // Animate current text
//     currentTextTween = gsap.to(active.el, {
//       opacity: 1,
//       y: 0,
//       duration: 0.5,
//       ease: "power2.out"
//     });

//     // ✅ Trigger background-block animation when we hit the accessible frame
//     if (active.el.classList.contains("accessible-frame")) {
//       gsap.fromTo(blocks, {
//         width: "0%",
//         transformOrigin: "center center"
//       }, {
//         opacity: 1,
//         width: "100%",
//         duration: 1,
//         ease: "power4.out",
//       });
//     }
//   });
// }
// playFanSansLottie()

// const lottieWrapper = document.querySelector(".fan-sans-lottie-section .lottie-text-fade");
// const lottieTextBlocks = document.querySelectorAll('.fan-sans-lottie-section .heading-style-h2')
// setTextFadeMinHeight(lottieWrapper, lottieTextBlocks);

// function sectionLogos(logoSection) {
//   // let logoSection = document.querySelector('.section_logo1');
//   let logoWraps = [...logoSection.querySelectorAll('.logo-content_wrap')];

//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: logoSection,
//       start: "top top",
//       end: "+=5000",
//       pin: true,
//       scrub: 2,
//       anticipatePin: 1,
//     }
//   });

//   logoWraps.forEach((wrap, i) => {

//     // Grab the .heading-style-h1 elements
//     let textHeaders = [...wrap.querySelectorAll('.heading-style-h1')];
//     let logoLists = [...wrap.querySelectorAll('.logo-list_inner')];

//     // FORMER CODE:
//     // gsap.set(textHeaders, { yPercent: 100, opacity: 0 });

//     // Instead: for each heading, split into words & animate them in
//     textHeaders.forEach((header, hIndex) => {
//       // 1) Split into .line-item__inner spans
//       let words = splitTextIntoWords(header, "line-item", "line-item__inner");

//       // 2) Set initial states: below, invisible, red
//       gsap.set(words, {
//         opacity: 0,
//         yPercent: 100,
//         color: "#E10600"
//       });

//       // 3) Animate the words upward & fade in
//       tl.to(words, {
//         opacity: 1,
//         yPercent: 0,
//         duration: 1,
//         ease: "power4.out",
//         stagger: 0.1
//       }, `+=${hIndex * 0.5}`);

//       // 4) Simultaneously shift color from red to black
//       tl.to(words, {
//         color: "#000",
//         ease: "power2.out",

//         duration: 1,
//         stagger: 0.15,
//         // color: "",
//       }, "<"); // "<" = at the same time as the fade-in
//     });

//     // Animate the logo marquee
//     if (logoLists.length > 0) {
//       let logoTl = gsap.timeline();

//       logoLists.forEach((logoList, i) => {
//         let parentWidth = logoList.parentElement.offsetWidth;
//         let innerWidth = logoList.offsetWidth;
//         let maxMove = Math.max(innerWidth - parentWidth, 0);
//         let direction = i % 2 === 0 ? 1 : -1; // alternate direction

//         gsap.set(logoList, {
//           left: direction === 1 ? "100%" : `-${innerWidth}px`,
//           opacity: 0
//         });

//         // logos move horizontally
//         logoTl.to(logoList, {
//           left: direction === 1 ? `-${maxMove}px` : "0%",
//           opacity: 1,
//           duration: 3,
//           ease: "expo.out"
//         }, 0);
//       });

//       // Insert sub-timeline slightly after text
//       tl.add(logoTl, "+=0.5");
//     } else {
//       // text-only wrap: hold on screen briefly
//       tl.to(wrap, {
//         duration: 2, // hold text for a bit before fading out
//       });
//     }

//     // Fade out except for last
//     if (i !== logoWraps.length - 1) {
//       tl.to(wrap, {
//         opacity: 0,
//         scale: 0.95,
//         duration: 1,
//         ease: "power3.inOut"
//       }, "+=1");
//     } else {
//       // let last remain & unpin
//       tl.to(logoSection, {
//         pin: false,
//         duration: 1,
//         ease: "power2.out"
//       }, "+=1");
//     }
//   });
// }

// sectionLogos(document.querySelector('.section_logo1'));

// function animateFanSansType() {
//   let section = document.querySelector('.section-typography .typography-fan-sans');

//   let svg = section.querySelector('.fan-sans-svg')

//   let blinker = section.querySelector(".type-blinker");

//   let sansGroup = section.querySelector(".type-sans-group");
//   let fansGroup = section.querySelector(".type-fans-group");

//   let sansS = sansGroup.querySelector(".type-sans-s");
//   let sansA = sansGroup.querySelector(".type-sans-a");
//   let sansN = sansGroup.querySelector(".type-sans-n");
//   let sansSTwo = sansGroup.querySelector(".type-sans-s2");

//   let fansF = fansGroup.querySelector(".type-fans-f");
//   let fansA = fansGroup.querySelector(".type-fans-a");
//   let fansN = fansGroup.querySelector(".type-fans-n");
//   let fansATwo = fansGroup.querySelector(".type-fans-a2");
//   let fansT = fansGroup.querySelector(".type-fans-t");
//   let fansI = fansGroup.querySelectorAll(".type-fans-i path");
//   let fansC = fansGroup.querySelector(".type-fans-c");
//   let fansS = fansGroup.querySelector(".type-fans-s");

//   let logomark = fansGroup.querySelector(".type-fans-logomark");

//   let typingTl = gsap.timeline({
//     scrollTrigger: {
//       trigger: svg,
//       // scrub:true,
//       // markers: true,
//       start: "top 80%",
//       toggleActions: "play pause resume reset"
//     }
//   });

//   gsap.set(
//     [
//       sansS,
//       sansA,
//       sansN,
//       sansSTwo,
//       fansF,
//       fansA,
//       fansN,
//       fansATwo,
//       fansT,
//       fansI,
//       fansC,
//       fansS,
//       logomark,
//       blinker
//     ],
//     {
//       autoAlpha: 0
//     }
//   );

//   typingTl.to(fansF, { autoAlpha: 1, duration: 0.2 })

//     .to(fansA, { autoAlpha: 1, duration: 0.2 })

//     .to(fansN, { autoAlpha: 1, duration: 0.2 })

//     // type out Sans
//     .to(sansS, { autoAlpha: 1, duration: 0.2 })
//     .to(sansA, { autoAlpha: 1, duration: 0.2 })
//     .to(sansN, { autoAlpha: 1, duration: 0.2 })
//     .to(sansSTwo, { autoAlpha: 1, duration: 0.2 })

//     // small pause
//     .to({}, { duration: 0.5 });

//   // delete Sans
//   typingTl.to(sansSTwo, { autoAlpha: 0, duration: 0.2 })
//     .to(sansN, { autoAlpha: 0, duration: 0.2 })
//     .to(sansA, { autoAlpha: 0, duration: 0.2 })
//     .to(sansS, { autoAlpha: 0, duration: 0.2 })

//     .to({}, { duration: 0.5 });

//   typingTl.to(fansATwo, { autoAlpha: 1, duration: 0.2 })
//     .to(fansT, { autoAlpha: 1, duration: 0.2 })
//     .to(fansI, { autoAlpha: 1, duration: 0.2 })
//     .to(fansC, { autoAlpha: 1, duration: 0.2 })
//     .to(fansS, { autoAlpha: 1, duration: 0.2 })

//     // small pause
//     .to({}, { duration: 0.5 });

//   typingTl.to(logomark, {
//     autoAlpha: 1,
//     duration: 0.7
//   });

//   return typingTl;
// }

// // animateFanSansType()
// console.log(`anton lottie`)

// function antonLottie() {
//   console.log('anton lottie')
//   const section = document.querySelector('.anton-lottie-section');
//   const wrapper = section.querySelector('.anton-text-fade');
//   const inner = section.querySelector('.anton-text-fade-inner');
//   const texts = gsap.utils.toArray('.anton-text-fade-inner .anton-text');
//   let hasTriggered = false;

//   // 1) size your text-container…
//   function setUniformHeights() {
//     const maxH = Math.ceil(
//       Math.max(...texts.map(t => t.getBoundingClientRect().height))
//     );
//     texts.forEach(t => (t.style.height = `${maxH}px`));
//     wrapper.style.height = `${maxH}px`;
//   }
//   setUniformHeights();
//   window.addEventListener('resize', setUniformHeights);

//   // 2) load Lottie
//   const anim = lottie.loadAnimation({
//     container: section.querySelector('.anton-lottie'),
//     renderer: 'svg',
//     loop: true,
//     autoplay: false,
//     path: 'https://cdn.prod.website-files.com/67b4c8583d604cb6c2fc9a62/681e136a89a8d5eb0a1fb2ac_antontest.json'
//   });

//   anim.addEventListener('DOMLoaded', () => {
//     anim.setSpeed(1);
//     anim.play();

//     // a) fire on every frame
//     anim.addEventListener('enterFrame', e => {
//       const fps = anim.frameRate;
//       const frameNum = Math.round(e.currentTime * fps);
//       const secs = e.currentTime;

//       // console.log(`frame: ${frameNum}`, `time: ${secs.toFixed(2)}s`);

//       if (!hasTriggered && (frameNum >= 9814 || secs >= 163)) {
//         hasTriggered = true;
//         console.log('🔥 reached target frame/time!');
//         gsap.to(inner, {
//           y: '-50%',
//           duration: 0.5,
//           ease: 'power2.out'
//         });
//       }
//     });

//     // b) reset on *every* loop
//     anim.addEventListener('loopComplete', () => {
//       hasTriggered = false;
//       // animate back down
//       gsap.to(inner, {
//         y: '0%',
//         duration: 0.5,
//         ease: 'power2.out'
//       });
//     });
//   });
// }

// antonLottie();

// let typographyRevealContent = document.querySelector(
//   '.section-typography .text-reveal-typography-2');
// revealText(typographyRevealContent);

// // current
// function stackedSlider(slider) {
//   // const slides = gsap.utils.toArray(".stacked-slider .stacked-slide");
//   const slides = slider.querySelectorAll(".stacked-slide")

//   let tl = gsap.timeline({
//     scrollTrigger: {
//       // scroller: scrollContainer,
//       trigger: slider,
//       pin: true,
//       scrub: 1,
//       start: "top top",
//       end: `+=${(slides.length - 1) * 1500}`,
//       onLeave: () => {
//         console.log('left')
//       }
//     }
//   });

//   tl.to({}, { duration: 0.5 });

//   for (let i = 0; i < slides.length - 1; i++) {
//     let current = slides[i];
//     let next = slides[i + 1];

//     let currentImg = current.querySelector(".stacked-img");
//     let currentBody = current.querySelector(".stacked-text-wrap");
//     let currentTitle = current.querySelector(".stacked-title");

//     let nextImg = next.querySelector(".stacked-img");
//     let nextText = next.querySelector(".stacked-text-wrap");
//     let nextTitle = next.querySelector(".stacked-title");

//     // gsap.set(currentTitle, {

//     // })

//     // gsap.set(currentText.querySelector('.stacked-title'), {
//     //   scale: 1.2,
//     // })

//     if (i === 0) {
//       gsap.set(currentImg, {
//         scale: 1.1
//       })
//       // console.log(currentImg)
//       gsap.to(currentImg, {
//         scale: 1, // Scale down to normal size (1) when entering the viewport
//         duration: 1,
//         scrollTrigger: {
//           trigger: currentImg,
//           start: "top 80%",
//           end: "bottom 20%",
//           scrub: true,
//           // markers: true
//         }
//       });
//     }

//     // Animate current slide OUT
//     // (clip from 0% => 100%, text fade up/out)
//     tl.to(currentImg, {
//         clipPath: "inset(100% 0% 0% 0%)",
//         duration: 0.5,
//         ease: "power4.out"
//       })
//       // .to(currentText.querySelector('.stacked-title'), {
//       //   scale: 1,
//       //   duration: .5
//       // }, "<")
//       .to(currentTitle, {
//         opacity: .0,
//         // moves text up
//         duration: 0.5,
//         clipPath: "inset(0% 100% 0% 0%)",
//         // y: 40,
//         // color: 'red',
//         ease: "power4.out",
//         scale: 1
//       }, "<")

//       .to(currentBody, {
//         opacity: .0,
//         y: -40, // moves text up
//         duration: 0.5,
//         ease: "power4.out",
//         scale: 1
//       }, "<");

//     // Animate next slide IN
//     // (clip from 100% => 0%, text fade in)
//     tl.fromTo(nextImg, {
//           clipPath: "inset(100% 0% 0% 0%)"

//         }, // ensure it starts clipped
//         {
//           clipPath: "inset(0% 0% 0% 0%)",
//           duration: 0.5,
//           ease: "power4.out"
//         },
//         "<"
//       )

//       .fromTo(nextText, { opacity: 0, y: 40 }, // fade in from below
//         {
//           opacity: 1,
//           y: 0,
//           duration: 0.5,
//           ease: "power4.out"
//         },
//         "<"
//       )
//       .to(next, {
//         zIndex: 1
//       }, "<")
//       .fromTo(nextTitle, {
//           opacity: 0,
//           x: -20,
//           clipPath: "inset(0% 100% 0% 0%)"
//         }, // fade in from below
//         {
//           clipPath: "inset(0% 0% 0% 0%)",
//           opacity: 1,
//           x: 0,
//           duration: 0.8,
//           ease: "power4.out"
//         },
//         "<0.5"
//       )
//   }
// }

// let photographySlider = document.querySelector('.section-photography .stacked-slider')
// stackedSlider(photographySlider)

// function bigSlider(sliderWrapper) {
//   let slider = sliderWrapper.querySelector('.big-slider')
//   let slides = sliderWrapper.querySelectorAll('.big-slide')

//   // console.log(slides)

//   const ghostContainer = document.createElement("div");
//   ghostContainer.className = "ghost_work-container";

//   slider.appendChild(ghostContainer);

//   const ghostItems = Array.from(slides).map(() => {
//     const ghostItem = document.createElement("div");
//     ghostItem.className = "ghost_work-item";
//     ghostItem.style.cssText = "width: 100%; height: 250vh;";
//     ghostContainer.appendChild(ghostItem);
//     return ghostItem;
//   });

//   // Initial setup for work items
//   gsap.set(slides, {
//     position: "absolute",
//     top: "0",
//     left: "0",
//     width: "100vw",
//     height: "100vh",
//     clipPath: "inset(0 0% 0 100%)"
//   });

//   ScrollTrigger.create({
//     anticipatePin: 1,
//     trigger: sliderWrapper,
//     start: "top top",
//     endTrigger: ghostContainer,
//     end: "bottom bottom",
//     pin: true,
//     pinSpacing: false,
//     // markers: true,
//     onLeave: () => {
//       sliderWrapper.style.height = "auto";
//       setTimeout(() => {
//         ghostContainer.remove();
//       }, 100);
//     }
//   });

//   const getBaseScrollTrigger = (ghostItem) => ({
//     trigger: ghostItem,
//     scrub: true,
//     start: "top bottom",
//     end: "+120vh top",
//     // pin: true,
//   });

//   slides.forEach((element, i) => {
//     const slideContainer = element.querySelector(".big-slide_inner");
//     const slideBackground = element.querySelector(".big-slide_img-wrap");
//     const slideOverlay = element.querySelector(".slide-overlay");
//     const slideTitle = element.querySelector('.Impact-H1')

//     // Initial states for background and title
//     gsap.set(slideBackground, { scale: 1.4 });
//     gsap.set(slideTitle, { scale: 1.1, xPercent: -20, opacity: 0 });

//     // For the first slide, immediately reveal it:
//     if (i === 0) {
//       gsap.to(slideBackground, {
//         scale: 1, // Scale down to normal size (1) when entering the viewport
//         duration: 1,
//         scrollTrigger: {
//           trigger: element,
//           start: "top 80%",
//           end: "bottom 20%",
//           scrub: true,
//           // markers: true
//         }
//       });
//       gsap.set(element, { clipPath: "inset(0 0 0 0%)" });
//       gsap.set(slideContainer, { xPercent: 0 });
//     } else {
//       gsap.set(slideContainer, { xPercent: 40 });
//       gsap.to(slideContainer, {
//         xPercent: 0,
//         scrollTrigger: getBaseScrollTrigger(ghostItems[i])
//       });
//       // gsap.to(element, {
//       //   clipPath: "inset(0 0 0 0%)",
//       //   ease: "back.out(1.7)",
//       //   duration: 0.5,
//       //   scrollTrigger: getBaseScrollTrigger(ghostItems[i])
//       // });
//       gsap.fromTo(
//         element, { clipPath: "inset(0 0 0 100%)" },
//         {
//           clipPath: "inset(0 0 0 0%)",
//           ease: "back.out(1.7)",
//           duration: 0.5,
//           scrollTrigger: getBaseScrollTrigger(ghostItems[i])
//         }
//       );
//       gsap.to(slideContainer, {
//         xPercent: 0,
//         scrollTrigger: getBaseScrollTrigger(ghostItems[i])
//       });
//       gsap.to(slideBackground, {
//         scale: 1,
//         scrollTrigger: getBaseScrollTrigger(ghostItems[i])
//       });
//     }
//   })

// }

// bigSlider(document.querySelector('.big-slider_from-fans'))

// sectionLogos(document.querySelector('.section_icon-slide'));

// // function sectionIcons() {
// //   let iconSection = document.querySelector('.section_icon-slide');
// //   let iconWraps = [...iconSection.querySelectorAll('.logo-content_wrap')];

// //   let tl = gsap.timeline({
// //     scrollTrigger: {
// //       trigger: iconSection,
// //       start: "top top",
// //       end: "+=5000", // Adjust based on content height
// //       pin: true, // Pin the whole section
// //       scrub: 2,
// //       anticipatePin: 1,
// //       markers: true
// //     }
// //   });

// //   iconWraps.forEach((wrap, i) => {
// //     // Grab the .heading-style-h1 elements
// //     let textHeaders = [...wrap.querySelectorAll('.heading-style-h1')];
// //     let iconLists = [...wrap.querySelectorAll('.logo-list_inner')];

// //   })

// //   iconWraps.forEach((wrap, i) => {
// //     // Grab the .heading-style-h1 elements
// //     let textHeaders = [...wrap.querySelectorAll('.heading-style-h1')];
// //     let logoLists = [...wrap.querySelectorAll('.logo-list_inner')];
// //     textHeaders.forEach((header, hIndex) => {
// //       // 1) Split into .line-item__inner spans
// //       let words = splitTextIntoWords(header, "line-item", "line-item__inner");

// //       // 2) Set initial states: below, invisible, red
// //       gsap.set(words, {
// //         opacity: 0,
// //         yPercent: 100,
// //         color: "#E10600"
// //       });

// //       // 3) Animate the words upward & fade in
// //       tl.to(words, {
// //         opacity: 1,
// //         yPercent: 0,
// //         duration: 1,
// //         ease: "power4.out",
// //         stagger: 0.1
// //       }, `+=${hIndex * 0.5}`);
// //       // ^ This delay ensures each heading still staggers in one by one

// //       // 4) Simultaneously shift color from red to black
// //       tl.to(words, {
// //         color: "#000",
// //         ease: "power2.out",

// //         duration: 1,
// //         stagger: 0.15,
// //         // color: "",
// //       }, "<"); // "<" = at the same time as the fade-in
// //     });

// //     // Animate the logo marquee
// //     if (logoLists.length > 0) {
// //       let logoTl = gsap.timeline();

// //       logoLists.forEach((logoList, i) => {
// //         let parentWidth = logoList.parentElement.offsetWidth;
// //         let innerWidth = logoList.offsetWidth;
// //         let maxMove = Math.max(innerWidth - parentWidth, 0);
// //         let direction = i % 2 === 0 ? 1 : -1; // alternate direction

// //         gsap.set(logoList, {
// //           left: direction === 1 ? "100%" : `-${innerWidth}px`,
// //           opacity: 0
// //         });

// //         // logos move horizontally
// //         logoTl.to(logoList, {
// //           left: direction === 1 ? `-${maxMove}px` : "0%",
// //           opacity: 1,
// //           duration: 3,
// //           ease: "expo.out"
// //         }, 0);
// //       });

// //       // Insert sub-timeline slightly after text
// //       tl.add(logoTl, "+=0.5");
// //     } else {
// //       // text-only wrap: hold on screen briefly
// //       tl.to(wrap, {
// //         duration: 2, // hold text for a bit before fading out
// //       });
// //     }

// //     // FORMER CODE:
// //     // gsap.set(textHeaders, { yPercent: 100, opacity: 0 });

// //     // Instead: for each heading, split into words & animate them in
// //     // textHeaders.forEach((header, hIndex) => {
// //     //   // 1) Split into .line-item__inner spans
// //     //   let words = splitTextIntoWords(header, "line-item", "line-item__inner");

// //     //   // 2) Set initial states: below, invisible, red
// //     //   gsap.set(words, {
// //     //     opacity: 0,
// //     //     yPercent: 100,
// //     //     color: "#E10600"
// //     //   });

// //     //   // 3) Animate the words upward & fade in
// //     //   tl.to(words, {
// //     //     opacity: 1,
// //     //     yPercent: 0,
// //     //     duration: 1,
// //     //     ease: "power4.out",
// //     //     stagger: 0.1
// //     //   }, `+=${hIndex * 0.5}`);
// //     //   // ^ This delay ensures each heading still staggers in one by one

// //     //   // 4) Simultaneously shift color from red to black
// //     //   tl.to(words, {
// //     //     color: "#000",
// //     //     ease: "power2.out",

// //     //     duration: 1,
// //     //     stagger: 0.15,
// //     //     // color: "",
// //     //   }, "<"); // "<" = at the same time as the fade-in
// //     // });

// //     // Animate the logo marquee
// //     // if (logoLists.length > 0) {
// //     //   let logoTl = gsap.timeline();

// //     //   logoLists.forEach((logoList, i) => {
// //     //     let parentWidth = logoList.parentElement.offsetWidth;
// //     //     let innerWidth = logoList.offsetWidth;
// //     //     let maxMove = Math.max(innerWidth - parentWidth, 0);
// //     //     let direction = i % 2 === 0 ? 1 : -1; // alternate direction

// //     //     gsap.set(logoList, {
// //     //       left: direction === 1 ? "100%" : `-${innerWidth}px`,
// //     //       opacity: 0
// //     //     });

// //     //     // logos move horizontally
// //     //     logoTl.to(logoList, {
// //     //       left: direction === 1 ? `-${maxMove}px` : "0%",
// //     //       opacity: 1,
// //     //       duration: 3,
// //     //       ease: "expo.out"
// //     //     }, 0);
// //     //   });

// //     //   // Insert sub-timeline slightly after text
// //     //   tl.add(logoTl, "+=0.5");
// //     // } else {
// //     //   // text-only wrap: hold on screen briefly
// //     //   tl.to(wrap, {
// //     //     duration: 2, // hold text for a bit before fading out
// //     //   });
// //     // }

// //     // Fade out except for last
// //     // if (i !== logoWraps.length - 1) {
// //     //   tl.to(wrap, {
// //     //     opacity: 0,
// //     //     scale: 0.95,
// //     //     duration: 1,
// //     //     ease: "power3.inOut"
// //     //   }, "+=1");
// //     // } else {
// //     //   // let last remain & unpin
// //     //   tl.to(logoSection, {
// //     //     pin: false,
// //     //     duration: 1,
// //     //     ease: "power2.out"
// //     //   }, "+=1");
// //     // }
// //   });
// // }

// // sectionIcons();

// let personalityAccordionWrapper = document.querySelector(
//   '.section-personality .scroll-accordion-wrapper')
// let personalityTitles = gsap.utils.toArray(
//   ".section-personality .scroll-accordion-wrapper .accordion-title");
// let personalityDefs = gsap.utils.toArray(
//   ".section-personality .scroll-accordion-wrapper .definition");

// scrollAccordion(personalityTitles, personalityDefs, personalityAccordionWrapper)

// let voiceSlider = document.querySelector('.section-voice .stacked-slider')
// stackedSlider(voiceSlider)

// function initStoryPanels() {

//   let panels = gsap.utils.toArray(".story-color-panel");

//   // Create a master timeline, pinned for the entire sequence
//   let tl = gsap.timeline({
//     scrollTrigger: {
//       // scroller: scrollContainer,
//       trigger: ".story-accordion", // or any container you want pinned
//       start: "top top",
//       end: "+=2000", // adjust so there's enough space to see the animations
//       pin: true,
//       scrub: 1,
//     }
//   });

//   // 1) Animate from the first (red) panel to the second panel normally
//   //    so the user sees the transition more clearly.
//   tl.to(panels[0], {
//     height: "5rem",
//     duration: 1,
//     onStart: () => panels[0].classList.remove("active")
//   });
//   tl.to(panels[1], {
//     height: "100%",
//     duration: 1,
//     onStart: () => panels[1].classList.add("active")
//   }, "<");

//   // 2) Animate the rest “fast.” Each panel shrinks in 0.2s, next expands in 0.2s
//   //    so visually it all whips by quickly.
//   for (let i = 1; i < panels.length - 1; i++) {
//     tl.to(panels[i], {
//       height: "5rem",
//       duration: 0.2,
//       onStart: () => panels[i].classList.remove("active")
//     }, "+=0.1");
//     tl.to(panels[i + 1], {
//       height: "100%",
//       duration: 0.2,
//       onStart: () => panels[i + 1].classList.add("active")
//     }, "<");
//   }

// }

// initStoryPanels();

// function initSliderScroll() {
//   let sliderSection = document.querySelector(".scrolling-slider_section");
//   let slidesContainer = document.querySelector('.scrolling-slider_slides');
//   let slides = gsap.utils.toArray('.scrolling-slider_slide');
//   let sliderHeader = sliderSection.querySelector('.heading-style-h1');

//   let totalWidth = slidesContainer.scrollWidth;
//   let parentWidth = slidesContainer.parentElement.offsetWidth;

//   // ✅ Set initial states
//   gsap.set(slides, { opacity: 0 }); // Fade in effect
//   gsap.set(sliderHeader, { yPercent: 100, opacity: 0 });

//   // ✅ Timeline for pinning + horizontal scroll
//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: sliderSection,
//       start: "top top",
//       invalidateOnRefresh: true,
//       end: `+=${(totalWidth - parentWidth) * 2}`, // 🔥 Extended scroll length
//       pin: true,
//       scrub: 3, // 🔥 Increased scrub to slow down movement
//       // anticipatePin: 1,
//       // markers: { startColor: "lime", endColor: "orange", fontSize: "16px" }

//     }
//   });

//   // ✅ Header animation (separate from scrub)
//   gsap.to(sliderHeader, {
//     yPercent: 0,
//     opacity: 1,
//     duration: 1.2, // Slightly longer for better timing
//     ease: "power4.out",
//     delay: 0.15
//   });

//   // ✅ Slides fade in as they start moving
//   tl.to(slides, {
//     opacity: 1,
//     duration: 1.5, // 🔥 Slightly longer fade-in
//     stagger: 0.3, // 🔥 Slower stagger for smooth effect
//     ease: "power2.out"
//   }, "<");

//   // ✅ Scroll slides to the left (Now takes longer)
//   tl.to(slidesContainer, {
//     x: `-${totalWidth - parentWidth}px`,
//     duration: slides.length * 1.8, // 🔥 Slower slide movement
//     ease: "power1.inOut"
//   });

//   // ✅ Unpin the section when done
//   tl.to(sliderSection, {
//     opacity: 1, // No fade-out, just unpin smoothly
//     duration: 0.8
//   });

// }

// initSliderScroll();

// let headerReveal = document.querySelectorAll('[line-split]');
// headerReveal.forEach((header, index) => {
//   let split = new SplitText(header, {
//     type: "lines",
//     linesClass: "header-line"
//   });

//   gsap.set(header.querySelectorAll(".header-line"), {
//     yPercent: 100,
//     opacity: 0
//   });

//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: header,
//       start: "top 70%", // When the top of the header hits 60% of the viewport height
//       toggleActions: "play none none none",
//       onLeaveBack: () => {
//         tl.progress(0);
//         tl.pause();
//       }
//     }
//   });

//   tl.to(header.querySelectorAll(".header-line"), {
//     yPercent: 0,
//     opacity: 1,
//     duration: 1,
//     ease: "power4.out",
//     stagger: 0.2
//   });

// })

// gsap.utils.toArray(".section-fade-up").forEach((section) => {
//   gsap.fromTo(section, { opacity: 0, y: 50 }, // start
//     {
//       opacity: 1,
//       y: 0,
//       duration: .5,
//       ease: "power2.out",
//       scrollTrigger: {
//         trigger: section,
//         start: "top 80%", // reveal when near 80% viewport
//         toggleActions: "play reverse play reverse",
//         /*markers: true*/
//       }
//     }
//   );
// });

// gsap.utils.toArray(".section-fade").forEach((section) => {
//   gsap.fromTo(section, { opacity: 0 }, // start
//     {
//       opacity: 1,
//       duration: 1,
//       ease: "power2.out",
//       scrollTrigger: {
//         trigger: section,
//         start: "top 80%", // reveal when near 80% viewport
//         toggleActions: "play reverse play reverse"
//       }
//     }
//   );
// });

// let headlineReveal = document.querySelectorAll('[headline-reveal]');

// headlineReveal.forEach((header, index) => {
//   const split = new SplitText(header, { type: "lines" });
//   const lines = split.lines; // Get the split lines

//   gsap.set(header, {
//     scale: 0.9
//   });

//   gsap.set(lines, {
//     color: "#E10600",
//     opacity: 0,
//     y: 30
//   });

//   let tl = gsap.timeline({
//     scrollTrigger: {
//       trigger: header,
//       start: "top 85%",
//       end: "top 30%",
//       scrub: false,
//       toggleActions: "play none none reset" // Replays on re-entering
//     }
//   });

//   tl.to(lines, {
//     opacity: 1,
//     y: 0,
//     duration: 0.5,
//     ease: "power4.out",
//     stagger: 0.12
//   });

//   tl.to(lines, {
//     color: "#FFFFFF",
//     stagger: 0.12
//   }, "<");

//   tl.to(header, {
//     scale: 1,
//     duration: 0.1,
//     ease: "power1.out"
//   });
// });

// const parallaxElements = document.querySelectorAll("[data-speed]");

// parallaxElements.forEach((element) => {
//   const speed = element.getAttribute("data-speed"); // Get speed from HTML attribute

//   gsap.to(element, {
//     y: `${speed * 100}px`, // Adjust movement based on speed
//     ease: "none",
//     scrollTrigger: {
//       trigger: element,
//       start: "top bottom",
//       end: "bottom top",
//       scrub: true,
//       scroller: "body" // ✅ Ensures Lenis is used
//     }
//   });
// });

// // helpers 
// window.addEventListener("resize", () => {
//   setTextFadeMinHeight(lottieWrapper, lottieTextBlocks);
//   setTimeout(() => {
//     // ScrollTrigger.sort()
//     ScrollTrigger.refresh();
//   }, 300);
// });

// setTimeout(() => {
//   setTextFadeMinHeight(lottieWrapper, lottieTextBlocks);
//   ScrollTrigger.sort()
//   ScrollTrigger.refresh();
// }, 400);
// // ScrollTrigger.refresh()

// // window.addEventListener("resize", setTextFadeMinHeight);
// ScrollTrigger.sort();

gsap.utils.toArray(".section-fade-up").forEach((section) => {
  gsap.fromTo(section, { opacity: 0, y: 50 }, // start
    {
      opacity: 1,
      y: 0,
      duration: .5,
      ease: "power2.out",
      scrollTrigger: {
        trigger: section,
        start: "top 80%", // reveal when near 80% viewport
        toggleActions: "play reverse play reverse",
        /*markers: true*/
      }
    }
  );
});

const sectionHeaders = document.querySelectorAll('.n_section-header');
// console.log(`sectionHeaders`)
// console.log(sectionHeaders)
sectionHeaders.forEach((section, i) => {
  let header = section.querySelector('.n_section-header__title')
  let number = section.querySelector('.n_section-header__number')

  gsap.set(header, {
    color: "#E10600",
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
  tl.to(header, {
    color: "#FFFFFF",
  }, "<");

  let markerTl = gsap.timeline({
    scrollTrigger: {
      trigger: header,
      start: "top top",
      end: "bottom top",
      // scrub: 1,
      // markers: true,
      toggleActions: "play none none reset"

    }
  })
  // markerTl.to()
})

initTextRevealSections();
initColorPanels();
initStackedSliders();
setTimeout(() => {
  ScrollTrigger.sort()

  ScrollTrigger.refresh();
}, 400);
