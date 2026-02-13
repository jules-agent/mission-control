import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Parse PROJECTS.md into structured data for the UI
function parseProjectsMd(content: string) {
  const projects: Array<{
    name: string;
    status: string;
    statusEmoji: string;
    lastActivity: string;
    keyAccomplishment: string;
    entries: Array<{ date: string; title: string; items: string[] }>;
  }> = [];

  // Parse the quick reference table
  const tableRegex = /\| \[([^\]]+)\][^\|]+\| ([^\|]+)\| ([^\|]+)\| ([^\|]+)\|/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const statusRaw = match[2].trim();
    const emojiMatch = statusRaw.match(/^(🟢|🟡|🔴|✅|📋)/);
    projects.push({
      name: match[1].trim(),
      statusEmoji: emojiMatch ? emojiMatch[1] : '⚪',
      status: statusRaw.replace(/^(🟢|🟡|🔴|✅|📋)\s*/, ''),
      lastActivity: match[3].trim(),
      keyAccomplishment: match[4].trim(),
      entries: [],
    });
  }

  // Parse detail sections for each project
  for (const project of projects) {
    const sectionRegex = new RegExp(
      `## ${project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n---\\n|\\n## [^#]|$)`
    );
    const sectionMatch = content.match(sectionRegex);
    if (!sectionMatch) continue;

    const section = sectionMatch[0];
    const entryRegex = /### (.+?)(?:\n)([\s\S]*?)(?=\n###|\n---|\n## |$)/g;
    let entryMatch;
    while ((entryMatch = entryRegex.exec(section)) !== null) {
      const items = entryMatch[2]
        .split('\n')
        .filter(l => l.startsWith('- '))
        .map(l => l.replace(/^- /, '').trim());
      const titleParts = entryMatch[1].trim().split(' — ');
      projects.find(p => p.name === project.name)?.entries.push({
        date: titleParts[0] || '',
        title: titleParts[1] || titleParts[0],
        items,
      });
    }
  }

  return projects;
}

export async function GET() {
  try {
    const projectsPath = join(process.env.WORKSPACE_PATH || '/Users/jules/.openclaw/workspace', 'PROJECTS.md');
    const content = await readFile(projectsPath, 'utf-8');
    const projects = parseProjectsMd(content);
    
    // Get last modified time
    const { stat } = await import('fs/promises');
    const stats = await stat(projectsPath);
    
    return NextResponse.json({
      projects,
      lastUpdated: stats.mtime.toISOString(),
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status.includes('Active')).length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read projects', details: String(error) }, { status: 500 });
  }
}
