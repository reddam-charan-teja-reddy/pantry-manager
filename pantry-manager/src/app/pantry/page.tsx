'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/Applayout/AppLayout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchPantryItems,
  updatePantryItemInDb,
  removePantryItemInDb,
} from '@/store/pantrySlice';
import { PantryItem } from '@/lib/types';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
// Fallback image served from public folder
// import sampleImg from '@/app/sample_img.avif';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Edit, MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isBefore, addDays } from 'date-fns';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export default function PantryPage() {
  const smapleImg = '../sample_img.avif'; // Fallback image path
  const dispatch = useAppDispatch();
  const { items, loading } = useAppSelector((state) => state.pantry);
  const { toast } = useToast();
  const { authState, userDetails } = useAppSelector((state) => state.user);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    notes: '',
    expiryDate: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showExpiringOnly, setShowExpiringOnly] = useState(false);
  const [confirmItem, setConfirmItem] = useState<PantryItem | null>(null);
  const [confirmClearExpired, setConfirmClearExpired] = useState(false);
  const [confirmResetAll, setConfirmResetAll] = useState(false);

  useEffect(() => {
    if (authState && userDetails.uid) {
      dispatch(fetchPantryItems(userDetails.uid));
    }
  }, [authState, userDetails.uid, dispatch]);

  const handleReduce = (item: PantryItem) => {
    if (item.quantity > 1) {
      dispatch(
        updatePantryItemInDb({
          userId: userDetails.uid,
          item: { ...item, quantity: item.quantity - 1 },
        })
      );
    } else {
      // open confirm dialog for deletion when quantity is 1
      setConfirmItem(item);
    }
  };
  const handleIncrease = (item: PantryItem) => {
    dispatch(
      updatePantryItemInDb({
        userId: userDetails.uid,
        item: { ...item, quantity: item.quantity + 1 },
      })
    );
  };
  const handleClear = (item: PantryItem) => {
    // open confirm dialog for deletion
    setConfirmItem(item);
  };
  const openEdit = (item: PantryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      notes: item.notes || '',
      expiryDate: item.expiryDate.split('T')[0],
    });
  };
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleUpdate = () => {
    if (editingItem) {
      const updated: PantryItem = {
        ...editingItem,
        name: formData.name,
        quantity: parseInt(formData.quantity, 10),
        notes: formData.notes,
        expiryDate: new Date(formData.expiryDate).toISOString(),
      };
      dispatch(
        updatePantryItemInDb({ userId: userDetails.uid, item: updated })
      ).then((res) => {
        if (res.meta.requestStatus === 'fulfilled') {
          toast({ title: 'Item updated', variant: 'default' });
        } else {
          toast({ title: 'Failed to update item', variant: 'destructive' });
        }
      });
      setEditingItem(null);
    }
  };

  // Filter & group items
  const now = new Date();
  const expiringThreshold = addDays(now, 3);
  const displayedItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === 'all' || item.category === filterCategory;
    const itemDate = new Date(item.expiryDate);
    if (showExpiringOnly && !isBefore(itemDate, expiringThreshold))
      return false;
    return matchesSearch && matchesCategory;
  });
  // Split into expired, expiring soon and others
  const expiredItems = displayedItems.filter((item) =>
    isBefore(new Date(item.expiryDate), now)
  );
  const expiringItems = displayedItems.filter((item) => {
    const date = new Date(item.expiryDate);
    return !isBefore(date, now) && isBefore(date, expiringThreshold);
  });
  const otherItems = displayedItems.filter(
    (item) => !isBefore(new Date(item.expiryDate), expiringThreshold)
  );

  return (
    <AppLayout pageTitle='Pantry'>
      {loading && <p>Loading...</p>}
      {/* Controls: search, filters, bulk actions */}
      <div className='flex flex-wrap items-center gap-4 mb-4'>
        <input
          type='text'
          placeholder='Search items...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='border rounded px-2 py-1 flex-1 md:flex-none w-full md:w-auto'
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className='border rounded px-2 py-1'>
          <option value='all'>All Categories</option>
          {[...new Set(items.map((i) => i.category))].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <label className='inline-flex items-center space-x-2'>
          <input
            type='checkbox'
            checked={showExpiringOnly}
            onChange={(e) => setShowExpiringOnly(e.target.checked)}
          />
          <span>Expiring Soon Only</span>
        </label>
        <Button variant='outline' onClick={() => setConfirmClearExpired(true)}>
          Clear All Expired
        </Button>
        <Button variant='outline' onClick={() => setConfirmResetAll(true)}>
          Reset Quantities
        </Button>
      </div>

      {/* Expired Items Section */}
      {expiredItems.length > 0 && (
        <>
          <h2 className='text-lg font-semibold mb-2 text-red-600'>
            Expired Items
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-6'>
            {expiredItems.map((item) => (
              <Card
                key={item.id}
                className='flex flex-col justify-between h-full p-4 border border-red-500 bg-red-50'>
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Image
                    src={item.imageUrl || '/sample_img.avif'}
                    alt={item.name}
                    width={150}
                    height={150}
                    className='rounded-md object-cover'
                  />
                  <p className='mt-2'>
                    {item.quantity} {item.unit}
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Expires: {item.expiryDate.split('T')[0]}
                  </p>
                </CardContent>
                <CardFooter className='flex items-center justify-between space-x-4 p-4'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='p-2'
                    onClick={() => handleReduce(item)}>
                    <MinusCircle className='h-4 w-6' />
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    className='p-2'
                    onClick={() => handleIncrease(item)}>
                    <PlusCircle className='h-4 w-6' />
                  </Button>
                  <Dialog
                    open={!!editingItem && editingItem.id === item.id}
                    onOpenChange={(open) => {
                      if (!open) setEditingItem(null);
                    }}>
                    <DialogTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='p-2'
                        onClick={() => openEdit(item)}>
                        <Edit className='h-4 w-6' />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Item</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div>
                          <Label>Name</Label>
                          <Input
                            name='name'
                            value={formData.name}
                            onChange={handleFormChange}
                          />
                        </div>
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            name='quantity'
                            type='number'
                            value={formData.quantity}
                            onChange={handleFormChange}
                          />
                        </div>
                        <div>
                          <Label>Expiry Date</Label>
                          <Input
                            name='expiryDate'
                            type='date'
                            value={formData.expiryDate}
                            onChange={handleFormChange}
                          />
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input
                            name='notes'
                            value={formData.notes}
                            onChange={handleFormChange}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={handleUpdate}>Update</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant='destructive'
                    size='sm'
                    className='p-2'
                    onClick={() => handleClear(item)}>
                    <Trash2 className='h-4 w-6' />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Expiring Soon Section */}
      {expiringItems.length > 0 && !showExpiringOnly && (
        <h2 className='text-lg font-semibold mb-2'>Expiring Soon</h2>
      )}
      {expiringItems.length > 0 && (
        <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-6'>
          {expiringItems.map((item) => (
            <Card
              key={item.id}
              className='flex flex-col justify-between h-full p-4'>
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <Image
                  src={item.imageUrl || '/sample_img.avif'}
                  alt={item.name}
                  width={150}
                  height={150}
                  className='rounded-md object-cover'
                />
                <p className='mt-2'>
                  {item.quantity} {item.unit}
                </p>
                <p className='text-sm text-muted-foreground'>
                  Expires: {item.expiryDate.split('T')[0]}
                </p>
              </CardContent>
              <CardFooter className='flex items-center justify-between space-x-4 p-4'>
                <Button
                  variant='outline'
                  size='sm'
                  className='p-2'
                  onClick={() => handleReduce(item)}>
                  <MinusCircle className='h-4 w-6' />
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  className='p-2'
                  onClick={() => handleIncrease(item)}>
                  <PlusCircle className='h-4 w-6' />
                </Button>
                <Dialog
                  open={!!editingItem && editingItem.id === item.id}
                  onOpenChange={(open) => {
                    if (!open) setEditingItem(null);
                  }}>
                  <DialogTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='p-2'
                      onClick={() => openEdit(item)}>
                      <Edit className='h-4 w-6' />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Item</DialogTitle>
                    </DialogHeader>
                    <div className='space-y-4'>
                      <div>
                        <Label>Name</Label>
                        <Input
                          name='name'
                          value={formData.name}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          name='quantity'
                          type='number'
                          value={formData.quantity}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label>Expiry Date</Label>
                        <Input
                          name='expiryDate'
                          type='date'
                          value={formData.expiryDate}
                          onChange={handleFormChange}
                        />
                      </div>
                      <div>
                        <Label>Notes</Label>
                        <Input
                          name='notes'
                          value={formData.notes}
                          onChange={handleFormChange}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleUpdate}>Update</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant='destructive'
                  size='sm'
                  className='p-2'
                  onClick={() => handleClear(item)}>
                  <Trash2 className='h-4 w-6' />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      {/* Other Items Section */}
      <h2 className='text-lg font-semibold mb-2'>All Items</h2>
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8'>
        {otherItems.map((item) => (
          <Card
            key={item.id}
            className='flex flex-col justify-between h-full p-4'>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <Image
                src={item.imageUrl || '/sample_img.avif'}
                alt={item.name}
                width={150}
                height={150}
                className='rounded-md object-cover'
              />
              <p className='mt-2'>
                {item.quantity} {item.unit}
              </p>
              <p className='text-sm text-muted-foreground'>
                Expires: {item.expiryDate.split('T')[0]}
              </p>
            </CardContent>
            <CardFooter className='flex items-center justify-between space-x-4 p-4'>
              <Button
                variant='outline'
                size='sm'
                className='p-2'
                onClick={() => handleReduce(item)}>
                <MinusCircle className='h-4 w-6' />
              </Button>
              <Button
                variant='outline'
                size='sm'
                className='p-2'
                onClick={() => handleIncrease(item)}>
                <PlusCircle className='h-4 w-6' />
              </Button>
              <Dialog
                open={!!editingItem && editingItem.id === item.id}
                onOpenChange={(open) => {
                  if (!open) setEditingItem(null);
                }}>
                <DialogTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    className='p-2'
                    onClick={() => openEdit(item)}>
                    <Edit className='h-4 w-6' />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Item</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label>Name</Label>
                      <Input
                        name='name'
                        value={formData.name}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input
                        name='quantity'
                        type='number'
                        value={formData.quantity}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div>
                      <Label>Expiry Date</Label>
                      <Input
                        name='expiryDate'
                        type='date'
                        value={formData.expiryDate}
                        onChange={handleFormChange}
                      />
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Input
                        name='notes'
                        value={formData.notes}
                        onChange={handleFormChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUpdate}>Update</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                variant='destructive'
                size='sm'
                className='p-2'
                onClick={() => handleClear(item)}>
                <Trash2 className='h-4 w-6' />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* ConfirmDialog for bulk clear expired */}
      <ConfirmDialog
        open={confirmClearExpired}
        title='Clear Expired Items'
        description='Are you sure you want to remove all expired items?'
        confirmLabel='Clear'
        cancelLabel='Cancel'
        onConfirm={async () => {
          try {
            const deletePromises = expiredItems.map((item) =>
              dispatch(
                removePantryItemInDb({
                  userId: userDetails.uid,
                  itemId: item.id,
                })
              ).unwrap()
            );

            // Wait for all delete operations to complete
            await Promise.all(deletePromises);

            // Only show success message when all operations have completed
            toast({ title: 'Expired items cleared', variant: 'default' });

            // Re-fetch pantry items to ensure UI is in sync
            dispatch(fetchPantryItems(userDetails.uid));
          } catch (error) {
            toast({
              title: 'Failed to clear some items',
              description: 'Some expired items could not be removed.',
              variant: 'destructive',
            });
          } finally {
            setConfirmClearExpired(false);
          }
        }}
        onCancel={() => setConfirmClearExpired(false)}
      />
      {/* ConfirmDialog for bulk reset quantities */}
      <ConfirmDialog
        open={confirmResetAll}
        title='Reset Quantities'
        description='Set quantities of all items to 1?'
        confirmLabel='Reset'
        cancelLabel='Cancel'
        onConfirm={() => {
          items.forEach((item) => {
            dispatch(
              updatePantryItemInDb({
                userId: userDetails.uid,
                item: { ...item, quantity: 1 },
              })
            )
              .unwrap()
              .catch(() => {});
          });
          toast({ title: 'Quantities reset', variant: 'default' });
          setConfirmResetAll(false);
        }}
        onCancel={() => setConfirmResetAll(false)}
      />

      {/* Confirmation dialog for deletes */}
      <Dialog
        open={!!confirmItem}
        onOpenChange={(open) => !open && setConfirmItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Removal</DialogTitle>
          </DialogHeader>
          <p>Remove {confirmItem?.name} from pantry?</p>
          <DialogFooter>
            <Button
              variant='destructive'
              onClick={() => {
                if (confirmItem) {
                  dispatch(
                    removePantryItemInDb({
                      userId: userDetails.uid,
                      itemId: confirmItem.id,
                    })
                  )
                    .unwrap()
                    .then(() =>
                      toast({ title: 'Item removed', variant: 'default' })
                    )
                    .catch(() =>
                      toast({
                        title: 'Failed to remove item',
                        variant: 'destructive',
                      })
                    );
                }
                setConfirmItem(null);
              }}>
              Confirm
            </Button>
            <Button variant='outline' onClick={() => setConfirmItem(null)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
