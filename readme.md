# 🛒 Multi-Vendor Product Price Tracker

A **Final Year Project (FYP)** that helps users track and compare product prices across multiple marketplaces (Amazon, eBay, AliExpress, Daraz, Alibaba, etc.) in real-time.  
The system provides **price comparison, historical trend analysis, and price-drop notifications** to enhance smart shopping decisions.  

---

## 🚀 Features
- 🔍 Search products across multiple marketplaces  
- 🏷️ Real-time price comparison with vendor logos  
- 📈 Price history trends with interactive charts  
- 📬 Email/SMS notifications for price drops (via AWS Lambda / Nodemailer)  
- 👤 User authentication and personalized watchlist  
- 🌗 Dark / Light mode with modern UI  

---

## 🛠️ Tech Stack
**Frontend:** React.js, TailwindCSS, Chart.js  
**Backend:** Node.js, Express.js  
**Database:** MongoDB  
**Data Retrieval:** REST APIs + Web Scraping (fallback)  
**Notifications:** AWS Lambda + SNS / Nodemailer  

---

## 📂 Project Structure
Multi-vendor-be-/
│── backend/ # Backend (Node.js, Express.js, MongoDB)
│── frontend/ # Frontend (React.js + TailwindCSS)
│── README.md
│── .gitignore


---

## ⚡ Installation & Setup
### 1️⃣ Clone the repository
```bash
git clone https://github.com/farhan-4201/Multi-vendor-be-.git
cd Multi-vendor-be-
