import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';
import { tokens } from '@/tokens/design-tokens';

export const runtime = 'nodejs';

const executeFile = promisify(execFile);
const tokenSourcePath = path.join(process.cwd(), 'tokens', 'design-tokens.ts');

type Collection = 'colors' | 'scene';

type TokenUpdate = {
  collection: Collection;
  name: string;
  value: string;
};

const isCollection = (value: unknown): value is Collection => value === 'colors' || value === 'scene';

const isValidValue = (collection: Collection, value: string) => {
  if (collection === 'scene') return /^0x[0-9a-f]{6}$/i.test(value);
  return /^oklch\(\s*[\d.]+%\s+[\d.]+\s+[\d.]+(?:\s*\/\s*[\d.]+)?\s*\)$/i.test(value);
};

export async function POST(request: Request) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  let update: TokenUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (!isCollection(update.collection) || typeof update.name !== 'string' || typeof update.value !== 'string') {
    return NextResponse.json({ error: 'Invalid token update.' }, { status: 400 });
  }

  const collection = update.collection === 'colors' ? tokens.colors : tokens.scene;
  if (!(update.name in collection) || !isValidValue(update.collection, update.value)) {
    return NextResponse.json({ error: 'Unknown token or invalid value.' }, { status: 400 });
  }

  const source = await fs.readFile(tokenSourcePath, 'utf8');
  const startMarker = update.collection === 'colors' ? '  colors: {' : '  scene: {';
  const start = source.indexOf(startMarker);
  const end = source.indexOf('\n  },', start);
  if (start < 0 || end < 0) {
    return NextResponse.json({ error: 'Unable to locate the token collection.' }, { status: 500 });
  }

  const section = source.slice(start, end);
  const value = update.collection === 'colors' ? `'${update.value}'` : update.value.toLowerCase();
  const property = new RegExp(`^(\\s*)${update.name}:\\s*[^,\\n]+,`, 'm');
  if (!property.test(section)) {
    return NextResponse.json({ error: 'Unable to locate the requested token.' }, { status: 500 });
  }

  const updatedSection = section.replace(property, (_match, indentation: string) => `${indentation}${update.name}: ${value},`);
  await fs.writeFile(tokenSourcePath, source.slice(0, start) + updatedSection + source.slice(end));

  try {
    await executeFile(process.execPath, [path.join(process.cwd(), 'scripts', 'generate-design-tokens.mjs')], {
      cwd: process.cwd(),
    });
  } catch {
    return NextResponse.json({
      error: 'The token source was updated, but generation failed. Run npm run tokens:generate manually.',
    }, { status: 500 });
  }

  return NextResponse.json({
    message: 'Saved to tokens/design-tokens.ts and regenerated runtime token files.',
    value: update.value,
  });
}
