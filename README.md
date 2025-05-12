# ASCII Renderer

An interactive 3D renderer that converts Three.js scenes into ASCII art in real time. It supports CPU and GPU rendering modes, model import, and terrain generation.

## Features

- **Real-Time ASCII Rendering:** Render Three.js scenes as dynamic ASCII art.
- **GPU & CPU Modes:** Choose between GPU-accelerated and CPU-based ASCII conversion.
- **Model Import:** Import 3D models (OBJ, STL, GLTF, GLB).
- **Interactive Controls:** Uses lil-gui for dynamically adjusting settings such as resolution, character ramp, lighting, and terrain.
- **Terrain Generation:** Create procedural terrain using simplex noise.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (comes with Node.js)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/JacksonHoggard/ascii-renderer.git
   cd ascii-renderer
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Running in Development

Use Vite's development server:
```bash
npm run dev
```
Open your browser and navigate to [http://localhost:3000](http://localhost:3000) (the port may vary).

### Building for Production

Generate a production build with:
```bash
npm run build
```

Preview the production build locally:
```bash
npm run preview
```

## Project Structure

- **/src**
  - `main.js` - Main entry point. Sets up Three.js, lil-gui, and rendering.
  - `AsciiEffect.js` - Implements the ASCII effect using a Web Worker.
  - `AsciiEffectGPU.js` - Implements GPU-based ASCII rendering using Three.js shader passes.
  - `AsciiCalculator.js` - Contains helper functions to convert image data into ASCII characters.
  - `AsciiWorker.js` - Web Worker script for offloading ASCII conversion tasks.
  - `AsciiShader.js` - Shader for the GPU ASCII effect.
- **index.html** - Entry HTML file.
- **styles.css** - Basic styling for the renderer.
- **vite.config.js** - Vite configuration.
- **package.json** - NPM package configuration.

## Usage

- **Adjust Settings:** Use the lil-gui interface to adjust renderer settings (e.g., resolution, color inversion, character ramp).
- **Import Models:** In the GUI under "Import Model", click the button to select and import your 3D model files.
- **Export Options:** Export the rendered ASCII art as text or JPEG images via the GUI export options.

## License

This project is licensed under the ISC License.

## Acknowledgments

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)
- [lil-gui](https://lil-gui.georgealways.com/)
- [simplex-noise](https://github.com/jwagner/simplex-noise.js)