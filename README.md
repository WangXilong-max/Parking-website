# 🅿️ Melbourne Parking Map

An interactive web application displaying real-time parking information across Melbourne using government open data.

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
   cd Parking-Project
   cp env.example .env
   # Edit .env and add your MapBox token
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

### Running the Application

**Start Backend Server:**
```bash
cd Parking-Project/backend
npm start
```
🌐 Backend runs on: http://localhost:3001

**Start Frontend (new terminal):**
```bash
cd Parking-Project
npm run dev
```
🖥️ Frontend runs on: http://localhost:5173

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

## 🔧 Development

**Development mode with hot reload:**
```bash
# Frontend
npm run dev

# Backend (with nodemon)
cd backend && npm run dev
```

**Build for production:**
```bash
npm run build
npm run preview
```

**Code quality:**
```bash
npm run lint    # ESLint
npm run format  # Prettier
```

## 📁 Project Structure
