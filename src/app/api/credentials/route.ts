import { NextResponse } from 'next/server';

// Backend URL - use internal proxy in production
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '10';
    const studentAddress = searchParams.get('studentAddress');
    const issuerAddress = searchParams.get('issuerAddress');
    const status = searchParams.get('status');

    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.set('page', page);
    queryParams.set('limit', limit);
    if (studentAddress) queryParams.set('studentAddress', studentAddress);
    if (issuerAddress) queryParams.set('issuerAddress', issuerAddress);
    if (status) queryParams.set('status', status);

    // Get token from header only
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    const response = await fetch(`${BACKEND_URL}/credentials?${queryParams.toString()}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      return NextResponse.json({ success: false, error: error.error || 'Failed to fetch credentials' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Get token from header only
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      return NextResponse.json({ success: false, error: error.error || 'Failed to create credential' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
