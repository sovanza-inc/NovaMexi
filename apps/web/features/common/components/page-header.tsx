'use client'

import {
  Box,
  Button,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import { LuBell, LuClock, LuChevronDown } from 'react-icons/lu'
import { UserMenu } from './user-menu'
import { WorkspacesMenu } from './workspaces-menu'

export interface PageHeaderProps {
  title?: string | React.ReactNode
}

export function PageHeader({ title }: PageHeaderProps) {
  const isMobile = useBreakpointValue({ base: true, md: false })

  return (
    <Box 
      bgGradient="linear(270deg, #330D38 0%, #300A4D 50%, #140E21 75%, #140E21 100%)"
      px={{ base: 3, sm: 4, md: 6, lg: 8 }} 
      py={{ base: 3, md: 4 }}
    >
      <Flex justify="space-between" align="center" gap={{ base: 2, md: 4 }}>
        {/* Left: Page Title */}
        <Heading 
          size="md" 
          color="white"
          isTruncated
          maxW={{ base: '120px', sm: '200px', md: 'none' }}
        >
          {title}
        </Heading>

        {/* Right: Actions */}
        <HStack spacing={{ base: 1, sm: 2, md: 4 }}>
          {/* Notification Bell */}
          <IconButton
            icon={<LuBell />}
            aria-label="Notifications"
            variant="ghost"
            color="white"
            size={{ base: 'sm', md: 'md' }}
            _hover={{ bg: 'whiteAlpha.200' }}
          />

          {/* Free Trial Badge */}
          <Button
            leftIcon={<Icon as={LuClock} boxSize={{ base: 3, md: 4 }} />}
            size={{ base: 'xs', md: 'sm' }}
            variant="solid"
            bg="whiteAlpha.200"
            color="white"
            _hover={{ bg: 'whiteAlpha.300' }}
            px={{ base: 2, md: 3 }}
          >
            <Text display={{ base: 'none', sm: 'inline' }}>Free Trial</Text>
            <Text 
              ml={{ base: 0, sm: 1 }} 
              color="purple.300"
              fontSize={{ base: 'xs', md: 'sm' }}
            >
              500
            </Text>
          </Button>

          {/* Language Selector */}
          <Menu>
            <MenuButton
              as={Button}
              rightIcon={<LuChevronDown />}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              size={{ base: 'xs', md: 'sm' }}
              px={{ base: 1, md: 2 }}
              minW={{ base: '40px', md: 'auto' }}
            >
              EN
            </MenuButton>
            <MenuList>
              <MenuItem>English</MenuItem>
            </MenuList>
          </Menu>

          {/* Workspace and User Menu */}
          <HStack spacing={{ base: 1, md: 2 }}>
            <WorkspacesMenu compact={isMobile} />
            <UserMenu />
          </HStack>
        </HStack>
      </Flex>
    </Box>
  )
} 