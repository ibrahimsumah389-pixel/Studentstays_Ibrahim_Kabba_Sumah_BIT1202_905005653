# StudentStay — Responsive Student Accommodation Website

DCOMP 204 Web Design · Assignment 2: Development of a Responsive Multi-Page Website
Limkokwing University of Creative Technology, Sierra Leone

StudentStay helps students find, compare and request student accommodation in Freetown. It also gives property owners a simple way to list rooms. This website is the coded version of my Assignment 1 Figma design.

**Live site:** `https://YOUR-USERNAME.github.io/studentstay/` *(update after enabling GitHub Pages)*
**Figma prototype:** https://www.figma.com/design/C83AYLQIImimS9DjvjVw86/Untitled?node-id=9-365

---

## Pages (8)

| Page | File | What it does |
| --- | --- | --- |
| Home | `index.html` | Hero, accommodation search, featured listings, owner call-to-action |
| Find Accommodation | `accommodation.html` | Search results with location, price, room type and facility filters, sorting, active-filter chips and an empty-results message |
| Listing Details | `listing.html?id=...` | Photo, price, specs, facilities, save button, **Request this room** form, provider contact, similar places |
| Saved & Compare | `saved.html` | Side-by-side comparison table of saved listings, highlighting the lowest price |
| Services | `services.html` | Four services from the Figma design, a section for property owners and FAQs |
| About | `about.html` | About StudentStay, "How it works" (Search → Compare → Contact), key numbers |
| Contact | `contact.html` | Contact details, office hours, and a 2-step contact form: the visitor enters their details, **verifies their phone with a 6-digit code**, then sends the message by **WhatsApp or SMS** to +232 33 982076 |
| List Your Property | `list-property.html` | Register/Log in tabs → Add listing form → Owner dashboard where **every cell is clickable** (listing, location, rent, status) to view, edit, change status or delete |

The structure follows the sitemap and navigation structure from Assignment 1:
**Home** → Find Accommodation · Services · About · Contact · List Your Property.

## Responsive design

The CSS is written **mobile-first** in `css/style.css`:

| Range | Layout |
| --- | --- |
| < 600px (mobile) | Single column, hamburger menu (the *List Property* button stays visible), full-width buttons, 44px touch targets |
| 600–959px (tablet) | Two-column grids, side-by-side contact layout, horizontal search results |
| ≥ 720px | Two-column hero, three-column featured cards |
| ≥ 960px (desktop) | Full horizontal navigation, three- and four-column grids, results with actions on the right |

Techniques used: CSS Grid and Flexbox, `clamp()` for fluid headings, `aspect-ratio` for images, a horizontally scrollable comparison table with a sticky first column, and `prefers-reduced-motion` support.

Screenshots of every page at **desktop (1440px), tablet (768px) and mobile (390px)** are in [`/screenshots`](screenshots).

## Design fidelity

| Figma token | Value |
| --- | --- |
| Primary (buttons, logo) | `#1E3A5F` navy |
| Headings | `#12233B` |
| Body text | `#4A5B70` |
| Hero band | `#DDE6F1` |
| Section background | `#EDF2F9` |
| Borders | `#D5DEEA` |
| Typeface | Inter (Google Fonts), uppercase display headings |

I replaced the image placeholders from the wireframes with photographs of each residence and a campus photo for the hero. I resized and compressed the photos from about 3.5 MB to about 200 KB each (1200px wide, JPEG quality 78), which supports the Assignment 1 goal of keeping pages light for users on limited mobile data.

| Photo | Used on |
| --- | --- |
| `students.jpg` | Home hero |
| `wilberforce-court.jpg` | Listing, About page |
| `kingtom-studios.jpg` | Listing, List Property page |
| `fourah-bay-lodge.jpg` | Listing |
| `tower-hill-house.jpg` | Listing, Services page |
| `brookfields-hall.jpg` | Listing |
| `mount-aureol-residence.jpg` | Listing |

## Contact form: phone verification

The contact form works in two steps:

1. The visitor enters their name, email, **phone number** and message. Sierra Leone numbers such as `033 982076` are converted to `+232 33 982076`.
2. A **6-digit code** is sent to that phone. The visitor types it in to prove the number is theirs. The code expires after 5 minutes, allows 3 wrong tries, and can be resent after 30 seconds.

In this version (`DEMO_SMS = true` in `js/main.js`), the code appears on screen as a text-message notification, because a static GitHub Pages site cannot send SMS by itself. To send real texts, connect an SMS provider (for example Firebase Phone Auth, Twilio or Africa's Talking) inside `sendVerificationCode()` and set `DEMO_SMS` to `false`.

## Contact form → your phone

The contact form sends messages to **+232 33 982076** (033 982076). GitHub Pages only serves static files and cannot send SMS by itself, so once the visitor's phone is verified it opens:

- **WhatsApp** (`https://wa.me/23233982076?text=…`), or
- the phone's **SMS app** (`sms:+23233982076?&body=…`)

with the name, email, verified phone number and message already written. The visitor taps **Send**. To change the number, edit `STUDENTSTAY_PHONE` at the top of `js/main.js`.

## Code quality and accessibility

- Semantic HTML5: `header`, `nav`, `main`, `section`, `article`, `aside`, `footer`, `figure`, `address`, `details`/`summary`, `dl`, and tables with `caption` and `scope`
- A skip link, visible keyboard focus, `aria-current` on the active page, an accessible mobile menu (`aria-expanded`, closes with Esc) and keyboard-navigable tabs
- Every form field has a `<label>`, with error messages linked through `aria-describedby` and `aria-invalid`, and success messages announced with `role="status"`
- Descriptive `alt` text on every image, one `<h1>` per page and a logical heading order
- JavaScript is separated into data (`js/listings.js`) and behaviour (`js/main.js`). User content is escaped before it is inserted into the page.
- Saved listings, requests and owner listings are stored in `localStorage` *(demo only; a real site would use a server and database)*

## Folder structure

```
studentstay/
├── index.html
├── accommodation.html
├── listing.html
├── saved.html
├── services.html
├── about.html
├── contact.html
├── list-property.html
├── css/
│   └── style.css
├── js/
│   ├── listings.js      # listing data
│   └── main.js          # navigation, filters, forms, compare, dashboard
├── images/              # residence photos (JPG) + favicon
├── screenshots/         # desktop / tablet / mobile screenshots
└── README.md
```

## Run locally

No build step is needed. Open `index.html` in a browser, or use the VS Code **Live Server** extension.

## Technologies

HTML5, CSS3 (Grid, Flexbox, custom properties, media queries), vanilla JavaScript (ES6), Git and GitHub, GitHub Pages.

## Author

**[Your Name]** · Student ID: **[Your ID]** · DCOMP 204 Web Design · Examiner: Amadu Kamara

# Studentstays_Ibrahim_Kabba_Sumah_BIT1202_905005653
