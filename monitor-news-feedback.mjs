#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('📊 Analyzing news feedback patterns...\n');

// Fetch all feedback
const { data: feedback, error } = await supabase
  .from('news_feedback')
  .select('*')
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Error fetching feedback:', error);
  process.exit(1);
}

console.log(`Total feedback entries: ${feedback.length}`);
console.log(`Thumbs up: ${feedback.filter(f => f.vote === 'up').length}`);
console.log(`Thumbs down: ${feedback.filter(f => f.vote === 'down').length}\n`);

// Analyze by category
const byCategory = {};
feedback.forEach(f => {
  if (!byCategory[f.category]) {
    byCategory[f.category] = { up: 0, down: 0, comments: [] };
  }
  byCategory[f.category][f.vote]++;
  if (f.comment) {
    byCategory[f.category].comments.push({
      title: f.article_title,
      comment: f.comment,
      url: f.article_url
    });
  }
});

console.log('📈 Category Performance:\n');
Object.entries(byCategory).forEach(([cat, stats]) => {
  const total = stats.up + stats.down;
  const upPct = ((stats.up / total) * 100).toFixed(0);
  const signal = upPct >= 60 ? '✅' : upPct >= 40 ? '⚠️' : '❌';
  console.log(`${signal} ${cat}: ${stats.up}👍 / ${stats.down}👎 (${upPct}% positive)`);
});

// Analyze patterns from comments
console.log('\n💡 Learning from Comments:\n');

const patterns = {
  'Random tickers (not in portfolio)': [],
  'E-bikes / not Tesla EVs': [],
  'Gaming / not interested': [],
  'Mainstream food chains': [],
  'Generic/vague headlines': []
};

feedback.filter(f => f.vote === 'down' && f.comment).forEach(f => {
  const comment = f.comment.toLowerCase();
  const title = f.article_title.toLowerCase();
  
  if (comment.includes('ticker') && comment.includes('not') && comment.includes('following')) {
    patterns['Random tickers (not in portfolio)'].push(f.article_title);
  }
  if (comment.includes('e-bike') || comment.includes('e bike')) {
    patterns['E-bikes / not Tesla EVs'].push(f.article_title);
  }
  if (comment.includes('gamer') || comment.includes('gaming')) {
    patterns['Gaming / not interested'].push(f.article_title);
  }
  if (comment.includes('pizza hut') || comment.includes('mainstream')) {
    patterns['Mainstream food chains'].push(f.article_title);
  }
  if (comment.includes('headline') || comment.includes('generalized') || comment.includes('no reason')) {
    patterns['Generic/vague headlines'].push(f.article_title);
  }
});

Object.entries(patterns).forEach(([pattern, examples]) => {
  if (examples.length > 0) {
    console.log(`❌ ${pattern}: ${examples.length} instances`);
    examples.slice(0, 2).forEach(ex => console.log(`   - "${ex}"`));
  }
});

// Recommendations
console.log('\n🎯 Recommendations:\n');

const stocksScore = byCategory['stocks'] ? (byCategory['stocks'].up / (byCategory['stocks'].up + byCategory['stocks'].down)) : 0;
if (stocksScore < 0.3) {
  console.log('1. ❌ Stocks category performing poorly (< 30% positive)');
  console.log('   → Filter to Ben\'s portfolio tickers only (TSLA, NVDA, MSFT, etc.)');
  console.log('   → Keep macro market news (Fed, rates, major indices)');
}

if (patterns['E-bikes / not Tesla EVs'].length > 0) {
  console.log('2. ❌ E-bike content rejected');
  console.log('   → Filter out e-bike, e-scooter content from EV feeds');
}

if (patterns['Gaming / not interested'].length > 0) {
  console.log('3. ❌ Gaming content rejected');
  console.log('   → Filter out gaming, PS5, Switch, Xbox from tech feeds');
}

if (patterns['Mainstream food chains'].length > 0) {
  console.log('4. ❌ Mainstream chain restaurants rejected');
  console.log('   → Filter out Pizza Hut, McDonald\'s, etc. Keep local/indie spots');
}

console.log('\n✅ Run this script weekly to monitor feedback trends');
