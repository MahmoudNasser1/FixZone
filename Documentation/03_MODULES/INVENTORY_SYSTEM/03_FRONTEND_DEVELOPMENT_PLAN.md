# 🎨 خطة تطوير Frontend - نظام المخزون
## Frontend Development Plan - Inventory System

**التاريخ:** 2025-01-27  
**الحالة:** Production Enhancement Plan

---

## 📋 نظرة عامة

هذه الخطة تغطي تطوير وتحسين Frontend لنظام المخزون، مع التركيز على:
- ✅ State Management
- ✅ Real-time Updates
- ✅ UI/UX Improvements
- ✅ Performance Optimization

---

## 🏗️ Architecture الجديدة

### Current vs. New:

```
الوضع الحالي:
Components → API Calls (مباشر)

الوضع الجديد:
Components → Context/State → React Query → API
                 ↓
            WebSocket (Real-time)
                 ↓
            Cache Layer
```

---

## 1️⃣ State Management

### 1.1 Context API:

```javascript
// context/InventoryContext.js
const InventoryContext = createContext();

export const InventoryProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await inventoryService.listItems();
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return (
    <InventoryContext.Provider value={{
      items,
      loading,
      fetchItems,
      updateItem: (id, data) => {
        setItems(prev => prev.map(item => 
          item.id === id ? { ...item, ...data } : item
        ));
      }
    }}>
      {children}
    </InventoryContext.Provider>
  );
};
```

### 1.2 React Query Integration:

```javascript
// hooks/useInventory.js
export const useInventory = () => {
  const queryClient = useQueryClient();
  
  const { data: items, isLoading } = useQuery(
    ['inventory', 'items'],
    () => inventoryService.listItems(),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000 // 10 minutes
    }
  );
  
  const updateItem = useMutation(
    ({ id, data }) => inventoryService.updateItem(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['inventory', 'items']);
      },
      onMutate: async ({ id, data }) => {
        // Optimistic update
        await queryClient.cancelQueries(['inventory', 'items']);
        const previous = queryClient.getQueryData(['inventory', 'items']);
        queryClient.setQueryData(['inventory', 'items'], old => 
          old.map(item => item.id === id ? { ...item, ...data } : item)
        );
        return { previous };
      },
      onError: (err, variables, context) => {
        queryClient.setQueryData(['inventory', 'items'], context.previous);
      }
    }
  );
  
  return { items, isLoading, updateItem };
};
```

---

## 2️⃣ Real-time Updates

### 2.1 WebSocket Integration:

```javascript
// hooks/useInventoryWebSocket.js
export const useInventoryWebSocket = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch(data.type) {
        case 'STOCK_UPDATED':
          queryClient.invalidateQueries(['inventory', 'stock', data.itemId]);
          break;
        case 'ITEM_CREATED':
          queryClient.invalidateQueries(['inventory', 'items']);
          break;
      }
    };
    
    return () => ws.close();
  }, [queryClient]);
};
```

---

## 3️⃣ UI Components

### 3.1 Reusable Components:

```javascript
// components/inventory/InventoryItemCard.js
export const InventoryItemCard = ({ item, onEdit, onDelete }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
        <CardDescription>{item.sku}</CardDescription>
      </CardHeader>
      <CardContent>
        <StockLevelBadge quantity={item.totalQuantity} minLevel={item.minStockLevel} />
        <PriceDisplay purchase={item.purchasePrice} selling={item.sellingPrice} />
      </CardContent>
      <CardActions>
        <Button onClick={() => onEdit(item)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(item.id)}>Delete</Button>
      </CardActions>
    </Card>
  );
};
```

---

## 4️⃣ Performance Optimization

### 4.1 Code Splitting:

```javascript
// Lazy load pages
const InventoryPage = lazy(() => import('./pages/inventory/InventoryPage'));
const StockCountPage = lazy(() => import('./pages/inventory/StockCountPage'));

// Use Suspense
<Suspense fallback={<LoadingSpinner />}>
  <InventoryPage />
</Suspense>
```

### 4.2 Virtual Scrolling:

```javascript
// For large lists
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <InventoryItemCard item={items[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 5️⃣ Error Handling

### 5.1 Error Boundaries:

```javascript
// components/ErrorBoundary.js
class InventoryErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: State Management
- [ ] Setup Context API
- [ ] Integrate React Query
- [ ] Add Optimistic Updates

### Phase 2: Real-time
- [ ] Setup WebSocket
- [ ] Add Real-time Updates
- [ ] Handle Reconnection

### Phase 3: UI/UX
- [ ] Create Reusable Components
- [ ] Improve Loading States
- [ ] Add Error Boundaries

### Phase 4: Performance
- [ ] Code Splitting
- [ ] Virtual Scrolling
- [ ] Memoization

---

**الخطوة التالية:** راجع [07_IMPLEMENTATION_ROADMAP.md](./07_IMPLEMENTATION_ROADMAP.md)

---

**آخر تحديث:** 2025-01-27


