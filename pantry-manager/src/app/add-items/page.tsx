'use client';

import React, { useState, useRef, useEffect } from 'react';
import AppLayout from '@/components/Applayout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ScanLine,
  History,
  FilePenLine,
  QrCode,
  Upload,
  Loader2,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import type { PantryItem } from '@/lib/types';
import { mockCandidateItems } from '@/lib/mock';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setStep,
  setMethod,
  setCandidateItems,
  updateCandidateItem,
  removeCandidateItem,
  addCandidateItem,
  resetAddItems,
  InputMethod,
  Step,
} from '@/store/addItemsSlice';
import {
  addPantryItem,
  addItemsToPantry,
  resetLoadingState,
} from '@/store/pantrySlice';
import { BrowserQRCodeReader } from '@zxing/library';

export default function AddItemsPage() {
  const dispatch = useAppDispatch();
  const { step, method, candidateItems } = useAppSelector(
    (state) => state.addItems
  );

  const handleSelectMethod = (selectedMethod: InputMethod) => {
    dispatch(setMethod(selectedMethod));
    dispatch(setStep('input'));
  };

  const handleItemsDetected = (items: PantryItem[]) => {
    dispatch(setCandidateItems(items));
    dispatch(setStep('validate'));
  };

  const { authState, userDetails } = useAppSelector((state) => state.user);
  const { loading } = useAppSelector((state) => state.pantry);

  const handleConfirm = async () => {
    if (!authState || !userDetails.uid) {
      toast.error('You must be logged in to add items to your pantry');
      return;
    }

    try {
      const result = await dispatch(
        addItemsToPantry({
          userId: userDetails.uid,
          items: candidateItems,
        })
      ).unwrap();

      toast.success(result.message || `Items have been added to your pantry.`);
      dispatch(resetAddItems());
    } catch (error) {
      // Make sure loading state is reset on error
      dispatch(resetLoadingState());
      toast.error(
        typeof error === 'string' ? error : 'Failed to add items to your pantry'
      );
    }
  };

  const updateItem = (
    id: string,
    field: keyof PantryItem,
    value: string | number | boolean | undefined
  ) => {
    dispatch(updateCandidateItem({ id, field, value }));
  };

  const removeItem = (id: string) => {
    dispatch(removeCandidateItem(id));
  };

  const addItem = () => {
    dispatch(addCandidateItem());
  };

  return (
    <AppLayout pageTitle='Add Items'>
      <div className='mx-auto max-w-2xl'>
        {step === 'select' && <MethodSelector onSelect={handleSelectMethod} />}
        {step === 'input' && method && (
          <InputStep
            method={method}
            onItemsDetected={handleItemsDetected}
            onBack={() => dispatch(setStep('select'))}
          />
        )}
        {step === 'validate' && (
          <ValidationStep
            items={candidateItems}
            onConfirm={handleConfirm}
            onBack={() => dispatch(setStep('input'))}
            updateItem={updateItem}
            removeItem={removeItem}
            addItem={addItem}
          />
        )}
      </div>
    </AppLayout>
  );
}

function MethodSelector({
  onSelect,
}: {
  onSelect: (method: InputMethod) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose an Input Method</CardTitle>
        <CardDescription>
          How would you like to add items to your pantry?
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <Button
          size='lg'
          className='w-full justify-start gap-4'
          onClick={() => onSelect('qr')}>
          <ScanLine className='h-6 w-6' />
          <span>Import from Receipt QR Code</span>
        </Button>
        <Button
          size='lg'
          className='w-full justify-start gap-4'
          onClick={() => onSelect('history')}>
          <History className='h-6 w-6' />
          <span>Import from Order History</span>
        </Button>
        <Button
          size='lg'
          className='w-full justify-start gap-4'
          onClick={() => onSelect('manual')}>
          <FilePenLine className='h-6 w-6' />
          <span>Add Items Manually</span>
        </Button>
      </CardContent>
    </Card>
  );
}

