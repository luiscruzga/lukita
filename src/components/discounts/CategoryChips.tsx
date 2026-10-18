import { ScrollView } from 'react-native';
import { LayoutGrid } from 'lucide-react-native';
import { DISCOUNT_CATEGORIES } from '@/constants/categories';
import { Chip } from '../ui/Chip';

export function CategoryChips({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      <Chip label="Todo" icon={LayoutGrid} selected={!value} onPress={() => onChange(null)} />
      {DISCOUNT_CATEGORIES.map((c) => (
        <Chip key={c.id} label={c.name} icon={c.icon} selected={value === c.id} onPress={() => onChange(value === c.id ? null : c.id)} />
      ))}
    </ScrollView>
  );
}
