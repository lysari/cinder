# src/mainview/app/shared/layout/main-layout/tab-strip/tab-strip.component.ts

The tab strip above the content outlet of the main layout (`tabs-store.md` has the model).

- Each tab is a button with its title (`routeContextOf`; the tooltip adds the account, project and database) and a close button. The active tab is marked with `aria-current="page"` and an accent underline.
- Tabs keep a readable width (120–220 px, title ellipsised); when they do not fit the list scrolls horizontally, and the active tab is scrolled into view after every switch.
- Middle-click closes a tab (`auxclick` with button 1); `mousedown` with the middle button is cancelled so WebKit does not start autoscroll.
- "+" opens a new tab (disabled at the tab limit).
- It is a `nav`-like list of buttons rather than ARIA `tablist`/`tab` roles, because each tab holds a second control (close) and a `tab` may not contain interactive children.
