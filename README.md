# BigQuery Release Notes & X (Twitter) Composer Dashboard

A premium, responsive dark-mode Flask web application that parses and aggregates Google Cloud's BigQuery Release Notes feed. It includes an interactive X (Twitter) composer that lets you select any specific release update, auto-fits the summary to meet X's 280-character limit, and provides real-time validation before posting.

## 🚀 Key Features

* **Live RSS/Atom Parsing**: Fetches the official Google Cloud BigQuery release notes XML feed in real-time.
* **Granular Extraction**: Parses and separates daily updates into individual, selectable cards classified by type (`Feature`, `Changed`, `Deprecation`, etc.).
* **Keyword Search & Category Filters**: Search updates by text queries or isolate specific release classifications using dynamic pill filters.
* **Premium Glassmorphic Design**: Dark-mode dashboard built with radial background glow orbs, frosted glass components, and seamless animations.
* **Smart X (Twitter) Composer**: 
  - Automatically formats a template with the release title, update date, type, and source documentation link.
  - Dynamically truncates the update body text to ensure the complete post fits within the 280-character limit.
  - Real-time character counts and warning badges if the limit is exceeded.
  - One-click posting using Twitter Web Intents.

---

## 🛠️ Technology Stack

* **Backend**: Python, Flask, requests, XML parsing (xml.etree.ElementTree), Regular Expressions (re)
* **Frontend**: HTML5 (Semantic Structure), CSS3 (Custom Variables, Flexbox/Grid, Backdrop-filter blurs, Animations), JavaScript (Vanilla ES6, Live DOM rendering)
* **Icons & Typography**: Lucide Icons, Google Fonts (Outfit, Inter)

---

## 📦 Directory Structure

```text
├── app.py                  # Flask application server (XML parsing & JSON API)
├── templates/
│   └── index.html          # Main HTML structure & Layout
├── static/
│   ├── app.js              # Application logic, filters, and character auto-fit
│   └── style.css           # Premium dark-mode styling and UI aesthetics
├── .gitignore              # Git ignore configuration
└── README.md               # Project documentation
```

---

## 💻 Quick Start & Installation

### 1. Prerequisites
Ensure you have **Python 3.8+** installed on your machine.

### 2. Clone the Repository
```bash
git clone https://github.com/saibrahmani12/Brahmani-event-talks-app.git
cd Brahmani-event-talks-app
```

### 3. Setup Virtual Environment (Recommended)
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install Flask requests
```

### 5. Run the Server
```bash
python app.py
```
Open **[http://127.0.0.1:5000](http://127.0.0.1:5000)** in your web browser.

---

## 📝 Usage Guide

1. **Browse & Refresh**: The dashboard loads the feed automatically. Click **Refresh** to sync the latest updates.
2. **Search & Filter**: Type keywords into the search bar or use the pill selectors to find a particular update.
3. **Select an Update**: Click on any update card on the left pane. This highlights the card and loads it into the **Tweet Composer** on the right.
4. **Draft and Post**: Modify the tweet text in the editor if desired. The character counter updates dynamically. Click **Tweet on X** to preview and publish the tweet on your X account.
