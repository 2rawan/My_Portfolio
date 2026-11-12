# NABD — Fitness Dashboard

NABD ("Move better, live brighter") is a dark-themed fitness dashboard concept with an activity ring, weekly movement chart, training plans, health metrics and a next-session planner.

**Live demo:** https://2rawan.github.io/My_Portfolio/projects/nabd/

## Features

- Time-of-day greeting (morning / afternoon / evening)
- Animated daily-goal ring with stats; **Log activity** adds steps and updates ring, calories, km and active minutes
- Weekly Movement chart drawn as inline SVG, with a Steps / Calories / Active minutes switcher and hover / keyboard tooltips
- **View Workout** modal with an exercise checklist and a working countdown timer
- **Add to Calendar** downloads a real `.ics` file
- Hash-routed views: Dashboard, Training (tick off sessions), Nutrition (water and meal tracker), Wellbeing (mood check-in, breathing exercise, sleep goal), Progress, Community (join challenges)
- Live search that filters items in the current view
- State saved in `localStorage`
- Collapsible sidebar on desktop, bottom navigation on mobile, responsive down to 360px
- Accessible: semantic landmarks, ARIA labels, visible focus states, keyboard usable, reduced-motion support

## Tech

Plain HTML, CSS and vanilla JavaScript. No build step, no frameworks, no JS libraries. Charts are hand-written SVG. Font: Manrope (Google Fonts).

## Run locally

```bash
cd projects/nabd
python3 -m http.server 8000
# open http://localhost:8000
```

Or simply open `index.html` in a browser.

## Author

Rawan Jarada
