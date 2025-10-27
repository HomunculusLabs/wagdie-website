# WAGDIE Simplified

A simplified, community-maintainable version of the WAGDIE (We Are All Going to Die) NFT platform, migrated from Google Cloud Platform to modern, developer-friendly infrastructure.

## Overview

This project represents a complete architectural simplification of the original WAGDIE platform, moving from:
- **Google Cloud Firestore** → **Supabase (PostgreSQL)**
- **Google Cloud Platform** → **Vercel**
- **iron-session** → **Simple cookie-based sessions with SIWE**
- **Complex GraphQL codegen** → **Direct database queries**

## Key Features

- **SIWE Authentication**: Secure wallet-based authentication using Sign-In with Ethereum
- **NFT Character Management**: Track and display WAGDIE NFT characters
- **Simplified Database**: PostgreSQL with auto-generated REST APIs via Supabase
- **Modern Stack**: Next.js 15, TypeScript, Tailwind CSS
- **Zero Infrastructure**: No Docker, no complex deployment pipelines

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: SIWE (Sign-In with Ethereum)
- **Blockchain**: wagmi, viem, ethers
- **Deployment**: Vercel (zero-config)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A wallet provider (MetaMask, Rainbow, etc.)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/wagdie-simplified.git
cd wagdie-simplified
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API
3. Copy your project URL and anon key
4. In the SQL Editor, run the migration file:
   ```bash
   # Copy contents of supabase/migrations/20250101000000_initial_schema.sql
   # and run it in the Supabase SQL Editor
   ```

### 4. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
wagdie-simplified/
├── app/                      # Next.js 15 App Router
│   ├── api/auth/            # SIWE authentication endpoints
│   │   ├── nonce/           # Generate nonce for signing
│   │   ├── verify/          # Verify SIWE signature
│   │   └── logout/          # Clear session
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── auth/               # Authentication components
│   └── ui/                 # UI components
├── lib/                    # Core utilities
│   ├── auth/              # Authentication utilities
│   │   └── siwe.ts        # SIWE verification logic
│   ├── supabase.ts        # Supabase client
│   └── database.types.ts  # TypeScript database types
├── hooks/                 # Custom React hooks
├── types/                # TypeScript type definitions
├── supabase/
│   └── migrations/       # Database migration files
└── public/              # Static assets
```

## Authentication Flow

1. User clicks "Connect Wallet"
2. Frontend requests a nonce from `/api/auth/nonce`
3. User signs a SIWE message with the nonce
4. Frontend sends message + signature to `/api/auth/verify`
5. Backend verifies signature and creates/updates user in database
6. Session cookie is set with user's Ethereum address

## Database Schema

### Users Table
- Tracks wallet addresses and login history
- Stores user preferences

### Characters Table
- NFT character data (token ID, owner, metadata)
- Game state (burned, infected, location)

### Tweets Table
- Social content related to WAGDIE

### Locations Table
- Game locations for staking/positioning

See `supabase/migrations/20250101000000_initial_schema.sql` for full schema.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

That's it! No Docker, no Cloud Build, no complex configuration.

## Migration from Original WAGDIE

If you're migrating data from the original Firestore database:

1. Export data from Firestore
2. Transform to match new PostgreSQL schema
3. Import using Supabase dashboard or SQL scripts

See `MIGRATION_PLAN.md` for detailed migration steps.

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Key Differences from Original

### Removed Complexity
- No Google Cloud infrastructure
- No Docker containers
- No GraphQL code generation
- No complex session management
- No Firestore indexes/rules

### Simplified Architecture
- Direct PostgreSQL queries via Supabase
- Simple cookie-based sessions
- Automatic REST API generation
- Web dashboard for database management

### Maintained Features
- SIWE authentication (essential for NFT projects)
- NFT character tracking
- User session management
- All core functionality

## Contributing

Contributions are welcome! This project is designed to be community-maintainable.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions:
- Open an issue on GitHub
- Check the original MIGRATION_PLAN.md for architecture details

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Original WAGDIE team for the creative vision
- Community members contributing to the simplified version
- Supabase and Vercel for excellent developer tools
