import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, FileText, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveBalance } from '@/hooks/useLeave';

interface ApplyLeaveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Hardcoded leave type IDs matching the database
const LEAVE_TYPES = [
  { id: '33333333-3333-3333-3333-333333333333', name: 'Sick Leave', icon: '🏥', color: 'text-red-600', max: 6 },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Casual Leave', icon: '📅', color: 'text-blue-600', max: 19 },
  { id: '55555555-5555-5555-5555-555555555555', name: 'My Leave', icon: '👩', color: 'text-pink-600', max: 12 },
];

// Get available leave types based on gender
function getAvailableLeaveTypes(gender?: string | null) {
  const baseTypes = LEAVE_TYPES.filter(t => t.name !== 'My Leave');
  
  // Only show "My Leave" for female employees
  if (gender === 'female') {
    const myLeave = LEAVE_TYPES.find(t => t.name === 'My Leave');
    return myLeave ? [...baseTypes, myLeave] : baseTypes;
  }
  
  return baseTypes;
}

export function ApplyLeaveModal({ open, onOpenChange, onSuccess }: ApplyLeaveModalProps) {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [leaveTypeId, setLeaveTypeId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { user, profile } = useAuth();
  const { data: balances = [] } = useLeaveBalance() as { data: any[] };
  const queryClient = useQueryClient();

  const selectedLeaveType = getAvailableLeaveTypes(profile?.gender).find(t => t.id === leaveTypeId);
  const leaveBalance = (balances as any[]).find(b => b.leave_type_id === leaveTypeId);
  const remaining = leaveBalance?.remaining_leaves || selectedLeaveType?.max || 0;
  const used = leaveBalance?.used_leaves || 0;
  const total = leaveBalance?.total_leaves || selectedLeaveType?.max || 0;
  const isMyLeave = selectedLeaveType?.name === 'My Leave';

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate file type - Check both MIME type and file extension
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    
    const fileName = file.name.toLowerCase();
    const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
    const isValidMimeType = validMimeTypes.includes(file.type);
    const isValidExtension = validExtensions.includes(fileExtension);

    // Accept if either MIME type or extension is valid
    if (!isValidMimeType && !isValidExtension) {
      setError('Only image formats (JPG, JPEG, PNG, GIF) are accepted');
      console.error(`Invalid file: MIME=${file.type}, Extension=${fileExtension}`);
      return;
    }

    // Additional check: ensure MIME type starts with 'image/' if MIME is provided
    if (file.type && !file.type.startsWith('image/')) {
      setError('Only image formats (JPG, JPEG, PNG, GIF) are accepted');
      return;
    }

    setSelectedFile(file);
    setError('');
    console.log(`File selected: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Create preview for all selected files (they're all images)
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    
    if (!cloudName || cloudName === 'your_cloud_name_here') {
      throw new Error('Cloudinary is not configured. Please set VITE_CLOUDINARY_CLOUD_NAME in your .env file');
    }

    console.log(`Starting upload: ${file.name} to Cloudinary`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'leave_attachments');
    formData.append('resource_type', 'image');

    try {
      // Upload image to Cloudinary using image endpoint
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      console.log(`Upload URL: ${uploadUrl}`);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: { message: `HTTP ${response.status}` }
        }));
        console.error('Cloudinary error response:', errorData);
        
        if (errorData.error?.message) {
          throw new Error(`Upload failed: ${errorData.error.message}`);
        } else {
          throw new Error(`Upload failed with status ${response.status}`);
        }
      }

      const data = await response.json();
      console.log(`Upload successful, URL: ${data.secure_url}`);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate || !leaveTypeId || !description) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate dates are real dates
    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    
    // Check if dates are valid (not NaN)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please select valid dates');
      return;
    }

    // Validate the day of month by checking if the day was adjusted
    // This catches invalid dates like April 31st
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    
    const startParsedDay = start.getUTCDate();
    const endParsedDay = end.getUTCDate();
    
    if (startDay !== startParsedDay || endDay !== endParsedDay) {
      setError('Please select valid dates (e.g., April only has 30 days)');
      return;
    }

    // Validate backdated leave limit (30 days maximum in the past)
    if (isBackdatedLeave && !isValidBackdatedLeave) {
      setError('You can only apply for leave from the last 30 days');
      return;
    }

    if (!user) {
      setError('You must be logged in');
      return;
    }

    const requestedDays = calculateDays();
    if (requestedDays > remaining) {
      setError(`Insufficient leave balance. You have ${remaining} days remaining.`);
      return;
    }

    setLoading(true);

    try {
      let attachmentUrl = null;
      let attachmentType = null;

      // Upload file to Cloudinary if selected
      if (selectedFile) {
        setUploadingFile(true);
        try {
          console.log(`Starting attachment upload for: ${selectedFile.name}`);
          attachmentUrl = await uploadToCloudinary(selectedFile);
          // All attachments are images (only images are accepted)
          attachmentType = 'image';
          console.log(`Attachment uploaded successfully: ${attachmentUrl}`);
        } catch (uploadError: any) {
          const errorMsg = uploadError?.message || 'Failed to upload attachment';
          console.error(`Upload error: ${errorMsg}`);
          setError(`Upload error: ${errorMsg}`);
          setLoading(false);
          setUploadingFile(false);
          return;
        }
        setUploadingFile(false);
      }

      // Call backend API for leave application with full validation
      const response = await fetch('/api/leave/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
        },
        body: JSON.stringify({
          leaveTypeId,
          startDate,
          endDate,
          reason: description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.error || 'Failed to submit leave request';
        console.error('API error:', errorMsg);
        setError(errorMsg);
        setLoading(false);
        return;
      }

      const data = await response.json();
      
      // Now update attachment if provided
      if (attachmentUrl && data?.id) {
        const { error: updateError } = await supabase
          .from('leave_requests')
          .update({
            attachment_url: attachmentUrl,
            attachment_type: attachmentType,
          })
          .eq('id', data.id);

        if (updateError) {
          console.error('Update attachment error:', updateError);
        }
      }

      console.log('Leave request submitted:', data);
      
      // Close immediately for smooth UX
      setStartDate('');
      setEndDate('');
      setLeaveTypeId('');
      setDescription('');
      setSelectedFile(null);
      setPreviewUrl('');
      onOpenChange(false);
      if (onSuccess) onSuccess();
      
      // Invalidate queries in background (don't await)
      queryClient.invalidateQueries({ queryKey: ['employeeLeaveRequests'] });
      queryClient.invalidateQueries({ queryKey: ['leaveBalance'] });
    } catch (err: any) {
      console.error('Error:', err);
      setError('Failed to submit leave request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  // Calculate date 30 days ago for backdated limit
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const minBackdatedDate = thirtyDaysAgo.toISOString().split('T')[0];

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays();
  
  // Check if start date is in the past
  const isBackdatedLeave = startDate && new Date(startDate) < new Date(today);
  
  // Check if backdated leave is within allowed range (30 days)
  const isValidBackdatedLeave = isBackdatedLeave && new Date(startDate) >= new Date(minBackdatedDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px] rounded-xl max-h-[90vh] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Apply for Leave</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Submit your leave request for admin approval
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Leave Type Selection */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
              Leave Type *
            </label>
            <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableLeaveTypes(profile?.gender).map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    <span className="flex items-center gap-2">
                      <span>{type.icon}</span>
                      <span>{type.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Leave Balance Info */}
          {leaveTypeId && selectedLeaveType && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    {selectedLeaveType.name}
                  </p>
                  <p className="text-xs font-semibold text-foreground">{total} days available</p>
                </div>
                <div className={`text-2xl font-bold ${selectedLeaveType.color}`}>
                  {remaining}
                </div>
              </div>
              
              <div className="border-t border-primary/10 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Used</p>
                    <p className="text-xs font-bold text-foreground">{used} days</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground font-medium mb-0.5">Remaining</p>
                    <p className={`text-xs font-bold ${remaining > 5 ? 'text-emerald-600' : remaining > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                      {remaining} days
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    selectedLeaveType.color === 'text-red-600' ? 'bg-gradient-to-r from-red-500 to-red-600' : 
                    selectedLeaveType.color === 'text-green-600' ? 'bg-gradient-to-r from-green-500 to-green-600' : 
                    'bg-gradient-to-r from-orange-500 to-orange-600'
                  }`}
                  style={{ width: `${total > 0 ? (used / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Date Selection */}
          {isMyLeave ? (
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                Leave Date *
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setEndDate(e.target.value); // For My Leave, start and end are same
                }}
                min={minBackdatedDate}
                max={today}
                className="h-9 text-xs"
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  Start Date *
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={minBackdatedDate}
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                  End Date *
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || minBackdatedDate}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          {/* Backdated Leave Warning */}
          {isBackdatedLeave && (
            <div className={`p-2.5 rounded-lg flex items-start gap-2.5 ${isValidBackdatedLeave ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
              <AlertCircle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isValidBackdatedLeave ? 'text-amber-600' : 'text-red-600'}`} />
              <div className="text-[10px]">
                <p className={`font-semibold mb-0.5 ${isValidBackdatedLeave ? 'text-amber-700' : 'text-red-700'}`}>
                  {isValidBackdatedLeave ? '⚠️ Backdated Leave' : '❌ Past Leave Date'}
                </p>
                <p className={isValidBackdatedLeave ? 'text-amber-700' : 'text-red-700'}>
                  {isValidBackdatedLeave 
                    ? 'You are applying for a past date. This request will require admin approval.' 
                    : 'You can only apply for leave from the last 30 days.'}
                </p>
              </div>
            </div>
          )}

          {/* Days Summary */}
          {requestedDays > 0 && (
            <div className={`p-2.5 rounded-lg flex items-center gap-2 ${requestedDays <= remaining ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
              <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${requestedDays <= remaining ? 'text-emerald-600' : 'text-red-600'}`} />
              <div className="text-[10px]">
                <p className={`font-medium ${requestedDays <= remaining ? 'text-emerald-700' : 'text-red-700'}`}>
                  {requestedDays} day{requestedDays > 1 ? 's' : ''} requested
                </p>
                {requestedDays > remaining && (
                  <p className="text-red-600">Exceeds available balance</p>
                )}
              </div>
            </div>
          )}

          {/* Description/Reason */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
              Description *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your leave request..."
              rows={2}
              className="text-xs resize-none"
            />
            <p className="text-[9px] text-muted-foreground mt-1">
              Brief description of your leave request
            </p>
          </div>

          {/* File Upload (Optional) */}
          {!isMyLeave && (
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1.5">
                Attachment (Optional)
              </label>
              
              {!selectedFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-600 font-medium mb-1">
                      Click to upload supporting image
                    </p>
                    <p className="text-[10px] text-gray-500">
                      JPG, PNG, JPEG, GIF only (Max 5MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-start gap-3">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              )}
              <p className="text-[9px] text-muted-foreground mt-1">
                Upload image (JPG, PNG, JPEG, GIF) as supporting document (optional)
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 flex gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-red-700">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-[10px] text-blue-900">
              <span className="font-semibold">ℹ️ Note:</span> Your request will be sent to admin for approval.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs"
              disabled={loading || uploadingFile}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadingFile || !leaveTypeId}
              className="h-9 text-xs bg-primary hover:bg-primary/90 text-white"
            >
              {uploadingFile ? 'Uploading...' : loading ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
