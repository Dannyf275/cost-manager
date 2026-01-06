# Cost Manager Application

A modern, responsive client-side application for tracking personal expenses, built with React.
This application uses **IndexedDB** for persistent local storage and supports multi-currency management with real-time normalization.

## 🚀 Features

### Core Functionality
* **Add Costs:** Log expenses with Amount, Currency, Category, and Description.
* **Multi-Currency Support:** Supports USD ($), ILS (₪), GBP (£), and EURO (€).
* **Currency Normalization:** All reports are automatically converted to a base currency (USD) for accurate aggregation.
* **Data Persistence:** Uses a custom `idb.js` wrapper to interact with the browser's IndexedDB.
* **History Management:** View a full history table of expenses and delete items.

### Visualization & Reports
* **Pie Chart:** Monthly breakdown of expenses by category.
* **Stacked Bar Chart:** Annual overview showing expenses per month, broken down by category stacks.
* **Dynamic Controls:** Filter reports by Year, Month, and Display Currency.

### UI/UX & Design
* **Material UI:** Clean and modern interface using MUI components.
* **Glassmorphism:** Styled header with a semi-transparent blur effect.
* **Animations:**
    * Staggered entrance animations on load.
    * Scroll-triggered fade-in/out effects using `framer-motion`.
* **Responsive Design:** optimized for various screen sizes.

### Configuration
* **Settings:** Configure a custom API URL for fetching exchange rates (defaults provided if API fails).

---

## 🛠 Tech Stack

* **Framework:** React
* **UI Library:** Material UI (@mui/material)
* **Charts:** Recharts
* **Animations:** Framer Motion
* **Icons:** MUI Icons
* **Storage:** Native IndexedDB (via Promise-based wrapper)

---

## 📂 Project Structure

The project follows specific naming conventions (snake_case filenames) and separation of concerns:

* `src/app.js` - Main entry point, handles layout, state, and animations.
* `src/idb.js` - Data Access Layer (DAL) for IndexedDB operations.
* `src/add_cost_form.js` - Component for adding new cost items.
* `src/reports.js` - Component for rendering Pie and Bar charts.
* `src/cost_table.js` - Component for displaying history and managing deletions.
* `src/settings.js` - Dialog for configuring exchange rates URL.
* `src/cost_manager_exception.js` - Custom exception handling class.

---

## 📦 Installation & Setup

1.  **Clone the repository** (or extract the project files).
2.  **Install dependencies:**
    This project requires several external libraries. Run the following command:

    ```bash
    npm install @mui/material @emotion/react @emotion/styled @mui/icons-material recharts framer-motion
    ```

3.  **Run the application:**

    ```bash
    npm start
    ```

    Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

---

## 📜 Available Scripts

In the project directory, you can run:

### `npm start`
Runs the app in the development mode.

### `npm test`
Launches the test runner in the interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

---

## Authors
**Daniel Firley**
**Michal Berlin**
**Linoy Abramovitch**
Cost Manager Client Side Project