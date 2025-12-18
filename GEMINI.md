# GEMINI.md: ilouli.com Frontend

## Project Overview

This is the frontend for `ilouli.com`, a web platform built with React.

According to the Product Requirements Document (PRD), `ilouli.com` is envisioned as a multi-faceted portal. Its primary goals are:
-   To serve as a brand portal for a parent company and its subsidiaries.
-   To provide an **AI Storyboard Pipeline**, an innovative tool for creators.
-   To offer a secure, private digital space for families.

The project follows a "Freemium" model with different user tiers (Guest, General, Subscriber, Family, Admin), each with distinct permissions and features.

The design specification calls for a minimalist, high-quality aesthetic inspired by apple.com, with a focus on smooth user experience and responsive design.

### Core Features (as planned in PRD):
-   **AI Storyboard:** A step-by-step tool to turn ideas into visual stories, including a "Character Lock" feature to maintain character consistency across scenes.
-   **Family Space:** A private area for 'Family' tier users, including a smart calendar and an AI photo gallery.
-   **Corporate Portal:** Pages like "About Us" and "Our Ventures".
-   **Community:** A hybrid of a blog and a forum for user interaction.

## Project Structure

The codebase is a standard Create React App project located in the `frontend/` directory.

-   `frontend/public/`: Contains the main `index.html` file and other static assets.
-   `frontend/src/`: Contains the React source code.
    -   `index.js`: The main entry point that renders the `App` component.
    -   `App.js`: The root component that sets up the main application routing.
    -   `components/`: Contains the individual React components, each corresponding to a major feature of the site:
        -   `LandingPage.js`: The main landing page.
        -   `NavigationBar.js`: The site's main navigation.
        -   `AIStoryboard.js`: Placeholder for the AI Storyboard feature.
        -   `FamilySpace.js`: Placeholder for the family-only section.
        -   `Profile.js`: Placeholder for the user profile page.

## Building and Running

The project is managed with `npm`. All commands should be run from the `frontend/` directory.

-   **To start the development server:**
    ```bash
    npm start
    ```
    This will run the app in development mode, accessible at [http://localhost:3000](http://localhost:3000).

-   **To run tests:**
    ```bash
    npm test
    ```
    This launches the test runner in interactive watch mode.

-   **To build the application for production:**
    ```bash
    npm run build
    ```
    This builds the app to the `frontend/build` folder.

## Development Conventions

-   **Framework:** The project uses [React](https://reactjs.org/) (v19.2.3) and was bootstrapped with Create React App.
-   **Routing:** Routing is handled by [React Router](https://reactrouter.com/) (v7.10.1).
-   **Styling:** Standard CSS is used via `.css` files imported into components.
-   **Testing:** The project is set up with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing.
-   **Linting:** The project uses the default ESLint configuration provided by Create React App.

## Key Files

-   `PRD.md`: **(HIGHLY IMPORTANT)** The Product Requirements Document, containing the vision, goals, and detailed feature specifications for the project.
-   `frontend/package.json`: Defines dependencies, scripts, and project metadata.
-   `frontend/src/App.js`: The main application component, defining the page structure and routes.
-   `frontend/src/components/`: Directory containing the UI components that make up the application.
