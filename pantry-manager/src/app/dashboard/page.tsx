'use client';

import { useEffect } from 'react';
import AppLayout from '@/components/Applayout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchPantryItems } from '@/store/pantrySlice';
import { PantryItem } from '@/lib/types';
import { addDays, isBefore } from 'date-fns';
import {
  UtensilsCrossed,
  AlertTriangle,
  Lightbulb,
  ShoppingCart,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { items: pantryItems, loading } = useAppSelector(
    (state) => state.pantry
  );
  const recipes = useAppSelector((state) => state.recipes);
  const { authState, userDetails } = useAppSelector((state) => state.user);

  // Load pantry items once when the dashboard mounts if user is available
  useEffect(() => {
    if (authState && userDetails.uid && pantryItems.length === 0 && !loading) {
      dispatch(fetchPantryItems(userDetails.uid));
    }
  }, [authState, userDetails.uid, dispatch, pantryItems.length, loading]);

  const expiringSoonCount = pantryItems.filter((item: PantryItem) =>
    item.expiryDate
      ? isBefore(new Date(item.expiryDate), addDays(new Date(), 3))
      : false
  ).length;

  const firstRecipe = recipes[0];

  return (
    <>
      <AppLayout pageTitle='Dashboard'>
        <div className='grid gap-6'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Items
                </CardTitle>
                <UtensilsCrossed className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{pantryItems.length}</div>
                <p className='text-xs text-muted-foreground'>
                  items currently in your pantry
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Expiring Soon
                </CardTitle>
                <AlertTriangle className='h-4 w-4 text-destructive' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{expiringSoonCount}</div>
                <p className='text-xs text-muted-foreground'>
                  items expiring in the next 3 days
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Quick Actions
                </CardTitle>
                <PlusCircle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent className='flex gap-2 pt-2'>
                <Button asChild size='sm'>
                  <Link href='/add-items'>Add Items</Link>
                </Button>
                <Button asChild variant='outline' size='sm'>
                  <Link href='/shopping-list'>Shopping List</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className='grid gap-6 lg:grid-cols-2'>
            {firstRecipe && (
              <Card>
                <CardHeader>
                  <div className='flex items-center gap-2'>
                    <Lightbulb className='h-5 w-5 text-yellow-500' />
                    <CardTitle>Recipe Suggestion</CardTitle>
                  </div>
                  <CardDescription>
                    Based on whats in your pantry
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='flex gap-4'>
                    {firstRecipe.imageUrl ? (
                      <Image
                        src={firstRecipe.imageUrl}
                        alt={firstRecipe.title}
                        width={96}
                        height={96}
                        className='h-24 w-24 rounded-md object-cover'
                      />
                    ) : (
                      <div className='h-24 w-24 rounded-md bg-muted flex items-center justify-center'>
                        <Lightbulb className='h-8 w-8 text-muted-foreground' />
                      </div>
                    )}
                    <div>
                      <h3 className='font-semibold'>{firstRecipe.title}</h3>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {firstRecipe.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link href='/recipes'>View All Recipes</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}

            <Card>
              <CardHeader>
                <div className='flex items-center gap-2'>
                  <ShoppingCart className='h-5 w-5 text-primary' />
                  <CardTitle>Shopping Recommendations</CardTitle>
                </div>
                <CardDescription>
                  Based on low stock and recipe needs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>
                  You re running low on Milk. We also noticed you need Lettuce
                  for a recipe.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href='/shopping-list'>Go to Shopping List</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </AppLayout>
    </>
  );
}
