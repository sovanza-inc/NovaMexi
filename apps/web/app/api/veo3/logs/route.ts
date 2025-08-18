import { NextRequest, NextResponse } from 'next/server'
import { getVEO3API } from '#lib/veo3-api'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const page = searchParams.get('page')
    const limit = searchParams.get('limit')
    const status = searchParams.get('status')
    const model = searchParams.get('model')

    const veo3API = getVEO3API()

    const params: any = {}
    if (page) params.page = parseInt(page)
    if (limit) params.limit = parseInt(limit)
    if (status) params.status = status
    if (model) params.model = model

    const result = await veo3API.getLogs(params)

    return NextResponse.json(result)
  } catch (error) {
    console.error('VEO3 Logs Error:', error)
    
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
