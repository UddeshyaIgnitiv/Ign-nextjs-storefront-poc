import React from 'react'

import { ComponentStory, ComponentMeta } from '@storybook/react'

import AiSearchSuggestions from './AiSearchSuggestions'

// Common
export default {
  title: 'Layout/AiSearchSuggestions',
  component: AiSearchSuggestions,
} as ComponentMeta<typeof AiSearchSuggestions>

const Template: ComponentStory<typeof AiSearchSuggestions> = () => <AiSearchSuggestions />

// Default
export const Common = Template.bind({})
