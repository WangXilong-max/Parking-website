# 🅿️ Melbourne Parking Map

An interactive web application displaying real-time parking information across Melbourne using government open data.

**🚀 Now supports single-service deployment on Railway and other cloud platforms!**

## ✨ Features

🗺️ **Interactive MapBox-powered map** with smooth navigation and controls

🔍 **Smart address search** with intelligent zoom and location positioning

🅿️ **Real-time parking data** from Melbourne Government Open Data API

📍 **300-meter proximity filter** for finding nearby parking spots

🎯 **Location markers** with super zoom functionality on search

📱 **Responsive design** optimized for both desktop and mobile devices

⚡ **High-performance caching** with 5-minute data refresh intervals

🔄 **Automatic background sync** for up-to-date parking information

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.19.0
- MapBox access token (free at https://www.mapbox.com/)

### Setup

1. **Configure environment variables**
   ```bash
   cd ParkItRight
   cp env.example .env
   # Edit .env and add your MapBox token
   ```

2. **Install dependencies (Automatic)**
   ```bash
   npm install              # Installs frontend dependencies
   npm run install:backend  # Installs backend dependencies
   ```

### Running the Application

#### 🎯 **Option 1: Development Mode (Recommended for local development)**
```bash
npm run dev:full
```
✨ **One command starts both frontend and backend with hot reload!**
- 🖥️ Frontend: http://localhost:5173 (with hot reload)
- 🌐 Backend: http://localhost:3001

#### 🚀 **Option 2: Production Mode (Same as deployment)**
```bash
npm start
```
✨ **Simulates production environment locally**
- 🌐 Full app: http://localhost:3001 (backend serves frontend)

#### 📋 **Option 3: Manual Start (Legacy method)**
```bash
# Terminal 1: Backend
cd backend && npm start

# Terminal 2: Frontend  
npm run dev
```

## 🛠️ Tech Stack

**Frontend:** Vue 3 + Vite + MapBox GL JS + ESLint

**Backend:** Node.js + Express + node-cron + Helmet

**Data Source:** Melbourne Government Open Data API

**Features:** Real-time sync, caching, responsive design

## 📋 Usage

1. **View parking spots** - Map loads with all available parking data
2. **Search locations** - Enter any Melbourne address in the search box
3. **Filter nearby spots** - Automatically shows parking within 300m of search
4. **Check availability** - Green (available) vs Red (occupied) indicators
5. **Get details** - Click any parking spot for detailed information
6. **Refresh data** - Use refresh button to get latest parking status

## 🚀 Cloud Deployment

### Railway (Recommended)

**🎯 One-Click Deployment:**

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy on Railway:**
   - Connect your GitHub repository
   - Set environment variables:
     ```bash
     NODE_ENV=production
     MAPBOX_ACCESS_TOKEN=your_mapbox_token
     ```
   - Railway automatically uses `railway.json` configuration
   - Access your app at: `https://your-app.railway.app`

**✨ What happens automatically:**
- ✅ Installs frontend & backend dependencies
- ✅ Builds frontend static files
- ✅ Starts unified server (backend serves frontend + APIs)
- ✅ Single service, single URL, no complexity!

### Other Platforms

The project also works on **Render**, **Vercel**, **Heroku** and other platforms using:
```bash
npm start  # Uses the smart start.js script
```

## 🔧 Development

**🎯 Quick Development:**
```bash
npm run dev:full    # Start both frontend & backend with hot reload
```

**📦 Build for production:**
```bash
npm run build       # Build frontend only
npm start          # Build + start (production mode)
```

**🧹 Code quality:**
```bash
npm run lint       # ESLint  
npm run format     # Prettier
```

**🔍 Available Scripts:**
```bash
npm run dev                # Frontend dev server only
npm run dev:full           # Both frontend & backend (development)
npm start                  # Production mode (build + start backend)
npm run build              # Build frontend to dist/
npm run install:backend    # Install backend dependencies
npm run start:backend      # Start backend only
```

## 📁 Project Structure
