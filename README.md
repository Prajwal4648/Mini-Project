# CodeReviewX - Live Code Editor

A modern, real-time code editor built with React and Vite. Write HTML, CSS, and JavaScript and see your changes instantly in a live preview pane.

## Features

- 🎨 **Live Preview** - See your code changes in real-time
- 🌓 **Dark/Light Mode** - Toggle between dark and light themes
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🖼️ **Flexible Layout** - Switch between horizontal and vertical split views
- ⚡ **Fast** - Built with Vite for lightning-fast development
- 🎯 **Modern UI** - Clean interface with Tailwind CSS

## Project Structure

```
Mini Project/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx        # Top navigation bar
│   │   ├── EditorPane.jsx    # Code editor component
│   │   └── PreviewPane.jsx   # Live preview component
│   ├── utils/
│   │   └── constants.js      # Default code and constants
│   ├── App.jsx               # Main application component
│   ├── main.jsx              # Application entry point
│   └── index.css             # Global styles
├── index.html                # HTML template
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── postcss.config.js         # PostCSS configuration
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Both Frontend and Backend Together** (Recommended)
   ```bash
   npm start
   ```
   This will start:
   - Frontend on http://localhost:3000
   - Backend server on http://localhost:3001

3. **Or Run Separately**
   
   Frontend only:
   ```bash
   npm run dev
   ```
   
   Backend server only:
   ```bash
   npm run server
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

5. **Preview Production Build**
   ```bash
   npm run preview
   ```

## Important Note

The Java compilation feature requires the backend server to be running. The backend server acts as a proxy to avoid CORS issues when calling the JDoodle API.

## Technologies Used

- **React** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

## License

MIT
