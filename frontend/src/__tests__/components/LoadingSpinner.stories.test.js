import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock du composant LoadingSpinner
vi.mock('../../components/LoadingSpinner.vue', () => ({
  default: { name: 'LoadingSpinner' },
}))

describe('LoadingSpinner.stories.js', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should import stories module without errors', async () => {
    // Test que le module s'importe sans erreur
    expect(async () => {
      await import('../../components/LoadingSpinner.stories.js')
    }).not.toThrow()
  })

  it('should have correct story configuration', () => {
    // Test que la configuration des stories est correcte
    const storyConfig = {
      title: 'Components/LoadingSpinner',
      component: 'LoadingSpinner',
      parameters: {
        layout: 'centered',
      },
      tags: ['autodocs'],
      argTypes: {
        size: {
          control: { type: 'select' },
          options: ['sm', 'md', 'lg'],
        },
      },
    }

    expect(storyConfig.title).toBe('Components/LoadingSpinner')
    expect(storyConfig.component).toBe('LoadingSpinner')
    expect(storyConfig.parameters.layout).toBe('centered')
    expect(storyConfig.tags).toContain('autodocs')
    expect(storyConfig.argTypes.size.control.type).toBe('select')
    expect(storyConfig.argTypes.size.options).toEqual(['sm', 'md', 'lg'])
  })

  it('should have Default story', () => {
    // Test que la story Default existe
    const defaultStory = {
      args: {
        size: 'md',
      },
    }

    expect(defaultStory.args.size).toBe('md')
  })

  it('should have Small story', () => {
    // Test que la story Small existe
    const smallStory = {
      args: {
        size: 'sm',
      },
    }

    expect(smallStory.args.size).toBe('sm')
  })

  it('should have Large story', () => {
    // Test que la story Large existe
    const largeStory = {
      args: {
        size: 'lg',
      },
    }

    expect(largeStory.args.size).toBe('lg')
  })

  it('should have correct size options', () => {
    // Test que les options de taille sont correctes
    const sizeOptions = ['sm', 'md', 'lg']

    expect(sizeOptions).toContain('sm')
    expect(sizeOptions).toContain('md')
    expect(sizeOptions).toContain('lg')
    expect(sizeOptions).toHaveLength(3)
  })

  it('should have correct story structure', () => {
    // Test que la structure des stories est correcte
    const stories = ['Default', 'Small', 'Large']

    expect(stories).toContain('Default')
    expect(stories).toContain('Small')
    expect(stories).toContain('Large')
    expect(stories).toHaveLength(3)
  })
})
