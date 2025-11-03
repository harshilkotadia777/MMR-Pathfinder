# Mumbai Metro Pathfinder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An intelligent and visually rich route planner for the Mumbai Metro network. This application provides users with an interactive map to find the shortest path between stations, including support for multi-stop journeys.

![Mumbai Metro Pathfinder Screenshot](https://storage.googleapis.com/aistudio-hosting/workspace-storage/e0a29f57-b0b2-45e1-881c-0b81a704403d/127.0.0.1_5500_.png)

---

## ✨ Features

- **Interactive Metro Map:** A dynamic and zoomable map of the Mumbai Metro network, built with Leaflet.js.
- **Shortest Route Calculation:** Implements Slime Mold Algorithm to find the most efficient route between any two stations, factoring in distance and line-change penalties.
- **Multi-Stop Journeys:** Plan complex trips with one or more intermediate "via" stops.
- **Dynamic Station Selection:** User-friendly searchable dropdowns make it easy to select start, end, and via stations.
- **Map-Based Interaction:**
  - **Click to Select:** Quickly set your start and end points by clicking on stations.
  - **Right-Click Context Menu:** Set start, end, or via points from anywhere on the map.
- **Animated Route Visualization:** The calculated path is drawn on the map with an elegant "ant path" animation.
- **Detailed Itinerary:** View a step-by-step breakdown of your journey, including line changes and intermediate stations.
- **Sleek Landing Page:** A modern, animated landing page to introduce the application.
- **Responsive Design:** A clean UI that works seamlessly across different screen sizes.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript
- **Mapping:** Leaflet.js
- **Styling:** Tailwind CSS
- **Pathfinding Algorithm:** Slime Mold Algorithm implemented in TypeScript
- **Build Tool:** Vite (or similar modern bundler like esbuild)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have Node.js and npm (or yarn) installed on your system.

- [Node.js](https://nodejs.org/) (which includes npm)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/mumbai-metro-pathfinder.git
    cd mumbai-metro-pathfinder
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```
    or if you use yarn:
    ```sh
    yarn install
    ```

3.  **Run the development server:**
    ```sh
    npm run dev
    ```
    or
    ```sh
    yarn dev
    ```

4.  Open your browser and navigate to `http://localhost:5173` (or the URL provided by your terminal).

---

## 📂 Project Structure

The project is organized with a focus on clarity and separation of concerns.

```
/
├── public/
│   └── # Static assets
├── src/
│   ├── App.tsx             # Main application component (handles landing page vs. pathfinder)
│   ├── constants.ts        # Static data for metro stations and connections
│   ├── index.css           # Global styles (if any)
│   ├── index.tsx           # React entry point
│   └── vite-env.d.ts       # TypeScript definitions for Vite
├── index.html              # Main HTML file
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # You are here!
```

---

## 🧠 How It Works

The core logic of the application revolves around a graph data structure and a classic pathfinding algorithm.

1.  **Graph Representation:** The Mumbai Metro network is modeled as a graph, where each station is a **node** and each connection between stations is an **edge**. The `constants.ts` file contains this data.
2.  **Edge Weighting:** The "cost" (or weight) of traversing an edge is calculated using the Haversine formula for geographical distance. A small penalty is added for interchanges to favor routes with fewer line changes.
3.  **Pathfinding:** When a user requests a route, **Slime Mold Algorithm** is executed on the graph to find the path with the lowest cumulative cost from the start node to the end node. For multi-stop routes, the algorithm is run sequentially for each segment of the journey.
4.  **Map Rendering:** The Leaflet.js library is used to render the map tiles, draw the metro lines, and place markers for each station. The calculated route is then visualized as an animated polyline on the map.

---

## 👤 Author

**Harshil Kotadia**
- Email: [harshil.kotadia@gmail.com](mailto:harshil.kotadia@gmail.com)


