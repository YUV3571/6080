Features
1. Dark / Light Theme Toggle
* ☀️ button toggles body.light
* Stored in localStorage
* Proper light theme contrast

2. Thread Search
* Search bar in sidebar
* Filters threads in real time by title

3. Sort Threads
* Options: Newest / Most Liked / Most Comments
* Instant re-render on change
Behavior:
* Works on state.allThreadData
* For full sorting → fetch all threads first
Fix:
* fetchAllThreads paginates all pages
* Then sorts complete dataset
Now:
* Newest → loads 5 at a time, no extra fetch
* Most Liked / Comments →
    * Shows loading
    * Fetches all threads
    * Sorts full dataset

4. Comment Count
* Shows 💬 count on thread cards
* Loaded asynchronously

5. Q&A Logo as Home Button
* Resets all thread-related state
* Navigates to /#dashboard
* Calls loadDashboard()
* Opens newest thread
* Has hover effect

6. Thread Count Badge
* Purple badge beside “Threads”
* Starts at 0, updates live
Problem:
* Showed only visible threads (e.g., 5)
Fix:
* Use fetchAllThreads to get total IDs
* No full thread fetch needed
Issue:
* Race condition:
    * fetchAllThreads → correct total
    * loadThreads → overwrites with partial count
Solution:
* Introduced state.totalThreadCount
* Single source of truth
Final Behavior:
* Set once on load
* Not overwritten by partial loads
* Updates on create/delete
* Resets on reload and re-fetches