function InputStep({
  method,
  onItemsDetected,
  onBack,
}: {
  method: InputMethod;
  onItemsDetected: (items: PantryItem[]) => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  // Mock detection for history import
  const handleDetect = () => {
    setIsLoading(true);
    setTimeout(() => {
      onItemsDetected(mockCandidateItems);
      setIsLoading(false);
    }, 1500);
  };
  // Pass-through for manual add
  const handleManualAdd = (item: PantryItem) => onItemsDetected([item]);

  // Process QR code result as purchase ID
  const handleQrResult = async (text: string) => {
    stopCamera();
    if (!/^[0-9a-fA-F]{24}$/.test(text)) {
      toast.error('Invalid QR code');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/purchase/${text}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) throw new Error();
      // Map API items to PantryItem
      const items: PantryItem[] = data.items.map(
        (item: {
          productId: string;
          itemName: string;
          quantity: number;
          unit: string;
          expirationDate: string | null;
          category: string;
        }) => ({
          id: item.productId,
          name: item.itemName,
          quantity: item.quantity,
          unit: item.unit === 'unit' ? 'units' : item.unit,
          expiryDate: item.expirationDate
            ? new Date(item.expirationDate).toISOString()
            : '',
          category: item.category,
        })
      );
      onItemsDetected(items);
    } catch {
      toast.error('Invalid QR code');
    } finally {
      setIsLoading(false);
    }
  };

  // Start camera scanning using ZXing
  const startCamera = async () => {
    try {
      setIsLoading(true);
      // Request camera permission and obtain stream
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setCameraActive(true);
    } catch (err) {
      console.error(err);
      toast.error('Camera access denied or error');
    } finally {
      setIsLoading(false);
    }
  };

  // Attach stream and begin scanning once video element is rendered
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (cameraActive && cameraStream && videoRef.current) {
      const videoElem = videoRef.current;
      videoElem.srcObject = cameraStream;
      videoElem.play();
      codeReaderRef.current = new BrowserQRCodeReader();
      codeReaderRef.current.decodeFromVideoDevice(null, videoElem, (result) => {
        if (result) {
          handleQrResult(result.getText());
        }
      });
    }
  }, [cameraActive, cameraStream]);

  // Stop camera and reset scanner
  const stopCamera = () => {
    if (codeReaderRef.current) codeReaderRef.current.reset();
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
    setCameraActive(false);
  };

  // Handle uploaded image QR scanning
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const readerInst = new BrowserQRCodeReader();
      const img = new Image();
      img.onload = async () => {
        try {
          const result = await readerInst.decodeFromImageElement(img);
          handleQrResult(result.getText());
        } catch {
          toast.error('Invalid QR code in image');
        }
      };
      img.onerror = () => toast.error('Invalid image file');
      img.src = URL.createObjectURL(file);
    }
  };

  const renderMethodContent = () => {
    switch (method) {
      case 'qr':
        return (
          <div className='grid gap-4 text-center'>
            <p>Scan a receipt QR code or upload an image of it.</p>
            <div className='flex flex-col md:flex-row justify-center items-center gap-4'>
              {!cameraActive ? (
                <Button size='lg' onClick={startCamera} disabled={isLoading}>
                  <QrCode className='mr-2 h-5 w-5' />
                  {isLoading ? 'Loading...' : 'Scan QR Code'}
                </Button>
              ) : (
                <div className='w-full max-w-md flex flex-col items-center'>
                  <div className='relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden'>
                    <video
                      ref={videoRef}
                      className='absolute inset-0 w-full h-full object-cover'
                      muted
                      autoPlay
                      playsInline
                    />
                  </div>
                  <Button size='sm' onClick={stopCamera} className='mt-2'>
                    Stop Camera
                  </Button>
                </div>
              )}
              <Button
                size='lg'
                variant='secondary'
                onClick={() => inputRef.current?.click()}
                disabled={isLoading}>
                <Upload className='mr-2 h-5 w-5' /> Upload Image
              </Button>
              <input
                type='file'
                accept='image/*'
                ref={inputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        );
      case 'history':
        return (
          <div className='grid gap-4 text-center'>
            <p>
              Connect to your Walmart account to import from your recent order
              history.
            </p>
            <Button
              size='lg'
              onClick={handleDetect}
              disabled={isLoading}
              className='mx-auto'>
              {isLoading ? (
                <Loader2 className='mr-2 h-5 w-5 animate-spin' />
              ) : (
                <History className='mr-2 h-5 w-5' />
              )}
              Import from Last Order
            </Button>
          </div>
        );
      case 'manual':
        return <ManualAddForm onAddItem={handleManualAdd} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {method === 'qr' && 'Import from QR'}
          {method === 'history' && 'Import from History'}
          {method === 'manual' && 'Add Item Manually'}
        </CardTitle>
      </CardHeader>
      <CardContent>{renderMethodContent()}</CardContent>
      <CardContent className='flex justify-between'>
        <Button variant='outline' onClick={onBack} disabled={isLoading}>
          Back
        </Button>
      </CardContent>
    </Card>
  );
}

function ManualAddForm({
  onAddItem,
}: {
  onAddItem: (item: PantryItem) => void;
}) {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [category, setCategory] = useState('general');
  const [unit, setUnit] = useState<'units' | 'g' | 'kg' | 'ml' | 'l'>('units');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: PantryItem = {
      id: `manual-${Date.now()}`,
      name,
      quantity,
      unit,
      expiryDate: new Date().toISOString(),
      category,
      notes,
    };
    onAddItem(newItem);
  };

  return (
    <form onSubmit={handleSubmit} className='grid gap-4'>
      <div className='grid gap-2'>
        <Label htmlFor='itemName'>Item Name</Label>
        <Input
          id='itemName'
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='grid gap-2'>
          <Label htmlFor='quantity'>Quantity</Label>
          <Input
            id='quantity'
            type='number'
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            required
            min='1'
          />
        </div>

        <div className='grid gap-2'>
          <Label htmlFor='unit'>Unit</Label>
          <Select
            value={unit}
            onValueChange={(value) =>
              setUnit(value as 'units' | 'g' | 'kg' | 'ml' | 'l')
            }>
            <SelectTrigger id='unit'>
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

      <div className='grid gap-2'>
        <Label htmlFor='category'>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id='category'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='general'>General</SelectItem>
            <SelectItem value='produce'>Produce</SelectItem>
            <SelectItem value='dairy'>Dairy</SelectItem>
            <SelectItem value='meat'>Meat</SelectItem>
            <SelectItem value='grain'>Grain</SelectItem>
            <SelectItem value='canned'>Canned</SelectItem>
            <SelectItem value='frozen'>Frozen</SelectItem>
            <SelectItem value='spice'>Spices</SelectItem>
            <SelectItem value='beverage'>Beverages</SelectItem>
            <SelectItem value='snack'>Snacks</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='grid gap-2'>
        <Label htmlFor='notes'>Notes</Label>
        <Input
          id='notes'
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder='Optional notes'
        />
      </div>

      <Button type='submit'>Add Item and Validate</Button>
    </form>
  );
}

