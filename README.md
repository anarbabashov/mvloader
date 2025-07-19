# MVLoader - YouTube Music/Video Downloader

A modern, fast, and user-friendly YouTube music/video downloader built with Next.js. Convert and download YouTube videos to MP3 or MP4 format with just a few clicks.

[![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-blue?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

## Features

- 🎵 Convert YouTube videos to MP3 or MP4
- 🚀 Fast conversion and download speeds
- 💻 No software installation required
- 🌐 Support for multiple languages
- 🌙 Dark/Light theme support
- 📱 Fully responsive design
- 🔒 Secure and private - no personal information required
- 💯 100% free to use

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone git@github.com:anarbabashov/mvloader.git
cd mvloader
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: 
  - Radix UI
  - Lucide Icons
  - shadcn/ui components
- **Form Handling**: React Hook Form
- **State Management**: React Hooks
- **Theme**: next-themes
- **Validation**: Zod

## Project Structure

```
mvloader/
├── app/                # Next.js app directory
│   ├── about/         # About page
│   ├── faq/           # FAQ page
│   ├── features/      # Features page
│   └── layout.tsx     # Root layout
├── components/        # React components
│   ├── ui/           # UI components
│   └── ...           # Feature components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions
├── public/           # Static assets
└── styles/           # Global styles
```

## Features in Detail

1. **Video Download**
   - Support for YouTube URLs
   - Multiple format options (MP3, MP4)
   - Real-time URL validation
   - Progress tracking

2. **User Interface**
   - Clean and modern design
   - Responsive layout
   - Dark/Light theme toggle
   - Mobile-friendly navigation

3. **Internationalization**
   - Support for 26+ languages
   - Easy language switching

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please visit our [FAQ page](/faq) or open an issue in the repository.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
