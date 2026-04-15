import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: credentialId } = await params;
    console.log('Document request for credential:', credentialId);
    
    const response = await fetch(`${BACKEND_URL}/credentials/${credentialId}/document`, {
      method: 'GET',
    });

    console.log('Backend response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Document not found' }));
      console.log('Backend error:', error);
      return NextResponse.json({ success: false, error: error.error || 'Document not found' }, { status: response.status });
    }

    // Forward the response with correct content type
    const data = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = response.headers.get('content-disposition') || 'inline';

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
      },
    });
  } catch (error) {
    console.error('Document fetch error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}