function ValidationStep({
  items,
  onConfirm,
  onBack,
  updateItem,
  removeItem,
  addItem,
}: {
  items: PantryItem[];
  onConfirm: () => void;
  onBack: () => void;
  updateItem: (
    id: string,
    field: keyof PantryItem,
    value: string | number | boolean | undefined
  ) => void;
  removeItem: (id: string) => void;
  addItem: () => void;
}) {
  const { loading } = useAppSelector((state) => state.pantry);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Validate Items</CardTitle>
        <CardDescription>
          Review and edit the detected items before adding them to your pantry.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        {items.map((item) => (
          <div
            key={item.id}
            className='grid grid-cols-1 md:grid-cols-12 gap-2 items-center rounded-lg border p-2 mb-2'>
            <div className='md:col-span-4'>
              <Input
                value={item.name}
                onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                placeholder='Item Name'
              />
            </div>
            <div className='md:col-span-2'>
              <Input
                type='number'
                value={item.quantity}
                onChange={(e) =>
                  updateItem(item.id, 'quantity', Number(e.target.value))
                }
                min='1'
              />
            </div>
            <div className='md:col-span-2'>
              <Select
                value={item.unit}
                onValueChange={(value) => updateItem(item.id, 'unit', value)}>
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
            <div className='md:col-span-3'>
              <Input
                type='date'
                value={item.expiryDate ? item.expiryDate.split('T')[0] : ''}
                onChange={(e) =>
                  updateItem(
                    item.id,
                    'expiryDate',
                    new Date(e.target.value).toISOString()
                  )
                }
              />
            </div>
            <div className='md:col-span-1'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => removeItem(item.id)}>
                <Trash2 className='h-4 w-4 text-destructive' />
              </Button>
            </div>

            {/* Second row for category and notes */}
            <div className='md:col-span-4 col-start-1'>
              <Select
                value={item.category}
                onValueChange={(value) =>
                  updateItem(item.id, 'category', value)
                }>
                <SelectTrigger>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='general'>General</SelectItem>
                  <SelectItem value='produce'>Produce</SelectItem>
                  <SelectItem value='dairy'>Dairy</SelectItem>
                  <SelectItem value='meat'>Meat</SelectItem>
                  <SelectItem value='grain'>Grain</SelectItem>
                  <SelectItem value='canned'>Canned</SelectItem>
                  <SelectItem value='frozen'>Frozen</SelectItem>
                  <SelectItem value='spice'>Spices</SelectItem>
                  <SelectItem value='beverage'>Beverages</SelectItem>
                  <SelectItem value='snack'>Snacks</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='md:col-span-7'>
              <Input
                placeholder='Notes (optional)'
                value={item.notes || ''}
                onChange={(e) => updateItem(item.id, 'notes', e.target.value)}
              />
            </div>
            <div className='md:col-span-1'></div>
          </div>
        ))}
        <Button variant='outline' onClick={() => addItem()}>
          <PlusCircle className='mr-2 h-4 w-4' /> Add Another Item
        </Button>
      </CardContent>
      <CardContent className='flex justify-between'>
        <Button variant='outline' onClick={onBack} disabled={loading}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Adding to
              Pantry...
            </>
          ) : (
            'Confirm & Add to Pantry'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
