import React, { useEffect, useState } from 'react'

import {
  Backdrop,
  Box,
  Collapse,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  SxProps,
  Theme,
  Typography,
} from '@mui/material'
import getConfig from 'next/config'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next'

import { AiSearchBar } from '@/components/common'
import { useDebounce, useGetSearchSuggestion2 } from '@/hooks'

const style = {
  paper: {
    borderRadius: 0,
    position: 'relative',
    zIndex: 1400,
    width: '100%',
    maxWidth: { xs: '100%', md: 661 },
  } as SxProps<Theme> | undefined,
  list: {
    p: 2,
  },
  listItem: {
    '&:focus': {
      backgroundColor: 'transparent',
    },
    '&:hover': {
      backgroundColor: 'transparent',
    },
  },
  listItemText: {
    fontSize: (theme: Theme) => theme.typography.body2,
    margin: 0,
  } as SxProps<Theme> | undefined,
}

interface AiSearchSuggestionsProps {
  onEnterSearch?: () => void
  isViewSearchPortal?: boolean
}

interface ListItemProps {
  code?: string
  name?: string
  path?: string
  onSearchSuggestionClose?: () => void
}

const Title = ({ heading }: { heading: string }) => {
  const { t } = useTranslation('common')

  return (
    <ListItem key="Suggestions" sx={{ ...style.listItem }}>
      <Typography fontWeight={600} variant="subtitle1">
        {t(heading)}
      </Typography>
    </ListItem>
  )
}

const Content = (props: ListItemProps) => {
  const { code, name, path = '', onSearchSuggestionClose } = props

  return (
    <Link href={`${path}${code}`} passHref>
      <ListItem button key={code} onClick={onSearchSuggestionClose}>
        <ListItemText primary={name} sx={{ ...style.listItemText }} />
      </ListItem>
    </Link>
  )
}

const AiSearchSuggestions = (props: AiSearchSuggestionsProps) => {
  const { onEnterSearch, isViewSearchPortal } = props
  const { publicRuntimeConfig } = getConfig()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [searchTerm, setSearchTerm] = useState<string>('')

  const handleOpen = () => setIsOpen(true)
  const handleClose = () => setIsOpen(false)
  const handleSearch = (userEnteredValue: string) => {
    setSearchTerm(userEnteredValue)
  }
  const handleEnterSearch = (value: string) => {
    router.push({ pathname: '/search', query: { search: value } })
    if (isViewSearchPortal) onEnterSearch?.()
    handleClose()
  }

  const { data } = useGetSearchSuggestion2(
    useDebounce(searchTerm.trim(), publicRuntimeConfig.debounceTimeout)
  )

  // Get product suggestions with safe access
  const productSuggestions =
    data.suggestionGroups?.find((g) => g.name === 'Products')?.suggestions || []

  useEffect(() => {
    searchTerm.trim() ? handleOpen() : handleClose()
  }, [searchTerm])

  return (
    <Stack width="100%" position="relative" gap={1} sx={{ maxWidth: { xs: '100%', md: '65%' } }}>
      <Box sx={{ zIndex: 1400 }}>
        <AiSearchBar
          searchTerm={searchTerm}
          onSearch={handleSearch}
          onKeyEnter={handleEnterSearch}
          showClearButton
        />
      </Box>
      <Collapse
        in={isOpen}
        timeout="auto"
        unmountOnExit
        role="contentinfo"
        sx={{ position: 'absolute', top: '50px', width: '100%' }}
      >
        <Paper sx={{ ...style.paper }}>
          <List sx={{ ...style.list }} role="group">
            <Title heading="products" />
            {productSuggestions.map(({ suggestion }) => (
              <Content
                key={
                  suggestion.productCode
                    ? String(suggestion.productCode).padStart(13, '0')
                    : '0000000000000'
                }
                code={
                  suggestion.productCode
                    ? String(suggestion.productCode).padStart(13, '0')
                    : '0000000000000'
                }
                name={suggestion.name}
                path="/product/"
                onSearchSuggestionClose={handleClose}
              />
            ))}
          </List>
          <Divider />
          {/* <List sx={{ ...style.list }} role="group">
            <Title heading="categories" />
            {categorySuggestionGroup?.suggestions?.map((category) => (
              <Content
                key={category?.suggestion?.categoryCategoryCode}
                code={category?.suggestion?.categoryCategoryCode}
                name={category?.suggestion?.categoryName}
                path={'/category/'}
                onSearchSuggestionClose={handleClose}
              />
            ))}
          </List> */}
        </Paper>
      </Collapse>
      <Backdrop open={isOpen} onClick={handleClose} data-testid="backdrop"></Backdrop>
    </Stack>
  )
}
export default AiSearchSuggestions
