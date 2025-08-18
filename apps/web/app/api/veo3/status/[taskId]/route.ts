import { NextRequest, NextResponse } from 'next/server'
import { getVEO3API } from '#lib/veo3-api'

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params

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
    console.error('VEO3 Status Error:', error)
    
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
