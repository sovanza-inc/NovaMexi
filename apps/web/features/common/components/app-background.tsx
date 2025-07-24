import { Box, useColorMode } from '@chakra-ui/react'
import { ReactNode } from 'react'

interface AppBackgroundProps {
  children: ReactNode
}

export const AppBackground = ({ children }: AppBackgroundProps) => {
  const { colorMode } = useColorMode()
  
  return (
    <Box
      minH="100vh"
      bgGradient={
        colorMode === 'dark'
          ? 'linear(270deg, #330D38 0%, #300A4D 50%, #140E21 75%, #140E21 100%)'
          : 'none'
      }
      bg={colorMode === 'light' ? 'white' : 'none'}
      transition="background 0.2s ease-in-out"
    >
      {children}
    </Box>
  )
} 