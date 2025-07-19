import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon({ searchParams }: { searchParams?: { size?: string } }) {
  const iconSize = searchParams?.size ? parseInt(searchParams.size) : 32
  const fontSize = iconSize * 0.75
  
  return new ImageResponse(
    (
      <div
        style={{
          fontSize,
          background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          borderRadius: '20%',
        }}
      >
        MV
      </div>
    ),
    // ImageResponse options
    {
      width: iconSize,
      height: iconSize,
    }
  )
} 