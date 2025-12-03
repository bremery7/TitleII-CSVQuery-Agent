import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LOGO_DIR = path.join(process.cwd(), 'public', 'branding');
const LOGO_FILE = path.join(LOGO_DIR, 'logo.txt');

// Ensure directory exists
if (!fs.existsSync(LOGO_DIR)) {
  fs.mkdirSync(LOGO_DIR, { recursive: true });
}

export async function GET() {
  try {
    if (fs.existsSync(LOGO_FILE)) {
      const logoData = fs.readFileSync(LOGO_FILE, 'utf-8');
      return NextResponse.json({ logoUrl: logoData });
    }
    return NextResponse.json({ logoUrl: null });
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

    // Save the base64 data
    fs.writeFileSync(LOGO_FILE, logoData, 'utf-8');

    return NextResponse.json({ success: true, logoUrl: logoData });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(LOGO_FILE)) {
      fs.unlinkSync(LOGO_FILE);
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting logo:', error);
    return NextResponse.json({ error: 'Failed to delete logo' }, { status: 500 });
  }
}
