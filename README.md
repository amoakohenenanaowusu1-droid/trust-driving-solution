# Trust Driving Solution – Online Lesson Scheduling

A complete, ready-to-use demo website for **Trust Driving Solution** (DVLA Approved Driving School) that lets students book driving lessons and instructors manage availability.

Includes the official promo flyer and road safety poster images.

## What’s included

- **Home page** – Hero with promo flyer, features, lesson types (Regular / Express / Expresso / Refresher), instructors, road safety poster
- **Book a Lesson** – 3-step booking flow (lesson type → date/time → student details)
- **My Schedule** – Students look up bookings by email and can cancel
- **Instructor Panel** – Add availability blocks and view all upcoming lessons

All data is stored in the browser’s `localStorage` (no backend required). Perfect for demos or as a starting point.

## How to open

1. Open `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. That’s it – no build step or server needed.

Or serve the folder with any static file server:

```bash
# Example with Python
cd trust-driving-school
python -m http.server 8080
# then visit http://localhost:8080
```

## How to use the demo

### As a student
1. Go to **Book a Lesson**.
2. Choose a lesson type and (optionally) an instructor.
3. Pick an available green time slot on the calendar.
4. Enter your name, email and phone → **Confirm Booking**.
5. On **My Schedule**, enter the same email to see or cancel lessons.

### As an instructor / admin
1. Open **Instructor Panel**.
2. Select instructor, date, and a time range → **Add Time Slots**.
3. The system creates 1-hour slots that students can book.
4. View all confirmed lessons and remaining open availability.

## Customisation ideas

- Change school name, colours, prices and lesson types in `app.js` and `index.html`.
- Connect to a real backend / database later.
- Add email/SMS notifications, payments (Stripe), or Google Calendar sync.

---

Built as a self-contained demo for Trust Driving School.
