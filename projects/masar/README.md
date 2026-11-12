# MASAR — Slower travel, richer stories

An editorial slow-travel concept site featuring Petra, AlUla and Wadi Rum, with a built-in itinerary planner.

**Live demo:** https://2rawan.github.io/My_Portfolio/projects/masar/

## Features
- Responsive layout (down to 360px) with sticky header, mobile menu and smooth scrolling
- Destination detail modals with short descriptions
- Itinerary builder: pick destinations, days per place and a start date; generates a day-by-day plan saved in `localStorage`
- Newsletter form with email validation and success message
- Destination search and reveal-on-scroll animations
- Accessible: semantic HTML, alt text, focus styles, modal focus trap and Esc to close, reduced-motion support

## Tech
Plain HTML, CSS and vanilla JavaScript. No build step, no frameworks. Fonts: Cormorant Garamond and Jost via Google Fonts.

## Run locally
```bash
cd projects/masar
python3 -m http.server 8000
# open http://localhost:8000
```
Or open `index.html` directly in a browser.

## Author
Rawan Jarada
