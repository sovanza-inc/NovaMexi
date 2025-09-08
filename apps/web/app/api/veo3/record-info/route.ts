import { NextRequest, NextResponse } from 'next/server'
import { getVEO3API } from '#lib/veo3-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      )
    }

    const veo3API = getVEO3API()
    const result = await veo3API.checkStatus(taskId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('VEO3 Record Info Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
