'use client'

import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'

const system = createSystem(defaultConfig, {
  theme: {
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
