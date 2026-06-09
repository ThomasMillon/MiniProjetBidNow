# BidNow - Luxury Real-time Auction Platform

BidNow is a high-end auction marketplace where collectors can bid on rare items in real-time.

## Features
- **Luxury Design**: A sophisticated UI with deep midnight blue and gold accents.
- **Real-time Bidding**: Instant updates for new bids and auction status changes.
- **Auto-Closure**: Auctions automatically close at the specified time, announcing the winner.
- **Secure Auth**: JWT-based authentication with bcrypt password hashing.
- **Native MongoDB**: Clean implementation using the native MongoDB driver.

## Tech Stack
- **Backend**: Node.js, Express, MongoDB Native Driver, Socket.IO
- **Frontend**: Vue.js 3, Vite, Pinia, Axios, Socket.IO Client

## Installation

### 1. Prerequisites
- Node.js (>= 18)
- MongoDB instance running locally (default: `mongodb://localhost:27017`)

### 2. Backend Setup
```bash
cd backend
npm install
# Configure .env (see .env.example)
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables (.env)
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for token signing

## Demonstration Scenario
1. **Register** two accounts (e.g., *CollectorA* and *CollectorB*).
2. **Login** as *CollectorA* and **List an Item** (e.g., "Vintage Rolex") with a 2-minute duration.
3. **Login** as *CollectorB* (in another tab/browser) and navigate to the item detail.
4. **Place a Bid** as *CollectorB*. Observe the price update instantly for *CollectorA*.
5. **Wait** for the timer to expire. The item status will change to "Sold" and *CollectorB* will be crowned winner.
6. **Delete**: *CollectorA* can now delete the finished auction.
