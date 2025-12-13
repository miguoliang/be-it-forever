# Be It Forever (背它一辈子)

[![CI](https://github.com/miguoliang/be-it-forever/actions/workflows/ci.yml/badge.svg)](https://github.com/miguoliang/be-it-forever/actions/workflows/ci.yml)
![Netlify](https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=flat&logo=netlify&logoColor=white)
[![License](https://img.shields.io/github/license/miguoliang/be-it-forever)](LICENSE)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radix-ui&logoColor=white)
![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)
![Day.js](https://img.shields.io/badge/Day.js-FB6052?style=for-the-badge&logo=javascript&logoColor=white)

**Be It Forever** is a modern, spaced-repetition learning application designed to help you master knowledge for a lifetime. Built with the latest web technologies, it offers a seamless learning experience with algorithm-based reviews, text-to-speech support, and comprehensive progress tracking.

## 🚀 Key Features

*   **🧠 Spaced Repetition (SM-2)**: Optimize your learning with the proven Anki-based SM-2 algorithm.
*   **🗣️ Text-to-Speech**: Integrated US and UK pronunciation support for immersive language learning.
*   **📊 Visual Statistics**: Track your progress with heatmaps, mastery levels, and daily streaks.
*   **🛠️ Operator Dashboard**: Powerful backend interface for content management, batch imports, and user administration.
*   **📱 Responsive Design**: A beautiful, mobile-first interface built with Tailwind CSS and Radix UI.
*   **🔐 Role-Based Access**: Secure authentication and authorization with Learner, Operator, and Manager roles.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database & Auth**: [Supabase](https://supabase.com/)
*   **State Management**: [TanStack Query](https://tanstack.com/query/latest)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Utilities**: [Day.js](https://day.js.org/) (Date handling), [PapaParse](https://www.papaparse.com/) (CSV)

## 📦 Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/miguoliang/be-it-forever.git
    cd be-it-forever
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file with your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).