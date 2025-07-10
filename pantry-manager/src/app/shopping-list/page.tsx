'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Applayout/AppLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPantryItems } from '@/store/pantrySlice';
import {
  setShoppingList,
  addToShoppingList,
  updateShoppingListItem,
  removeFromShoppingList,
} from '@/store/shoppingListSlice';
import { ShoppingListItem, PantryItem, Recipe } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  AlertTriangle,
  ChefHat,
  Lightbulb,
  Check,
  X,
  Package,
  DollarSign,
  Clock,
  MapPin,
} from 'lucide-react';
import { isBefore, addDays } from 'date-fns';
import toast from 'react-hot-toast';

// Mock data for demonstration
const mockLowStockThresholds = {
  Milk: 1,
  Eggs: 6,
  Bread: 1,
  'Chicken Breast': 200,
  Tomatoes: 2,
};

const mockStores = [
  {
    id: 'walmart',
    name: 'Walmart',
    estimatedTime: '2-3 hours',
    deliveryFee: 5.99,
  },
  {
    id: 'target',
    name: 'Target',
    estimatedTime: '3-4 hours',
    deliveryFee: 7.99,
  },
  {
    id: 'kroger',
    name: 'Kroger',
    estimatedTime: '1-2 hours',
    deliveryFee: 4.99,
  },
];

const mockPrices: Record<string, number> = {
  Milk: 3.49,
  Eggs: 2.99,
  Bread: 2.49,
  Lettuce: 1.99,
  Mayonnaise: 3.99,
  Cheese: 4.99,
  'Chicken Breast': 8.99,
  Tomatoes: 2.99,
  Onions: 1.49,
  'Bell Peppers': 3.49,
  Rice: 2.99,
  Pasta: 1.99,
};

