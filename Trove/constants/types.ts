// types/components.ts

export interface AppTextProps {
  children: React.ReactNode;
  style?: any;
  variant?: "title" | "subtitle" | "body" | "small";
  color?: string;
}

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "outline";
  disabled?: boolean;
  style?: any;
}

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface CategoryGridProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  onDelete: (category: Category) => void;
  refreshing: boolean;
  onRefresh: () => void;
}

export interface HomeHeaderProps {
  title?: string;
  onAdd?: () => void;
}

export interface AddCategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (category: { name: string; description?: string }) => void;
}

export interface ConfirmDeleteModalProps {
  visible: boolean;
  categoryName: string;
  onCancel: () => void;
  onConfirm: () => void;
}
