import LoadingSpinner from './LoadingSpinner.vue'

export default {
    title: 'Components/LoadingSpinner',
    component: LoadingSpinner,
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

export const Default = {
    args: {
        size: 'md',
    },
}

export const Small = {
    args: {
        size: 'sm',
    },
}

export const Large = {
    args: {
        size: 'lg',
    },
}
