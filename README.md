# 🏠 Greenfield HOA Management System

A modern, full-featured Homeowners Association (HOA) management system built with React, Vite, and Supabase.

## ✨ Features

- **Member Management**: Add, edit, and manage HOA members
- **Lot Payments**: Track property payments and payment history
- **Contributions**: Handle various HOA contributions and fees
- **Penalties**: Manage violations and penalty enforcement
- **Dashboard**: Comprehensive overview with statistics
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Icons**: Lucide React
- **Routing**: React Router
- **State Management**: Zustand

## 📦 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/D0N311/Greenfield.git
   cd Greenfield
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Supabase credentials:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🌐 Deployment

### Netlify (Recommended)

1. Push your code to GitHub
2. Connect your repository to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables in Netlify dashboard

### Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy automatically

### GitHub Pages

1. Enable GitHub Pages in repository settings
2. Add secrets for environment variables
3. Push to main branch to trigger deployment

## 🔧 Environment Variables

| Variable                 | Description                 | Required |
| ------------------------ | --------------------------- | -------- |
| `VITE_SUPABASE_URL`      | Your Supabase project URL   | Yes      |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Yes      |

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries (Supabase config)
├── pages/              # Page components
├── stores/             # State management
└── assets/             # Static assets
```

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request
