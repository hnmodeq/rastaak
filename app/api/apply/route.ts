import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let applicationData: Record<string, any> = {};

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        if (value instanceof File) {
          applicationData[key] = {
            name: value.name,
            size: value.size,
            type: value.type,
          };
        } else {
          applicationData[key] = value;
        }
      });
    } else {
      applicationData = await request.json();
    }

    console.log('[Next.js API] Job application received:', applicationData);

    return NextResponse.json({
      success: true,
      message: 'Application received successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to process application' },
      { status: 400 }
    );
  }
}
