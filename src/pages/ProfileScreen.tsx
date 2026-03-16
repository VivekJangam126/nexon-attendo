import { useNavigate } from "react-router-dom";
import { 
  User, Briefcase, Building2, Mail, Calendar, 
  LogOut, ChevronRight, Lock, HelpCircle, FileText, Info, Shield, Camera, Upload, X
} from "lucide-react";
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { profile, logout: authLogout, refreshProfile } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showPhotoUploadDialog, setShowPhotoUploadDialog] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (!profile) {
      navigate("/login");
    }
  }, [profile, navigate]);

  const handleLogout = async () => {
    setShowLogoutDialog(false);
    try {
      await authLogout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusDisplay = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'pending':
        return 'text-amber-600';
      case 'rejected':
      case 'blocked':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid File", description: "Please select an image file (JPG, PNG)", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File Too Large", description: "Image size must be less than 5MB", variant: "destructive" });
      return;
    }

    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhoto || !profile?.id) return;

    setUploadingPhoto(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Upload photo via API
          const response = await fetch('/api/upload-photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId: profile.id,
              photoData: base64Data,
              fileName: selectedPhoto.name,
            }),
          });

          const result = await response.json();

          if (result.success) {
            toast({ 
              title: "Photo Uploaded", 
              description: "Profile photo uploaded successfully." 
            });
            
            setShowPhotoUploadDialog(false);
            setSelectedPhoto(null);
            setPhotoPreview(null);
            
            // Refresh the profile data to show updated photo
            await refreshProfile();
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Upload error:', error);
          toast({ 
            title: "Upload Failed", 
            description: "Failed to upload photo. Please try again.", 
            variant: "destructive" 
          });
        } finally {
          setUploadingPhoto(false);
        }
      };
      
      reader.readAsDataURL(selectedPhoto);
    } catch (error) {
      console.error('Photo processing error:', error);
      toast({ 
        title: "Upload Failed", 
        description: "Failed to process photo. Please try again.", 
        variant: "destructive" 
      });
      setUploadingPhoto(false);
    }
  };

  const cancelPhotoUpload = () => {
    setShowPhotoUploadDialog(false);
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };

  if (!profile) {
    return null;
  }

  return (
    <DashboardLayout title="My Profile">
      <div className="space-y-3">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {profile.profile_photo_url ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-300">
                <img 
                  src={profile.profile_photo_url} 
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(profile.full_name)}
              </div>
            )}
            <div>
              <h1 className="text-base font-bold text-gray-900">{profile.full_name}</h1>
              <p className="text-xs text-amber-700 capitalize mt-0.5">{profile.role_type || profile.role}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.status === 'active' ? 'bg-green-100 text-green-700' :
                  profile.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {getStatusDisplay(profile.status)}
                </span>
                {profile.face_registered && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1">
                    <Camera className="w-3 h-3" />
                    Face ID
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Photo & Face Recognition */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Profile Photo & Security</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-start gap-3">
              {profile.profile_photo_url ? (
                <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                  <img 
                    src={profile.profile_photo_url} 
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  {profile.profile_photo_url ? 'Profile Photo Uploaded' : 'No Profile Photo'}
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  {profile.face_registered 
                    ? 'Face recognition is enabled for secure attendance verification'
                    : profile.profile_photo_url
                    ? 'Face recognition will be enabled once ML service is configured'
                    : 'Upload a profile photo to enable face recognition for attendance'
                  }
                </p>
                <div className="flex items-center gap-2">
                  {profile.face_registered ? (
                    <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5" />
                      Face Recognition Active
                    </span>
                  ) : profile.profile_photo_url ? (
                    <span className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium">
                      Pending ML Service Setup
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                      Photo Required
                    </span>
                  )}
                  <button
                    onClick={() => setShowPhotoUploadDialog(true)}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {profile.profile_photo_url ? 'Update' : 'Upload'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Profile Information</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Full Name</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5">{profile.full_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Email</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5 break-all">{profile.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Role</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5 capitalize">{profile.role_type || profile.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Account Status</p>
                <p className={`text-xs font-semibold mt-0.5 capitalize ${getStatusColor(profile.status)}`}>
                  {getStatusDisplay(profile.status)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Office Location</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5">{profile.office_name || 'Not Assigned'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide">Member Since</p>
                <p className="text-xs font-semibold text-gray-900 mt-0.5">{formatDate(profile.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Account Options */}
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-2">Account Settings</h2>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-200">
            <button onClick={() => navigate("/change-password")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Change Password</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Update your account password</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button onClick={() => navigate("/help-support")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Help & Support</p>
                <p className="text-[10px] text-gray-600 mt-0.5">Get assistance or report issues</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button onClick={() => navigate("/attendance-rules")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Attendance Rules</p>
                <p className="text-[10px] text-gray-600 mt-0.5">How attendance marking works</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>

            <button onClick={() => navigate("/attendance-rules")} className="flex items-center gap-3 p-3 w-full hover:bg-gray-50 transition-colors">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-semibold text-gray-900">Attendance Policy</p>
                <p className="text-[10px] text-gray-600 mt-0.5">View company attendance rules</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutDialog(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 text-red-600 rounded-lg font-semibold text-sm hover:bg-red-100 transition-colors border border-red-200"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">Nexus Corporate Pvt Ltd v1.0.0</p>
          <p className="text-xs text-gray-600 mt-1">© 2026 Nexus Corporate Pvt Ltd</p>
        </div>
      </div>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[400px] rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 text-white hover:bg-red-700">
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Photo Upload Dialog */}
      <Dialog open={showPhotoUploadDialog} onOpenChange={setShowPhotoUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Profile Photo</DialogTitle>
            <DialogDescription>
              Upload a clear, front-facing photo for face recognition verification
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {photoPreview ? (
              <div className="relative">
                <div className="w-full aspect-square bg-muted rounded-xl overflow-hidden border-2 border-border">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                <div className="w-full aspect-square bg-muted rounded-xl border-2 border-dashed border-border hover:border-primary transition-colors flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to select photo</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG or PNG, max 5MB</p>
                  </div>
                </div>
              </label>
            )}
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Tips for best results:</strong><br />
                • Face should be clearly visible and front-facing<br />
                • Good lighting with no shadows<br />
                • Remove sunglasses or hats<br />
                • Neutral expression works best
              </p>
            </div>
          </div>
          
          <DialogFooter className="flex gap-3">
            <button 
              onClick={cancelPhotoUpload} 
              className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              disabled={uploadingPhoto}
            >
              Cancel
            </button>
            <button 
              onClick={handleUploadPhoto} 
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              disabled={!selectedPhoto || uploadingPhoto}
            >
              {uploadingPhoto ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload Photo
                </>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ProfileScreen;
