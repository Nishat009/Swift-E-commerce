import { useAvatarStore } from '@/stores/avatarStore';
import { Product } from '@/types';
import { AvatarProfile } from '@/types/ai';

export function useAvatar() {
  const avatarStore = useAvatarStore();

  const handleTryOnWithPhoto = async (photoFile: File, product: Product) => {
    const photoUrl = URL.createObjectURL(photoFile);
    avatarStore.tryOnItem(product);
    return photoUrl;
  };

  const currentAvatarProfile: AvatarProfile = {
    id: 'current_avatar',
    name: 'Default Avatar',
    gender: avatarStore.avatar.gender as any,
    body_type: avatarStore.avatar.bodyType as any,
    height: avatarStore.avatar.height as any,
    skin_tone: avatarStore.avatar.skinTone,
    hair_style: avatarStore.avatar.hairStyle as any,
    hair_color: avatarStore.avatar.hairColor,
  };

  return {
    ...avatarStore,
    currentAvatarProfile,
    handleTryOnWithPhoto,
  };
}
