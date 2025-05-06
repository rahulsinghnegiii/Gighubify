
import React, { useEffect, useState } from 'react';
import { Upload, Plus, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const AddGig = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [formStatus, setFormStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    subcategory: '',
    description: '',
    price: '',
    deliveryTime: '',
    revisions: '3',
    features: [''],
    tags: [],
    requirements: ''
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({
      ...prev,
      features: newFeatures,
    }));
  };

  const addFeature = () => {
    if (formData.features.length < 10) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, ''],
      }));
    }
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = [...formData.features];
      newFeatures.splice(index, 1);
      setFormData(prev => ({
        ...prev,
        features: newFeatures,
      }));
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = (e.target as HTMLInputElement).value.trim();
      if (value && !formData.tags.includes(value) && formData.tags.length < 10) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, value],
        }));
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('submitting');
    
    // Here you would typically send the data to a backend API
    setTimeout(() => {
      console.log('Form submitted:', { ...formData, images: uploadedImages });
      setFormStatus('success');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setFormStatus('idle');
        setActiveStep(1);
        setUploadedImages([]);
        setFormData({
          title: '',
          category: '',
          subcategory: '',
          description: '',
          price: '',
          deliveryTime: '',
          revisions: '3',
          features: [''],
          tags: [],
          requirements: ''
        });
      }, 3000);
    }, 1500);
  };

  const nextStep = () => {
    if (activeStep < 3) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Check if current step is complete
  const isStepComplete = () => {
    if (activeStep === 1) {
      return formData.title && formData.category && formData.description && formData.price;
    } else if (activeStep === 2) {
      return uploadedImages.length > 0 && formData.features.some(f => f !== '');
    }
    return true;
  };

  // Render different steps
  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Basic Information</h2>
            <p className="text-muted-foreground mb-6">
              Provide the basic details about your video editing service.
            </p>
            
            <div className="form-group">
              <label htmlFor="title" className="block text-sm font-medium mb-2">Gig Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Professional Video Editing for YouTube"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="category" className="block text-sm font-medium mb-2">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="video-editing">Video Editing</option>
                  <option value="motion-graphics">Motion Graphics</option>
                  <option value="color-grading">Color Grading</option>
                  <option value="sound-design">Sound Design</option>
                  <option value="vfx">Visual Effects</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="subcategory" className="block text-sm font-medium mb-2">Subcategory</label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select Subcategory</option>
                  <option value="youtube">YouTube Videos</option>
                  <option value="social-media">Social Media</option>
                  <option value="wedding">Wedding Videos</option>
                  <option value="corporate">Corporate Videos</option>
                  <option value="music-video">Music Videos</option>
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="description" className="block text-sm font-medium mb-2">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="Describe your service in detail..."
                required
              />
              <p className="text-xs text-muted-foreground mt-2">Minimum 120 characters. Be detailed about what you offer.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="price" className="block text-sm font-medium mb-2">Price ($)</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="5"
                  max="10000"
                  className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. 100"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="deliveryTime" className="block text-sm font-medium mb-2">Delivery Time (Days)</label>
                <select
                  id="deliveryTime"
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                >
                  <option value="">Select Delivery Time</option>
                  <option value="1">1 day</option>
                  <option value="2">2 days</option>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Gallery & Features</h2>
            <p className="text-muted-foreground mb-6">
              Upload portfolio samples and specify what's included in your service.
            </p>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-4">Upload Images (Max 5)</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative h-32 border border-border rounded-md overflow-hidden group">
                    <img 
                      src={image} 
                      alt={`Sample ${index + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 h-6 w-6 bg-black/60 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                {uploadedImages.length < 5 && (
                  <label className="h-32 border border-dashed border-border rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-accent/30 transition-colors">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Upload Image</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Upload high-quality samples of your work. Image formats: JPG, PNG, GIF</p>
            </div>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-2">Features Included</label>
              <div className="space-y-3">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => handleFeatureChange(index, e.target.value)}
                      className="flex-grow px-4 py-2 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={`Feature ${index + 1}`}
                      required={index === 0}
                    />
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="h-10 w-10 flex items-center justify-center rounded-md border border-border hover:bg-accent/30 transition-colors"
                      disabled={formData.features.length === 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              {formData.features.length < 10 && (
                <button
                  type="button"
                  onClick={addFeature}
                  className="mt-3 flex items-center gap-2 text-sm text-primary"
                >
                  <Plus className="h-4 w-4" /> Add Another Feature
                </button>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="revisions" className="block text-sm font-medium mb-2">Number of Revisions</label>
              <select
                id="revisions"
                name="revisions"
                value={formData.revisions}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="1">1 revision</option>
                <option value="2">2 revisions</option>
                <option value="3">3 revisions</option>
                <option value="unlimited">Unlimited revisions</option>
              </select>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Final Details</h2>
            <p className="text-muted-foreground mb-6">
              Add the finishing touches to your gig listing.
            </p>
            
            <div className="form-group">
              <label className="block text-sm font-medium mb-2">Tags</label>
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <div key={tag} className="px-3 py-1 text-sm bg-accent rounded-full flex items-center gap-2">
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="h-4 w-4 rounded-full flex items-center justify-center hover:text-primary transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              <input
                type="text"
                placeholder="Type tag and press Enter (e.g. 'youtube', 'color grading')"
                onKeyDown={handleTagInput}
                className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={formData.tags.length >= 10}
              />
              <p className="text-xs text-muted-foreground mt-2">Add up to 10 tags to help buyers find your service. Press Enter or comma after each tag.</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="requirements" className="block text-sm font-medium mb-2">Requirements for Buyers</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-md border border-border focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="What do you need from the buyer to get started? (e.g. video files, script, brand guidelines)"
              />
            </div>
            
            <div className="p-4 border border-border/50 rounded-md bg-accent/30">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Before you submit</h3>
                  <p className="text-sm text-muted-foreground">
                    Make sure your gig adheres to our guidelines. All services must be delivered through our platform, and you should only offer services you're capable of delivering within the timeframe specified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  if (formStatus === 'success') {
    return (
      <div className="min-h-screen pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center py-12">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Your Gig Has Been Created!</h2>
            <p className="text-muted-foreground mb-8">
              Your gig is now published and available for clients to find. You'll be notified when you receive orders.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/my-gigs" className="btn-primary">
                View My Gigs
              </Link>
              <Link to="/" className="btn-secondary">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Create a New Gig</h1>
          <p className="text-muted-foreground">
            Share your video editing services with clients around the world.
          </p>
        </div>
        
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div 
              className={`flex flex-col items-center ${activeStep >= 1 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${activeStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                1
              </div>
              <span className="text-sm">Basics</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${activeStep >= 2 ? 'bg-primary' : 'bg-accent'}`}></div>
            
            <div 
              className={`flex flex-col items-center ${activeStep >= 2 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${activeStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                2
              </div>
              <span className="text-sm">Gallery</span>
            </div>
            
            <div className={`flex-1 h-1 mx-2 ${activeStep >= 3 ? 'bg-primary' : 'bg-accent'}`}></div>
            
            <div 
              className={`flex flex-col items-center ${activeStep >= 3 ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-2 ${activeStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-accent'}`}>
                3
              </div>
              <span className="text-sm">Publish</span>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="bg-card rounded-xl border border-border/50 shadow-subtle p-8 mb-8">
            {renderStepContent()}
          </div>
          
          <div className="flex justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn-secondary"
                disabled={formStatus === 'submitting'}
              >
                Previous
              </button>
            ) : (
              <div></div> // Empty div to maintain flex layout
            )}
            
            {activeStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary"
                disabled={!isStepComplete()}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="btn-primary"
                disabled={formStatus === 'submitting'}
              >
                {formStatus === 'submitting' ? (
                  <span className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent border-white rounded-full"></div>
                    Publishing...
                  </span>
                ) : 'Publish Gig'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGig;
