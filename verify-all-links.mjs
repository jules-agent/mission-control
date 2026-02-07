#!/usr/bin/env node

console.log('🔍 Verifying all news links...\n');

// Fetch from API
const response = await fetch('https://mission-control-mocha-omega.vercel.app/api/news');
const data = await response.json();

console.log(`📅 Briefing Date: ${data.briefing_date}`);
console.log(`📰 Total Articles: ${data.total}\n`);

const allArticles = [];
for (const [category, articles] of Object.entries(data.categories)) {
  allArticles.push(...articles.map(a => ({ ...a, category })));
}

console.log('Testing URLs...\n');

let working = 0;
let broken = 0;

for (const article of allArticles.slice(0, 10)) {
  try {
    const urlCheck = await fetch(article.url, { method: 'HEAD' });
    const status = urlCheck.status;
    const icon = status === 200 ? '✅' : '❌';
    
    if (status === 200) {
      working++;
    } else {
      broken++;
    }
    
    console.log(`${icon} [${status}] ${article.category}: ${article.title.substring(0, 60)}...`);
    console.log(`   ${article.url}\n`);
  } catch (error) {
    broken++;
    console.log(`❌ [ERROR] ${article.category}: ${article.title.substring(0, 60)}...`);
    console.log(`   ${article.url}`);
    console.log(`   Error: ${error.message}\n`);
  }
}

console.log(`\n📊 Results: ${working} working, ${broken} broken`);
