import { extendTheme } from '@chakra-ui/react'
import { theme as baseTheme } from '@saas-ui-pro/react'

import { components } from './components'
import { semanticTokens } from './foundations/semantic-tokens'
// import colorScheme from './color-schemes/galaxy'

export const theme = extendTheme(
  {
    semanticTokens,
    components,
    fonts: {
      heading: 'Lato, sans-serif',
      body: 'Lato, sans-serif',
      mono: 'SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace',
    },
    colors: {
      primary: baseTheme.colors.purple,
    },
    config: {
      initialColorMode: 'dark',
      useSystemColorMode: false,
    },
  },
  baseTheme,
)
