# Changelog

# Assessment 3 (HTML, CSS, Vanilla JS)

[Please see course website for full spec](https://cgi.cse.unsw.edu.au/~cs6080/NOW/assessments/assignments/ass3)

This assignment is due **_Monday the 30th of March 2026, 8pm_**.

Please run `./util/setup.sh` in your terminal before you begin. This will set up some checks in relation to the "Git Commit Requirements".

## 2. Your Task - Qanda 

In this assignment you are working on the frontend.

Your task is to build a frontend for a UNSW rip-off version of the popular forum [EdStem](https://edstem.org).

UNSW's rip-off of EdStem is called "Qanda". However, you don't have to build the entire application. You only have to build the frontend. The [backend](https://gitlab.cse.unsw.edu.au/undergraduate-courses/COMP6080/26T1/ass3-backend) is already built for you as an express server built in NodeJS (see spec).

Instead of providing visuals of what the frontend (your task) should look like, we instead are providing you with a number of clear and short requirements about expected features and behaviours.

**Important Note**: Throughout this specification, certain elements are required to be declared with specific DOM element types, IDs, and classes. Please follow these requirements carefully, as they are essential for testing and functionality.

### 2.1. Milestone 1 - Registration & Login (8%)

Milestone 1 focuses on the basic user interface to register and log in to the site.

#### 2.1.1. Login
 * When the user isn't logged in, the site shall present a login form that contains:
   * an email field (text) [`Input` with id: `login-email`]
   * a password field (password) [`Input` with id: `login-password`]
   * a submit button to login [`Button` with id: `login-submit`]
 * When the submit button is pressed, the form data should be sent to `POST /auth/login` to verify the credentials. If there is an error during login an appropriate error should appear on the screen.

#### 2.1.2. Registration
 * When the user isn't logged in, the login form shall provide a link/button [`DOMElement` with id: `register-link`] that goes to the register form. The register form will contain:
   * an email field (text) [`Input` with id: `register-email`]
   * a name field (text) [`Input` with id: `register-name`]
   * a password field (password) [`Input` with id: `register-password`]
   * a confirm password field (password) - not passed to the backend, but an error should be shown on submit if it doesn't match the other password [`Input` with id: `register-confirm-password`]
   * a submit button to register [`Button` with id: `register-submit`]
 * When the submit button is pressed, if the two passwords don't match the user should receive an error popup with text "Passwords do not match.". If they do match, the form data should be sent to `POST /auth/register` to verify the credentials. If there is an error during registration an appropriate error should appear on the screen.

#### 2.1.3. Error Popup
 * Whenever the frontend or backend produces an error, including but not limited to the login and registration processes, an error popup [`DOMElement` with id: `error-container`] shall be displayed on the screen with an appropriate message (either derived from the backend error response or meaningfully created on the frontend).
 * This popup can be closed/removed/deleted by pressing an "x" or "close" button. [`DOMElement` with id: `error-close`]

#### 2.1.4. Dashboard
 * Once a user has registered or logged in, they should arrive on the dashboard. [`DOMElement` with id: `dashboard-container`]
 * For now, the dashboard will be a blank screen that contains only a "logout" button visible at all times. [`DOMElement` with id: `logout-button`]
 * When this logout button is pressed, it removes the token from the state of the website (e.g. local storage) and then sends the user back to the login screen.

### 2.2. Milestone 2 - Making Threads (12%)

Milestone 2 focuses on how to make a thread and then view that thread (along with others).

#### 2.2.1. Making a thread

> **What is a fold?**<br>
> Above the fold content is the part of a web page shown before scrolling. Any content you'd need to scroll down to see, would be considered 'below the fold'. The 'fold' is where the browser window ends, but the content continues underneath ([source](https://www.optimizely.com/optimization-glossary/above-the-fold)).

* Somewhere above the fold on every page, logged-in users should be able to click a button [`Button` with id: `create-thread-button`] labeled "Create" that takes them to a new screen.
  * This new screen should occupy the entire page excluding any header or footers
  * On this screen contains the following content:
    * an input field for thread title [`Input` with id: `create-thread-title`]
    * an input field for body content [`DOMElement` with id: `create-thread-body`]
    * a checkbox whether or not the thread is private [`Input` with id: `create-thread-private`]
    * a submit button [`Button` with id: `create-thread-submit`]
* The submit button creates a new thread via `POST /thread`, and once the request returns successfully, return the user to an new screen that shows that thread (2.2.3), error display (2.1.3) should popup when there are any error.

#### 2.2.2. Getting a list of threads

* When you are on the dashboard, a list of threads should appear (with `GET /threads`) on the left hand side of the page, wrapped in a container [`DOMElement` with id: `thread-list-container`]
  * The width of this list should be no more than `400px` on desktop / tablet viewport.
    * (You may use your own design to display the list on mobile viewports.)
* It contains a list of threads where each thread [`DOMElement` with class: `list-thread-container`] is captured in a box no taller than `100px`.
  * Each box contains the following content:
    * Thread title [`DOMElement` with class: `list-thread-title`]
    * Post date [`DOMElement` with class: `list-thread-date`]
    * Author [`DOMElement` with class: `list-thread-author`]
    * Number of likes [`DOMElement` with class: `list-thread-likes`]
    * Two types of threads should be distinguishable visually (public vs private)
* Because the `GET /threads` API returns 5 elements at a time, you do not need to display the full list all at once. Section `2.6.1` covers how you can earn extra marks by implementing infinite scroll. However, for `2.2.2`, to receive full marks, all you need to do is include a `more` button at the bottom of the list [`Button` with id: `list-more-button`] that, when clicked, appends the next 5 elements to the bottom of the list until no more items remain, at which point the button should disappear.

#### 2.2.3. Individual thread screen

* When a particular thread is clicked in the side bar, or after a thread is created, you are taken to an "individual thread screen". [`DOMElement` with id: `thread-container`]
* This individual thread screen should include the list of threads on the left (`2.2.2`) but the main page body content of individual thread screen contains information on thread that includes:
  * Thread title [`DOMElement` with id: `thread-title`]
  * Author's Name [`DOMElement` with id: `thread-author`]
  * Body content [`DOMElement` with id: `thread-body`]
  * Number of likes [`DOMElement` with id: `thread-likes`]
* This page will later on include things like edit, delete, like, watch, comments etc, but you can skip this for `2.2.3`.
* Private threads are only visible to users who are an admin or the creator of that thread.

### 2.3. Milestone 3 - Thread Interactions (8%)

Milestone 3 focuses on how to interact with threads once they've been made

#### 2.3.1. Editing a thread

* On an individual thread screen, the user should see a "edit" button [`Button` with id: `thread-edit-button`] somewhere above the fold that allows them to edit the thread (e.g. by new page or modal).
* On this screen [`DOMElement` with id: `edit-thread-container`] should contains:
  * an input field for title [`DOMElement` with id: `edit-thread-title`]
  * content [`DOMElement` with id: `edit-thread-body`]
  * whether or not the thread is private [`DOMElement` with id: `edit-thread-private`]
  * whether or not a thread is locked. [`DOMElement` with id: `edit-thread-locked`]
* These fields are pre-populated based on the current thread data.
* This screen should also contain some form of save button [`Button` with id: `edit-thread-submit`]
* When the save button is pressed, `PUT /thread` is called which updates the details, and when that request returns, the user is taken back to the individual thread page.
* The edit button only appears if the user is an admin or a creator of that thread.

#### 2.3.2. Deleting a thread

* On an individual thread screen, the user should see a "delete" button [`Button` with id: `thread-delete-button`] somewhere above the fold that allows them to delete the thread via `DELETE /thread`.
* The delete button only appears if the user is an admin or a creator of that thread.
* Once the thread delete request is returned, the screen should redirect to the latest individual thread post from the thread list.

#### 2.3.3. Liking a thread

* On an individual thread screen, the user should see a "like" action (button, icon) [`DOMElement` with id: `thread-like-toggle`] somewhere above the fold that allows them to like or unlike a thread via `PUT /thread/like`.
* If the thread is currently liked by this user, the button should imply visually(Text / Image) that clicking it will unlike the thread. If the thread is currently not liked by this user, the button should visually imply clicking it will cause it to be liked.
* Any liking or unliking should reflect a change in the UI immediately.
* Locked threads cannot be liked, and the like button should be hidden.

#### 2.3.4. Watching a thread

* On an individual thread screen, the user should see a "watch" action (button or icon) [`DOMElement` with id: `thread-watch-toggle`] somewhere above the fold that allows them to watch or unwatch a thread via `PUT /thread/watch`.
* If the thread is currently watched by this user, the button should imply visually that clicking it will unwatch the thread. If the thread is currently not watched by this user, the button should visually imply clicking it will cause it to be watched.
* Any watching or unwatching should reflect a change in the UI immediately.

### 2.4. Milestone 4 - Comments (12%)

Milestone 4 focuses on commenting features once the threads have been made.

#### 2.4.1. Showing comments

* When an individual thread screen loads, it should load all of the relevant comments from `GET /comments` that apply to that particular thread.
* These comments should be displayed as list [`DOMElement` with id: `comment-list-container`] on the page, where each comment [`DOMElement` with class: `list-comment-container`] shows:
  * The comment text [`DOMElement` with class: `list-comment-body`]
  * A profile picture for that user that commented [`DOMElement` with class: `list-comment-profile`] 
  * The name for that user that commented [`DOMElement` with class: `list-comment-author`]
  * The time since commented in the format either [`DOMElement` with class: `list-comment-date`]
    * "Just now" if posted less than a minute ago, or
    * "[time] [denomination](s) ago" if posted more than a minute ago, e.g. "1 minute(s) ago" "7 hour(s) ago". You move from 1-59 minutes, then 1-23 hours, then 1-6 days, then 1-N weeks where N can be a number of unlimited size.
  * The number of people who have liked the comment. [`DOMElement` with class: `list-comment-likes`]
* Some comments have a parent that is another comment. These comments need to be nested under their parent comment. For each layer of nesting, there needs to be some kind of visual indentation.
* Comments must be sorted in reverse chronological order (most recent comments at the top of the page). Nested comments should be sorted within their nested area.

#### 2.4.2. Making a comment

* If there are no comments on the thread, an input/textarea box should appear below the thread information. [`DOMElement` with id: `thread-comment-text`]
  * Underneath this box, a "Comment" button should exist  [`Button` with id: `thread-comment-submit`]
  * When the comment button is pressed, the text inside the text comment should be posted as a new comment for the thread at `POST /comment`.
* If there are comments on the thread, an input/textarea box should appear but at the bottom of the comments instead. [`DOMElement` with id: `thread-comment-text`]
  * Underneath this box, a "Comment" button should exist  [`Button` with id: `thread-comment-submit`]
* Each comment should have a "reply" text/button somewhere in the space that contains the comment info. [`DOMElement` with class: `thread-reply-button`]
  * When this reply text/button is pressed, a modal [`DOMElement` with id: `thread-reply-container`] should appear that contains an input/textarea box [`DOMElement` with id: `thread-reply-text`] and a "comment" button. [`Button` with id: `thread-reply-submit`]
  * When the comment button is pressed, the text inside the text comment should be posted as a new comment for the thread at `POST /comment` and the modal should disappear.
* Locked threads cannot have a new comment added to them, comment related elements should be hidden.

#### 2.4.3. Editing a comment

* Each comment should have an "edit" text/button [`DOMElement` with class: `comment-edit-button`] somewhere in the space that contains the comment info [`DOMElement` with class: `list-comment-container`].
* When this edit text/button is pressed, a modal [`DOMElement` with id: `thread-edit-container`] should appear that contains an input/textarea box [`DOMElement` with id: `thread-edit-text`] and "comment" button. [`Button` with id: `thread-edit-submit`]
* The input/textarea box should pre-populate the current comment text.
* When the comment button is pressed, the text inside the text comment should be posted as the updated comment for the thread at `PUT /comment` and the modal should disappear.
* The edit button only appears if the user is an admin or a creator of that comment.

#### 2.4.4. Liking a comment

* Each comment should have a "like" text/button[`DOMElement` with class: `thread-like-button`]somewhere in the space that contains the comment info, the status should be implied visually(Text / Image).
* If the comment is already liked, the text/button should say "unlike".
* When the "like" text/button is pressed, the comment moves into a liked state via `PUT /comment/like`. After this change, the liked counter should change.
* When the "unlike" text/button is pressed, the comment moves into a not-liked state via `PUT /comment/like`. After this change, the liked counter should change.

### 2.5. Milestone 5 - Handling Users (10%)

Milestone 5 focuses predominately on user profiles and admins manage other admin permissions.

#### 2.5.1. Viewing a profile

* Let a user click on a user's name from a thread or comment, and be taken to a profile screen for that user. [`DOMElement` with class: `profile-container`]
* The profile screen should contain any information the backend provides for that particular user ID via (`GET /user`) (excludes the user ID and the watching thread information).
* The profile should also display all threads [`DOMElement` with id: `profile-thread-list`] made by that person. Each thread [`DOMElement` with class: `profile-thread-container`] should show the following content:
  * Title [`DOMElement` with class: `profile-thread-title`]
  * Content [`DOMElement` with class: `profile-thread-content`]
  * Number of likes [`DOMElement` with class: `profile-thread-likes`]
  * Number of comments [`DOMElement` with class: `profile-thread-comments`] 

#### 2.5.2. Viewing your own profile
* Users can view their own profile [`DOMElement` with class: `profile-container`] as if they would any other user's profile.
* A link to the users profile (via text or small icon) [`DOMElement` with id: `avatar-label`] should be visible somewhere common on most screens (at the very least on the feed screen) when logged in.

#### 2.5.3. Updating your profile
* Users can update their own personal profile via (`PUT /user`). This allows them to update their:
  * Email address
  * Password
  * Name
  * Image (has to be uploaded as a file from your system)

#### 2.5.4. Updating someone as admin

* If the user (with admin privilege) viewing another user's profile screen, they should be able to see a dropdown that includes options "User" and "Admin". [`DOMElement` with id: `user-permission`]
* The option selected in the dropdown by default on the page should reflect the user's current admin status.
* Underneath the drop down, an "Update" button should exist [`Button` with id: `user-permission-submit`], that when clicked, updates the user to that permission level.

### 2.6. Milestone 6 - Challenge Components (`advanced`) (5%)

#### 2.6.1. Infinit Scroll 
* Instead of pagination, use infinite scroll through the thread list. For infinite scroll to be properly implemented you need to progressively load threads as you scroll.
* Once users have reached the end of a set of threads, while the fetch is happening, they should see a message or icon indicating that the next set of messages are currently being fetched. 

#### 2.6.2. Live Update
* If another user likes a thread or comments on a thread that the user is viewing, the thread's likes and comments should update without requiring a page reload/refresh. This should be done with some kind of polling.

*Polling is very inefficient for browsers, but can often be used as it simplifies the technical needs on the server.*

#### 2.6.3. Push Notifications
* Users can receive push notifications when a new comment is posted on a thread they watch.
* The info should at least contain which thread has a new comment.
* To know whether a new comment has been posted to a thread, you must "poll" the server (i.e. intermittent requests, maybe every second, that check the state). 
* You can implement this either via browser's built in notification APIs or through your own custom built notifications/popups. The notifications are not required to exist outside of the webpage.

_No course assistance in lectures will be provided for this component, you should do your own research as to how to implement this. There are extensive resources online._

### 2.7. Milestone 7 - Very Challenge Components (`advanced *= 2`) (5%)

#### 2.7.1. Static feed offline access
* Users can access the most recent thread they've loaded even without an internet connection.
* Cache information from the latest thread in local storage in case of outages.
* When the user tries to interact with the website at all in offline mode (e.g. comment, like) they should receive error (2.1.3)

_No course assistance will be provided for this component, you should do your own research as to how to implement this._

#### 2.7.2 Fragment based URL routing
Users can access different pages using URL fragments:
```
* `/#thread={threadId}` to access the individual thread screen of that particular `threadId`
* `/#profile` to view the authorised user's own profile
* `/#profile={userId}` to view the profile of the user with the particular `userId`
```

_No course assistance in lectures or on the forum will be provided for this component, you should do your own research as to how to implement this._
