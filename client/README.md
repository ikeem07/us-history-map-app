# US History Map App

An interactive web application that visualizes historical events across the United States on an interactive map. Built with React, TypeScript, and MapLibre GL JS, this app allows users to explore American history through geographical and temporal lenses.

## Features

- 🗺️ **Interactive Map**: Explore historical events plotted on a detailed map of the United States
- 📅 **Timeline Navigation**: Navigate through different time periods to see events chronologically
- 🏷️ **Event Filtering**: Filter events by tags, people, and categories
- 📍 **Location-based Clustering**: Smart clustering of nearby events for better visualization
- 🔗 **Related Events**: Discover connections between historical events
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend Framework**: React 19.1.0
- **Language**: TypeScript
- **Mapping Library**: MapLibre GL JS with react-map-gl
- **UI Components**: Ant Design (antd)
- **Build Tool**: Vite
- **Styling**: CSS with TypeScript support
- **Code Quality**: Biome (linting and formatting)

## Getting Started

### Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ikeem07/us-history-map-app.git
   cd us-history-map-app/client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run code linting with Biome
- `npm run format` - Format code with Biome

## Project Structure

```
client/
├── public/                     # Static assets
│   └── vite.svg               # Vite logo
├── src/                       # Source code
│   ├── assets/                # React assets
│   │   └── react.svg         # React logo
│   ├── components/            # React components
│   │   ├── filter-sidebar.tsx # Event filtering sidebar
│   │   ├── map-legend.tsx     # Map legend component
│   │   ├── map-view.tsx       # Main map visualization
│   │   └── timeline-panel.tsx # Timeline navigation
│   ├── data/                  # Application data
│   │   └── historical-events.json # Historical events dataset
│   ├── types/                 # TypeScript type definitions
│   │   └── historical-event.ts # Event data structure
│   ├── App.css               # Main application styles
│   ├── App.tsx               # Root React component
│   ├── index.css             # Global styles
│   ├── main.tsx              # Application entry point
│   └── vite-env.d.ts         # Vite environment types
├── docs/                      # Documentation
├── eslint.config.js          # ESLint configuration
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── tsconfig.app.json         # TypeScript config for app
├── tsconfig.json             # Main TypeScript config
├── tsconfig.node.json        # TypeScript config for Node.js
├── vite.config.ts            # Vite configuration
└── README.md                 # This file
```

## Data Structure

The application uses a structured JSON format for historical events:

```typescript
type HistoricalEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  location: {
    city?: string;
    state?: string;
    latitude: number;
    longitude: number;
  };
  relatedEvents: RelatedEvent[];
  tags?: string[];
  people?: string[];
};
```

## Key Components

### MapView
The main component that renders the interactive map with historical events. Features include:
- Event clustering for better performance
- Popup displays for event details
- Integration with timeline and filtering components

### TimelinePanel
Provides chronological navigation through historical events with year-based filtering.

### FilterSidebar
Allows users to filter events by:
- Tags (e.g., "american revolution", "civil war")
- People involved
- Event categories

### MapLegend
Displays map legend and additional information about the visualization.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project uses Biome for code formatting and linting. Run the following commands before committing:

```bash
npm run lint    # Check for linting errors
npm run format  # Format code
```

## Data Sources

Historical events data is curated and stored in `src/data/historical-events.json`. Each event includes:
- Accurate geographical coordinates
- Historical context and descriptions
- Related events and connections
- Relevant tags and people

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Historical data sourced from various educational and historical institutions
- Map tiles and geographical data provided by MapLibre GL JS
- UI components from Ant Design
- Built with React and TypeScript for modern web development
