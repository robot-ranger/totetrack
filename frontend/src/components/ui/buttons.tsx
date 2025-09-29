import { Button, IconButton } from "@chakra-ui/react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import type { ButtonProps, IconButtonProps } from "@chakra-ui/react";

interface EditButtonProps extends ButtonProps {
    topic?: string;
}

interface DeleteButtonProps extends ButtonProps {
    topic?: string;
}

export function EditButton({ topic, ...props }: EditButtonProps) {
    return (
        <Button
            colorPalette="cyan"
            variant="surface"
            size="xs"
            {...props}
        >
            <FiEdit2 /> Edit {topic || ''}
        </Button>
    );
}

export function DeleteButton({ topic, ...props }: DeleteButtonProps) {
    return (
        <Button
            colorPalette="orange"
            variant="surface"
            size="xs"
            {...props}
        >
            <FiTrash2 /> Delete {topic || ''}
        </Button>
    );
}

export function EditIconButton(props: IconButtonProps) {
    return (
        <IconButton
            aria-label="Edit"
            colorScheme="blue"
            variant="ghost"
            size="sm"
            {...props}
        >
            <FiEdit2 />
        </IconButton>
    );
}

export function DeleteIconButton(props: IconButtonProps) {
    return (
        <IconButton
            aria-label="Delete"
            colorScheme="red"
            variant="ghost"
            size="sm"
            {...props}
        >
            <FiTrash2 />
        </IconButton>
    );
}