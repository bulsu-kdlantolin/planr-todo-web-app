import React, { useState, useEffect } from 'react';
import { useMetaStore } from '../../store/useMetaStore';
import { useUIStore } from '../../store/useUIStore';
import { Modal } from '../common/Modal';
import { ModalFooter } from '../common/ModalFooter';
import { Logo } from '../common/Logo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const user = useMetaStore((state) => state.user);
  const updateUser = useMetaStore((state) => state.updateUser);
  const showToast = useUIStore((state) => state.showToast);

  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [tagline, setTagline] = useState(user.tagline);
  const [email, setEmail] = useState(user.email);

  useEffect(() => {
    setName(user.name);
    setTitle(user.title);
    setTagline(user.tagline);
    setEmail(user.email);
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await updateUser({
        name: name.trim(),
        title: title.trim(),
        tagline: tagline.trim(),
        email: email.trim()
      });
      showToast('Profile updated');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile"
      titleId="profile-modal-title"
      maxWidthClass="max-w-md"
      icon={<Logo size="sm" showWordmark={false} />}
    >
      <form onSubmit={handleSubmit} className="space-y-4 my-2">
        <div>
          <label htmlFor="profile-name-input" className="block text-xs font-medium text-secondary mb-1">
            Display Name
          </label>
          <input
            id="profile-name-input"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="profile-title-input" className="block text-xs font-medium text-secondary mb-1">
            Role / Focus
          </label>
          <input
            id="profile-title-input"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Product Designer"
            className="w-full px-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="profile-tagline-input" className="block text-xs font-medium text-secondary mb-1">
            Motto / Tagline
          </label>
          <input
            id="profile-tagline-input"
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="e.g. Focus on what matters"
            className="w-full px-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="profile-email-input" className="block text-xs font-medium text-secondary mb-1">
            Email
          </label>
          <input
            id="profile-email-input"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-surface-low border border-outline-variant rounded-md text-xs text-on-surface focus:border-primary-container focus:outline-none"
          />
        </div>

        <ModalFooter onCancel={onClose} submitText="Save Profile" />
      </form>
    </Modal>
  );
};

export default ProfileModal;
