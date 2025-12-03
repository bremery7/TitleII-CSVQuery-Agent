import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

interface Settings {
  logo?: string;
}

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Load settings
function loadSettings(): Settings {
  try {
    ensureDataDir();
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('Error loading settings:', error);
    return {};
  }
}

// Save settings
function saveSettings(settings: Settings): void {
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
}

export async function GET() {
  try {
    const settings = loadSettings();
    return NextResponse.json({ logoUrl: settings.logo || null });
  } catch (error) {
    console.error('Error reading logo:', error);
    return NextResponse.json({ error: 'Failed to read logo' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { logoData } = await request.json();

    if (!logoData || !logoData.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    // Load current settings
    const settings = loadSettings();
    
    // Update logo
    settings.logo = logoData;
    
    // Save settings
    saveSettings(settings);

    return NextResponse.json({ success: true, logoUrl: logoData });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    // Load current settings
    const settings = loadSettings();
    
    // Remove logo
    delete settings.logo;
    
    // Save settings
    saveSettings(settings);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
