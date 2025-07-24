import { cardTheme } from './card'
import { pageTheme } from './page'
import { toolbarTheme } from './toolbar'

export const components = {
  Card: cardTheme,
  SuiToolbar: toolbarTheme,
  SuiPage: pageTheme,
  Button: {
    defaultProps: {
      colorScheme: 'purple',
    },
    variants: {
      outline: {
        borderColor: '#8C52FF',
        _hover: {
          borderColor: '#8C52FF',
        },
        _active: {
          borderColor: '#8C52FF',
        },
        _focus: {
          borderColor: '#8C52FF',
          boxShadow: '0 0 0 1px #8C52FF',
        },
      },
    },
  },
  SubmitButton: {
    defaultProps: {
      colorScheme: 'purple',
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          _hover: {
            borderColor: '#8C52FF',
            boxShadow: '0 0 0 1px #8C52FF',
          },
          _focus: {
            borderColor: '#8C52FF',
            boxShadow: '0 0 0 1px #8C52FF',
          },
        },
      },
    },
  },
}
