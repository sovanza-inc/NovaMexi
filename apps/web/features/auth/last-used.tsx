import { useEffect, useState } from 'react'

import { Tooltip } from '@chakra-ui/react'
import { useLocalStorageValue } from '@react-hookz/web'

export function LastUsedProvider(props: {
  children: React.ReactNode
  value: string
}) {
  const lastUsed = useLocalStorageValue('lastUsedProvider')

  const [match, setMatch] = useState(false)

  useEffect(() => {
    // not pretty, but we trigger this after first render, to prevent SSR mismatch
    // and trigger animation on load
    setMatch(lastUsed.value === props.value)
  }, [match, lastUsed.value, props.value])

  return (
    <Tooltip
      label="Last used"
      isDisabled={!match}
      placement="end"
      isOpen={match}
      hasArrow
      border="0"
      boxShadow="none"
      bgGradient="linear(270deg, #330D38 0%, #300A4D 50%, #140E21 75%, #140E21 100%)"
      _dark={{
        bgGradient: 'linear(270deg, #330D38 0%, #300A4D 50%, #140E21 75%, #140E21 100%)',
      }}
    >
      {props.children}
    </Tooltip>
  )
}
