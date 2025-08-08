# 🥢 Grocery Planner – Daily Asian-Inspired Meal Viewer

This is a lightweight, mobile-friendly web app that displays **daily grocery lists** for a week of Thai & Chinese-inspired healthy meals.  
It’s designed to be hosted on **GitHub Pages** so you can share daily links via SMS, email, or chat.

---

## 📌 Live Demo
[View the Grocery Planner](https://seuth325.github.io/grocery-planner/)

---

## 📂 Project Structure
```
grocery-planner/
│
├── index.html          # Main web page
├── style.css           # Styling
├── script.js           # JavaScript with URL day parameter loading
│
└── data/               # Daily grocery list JSON files
    ├── monday_grocery.json
    ├── tuesday_grocery.json
    ├── wednesday_grocery.json
    ├── thursday_grocery.json
    ├── friday_grocery.json
    ├── saturday_grocery.json
    └── sunday_grocery.json
```

---

## 🛠 Features
- **Dropdown menu** to pick a day
- **Direct URL access** to a specific day (e.g.  
  `https://seuth325.github.io/grocery-planner/?day=thursday`)
- Mobile-friendly design
- Fully static – no server required

---

## 🚀 How to Use
1. **Select a day** from the dropdown to view that day’s grocery list.
2. Or, **share a direct link** with a `?day=` parameter to jump to a specific day.
   - Example:  
     ```
     https://seuth325.github.io/grocery-planner/?day=wednesday
     ```

---

## 📤 Deployment on GitHub Pages
1. Push all files to your `grocery-planner` repository on GitHub.
2. Go to **Settings → Pages**.
3. Set **Branch** to `main` and **Folder** to `/ (root)`.
4. Save and open your published site at:  
   ```
   https://seuth325.github.io/grocery-planner/
   ```

---

## 📧 Daily SMS Integration
You can pair this with services like:
- [Twilio](https://www.twilio.com/)
- [Vibe](https://vibe.dev/)
- [Zapier](https://zapier.com/)

…to send automated daily texts containing the grocery link.

---

## 📜 License
This project is open-source. Feel free to fork and customize for your own meal plans.

---
