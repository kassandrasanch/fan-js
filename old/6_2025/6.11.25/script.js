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

    if (block.dataset.animateSpecial === 'logomark') {

      const heading = block.querySelector('.n_text-reveal__heading');
      const extra = wrapper.querySelector('.logomark');

      const words = splitTextIntoWords(heading)
      prepareWords(words)

      // const extra = wrapper.querySelector('.special__split');
      // const typographyFans = wrapper.querySelector('.special__typography-fans')
      // console.log(extra)
      // gsap.set(extra, {
      //   opacity: 0,
      //   zIndex: -4,

      // })

      gsap.set(extra, {
        zIndex: -4,
        clipPath: "inset(0% 100% 0% 0%)",
      })

      let specialTl = gsap.timeline();

      specialTl.to(extra, {
        clipPath: "inset(0% 0% 0% 0%)",
        zIndex: 3,
        duration: 1,
      })

      // specialTl.to(extra, {
      //   opacity: 1,
      //   zIndex: 2
      // })

      specialTl.to(extra, {
        duration: 1
      })
      // specialTl.set(extra, {
      //   opacity: 0,
      //   zIndex: -4

      // })

      specialTl.add(animateWordsIn(words, "#000000"));

      specialTl.add(animateWordsOut(words));
      // specialTl.to(extra, {
      //   clipPath: "inset(0% 100% 0% 0%)",
      //   zIndex: 3,
      //   duration: 1,
      // }, "<")

      specialTl.to(extra, {
        y: 150,
        zIndex: -5,
        opacity: 0,
        duration: 1,
      }, )

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

function setupBigSlider(wrapper) {
  // 1) Each “panel” is the .n_big-slide element
  const panels = gsap.utils.toArray(wrapper.querySelectorAll('.n_big-slide'));
  console.log(`panels`)
  console.log(panels)
  const total = panels.length;

  // 2) Inside each panel we’ll animate both the <img> and the panel
  const imgs = panels.map(p => p.querySelector('.n_big-slide_img'));
  console.log(imgs)

  // 4) Build a scrubbed, pinned timeline: one viewport per slide
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: wrapper,
      pin: true,
      scrub: 1,
      // markers: true,
      start: 'top top',
      end: `+=${(total - 1) * window.innerHeight}`,
      snap: 1 / (total - 1),
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
      ease: 'power4.inOut'
    });

    // 2) push that old image out to the right
    tl.to(prevImg, {
      xPercent: 100,
      duration: 1,
      ease: 'power4.inOut'
    }, '<');
    // 3) pull the new container in from the right
    tl.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 1, ease: 'power4.inOut' },
      '<'
    );
    // 4) pull its image in from the left
    tl.fromTo(curImg, { xPercent: -100 }, { xPercent: 0, duration: 1, ease: 'power4.inOut' },
      '<'
    );

  });
}

function initBigSliderAnimations() {
  gsap.utils.toArray('.n_big-slider_wrapper').forEach(setupBigSlider);
}

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
initBigSliderAnimations();
setTimeout(() => {
  ScrollTrigger.sort()

  ScrollTrigger.refresh();
}, 400);