export default function ShoppingListPage() {
  const dispatch = useAppDispatch();
  const { items: pantryItems } = useAppSelector((state) => state.pantry);
  const shoppingList = useAppSelector((state) => state.shoppingList);
  const recipes = useAppSelector((state) => state.recipes);
  const { authState, userDetails } = useAppSelector((state) => state.user);

  const [activeTab, setActiveTab] = useState('smart');
  const [selectedStore, setSelectedStore] = useState('walmart');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState<
    'units' | 'g' | 'kg' | 'ml' | 'l'
  >('units');
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);

  // Load pantry items on mount
  useEffect(() => {
    if (authState && userDetails.uid && pantryItems.length === 0) {
      dispatch(fetchPantryItems(userDetails.uid));
    }
  }, [authState, userDetails.uid, dispatch, pantryItems.length]);

  // Generate smart shopping suggestions
  const generateSmartSuggestions = () => {
    const suggestions: ShoppingListItem[] = [];

    // 1. Low stock items
    pantryItems.forEach((item) => {
      const threshold =
        mockLowStockThresholds[
          item.name as keyof typeof mockLowStockThresholds
        ];
      if (threshold && item.quantity <= threshold) {
        const existingItem = shoppingList.find((si) => si.name === item.name);
        if (!existingItem) {
          suggestions.push({
            id: `low-stock-${item.id}`,
            name: item.name,
            quantity: threshold * 2, // Buy double the threshold
            unit: item.unit,
            purchased: false,
            category: 'Low Stock',
            estimatedPrice: mockPrices[item.name] || 2.99,
            priority: 'high',
          });
        }
      }
    });

    // 2. Expiring soon items (replacement)
    const expiringThreshold = addDays(new Date(), 3);
    pantryItems.forEach((item) => {
      if (isBefore(new Date(item.expiryDate), expiringThreshold)) {
        const existingItem = shoppingList.find((si) => si.name === item.name);
        if (!existingItem && !suggestions.find((s) => s.name === item.name)) {
          suggestions.push({
            id: `expiring-${item.id}`,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            purchased: false,
            category: 'Expiring Soon',
            estimatedPrice: mockPrices[item.name] || 2.99,
            priority: 'medium',
          });
        }
      }
    });

    // 3. Missing recipe ingredients
    recipes.forEach((recipe) => {
      recipe.missing.forEach((ingredient) => {
        const existingItem = shoppingList.find((si) => si.name === ingredient);
        if (!existingItem && !suggestions.find((s) => s.name === ingredient)) {
          suggestions.push({
            id: `recipe-${recipe.id}-${ingredient}`,
            name: ingredient,
            quantity: 1,
            unit: 'units',
            purchased: false,
            category: 'Recipe Ingredients',
            estimatedPrice: mockPrices[ingredient] || 2.99,
            priority: 'low',
            recipeId: recipe.id,
            recipeName: recipe.title,
          });
        }
      });
    });

    // Add suggestions to shopping list
    suggestions.forEach((item) => {
      dispatch(addToShoppingList(item));
    });

    toast.success(
      `Added ${suggestions.length} smart suggestions to your shopping list!`
    );
  };

  const handleAddCustomItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingListItem = {
      id: `custom-${Date.now()}`,
      name: newItemName,
      quantity: newItemQuantity,
      unit: newItemUnit,
      purchased: false,
      category: 'Custom',
      estimatedPrice: mockPrices[newItemName] || 2.99,
      priority: 'medium',
    };

    dispatch(addToShoppingList(newItem));
    setNewItemName('');
    setNewItemQuantity(1);
    setNewItemUnit('units');
    setIsAddItemOpen(false);
    toast.success('Item added to shopping list!');
  };

  const handleTogglePurchased = (item: ShoppingListItem) => {
    dispatch(updateShoppingListItem({ ...item, purchased: !item.purchased }));
  };

  const handleUpdateQuantity = (
    item: ShoppingListItem,
    newQuantity: number
  ) => {
    if (newQuantity <= 0) {
      dispatch(removeFromShoppingList(item.id));
    } else {
      dispatch(updateShoppingListItem({ ...item, quantity: newQuantity }));
    }
  };

  const handleRemoveItem = (itemId: string) => {
    dispatch(removeFromShoppingList(itemId));
    toast.success('Item removed from shopping list');
  };

  const handleClearCompleted = () => {
    const completedItems = shoppingList.filter((item) => item.purchased);
    completedItems.forEach((item) => dispatch(removeFromShoppingList(item.id)));
    toast.success(`Removed ${completedItems.length} completed items`);
  };

  // Calculate totals
  const totalItems = shoppingList.length;
  const completedItems = shoppingList.filter((item) => item.purchased).length;
  const totalCost = shoppingList.reduce(
    (sum, item) => sum + (item.estimatedPrice || 0) * item.quantity,
    0
  );
  const selectedStoreInfo = mockStores.find(
    (store) => store.id === selectedStore
  );

  // Group items by category
  const groupedItems = shoppingList.reduce((groups, item) => {
    const category = item.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {} as Record<string, ShoppingListItem[]>);

  // Priority items
  const highPriorityItems = shoppingList.filter(
    (item) => item.priority === 'high'
  );
  const mediumPriorityItems = shoppingList.filter(
    (item) => item.priority === 'medium'
  );
  const lowPriorityItems = shoppingList.filter(
    (item) => item.priority === 'low'
  );

  return (
    <AppLayout pageTitle='Shopping List'>
      <div className='space-y-6'>
        {/* Header with Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <ShoppingCart className='h-5 w-5 text-primary' />
                <div>
                  <p className='text-sm font-medium'>Total Items</p>
                  <p className='text-2xl font-bold'>{totalItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <Check className='h-5 w-5 text-green-600' />
                <div>
                  <p className='text-sm font-medium'>Completed</p>
                  <p className='text-2xl font-bold'>{completedItems}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <DollarSign className='h-5 w-5 text-green-600' />
                <div>
                  <p className='text-sm font-medium'>Est. Total</p>
                  <p className='text-2xl font-bold'>${totalCost.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center space-x-2'>
                <AlertTriangle className='h-5 w-5 text-orange-600' />
                <div>
                  <p className='text-sm font-medium'>High Priority</p>
                  <p className='text-2xl font-bold'>
                    {highPriorityItems.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-4'>
          <Button
            onClick={generateSmartSuggestions}
            className='flex items-center gap-2'>
            <Lightbulb className='h-4 w-4' />
            Generate Smart Suggestions
          </Button>

          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button variant='outline' className='flex items-center gap-2'>
                <Plus className='h-4 w-4' />
                Add Custom Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Item</DialogTitle>
                <DialogDescription>
                  Add a custom item to your shopping list
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                <div>
                  <Label htmlFor='itemName'>Item Name</Label>
                  <Input
                    id='itemName'
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder='Enter item name'
                  />
                </div>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='quantity'>Quantity</Label>
                    <Input
                      id='quantity'
                      type='number'
                      value={newItemQuantity}
                      onChange={(e) =>
                        setNewItemQuantity(Number(e.target.value))
                      }
                      min='1'
                    />
                  </div>
                  <div>
                    <Label htmlFor='unit'>Unit</Label>
                    <Select
                      value={newItemUnit}
                      onValueChange={(value: string) =>
                        setNewItemUnit(
                          value as 'units' | 'g' | 'kg' | 'ml' | 'l'
                        )
                      }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='units'>units</SelectItem>
                        <SelectItem value='g'>g</SelectItem>
                        <SelectItem value='kg'>kg</SelectItem>
                        <SelectItem value='ml'>ml</SelectItem>
                        <SelectItem value='l'>l</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddCustomItem}>Add Item</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant='outline' onClick={handleClearCompleted}>
            Clear Completed
          </Button>
        </div>

        {/* Store Selection */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              Select Store
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {mockStores.map((store) => (
                <div
                  key={store.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStore === store.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedStore(store.id)}>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='font-semibold'>{store.name}</h3>
                    {selectedStore === store.id && (
                      <Check className='h-4 w-4 text-primary' />
                    )}
                  </div>
                  <div className='text-sm text-muted-foreground space-y-1'>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-3 w-3' />
                      <span>{store.estimatedTime}</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <DollarSign className='h-3 w-3' />
                      <span>Delivery: ${store.deliveryFee}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Shopping List Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='smart'>Smart List</TabsTrigger>
            <TabsTrigger value='category'>By Category</TabsTrigger>
            <TabsTrigger value='priority'>By Priority</TabsTrigger>
          </TabsList>

          <TabsContent value='smart' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Smart Shopping List</CardTitle>
                <CardDescription>
                  Items organized by importance and urgency
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {shoppingList.length === 0 ? (
                  <div className='text-center py-8'>
                    <Package className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                    <p className='text-muted-foreground'>
                      Your shopping list is empty. Generate smart suggestions to
                      get started!
                    </p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    {shoppingList.map((item) => (
                      <ShoppingListItemCard
                        key={item.id}
                        item={item}
                        onTogglePurchased={handleTogglePurchased}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='category' className='space-y-4'>
            {Object.entries(groupedItems).map(([category, items]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    {category === 'Low Stock' && (
                      <AlertTriangle className='h-5 w-5 text-orange-600' />
                    )}
                    {category === 'Recipe Ingredients' && (
                      <ChefHat className='h-5 w-5 text-blue-600' />
                    )}
                    {category === 'Expiring Soon' && (
                      <Clock className='h-5 w-5 text-red-600' />
                    )}
                    {category === 'Custom' && (
                      <Plus className='h-5 w-5 text-green-600' />
                    )}
                    {category}
                    <Badge variant='secondary'>{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {items.map((item) => (
                    <ShoppingListItemCard
                      key={item.id}
                      item={item}
                      onTogglePurchased={handleTogglePurchased}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={handleRemoveItem}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value='priority' className='space-y-4'>
            {[
              {
                priority: 'high',
                items: highPriorityItems,
                color: 'text-red-600',
                label: 'High Priority',
              },
              {
                priority: 'medium',
                items: mediumPriorityItems,
                color: 'text-orange-600',
                label: 'Medium Priority',
              },
              {
                priority: 'low',
                items: lowPriorityItems,
                color: 'text-green-600',
                label: 'Low Priority',
              },
            ].map(
              ({ priority, items, color, label }) =>
                items.length > 0 && (
                  <Card key={priority}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${color}`}>
                        <AlertTriangle className='h-5 w-5' />
                        {label}
                        <Badge variant='secondary'>{items.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                      {items.map((item) => (
                        <ShoppingListItemCard
                          key={item.id}
                          item={item}
                          onTogglePurchased={handleTogglePurchased}
                          onUpdateQuantity={handleUpdateQuantity}
                          onRemove={handleRemoveItem}
                        />
                      ))}
                    </CardContent>
                  </Card>
                )
            )}
          </TabsContent>
        </Tabs>

        {/* Checkout Summary */}
        {shoppingList.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <div className='flex justify-between'>
                  <span>Subtotal ({totalItems} items)</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Delivery Fee</span>
                  <span>${selectedStoreInfo?.deliveryFee.toFixed(2)}</span>
                </div>
                <div className='flex justify-between'>
                  <span>Tax (estimated)</span>
                  <span>${(totalCost * 0.08).toFixed(2)}</span>
                </div>
                <hr />
                <div className='flex justify-between font-semibold text-lg'>
                  <span>Total</span>
                  <span>
                    $
                    {(
                      totalCost +
                      (selectedStoreInfo?.deliveryFee || 0) +
                      totalCost * 0.08
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
              <div className='mt-4 space-y-2'>
                <Button className='w-full' size='lg'>
                  <ShoppingCart className='h-4 w-4 mr-2' />
                  Proceed to Checkout
                </Button>
                <p className='text-sm text-muted-foreground text-center'>
                  Estimated delivery: {selectedStoreInfo?.estimatedTime} from{' '}
                  {selectedStoreInfo?.name}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

// Shopping List Item Component
function ShoppingListItemCard({
  item,
  onTogglePurchased,
  onUpdateQuantity,
  onRemove,
}: {
  item: ShoppingListItem & {
    category?: string;
    estimatedPrice?: number;
    priority?: 'high' | 'medium' | 'low';
    recipeId?: string;
    recipeName?: string;
  };
  onTogglePurchased: (item: ShoppingListItem) => void;
  onUpdateQuantity: (item: ShoppingListItem, quantity: number) => void;
  onRemove: (itemId: string) => void;
}) {
  const priorityColors = {
    high: 'border-l-red-500',
    medium: 'border-l-orange-500',
    low: 'border-l-green-500',
  };

  return (
    <div
      className={`flex items-center space-x-4 p-4 border rounded-lg border-l-4 ${
        priorityColors[item.priority || 'medium']
      } ${item.purchased ? 'opacity-60 bg-muted/50' : ''}`}>
      <Checkbox
        checked={item.purchased}
        onCheckedChange={() => onTogglePurchased(item)}
      />

      <div className='flex-1'>
        <div className='flex items-center gap-2'>
          <h3 className={`font-medium ${item.purchased ? 'line-through' : ''}`}>
            {item.name}
          </h3>
          {item.category && (
            <Badge variant='outline' className='text-xs'>
              {item.category}
            </Badge>
          )}
          {item.priority === 'high' && (
            <Badge variant='destructive' className='text-xs'>
              Urgent
            </Badge>
          )}
        </div>

        <div className='flex items-center gap-4 mt-1'>
          <span className='text-sm text-muted-foreground'>
            {item.quantity} {item.unit}
          </span>
          {item.estimatedPrice && (
            <span className='text-sm font-medium text-green-600'>
              ${(item.estimatedPrice * item.quantity).toFixed(2)}
            </span>
          )}
          {item.recipeName && (
            <span className='text-xs text-blue-600 flex items-center gap-1'>
              <ChefHat className='h-3 w-3' />
              For {item.recipeName}
            </span>
          )}
        </div>
      </div>

      <div className='flex items-center space-x-2'>
        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => onUpdateQuantity(item, item.quantity - 1)}>
          <Minus className='h-4 w-4' />
        </Button>

        <span className='w-8 text-center font-medium'>{item.quantity}</span>

        <Button
          variant='outline'
          size='icon'
          className='h-8 w-8'
          onClick={() => onUpdateQuantity(item, item.quantity + 1)}>
          <Plus className='h-4 w-4' />
        </Button>

        <Button
          variant='ghost'
          size='icon'
          className='h-8 w-8 text-destructive'
          onClick={() => onRemove(item.id)}>
          <Trash2 className='h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}
