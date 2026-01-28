import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, MapPin, Clock, Upload, RefreshCw, Check, Plus, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import type { RealEstateLead } from './RealEstateLeadsTable';

interface SiteVisitCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: RealEstateLead | null;
  onSuccess: () => void;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
}

type DialogMode = 'view' | 'capture';

export function SiteVisitCameraDialog({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: SiteVisitCameraDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<DialogMode>('capture');
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [captureTime, setCaptureTime] = useState<Date | null>(null);

  const queryClient = useQueryClient();

  // Initialize mode based on existing photos
  useEffect(() => {
    if (open && lead) {
      const hasPhotos = lead.site_visit_photos && lead.site_visit_photos.length > 0;
      setMode(hasPhotos ? 'view' : 'capture');
    }
  }, [open, lead]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      // Stop any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });

      streamRef.current = stream; // specific assignment order

      // Delay slightly to ensure ref is populated if switching modes
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsStreaming(true);
        }
      }, 100);

    } catch (error) {
      console.error('Camera error:', error);
      toast.error('Failed to access camera. Please allow camera permissions.');
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  // Get location
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationError(null);
      },
      (error) => {
        console.error('Location error:', error);
        setLocationError('Unable to get location. Please enable location services.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Handle mode changes
  useEffect(() => {
    if (open && mode === 'capture') {
      startCamera();
      getLocation();
    } else {
      stopCamera();
      setCapturedImage(null);
      setCaptureTime(null);
    }

    return () => stopCamera();
  }, [open, mode, startCamera, stopCamera, getLocation]);

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Add timestamp and location overlay
    const now = new Date();
    setCaptureTime(now);

    const overlayText = [
      format(now, 'dd MMM yyyy, hh:mm:ss a'),
      location ? `📍 ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : '📍 Location pending...',
      lead?.property_name ? `🏠 ${lead.property_name}` : '',
      lead?.preferred_location ? `📍 ${lead.preferred_location}` : '',
    ].filter(Boolean);

    // Draw semi-transparent overlay at bottom
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, canvas.height - 120, canvas.width, 120);

    // Draw text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    overlayText.forEach((text, index) => {
      ctx.fillText(text, 20, canvas.height - 90 + (index * 28));
    });

    // Convert to data URL
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    stopCamera();
  };

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null);
    setCaptureTime(null);
    startCamera();
    getLocation();
  };

  // DELETE PHOTO Function
  const handleDeletePhoto = async (indexToDelete: number) => {
    if (!lead || !lead.site_visit_photos) return;

    try {
      // 1. Prepare new array
      const updatedPhotos = lead.site_visit_photos.filter((_, idx) => idx !== indexToDelete);

      // 2. Update DB
      const { error } = await supabase
        .from('leads_real_estate')
        .update({
          site_visit_photos: updatedPhotos,
        })
        .eq('id', lead.id);

      if (error) throw error;

      // 3. Invalidate queries to refresh UI
      toast.success('Photo deleted');
      queryClient.invalidateQueries({ queryKey: ['real-estate-leads'] });

      // Note: We are not deleting from Storage bucket to avoid complex path logic for now.
      // It's safer to keep the file and just remove the reference.

      // If no photos left, switch to capture mode
      if (updatedPhotos.length === 0) {
        setMode('capture');
      }

    } catch (error) {
      console.error('Delete error', error);
      toast.error('Failed to delete photo');
    }
  };

  // Upload photo
  const uploadPhoto = async () => {
    if (!capturedImage || !lead) return;

    setIsUploading(true);
    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const fileName = `site-visits/${lead.id}/${Date.now()}.jpg`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company_assets')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('company_assets')
        .getPublicUrl(fileName);

      // Update lead with new photo
      const newPhoto = {
        url: publicUrl,
        timestamp: captureTime?.toISOString() || new Date().toISOString(),
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        verified: true,
      };

      const existingPhotos = lead.site_visit_photos || [];

      const { error: updateError } = await supabase
        .from('leads_real_estate')
        .update({
          site_visit_photos: [...existingPhotos, newPhoto],
        })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      toast.success('Site visit photo uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['real-estate-leads'] });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setIsUploading(false);
    }
  };

  const renderGallery = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {lead?.site_visit_photos?.map((photo, index) => (
          <div key={index} className="relative aspect-video bg-muted rounded-lg overflow-hidden group">
            <img
              src={photo.url}
              alt={`Site visit ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white text-xs">
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePhoto(index);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div>
                <p>{format(new Date(photo.timestamp), 'dd MMM, hh:mm a')}</p>
                <p>Lat: {photo.lat.toFixed(4)}, Lng: {photo.lng.toFixed(4)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setMode('capture')}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Photo
        </Button>
      </div>
    </div>
  );

  const renderCamera = () => (
    <div className="space-y-4">
      {/* Location Status */}
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm">
        <MapPin className="h-4 w-4" />
        {locationError ? (
          <span className="text-destructive">{locationError}</span>
        ) : location ? (
          <span className="text-green-600">
            Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            (±{location.accuracy.toFixed(0)}m)
          </span>
        ) : (
          <span className="text-muted-foreground">Getting location...</span>
        )}
        <Button variant="ghost" size="sm" onClick={getLocation} className="ml-auto">
          <RefreshCw className="h-3 w-3" />
        </Button>
      </div>

      {/* Camera/Preview Area */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Live timestamp overlay */}
        {isStreaming && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 text-white text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(new Date(), 'dd MMM yyyy, hh:mm:ss a')}
            </div>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Capture Time */}
      {captureTime && (
        <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-700 dark:text-green-300">
          <Check className="h-4 w-4" />
          Captured at: {format(captureTime, 'dd MMM yyyy, hh:mm:ss a')}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {mode === 'view' ? 'Site Visit Photos' : 'Capture Site Visit Photo'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {mode === 'view'
              ? 'View existing site visit photos and verification details'
              : 'Take a photo with timestamp and GPS location for verification'}
          </p>
        </DialogHeader>

        {mode === 'view' ? renderGallery() : renderCamera()}

        <DialogFooter className="gap-2 sm:gap-0">
          {mode === 'capture' && lead?.site_visit_photos && lead.site_visit_photos.length > 0 && !capturedImage && (
            <Button variant="outline" onClick={() => setMode('view')} className="mr-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Gallery
            </Button>
          )}

          {mode === 'capture' && (
            capturedImage ? (
              <>
                <Button variant="outline" onClick={retakePhoto}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={uploadPhoto} disabled={isUploading}>
                  {isUploading ? (
                    <>Uploading...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Save Photo
                    </>
                  )}
                </Button>
              </>
            ) : (
              <div className="flex w-full justify-between items-center sm:justify-end sm:gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button onClick={capturePhoto} disabled={!isStreaming}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              </div>
            )
          )}

          {mode === 'view' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
