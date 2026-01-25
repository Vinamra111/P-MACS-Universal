# P-MACS Web Dashboard

Modern web interface for the P-MACS (Pharmacy - Management and Control System) with AI-powered assistant.

## Features

- 📊 **Real-time Dashboard** - Monitor inventory, alerts, and analytics
- 💬 **AI Chat Assistant** - Natural language queries powered by GPT-4o-mini
- 🚨 **Alert Management** - Critical, warning, and info alerts with filtering
- 📈 **Analytics** - Inventory trends and category breakdowns
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- OpenAI API key

### Installation

```bash
# Install dependencies (from monorepo root)
pnpm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local and add your OPENAI_API_KEY
```

### Development

```bash
# Start development server
cd packages/web
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Usage

### Dashboard View

The dashboard provides an overview of:
- Total items, low stock, expiring items, and stockouts
- Active alerts with severity filtering
- Recent activity feed
- Inventory breakdown by category

### AI Assistant View

Chat with the AI assistant to:
- Query inventory: "Show me all Morphine stock"
- Check expiring drugs: "What drugs are expiring in the next 30 days?"
- Get shortage alerts: "Give me critical shortage alerts"
- View location status: "Show ICU inventory status"

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: LangChain + OpenAI GPT-4o-mini
- **Backend**: P-MACS Core (CSV database)

## Project Structure

```
packages/web/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   │   └── chat/       # Chat endpoint
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Dashboard.tsx
│   │   ├── ChatInterface.tsx
│   │   ├── AlertsPanel.tsx
│   │   ├── StatsCard.tsx
│   │   └── InventoryChart.tsx
│   └── lib/
│       └── utils.ts        # Utility functions
├── public/                 # Static files
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## API Endpoints

### POST /api/chat

Send messages to the AI assistant.

**Request:**
```json
{
  "message": "Show me all Propofol stock"
}
```

**Response:**
```json
{
  "response": "Here is the current stock information for Propofol 20mg/mL...",
  "success": true
}
```

## Environment Variables

- `OPENAI_API_KEY` - Your OpenAI API key (required)

## Contributing

See the main [P-MACS repository](../../README.md) for contribution guidelines.

## License

Proprietary - Hospital Internal Use
