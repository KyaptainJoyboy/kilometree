# Kilometree Prototype Web App

This directory contains a simple prototype for the **Kilometree** project, an environmentally focused web application that encourages users to convert their daily physical activity into tree sapling donations.  The goal of this prototype is to showcase a mobile‑first design that looks and feels like an Android application while remaining entirely web based.

## Files

| File                    | Description                                                                            |
|-------------------------|----------------------------------------------------------------------------------------|
| `index.html`            | Main HTML file containing the structure and content of the app.                        |
| `assets/css/style.css`  | Custom CSS styles to complement Bootstrap and provide an eco‑friendly theme.          |
| `assets/js/app.js`      | JavaScript code responsible for simulating the step counter and updating the UI.      |

## How to Run

Simply open `index.html` in any modern web browser.  No additional server is required; everything runs client side.  For a more realistic experience, view the app on a mobile device or using your browser’s mobile device emulation tools.

## Customizing Images

Image placeholders have been left blank (`<img src="" alt="..." />`) throughout the HTML.  Replace the empty `src` attributes with the URLs or file paths to your desired images to personalize the look and feel of the app.  Be sure the images are sized appropriately for mobile devices.

## Features Demonstrated

* **Mobile‑first responsive layout** using [Bootstrap 5](https://getbootstrap.com/)
* **Step counter simulation** that increments steps and kilometers and converts them into saplings
* **Visual progress indicators**, including cards and progress bars, to track donations
* **Placeholder sections** for Google integrations such as Forms, Calendar events and YouTube uploads
* **Clean, organized code** separated into HTML, CSS and JavaScript files for maintainability

Feel free to build upon this structure to add real integrations with Google APIs (Forms, Calendar, Sheets, YouTube) and more advanced features.