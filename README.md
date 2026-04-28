# ASL Master: AI-Powered Sign Language Learning Platform

ASL Master is a cutting-edge educational platform designed to bridge the communication gap through American Sign Language (ASL). Leveraging **Computer Vision** and **Real-time AI**, the platform provides an interactive environment for users to learn, practice, and master sign language.

![ASL Master Preview](https://via.placeholder.com/1200x600?text=ASL+Master+Platform+Preview)

## 🚀 Key Features

- **Real-time AI Recognition:** Powered by **MediaPipe** and **TensorFlow.js**, our practice studio identifies hand gestures and fingerspelling in real-time with high fidelity.
- **Structured Curriculum:** Organized learning paths featuring Units, Chapters, and Lessons tailored for progressive mastery.
- **Vocabulary Mastery Dashboard:** Track your progress through every sign, with automated mastery calculations based on practice performance.
- **Centralized Sign Library:** A robust content management system for instructors to manage high-quality sign resources and video assets.
- **Personalized Progress:** Detailed user profiles tracking lesson completion, accuracy rates, and learning streaks.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Frontend:** [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/)
- **AI/Vision:** [MediaPipe Hands & Holistic](https://developers.google.com/mediapipe), [TensorFlow.js](https://www.tensorflow.org/js)
- **Database & Auth:** [Supabase](https://supabase.com/), [Prisma ORM](https://www.prisma.io/), [NextAuth.js v5](https://next-auth.js.org/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/), [Lucide React](https://lucide.dev/)

## 📦 Getting Started

### Prerequisites
- Node.js 20+ 
- A Supabase project (PostgreSQL)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Alanroy777/asl-master.git
   cd asl-master
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory and add your credentials:
   ```env
   DATABASE_URL="your_postgresql_url"
   DIRECT_URL="your_direct_url"
   NEXTAUTH_SECRET="your_secret"
   NEXT_PUBLIC_SUPABASE_URL="your_url"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your_key"
   ```

4. **Database Migration:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server:**
   ```bash
   npm run dev
   ```

## 📄 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ for the ASL Community.*
