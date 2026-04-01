# Changelog
N / A

# Assessment 1 (HTML, CSS)

[Please see course website for full spec](https://cgi.cse.unsw.edu.au/~cs6080/NOW/assessments/assignments/ass1)

This assignment is due Monday 2nd of March @ 8pm.

Please run `./util/setup.sh` in your terminal before you begin. This will set up some checks in relation to the "Git Commit Requirements".

## Your Task - Replicator

### 1. Task 1 - Static, fixed size page

Build a page that looks identical to [task1/page.png](task1/page.png). The window width you should work with is 2135 × 1880 pixels. You are only allowed to use HTML and CSS for this task. No external libraries are permitted.

Please build your page in [task1/index.html](task1/index.html). You are welcome to create as many CSS files that you need in the `task1` folder for `index.html` to import. When being marked, your tutor will start with `index.html`.

#### Assets

- The asset(s) are provided in `task1/assets`.
- The font used on this page should match exactly. The font used is `sans-serif` for the page.

### 2. Task 2 - Static, fixed size page

Build a page that looks identical to [task2/page.png](task2/page.png). The window width you should work with is 3024 × 1782 pixels. You are only allowed to use HTML and CSS for this task. No external libraries are permitted.

Please build your page in `task2/index.html`. You are welcome to create as many CSS files that you need in the `task2` folder for `index.html` to import. When being marked, your tutor will start with `index.html`.

**Some students may have noticed that the monospace font appears different on Windows 11. As Hayden has mentioned in lectures, we mark very leniently with fonts not matching perfectly purely because the SAME font can look different on different machines. This particular term we've had trouble with windows.**

Even though it doesn't matter, what if I'm nervous?
Whilst you don't need to perfect your font, but if you'd like to then:

- Use Chromium or Firefox on CSE: Log into a CSE machine and check your site using browsers on CSE servers. This is a neutral ground that closely mirrors our marking environment.
- Don't let this distract you from the main functionality. Finish the assignment first, then use the CSE check as a final "sanity tweak" before submission.


#### Assets

- The asset(s) are provided in `task2/assets`.
- The font used on this page should match exactly. The font used is `monospace` for the page.

### 3. Task 3 - Responsive, static page

Build a responsive page that complies with [task3/page_big.png](task3/page_big.png) and [task3/page_small.png](task3/page_small.png). The big page is 1979 × 1847 pixels, and the small page is 420 × 1680 pixels. Your single page (note that you're not using two separate HTML files) should look identical to either of these pages depending on the window size the browser is at.

You are expected to have reasonable intermediate states. In other words, if the window size is some combination of widths between 1979 and 420, heights between 1847 and 1680, the page should still reflect the same general structure.

Please build your page in `task3/index.html`. You are welcome to create as many CSS files that you need in the `task3` folder for `index.html` to import. When being marked, your tutor will start with `index.html`.

On top of this you are required to:
 * Ensure that the *Get started* buttons have a brightness of 125% on hover.

#### Assets

- The asset(s) are provided in `task3/assets`.
- The font used on this page should match exactly. The font used for text is `Inter`. The required `<link>` tags are provided in `assets/font.html` and should be copied into your `index.html`.

# Assumptions

- Markers are aware that font rendering can vary between different browsers and operating systems. As long as you have used the correct font specified for the task and made a reasonable effort to match the intended design, we will not penalize minor typography inconsistencies and will show some leniency in this area.
