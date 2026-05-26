'use client'

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import { themeConfig } from '../../theme.js'

const system = createSystem(defaultConfig, {
  ...themeConfig,
  theme: {
    ...themeConfig.theme,
    recipes: {
      button: {
        base: {
          borderRadius: "lg",
        }
      }
    }
  }
})

export function Provider(props) {
  return (
    <ChakraProvider value={system}>
      {props.children}
    </ChakraProvider>
  )
}
