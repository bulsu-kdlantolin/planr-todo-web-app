import React, { useState, useEffect, useRef } from 'react';
import { useMetaStore } from '../../store/useMetaStore';
import { useUIStore } from '../../store/useUIStore';
import { Modal } from '../common/Modal';
import { ModalFooter } from '../common/ModalFooter';
import { Logo } from '../common/Logo';
import { Camera, Trash2, User, Upload, AlertCircle } from 'lucide-react';
import { triggerHapticFeedback, getFieldValidationClass } from '../../utils/validation';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const user = useMetaStore((state) => state.user);
  const updateUser = useMetaStore((state) => state.updateUser);
  const showToast = useUIStore((state) => state.showToast);

  const [name, setName] = useState(user.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [title, setTitle] = useState(user.title);
  const [tagline, setTagline] = useState(user.tagline);
  const [email, setEmail] = useState(user.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | undefined>(user.avatar);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(user.name);
    setNameError(null);
    setTitle(user.title);
    setTagline(user.tagline);
    setEmail(user.email);
    setEmailError(null);
    setAvatar(user.avatar);
    setIsSubmitting(false);
  }, [user, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize & resize image on canvas (256x256 square)
        const canvas = document.createElement('canvas');
        const maxSize = 256;
        let width = img.width;
        let height = img.height;

        const size = Math.min(width, height);
        const startX = (width - size) / 2;
        const startY = (height - size) / 2;

        canvas.width = maxSize;
        canvas.height = maxSize;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, startX, startY, size, size, 0, 0, maxSize, maxSize);
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setAvatar(optimizedDataUrl);
          showToast('Photo selected! Click Save to apply 📷', 'info');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let hasError = false;
    const cleanName = name.trim();
    if (!cleanName) {
      setNameError('Please enter your display name');
      hasError = true;
    }

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your email address');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (hasError) {
      triggerHapticFeedback();
      return;
    }

    setIsSubmitting(true);
    await updateUser({
      name: cleanName,
      title: title.trim(),
      tagline: tagline.trim(),
      email: cleanEmail,
      avatar: avatar
    });
    setIsSubmitting(false);
    showToast('Profile updated successfully 🌿', 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile"
      titleId="profile-modal-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-4 my-2">
        {/* Profile Picture Change Section */}
        <div className="p-4 bg-surface-low rounded-xl border border-outline-subtle flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-surface-container border-2 border-outline-variant flex items-center justify-center text-primary-container font-serif text-xl font-bold overflow-hidden shadow-xs">
              {avatar ? (
                <img src={avatar} alt={name || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name.charAt(0).toUpperCase() : <User className="w-6 h-6 text-secondary" />}</span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Upload profile picture"
              className="absolute inset-0 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <h4 className="text-xs font-semibold text-on-surface">Profile Picture</h4>
            <p className="text-[11px] text-secondary">Upload a square photo (PNG, JPG, max 5MB)</p>

            <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                onChange={handleImageUpload}
                className="hidden"
                id="profile-picture-upload"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-container border border-outline-variant text-[11px] font-semibold text-on-surface transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3 h-3 text-tertiary" />
                <span>{avatar ? 'Change' : 'Upload'}</span>
              </button>

              {avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="px-3 py-1.5 rounded-lg bg-surface hover:bg-red-50 dark:hover:bg-red-950/40 border border-outline-variant text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="profile-name-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            id="profile-name-input"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            className={`w-full px-3.5 py-2.5 bg-surface-low border rounded-xl text-xs text-on-surface transition-all focus:outline-none ${getFieldValidationClass(
              !!nameError
            )}`}
          />
          {nameError && (
            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{nameError}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="profile-title-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
            Role / Craft
          </label>
          <input
            id="profile-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fullstack Engineer / Designer"
            className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-xs text-on-surface focus:border-primary-container focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="profile-tagline-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
            Focus Motto / Tagline
          </label>
          <input
            id="profile-tagline-input"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Keep it calm, keep it moving"
            className="w-full px-3.5 py-2.5 bg-surface-low border border-outline-variant rounded-xl text-xs text-on-surface focus:border-primary-container focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label htmlFor="profile-email-input" className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-1.5 font-sans">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="profile-email-input"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            className={`w-full px-3.5 py-2.5 bg-surface-low border rounded-xl text-xs text-on-surface transition-all focus:outline-none ${getFieldValidationClass(
              !!emailError
            )}`}
          />
          {emailError && (
            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 animate-fade-in font-medium" role="alert">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        <ModalFooter
          onCancel={onClose}
          submitText="Save Profile"
          submittingText="Saving profile..."
          isSubmitting={isSubmitting}
        />
      </form>
    </Modal>
  );
};

export default ProfileModal;
