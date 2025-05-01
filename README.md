# NovaFi - Mauritius Accounting MVP

A modern accounting web application focused on Mauritius businesses, featuring expense tracking, VAT handling, and bank data ingestion.

## Features

- **User Authentication**
  - JWT-based login system
  - Role-based access (admin/accountant)

- **Invoice Processing**
  - OCR-based invoice scanning
  - Automatic VAT detection and calculation
  - Vendor information extraction

- **CSV Data Import**
  - Bulk transaction import
  - Automatic categorization
  - Data validation

- **Bank Statement Processing**
  - PDF statement parsing
  - Balance tracking
  - Transaction categorization

- **Accounting Dashboard**
  - Profit & Loss tracking
  - VAT liability monitoring
  - Bank balance overview
  

## Tech Stack

### Frontend
- Vue.js 3
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js
- MongoDB

### Key Libraries
- Tesseract.js (OCR)
- pdf-parse (PDF processing)
- papaparse (CSV handling)

## Project Structure

```
novafi/
├── frontend/           # Vue.js frontend application
├── backend/           # Node.js/Express backend
├── docs/             # Documentation
└── README.md         # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/novafi.git
cd novafi
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
```bash
cp .env.example .env
```

5. Start the development servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

## Security

- JWT tokens stored in HTTP-only cookies
- Rate limiting implemented for file uploads
- Input validation and sanitization
- Role-based access control

## License

MIT License 

## Restarting the Application

To restart both the frontend and backend applications:

1. Run the restart script using Node.js:
   ```
   node restart.js
   ```

2. Alternatively, on Windows, you can use the batch file:
   ```
   restart.bat
   ```

This will:
- Terminate any running processes on ports 5173 (frontend) and 3000 (backend)
- Restart the backend first, then the frontend
- Display output from both applications in the terminal

If you need to customize the ports, edit the `restart.js` file. 