
# BiteSpeed Contact Identifier

This is a Node.js + TypeScript project to implement the Contact Identification logic as per the [BiteSpeed Backend Assignment](https://github.com/BiteSpeed/backend-assignment). It uses **Express**, **Prisma** (PostgreSQL ORM), and **Redis** for caching.

---

## 🧠 Problem Statement

Given a contact database where users can be associated by either **email**, **phone number**, or both, this service identifies whether a new contact:
- already exists (as a primary or secondary contact),
- is partially new (should link as secondary),
- or is completely new (should become a new primary).

---

## ⚙️ Tech Stack

- **Node.js** with **TypeScript**
- **Express.js** for server
- **Prisma ORM** with **PostgreSQL**
- **Redis** for caching
- **Render.com** for deployment

---

## 📁 Folder Structure

```
src/
├── routes/
│   └── identify.ts       # API route handler
├── services/
│   └── contactService.ts # Contact logic + DB/cache access
├── prisma/
│   └── client.ts         # Prisma client setup
├── redis.ts              # Redis client setup
└── index.ts              # Main Express entry
```

---

## 🔗 API Endpoint

**POST** [`/identify`](http://localhost:3000/identify)

### ✅ Request Body:

```json
{
  "email": "john@example.com",
  "phoneNumber": "9876543210"
}
```

- At least one of `email` or `phoneNumber` is required.

### 🔁 Response Body:

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["john@example.com", "johnny@alt.com"],
    "phoneNumbers": ["9876543210"],
    "secondaryContactIds": [2, 3]
  }
}
```

---

## 📦 Local Development

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/bitespeed-contact-identifier.git
cd bitespeed-contact-identifier
npm install
```

### 2. Set Up `.env`

Create a `.env` file:

```
DATABASE_URL=your_postgres_url
REDIS_URL=redis://localhost:6379
PORT=3000
```

### 3. Prisma Setup

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Start Server

```bash
npm run dev     # for dev with ts-node-dev
npm run build   # compile to JS
npm start       # run compiled output
```

---

## 🚀 Deployment on Render.com

### 1. Push to GitHub

```bash
git init
git remote add origin https://github.com/YOUR_USERNAME/bitespeed-contact-identifier.git
git add .
git commit -m "Initial commit"
git push -u origin main
```

### 2. Deploy Web Service

- New Web Service → Connect repo
- Build Command: `npm run build`
- Start Command: `npm start`
- Add env vars: `DATABASE_URL`, `REDIS_URL`, `PORT`

### 3. Optional: Add Redis (via Render Add-on)

---

## ✅ Scripts

```bash
npm run dev     # development with live reload
npm run build   # compile TS → JS to dist/
npm start       # run dist/index.js
```

---

## ⚡ Redis Caching

Redis key format:
```
${email || 'none'}|${phoneNumber || 'none'}
```

If a cache hit is found, it returns cached response immediately.

---

## 🧪 Example Test Cases

### ✅ New contact

```json
POST /identify
{ "email": "a@b.com", "phoneNumber": "123" }
```

### ✅ Existing contact (partial)

```json
POST /identify
{ "email": "a@b.com", "phoneNumber": "456" }
```

---

## 👨‍💻 Author

Made by Subrat Sethi  
Student @ IIT Madras  
Backend Dev · TypeScript · Redis · PostgreSQL

---
