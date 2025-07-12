'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import AppLayout from '@/components/Applayout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateProfile } from '@/store/profileSlice';

interface ProfileFormValues {
  displayName: string;
  region: string;
  customRegion?: string; // Added optional field for custom region input
  preference: string;
  expiryAlerts: boolean;
  weeklyReminders: boolean;
  privacyConsent: boolean;
}

interface ValidationErrors {
  displayName?: string;
  region?: string;
  customRegion?: string;
  preference?: string;
  expiryAlerts?: string;
  weeklyReminders?: string;
  privacyConsent?: string;
}

// Define validation rules manually
const validateProfile = (values: ProfileFormValues): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!values.displayName || values.displayName.length < 2) {
    errors.displayName = 'Display name must be at least 2 characters.';
  }

  // Check region validation
  if (values.region === 'Other') {
    if (!values.customRegion || values.customRegion.length < 2) {
      errors.customRegion = 'Please enter your region.';
    }
  } else if (!values.region || values.region.length < 2) {
    errors.region = 'Region is required.';
  }

  if (!values.preference || values.preference.length < 2) {
    errors.preference = 'Preference is required.';
  }

  if (!values.privacyConsent) {
    errors.privacyConsent = 'You must agree to the privacy policy.';
  }

  return errors;
};

export default function ProfilePage() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.profile);
  const userDetails = useAppSelector((state) => state.user.userDetails);
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we've already fetched profile data in this session
  const [hasLoadedProfile, setHasLoadedProfile] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('profileLoaded') === 'true';
    }
    return false;
  });

  // Get the user's name from Redux state for fallback
  const userName = userDetails?.name || '';

  // Determine the default display name: use profile.displayName if it exists, otherwise use userName
  const defaultDisplayName =
    profile?.displayName && profile.displayName.trim().length > 0
      ? profile.displayName
      : userName;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    watch,
    setValue,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      displayName: defaultDisplayName,
      region: profile.region,
      preference: profile.dietaryPreferences?.[0] || '', // Using the first dietary preference as preference
      expiryAlerts: profile.notificationSettings.expiryAlerts,
      weeklyReminders: profile.notificationSettings.weeklyReminders,
      privacyConsent: profile.privacyConsent,
    },
  });

  // Watch the region value to see if "Other" is selected
  const selectedRegion = watch('region');

  // Fetch profile data on initial load, only once per session
  useEffect(() => {
    // Only fetch when user UID is available and not already loaded
    if (!userDetails?.uid || hasLoadedProfile) return;
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userDetails.uid }),
        });
        const data = await response.json();
        if (data.success && data.profile) {
          dispatch(updateProfile(data.profile));
          console.log('Profile loaded from DB:', data.profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      } finally {
        // Persist load flag to prevent infinite fetch attempts
        sessionStorage.setItem('profileLoaded', 'true');
        setHasLoadedProfile(true);
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [userDetails?.uid, hasLoadedProfile, dispatch, toast]);

  // Keep form in sync with store if profile changes
  useEffect(() => {
    // Using proper fallback for display name - prefer profile display name if it exists, otherwise use user's name
    const updatedDisplayName =
      profile.displayName && profile.displayName.trim().length > 0
        ? profile.displayName
        : userName;

    // Set customRegion if region is not one of the predefined options
    const standardRegions = ['US-CA', 'US-NY', 'CA-ON', 'Other'];
    const isStandardRegion = standardRegions.includes(profile.region);
    const regionValue = isStandardRegion ? profile.region : 'Other';

    // Update form values
    reset({
      displayName: updatedDisplayName,
      region: regionValue,
      customRegion: !isStandardRegion ? profile.region : '',
      preference: profile.dietaryPreferences?.[0] || '', // Using the first dietary preference
      expiryAlerts: profile.notificationSettings.expiryAlerts,
      weeklyReminders: profile.notificationSettings.weeklyReminders,
      privacyConsent: profile.privacyConsent,
    });
  }, [profile, userName, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    // Custom validation before submitting
    const validationErrors = validateProfile(data);

    // Check if there are any validation errors
    const hasErrors = Object.keys(validationErrors).length > 0;

    if (hasErrors) {
      // Set errors for each field with validation errors
      Object.entries(validationErrors).forEach(([field, message]) => {
        setError(field as keyof ProfileFormValues, {
          type: 'manual',
          message: message,
        });
      });
      return;
    }

    setIsSaving(true);

    // Get user ID from the state (using only UID for security)
    const userId = userDetails.uid;

    // Prepare profile data for API
    const finalRegion =
      data.region === 'Other' && data.customRegion
        ? data.customRegion
        : data.region;

    const profileData = {
      displayName: data.displayName,
      region: finalRegion, // Use custom region text if "Other" was selected
      dietaryPreferences: [data.preference], // Converting preference to dietaryPreferences array
      notificationSettings: {
        expiryAlerts: data.expiryAlerts,
        weeklyReminders: data.weeklyReminders,
      },
      privacyConsent: data.privacyConsent,
    };

    // Update profile in Redux store
    dispatch(updateProfile(profileData));

    // Log the profile data being sent to the API for debugging
    console.log('Sending profile data to API:', { userId, profileData });

    // Save to database via API using try-catch for consistency
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          profileData,
        }),
      });
      // Log HTTP status code to monitor API response
      console.log('Profile update response status:', response.status);
      const data = await response.json();
      // Log response data from API for debugging
      console.log('Profile update response data:', data);

      if (data.success) {
        // Mark profile as loaded in session storage
        sessionStorage.setItem('profileLoaded', 'true');
        setHasLoadedProfile(true);

        toast({
          title: 'Profile Updated',
          description: 'Your settings have been saved to the database.',
        });
      } else {
        toast({
          title: 'Warning',
          description:
            'Profile updated locally but failed to save to the database.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      // Log basic error information for debugging
      console.error('Error saving profile:', error);
      // More detailed error logging with type-safe access to error properties
      if (error instanceof Error) {
        console.error(
          'Error name:',
          error.name,
          'Error message:',
          error.message
        );
      }
      toast({
        title: 'Error',
        description: 'Failed to save profile settings to the database.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout pageTitle='Profile & Settings'>
      <Card>
        <CardHeader>
          <CardTitle>Your Profile</CardTitle>
          <CardDescription>
            Manage your account settings and preferences.
          </CardDescription>
        </CardHeader>
        {isLoading ? (
          <CardContent className='flex items-center justify-center py-8'>
            <div className='flex flex-col items-center space-y-2'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
              <p className='text-sm text-muted-foreground'>
                Loading profile data...
              </p>
            </div>
          </CardContent>
        ) : (
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
              {/* Display Name */}
              <div className='grid gap-2'>
                <Label htmlFor='displayName'>Display Name</Label>
                <Controller
                  name='displayName'
                  control={control}
                  render={({ field }) => <Input id='displayName' {...field} />}
                />
                {errors.displayName && (
                  <p className='text-sm text-destructive'>
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              {/* Region */}
              <div className='grid gap-2'>
                <Label htmlFor='region'>Region</Label>
                <Controller
                  name='region'
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a region' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='US-CA'>USA - California</SelectItem>
                        <SelectItem value='US-NY'>USA - New York</SelectItem>
                        <SelectItem value='CA-ON'>Canada - Ontario</SelectItem>
                        <SelectItem value='Other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {selectedRegion === 'Other' && (
                  <div className='mt-2'>
                    <Controller
                      name='customRegion'
                      control={control}
                      defaultValue=''
                      render={({ field }) => (
                        <Input
                          placeholder='Enter your region'
                          {...field}
                          className='mt-1'
                        />
                      )}
                    />
                    <p className='text-sm text-muted-foreground mt-1'>
                      Please enter your region or location
                    </p>
                    {errors.customRegion && (
                      <p className='text-sm text-destructive mt-1'>
                        {errors.customRegion.message}
                      </p>
                    )}
                  </div>
                )}
                {errors.region && (
                  <p className='text-sm text-destructive'>
                    {errors.region.message}
                  </p>
                )}
              </div>

              {/* preferences */}
              <div className='grid gap-2'>
                <Label htmlFor='preference'>Preference</Label>
                <Controller
                  name='preference'
                  control={control}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder='Select a preference' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='Veg'>Veg</SelectItem>
                        <SelectItem value='Non-Veg'>Non-Veg</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.region && (
                  <p className='text-sm text-destructive'>
                    {errors.region.message}
                  </p>
                )}
              </div>

              {/* Notification Settings */}
              <div>
                <h3 className='text-lg font-medium'>Notifications</h3>
                <div className='space-y-4 mt-4'>
                  <Controller
                    name='expiryAlerts'
                    control={control}
                    render={({ field }) => (
                      <div className='flex items-center justify-between rounded-lg border p-4'>
                        <div className='space-y-0.5'>
                          <Label htmlFor='expiryAlerts' className='text-base'>
                            Expiry Alerts
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            Get notified when items are about to expire.
                          </p>
                        </div>
                        <Switch
                          id='expiryAlerts'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                  <Controller
                    name='weeklyReminders'
                    control={control}
                    render={({ field }) => (
                      <div className='flex items-center justify-between rounded-lg border p-4'>
                        <div className='space-y-0.5'>
                          <Label
                            htmlFor='weeklyReminders'
                            className='text-base'>
                            Weekly Reminders
                          </Label>
                          <p className='text-sm text-muted-foreground'>
                            Receive a weekly summary of your pantry.
                          </p>
                        </div>
                        <Switch
                          id='weeklyReminders'
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Privacy Consent */}
              <div>
                <Controller
                  name='privacyConsent'
                  control={control}
                  render={({ field }) => (
                    <div className='flex items-start space-x-2'>
                      <Switch
                        id='privacyConsent'
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className='mt-1'
                      />
                      <div className='grid gap-1.5 leading-none'>
                        <Label htmlFor='privacyConsent'>
                          I agree to the terms and privacy policy.
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          We use your data to improve recipe recommendations.
                        </p>
                      </div>
                    </div>
                  )}
                />
                {errors.privacyConsent && (
                  <p className='text-sm text-destructive mt-2'>
                    {errors.privacyConsent.message}
                  </p>
                )}
              </div>

              <Button type='submit' disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Save className='mr-2 h-4 w-4' />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </AppLayout>
  );
}
