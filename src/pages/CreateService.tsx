import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { createService } from '@/lib/services/service.service';
import { Package, ArrowLeft, Image, Video, Music, Upload, X, Plus, ImagePlus, Info, Tag } from 'lucide-react';
import { uploadServiceMedia, MediaItem } from '@/lib/services/media.service';
import { MediaType } from '@/lib/utils/cloudinaryUtils';
import { useToast } from '@/components/ui/use-toast';
import { EditorVibes } from '@/lib/models/service.model';

const CreateService = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [tags, setTags] = useState('');
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isStarterGig, setIsStarterGig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Supported file types
  const supportedFileTypes = {
    image: 'image/jpeg, image/png, image/gif, image/webp',
    video: 'video/mp4, video/webm, video/quicktime',
    audio: 'audio/mpeg, audio/wav, audio/ogg'
  };
  
  // Toggle a vibe selection
  const toggleVibe = (vibe: string) => {
    setSelectedVibes(prev => 
      prev.includes(vibe) 
        ? prev.filter(v => v !== vibe) 
        : [...prev, vibe]
    );
  };
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !currentUser) return;
    
    const file = e.target.files[0];
    
    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 100MB",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Create a temporary service ID for uploading media
      // We'll create the real service later and update these files
      const tempServiceId = `temp_${Date.now()}`;
      
      // Update progress every second to simulate upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 20;
          return next > 90 ? 90 : next;
        });
      }, 1000);
      
      // Upload the file
      const mediaItem = await uploadServiceMedia(
        tempServiceId,
        currentUser.uid,
        file,
        media.length === 0 // Set as thumbnail if this is the first media
      );
      
      // Clear the interval and set progress to 100
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Add the media item to the state
      setMedia(prev => [...prev, mediaItem]);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "File uploaded successfully",
        description: `Your ${getMediaTypeLabel(mediaItem.type)} has been uploaded`,
        variant: "success"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  // Get label for media type
  const getMediaTypeLabel = (type: MediaType): string => {
    switch (type) {
      case MediaType.IMAGE: return 'image';
      case MediaType.VIDEO: return 'video';
      case MediaType.AUDIO: return 'audio';
      default: return 'file';
    }
  };
  
  // Get icon for media type
  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.IMAGE: return <Image className="h-5 w-5" />;
      case MediaType.VIDEO: return <Video className="h-5 w-5" />;
      case MediaType.AUDIO: return <Music className="h-5 w-5" />;
      default: return <Upload className="h-5 w-5" />;
    }
  };
  
  // Remove a media item
  const removeMedia = (id: string) => {
    setMedia(prev => prev.filter(item => item.id !== id));
  };
  
  // Set a media item as thumbnail
  const setAsThumbnail = (id: string) => {
    setMedia(prev => prev.map(item => ({
      ...item,
      isThumbnail: item.id === id
    })));
  };
  
  // Handle starter gig checkbox change
  const handleStarterGigChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsStarterGig(isChecked);
    
    // If it's a starter gig, set price to $5
    if (isChecked) {
      setPrice('5');
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    // Validate starter gig has $5 price
    if (isStarterGig && parseFloat(price) !== 5) {
      toast({
        title: "Invalid price for Starter Gig",
        description: "Starter Gigs must be priced at exactly $5.",
        variant: "destructive"
      });
      setPrice('5');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Calculate delivery time in hours to determine if this is an express delivery
      const deliveryTimeValue = parseInt(deliveryTime) || 3;
      const deliveryTimeInHours = deliveryTimeValue * 24;
      const isExpressDelivery = deliveryTimeInHours <= 24;
      
      const serviceData = {
        title,
        description,
        category,
        subcategory: '',
        tags: tags.split(',').map(tag => tag.trim()),
        images: [], // Keep empty for new services
        // Get only URLs for the media items
        media: media.map(item => ({
          ...item
        })),
        thumbnail: media.find(item => item.isThumbnail)?.url || '',
        packages: [
          {
            id: '1',
            name: 'Basic',
            description: 'Basic package',
            deliveryTime: deliveryTimeValue,
            revisions: 2,
            features: ['Feature 1', 'Feature 2'],
            price: parseFloat(price) || 50
          }
        ],
        requirements: '',
        isStarterGig,
        isExpressDelivery,
        vibes: selectedVibes,
        isActive: true
      };
      
      const serviceId = await createService(currentUser.uid, serviceData);
      
      navigate(`/seller/edit-service/${serviceId}`);
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        title: "Service creation failed",
        description: "There was an error creating your service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        
        <h1 className="text-3xl font-bold mb-8">Create a New Service</h1>
        
        <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Service Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="I will create a professional video edit"
                className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your service in detail..."
                className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-32"
                required
              />
            </div>
            
            {/* Media Upload Section */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Media (Images, Videos, Audio)
              </label>
              
              <div className="border border-dashed border-border rounded-lg p-6 bg-background/50">
                {/* Thumbnail Instructions */}
                <div className="mb-4 p-3 bg-accent/30 rounded-lg flex items-start gap-2">
                  <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium">Service Thumbnail</h4>
                    <p className="text-xs text-muted-foreground">
                      The thumbnail is the main image shown to buyers when browsing services. Set a thumbnail by hovering over any image or video and clicking the thumbnail icon.
                    </p>
                    {!media.some(item => item.isThumbnail) && media.length > 0 && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        ⚠️ Your service has no thumbnail set. Please set one.
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Current Thumbnail Display */}
                {media.some(item => item.isThumbnail) && (
                  <div className="mb-4 border border-primary/40 rounded-lg p-3 bg-primary/5">
                    <h4 className="text-sm font-medium flex items-center mb-2">
                      <ImagePlus className="h-4 w-4 mr-1 text-primary" />
                      Current Thumbnail
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="aspect-video rounded-md overflow-hidden border border-primary">
                        {(() => {
                          const thumb = media.find(item => item.isThumbnail);
                          if (!thumb) return null;
                          
                          return thumb.type === MediaType.VIDEO ? (
                            <video 
                              src={thumb.url} 
                              className="w-full h-full object-cover" 
                              controls
                            />
                          ) : (
                            <img 
                              src={thumb.url} 
                              alt="Service thumbnail" 
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>
                      
                      <div className="flex flex-col justify-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          This is how your service will appear in search results and listings.
                        </p>
                        <button
                          type="button"
                          onClick={triggerFileInput}
                          className="text-sm text-primary hover:underline"
                        >
                          Upload a different thumbnail
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Media Grid */}
                {media.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {media.map((item) => (
                      <div key={item.id} className="relative group">
                        {/* Media Preview */}
                        <div className={`aspect-video rounded-md overflow-hidden bg-black/5 flex items-center justify-center ${item.isThumbnail ? 'ring-2 ring-primary' : ''}`}>
                          {item.type === MediaType.IMAGE ? (
                            <img src={item.url} alt="Service media" className="w-full h-full object-cover" />
                          ) : item.type === MediaType.VIDEO ? (
                            <video src={item.url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <Music className="h-8 w-8 text-muted-foreground mb-2" />
                              <span className="text-xs text-muted-foreground">Audio File</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Controls */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {/* Set as thumbnail button (only for images and videos) */}
                          {(item.type === MediaType.IMAGE || item.type === MediaType.VIDEO) && !item.isThumbnail && (
                            <button
                              type="button"
                              onClick={() => setAsThumbnail(item.id)}
                              className="bg-primary/80 text-white p-2 rounded-md hover:bg-primary transition-colors flex flex-col items-center"
                              title="Set as thumbnail"
                            >
                              <ImagePlus className="h-4 w-4 mb-1" />
                              <span className="text-xs">Set as Thumbnail</span>
                            </button>
                          )}
                          
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeMedia(item.id)}
                            className="bg-destructive/80 text-white p-2 rounded-md hover:bg-destructive transition-colors"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        
                        {/* Thumbnail indicator */}
                        {item.isThumbnail && (
                          <div className="absolute top-1 left-1 bg-primary text-white text-xs px-2 py-1 rounded-md font-medium">
                            Thumbnail
                          </div>
                        )}
                        
                        {/* Type indicator */}
                        <div className="absolute bottom-1 right-1 bg-background/80 p-1 rounded-md">
                          {getMediaTypeIcon(item.type)}
                        </div>
                      </div>
                    ))}
                    
                    {/* Add more button */}
                    {media.length < 10 && (
                      <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={isUploading}
                        className="aspect-video rounded-md border border-dashed border-border bg-background/50 flex flex-col items-center justify-center hover:bg-background/80 transition-colors"
                      >
                        <Plus className="h-8 w-8 text-muted-foreground mb-1" />
                        <span className="text-xs text-muted-foreground">Add Media</span>
                      </button>
                    )}
                  </div>
                )}
                
                {/* Upload Button */}
                {media.length === 0 && (
                  <div className="text-center">
                    <div className="mb-4 flex justify-center">
                      <div className="p-3 rounded-full bg-background border border-border">
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-1">Upload Media</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload images, videos, or audio files for your service.<br/>
                      <span className="font-medium">Important: Add at least one image or video to use as your service thumbnail.</span>
                    </p>
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      disabled={isUploading}
                      className="btn-secondary"
                    >
                      {isUploading ? 'Uploading...' : 'Select Files'}
                    </button>
                  </div>
                )}
                
                {/* File Input (hidden) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  accept={`${supportedFileTypes.image}, ${supportedFileTypes.video}, ${supportedFileTypes.audio}`}
                  className="hidden"
                  disabled={isUploading}
                />
                
                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-4">
                    <div className="h-2 bg-background/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-1">
                      Uploading: {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}
                
                {/* Help Text */}
                <p className="text-xs text-muted-foreground mt-4">
                  You can upload up to 10 media items (images, videos, audio). Max file size: 100MB.
                  <br />
                  Supported formats: JPG, PNG, GIF, WEBP, MP4, WEBM, MOV, MP3, WAV, OGG
                </p>
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="">Select a category</option>
                <option value="youtube">YouTube Videos</option>
                <option value="social">Social Media</option>
                <option value="wedding">Wedding Films</option>
                <option value="corporate">Corporate Videos</option>
                <option value="color">Color Grading</option>
                <option value="animation">Animation</option>
              </select>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-sm font-medium mb-1">
                  Basic Package Price ($)
                </label>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="50"
                  min="5"
                  step="0.01"
                  className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                  disabled={isStarterGig}
                />
                {isStarterGig && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Price is fixed at $5 for Starter Gigs
                  </p>
                )}
              </div>
              
              <div>
                <label htmlFor="deliveryTime" className="block text-sm font-medium mb-1">
                  Delivery Time (days)
                </label>
                <input
                  id="deliveryTime"
                  type="number"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="3"
                  min="1"
                  className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="tags" className="block text-sm font-medium mb-1">
                Tags (comma separated)
              </label>
              <input
                id="tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="video editing, color grading, youtube"
                className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter tags separated by commas to help buyers find your service
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Editor Vibes <span className="text-sm font-normal text-muted-foreground">(Select up to 5)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EditorVibes.map((vibe) => (
                  <button
                    key={vibe}
                    type="button"
                    onClick={() => toggleVibe(vibe)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedVibes.includes(vibe)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-accent/30'
                    }`}
                    disabled={selectedVibes.length >= 5 && !selectedVibes.includes(vibe)}
                  >
                    {vibe}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Choose vibes that best describe your editing style to help buyers find services matching their preferences
              </p>
            </div>
            
            <div className="border-t border-border pt-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="starter-gig"
                    type="checkbox"
                    checked={isStarterGig}
                    onChange={handleStarterGigChange}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="starter-gig" className="font-medium flex items-center">
                    <Tag className="h-4 w-4 text-green-600 mr-1" />
                    Mark as $5 Starter Gig
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 rounded">New</span>
                  </label>
                  <p className="text-muted-foreground mt-1">
                    Starter Gigs are priced at exactly $5 and are designed to attract new buyers. 
                    They help you establish your presence on the platform by offering a simple, entry-level service.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                className="btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateService; 