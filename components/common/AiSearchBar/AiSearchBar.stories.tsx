import React from 'react'

import { ComponentStory, ComponentMeta } from '@storybook/react'

import AiSearchBar from './AiSearchBar'

// Common
export default {
  title: 'Common/AiSearchBar',
  component: AiSearchBar,
} as ComponentMeta<typeof AiSearchBar>

const Template: ComponentStory<typeof AiSearchBar> = (args) => <AiSearchBar {...args} />

// Default
export const Common = Template.bind({})
Common.args = {
  placeHolder: 'AI Search',
  searchTerm: '',
  onSearch: () => {
    /*parent will handle AiSearchBar*/
  },
  childInputRef: undefined,
  showClearButton: false,
}

// WithCancelButton
export const WithCancelButton = Template.bind({})
WithCancelButton.args = {
  ...Common.args,
  showClearButton: true,
}
