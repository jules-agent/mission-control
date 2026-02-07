# Daily News Dashboard

Visual morning briefing integrated with Mission Control.

## 🎯 What It Does

Every morning at 6:45am, you get:
1. **Text briefing** via iMessage (like before)
2. **Visual dashboard link** at the end of the text: `📰 View visual briefing: https://mission-control-mocha-omega.vercel.app/news`

## 📊 Categories

The dashboard organizes news into:
- ⚡ **Tesla & EV** - TSLA news, EV sector, Unplugged Performance mentions
- ₿ **Crypto & Bitcoin** - BTC, ETH, crypto market, your holdings
- 📈 **Stocks & Markets** - Your portfolio holdings, market moves
- 🥃 **Whisky Investing** - Rare releases, auction prices, 2x opportunities under $1,200
- 🤖 **Technology & AI** - AI, tech sector, singularity
- 🌮 **LA Food & Culture** - Restaurant openings, food scene, Venice news
- 💡 **Business Ideas** - Growth opportunities for UP/BP/UP.FIT

## 🖼️ Features

Each article card shows:
- **Thumbnail image** (when available)
- **Headline** with source badge
- **Summary** explaining WHY it matters to you
- **Link** to read full article
- **Category grouping** for easy scanning

## 🔧 How It Works

### Architecture
```
Morning Cron (6:45am)
  ↓
Fetch news from sources
  ↓
Populate Supabase database
  ↓
Send text briefing
  ↓
Include link: mission-control.../news
```

### Database Schema
Table: `news_briefings`
- `briefing_date` - Date of briefing
- `category` - One of: tesla_ev, crypto, stocks, whisky, tech, la_food, business
- `title` - Article headline
- `summary` - Why it matters (context!)
- `url` - Full article link
- `image_url` - Thumbnail
- `source` - Publication name

### API Endpoints

**POST /api/news**
Populate daily briefing (called by cron):
```json
{
  "articles": [
    {
      "category": "tesla_ev",
      "title": "...",
      "summary": "...",
      "url": "...",
      "image_url": "...",
      "source": "Electrek"
    }
  ]
}
```

**GET /api/news**
Fetch today's briefing (used by dashboard page)

## 🚀 Setup Checklist

- [x] Create news dashboard page (`/news`)
- [x] Create API routes (`/api/news`)
- [x] Design database schema
- [ ] **Apply schema to Supabase** (manual step below)
- [ ] Update morning briefing cron to populate dashboard
- [ ] Add link to text briefing

## 📝 Setup Instructions

### 1. Apply Database Schema

Go to: https://supabase.com/dashboard/project/nqikobnkhpyfduqgfrew/editor

Run the SQL from: `supabase/news_briefings.sql`

### 2. Update Morning Briefing Cron

The cron job needs to:
1. Fetch news (already doing this)
2. Call `/api/news` with articles array
3. Send text briefing
4. Append: `\n\n📰 View visual briefing: https://mission-control-mocha-omega.vercel.app/news`

### 3. Test Locally

```bash
cd mission-control
npm run dev
# Visit http://localhost:3000/news
```

## 📖 News Sources

Configured in `/memory/news-sources.md`:
- Tesla/EV: Electrek, Teslarati, InsideEVs
- Crypto: CoinDesk, CoinTelegraph
- Stocks: Yahoo Finance, MarketWatch
- Whisky: Whisky Auctioneer, The Whisky Exchange, r/Scotch
- Tech: TechCrunch, Reuters Tech, The Verge
- LA/Food: Eater LA, LA Taco, Infatuation LA

## 🎨 Design

- SpaceX Mission Control aesthetic (matching main dashboard)
- Dark theme (slate-900/950 background)
- Gradient category icons
- Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Hover effects on cards
- Image lazy loading

## 🔐 Security

- Authentication required (NextAuth)
- RLS enabled on Supabase table
- Service role key for writes (cron job)
- Public reads for authenticated users

---

**Status:** Built, ready for schema setup + cron integration
**Live URL:** https://mission-control-mocha-omega.vercel.app/news
**Repo:** https://github.com/jules-agent/mission-control
