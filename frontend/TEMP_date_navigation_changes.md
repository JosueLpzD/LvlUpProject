# Código a agregar al TimeBlockPlanner.tsx

## 1. Imports (línea 6)
```tsx
import { Plus, GripVertical, Clock, Trash2, Sparkles, CheckCircle, XCircle, Settings, ChevronLeft, ChevronRight } from "lucide-react";
```

## 2. Estado nuevo (después de línea 34)
```tsx
const [selectedDate, setSelectedDate] = useState(new Date());
```

## 3. Helper functions (después de línea 180)
```tsx
// Navegación de fechas
const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
};

const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    const today = new Date();
    // Solo permitir avanzar hasta hoy
    if (newDate <= today) {
        setSelectedDate(newDate);
    }
};

const isToday = () => {
    const today = new Date();
    return selected Date.toDateString() === today.toDateString();
};

const getDayLabel = (date: Date) => {
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "Ayer";
    if (diffDays === 2) return "Hace 2 días";
    if (diffDays > 2) return `Hace ${diffDays} días`;
    return "Hoy";
};

const getCompletedCount = () => {
    const completedCount = blocks.filter(b => b.completed).length;
    return `${completedCount}/${blocks.length}`;
};
```

## 4. Modificar useEffect loadBlocks (líneas 37-67)
Cambiar:
```tsx
const apiBlocks = await timeblockService.getAll();
```

Por:
```tsx
const dateStr = selectedDate.toISOString().split('T')[0]; // "2026-02-05"
const apiBlocks = await timeblockService.getByDate(dateStr);
```

Y actualizar dependencies:
```tsx
}, [selectedDate]); // Recargar cuando cambia la fecha
```

## 5. Nuevo Header (reemplazar líneas 786-805)
Ver archivo siguiente para código completo...
