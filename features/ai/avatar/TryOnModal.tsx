import React from 'react';
import Link from 'next/link';
import Modal from '@/components/ui/Modal';
import { Product } from '@/types';
import { garmentKind } from '@/stores/fittingStore';
import { Box } from 'lucide-react';

import DressRoomViewer from '@/components/dressing-room/DressRoomViewer';

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function TryOnModal({ isOpen, onClose, product }: TryOnModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" size="xl">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
              &quot;{product.title}&quot; Dress Room
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Switch between studio product shots and real editorial model wearing look.
            </p>
          </div>
          {garmentKind(product) && (
            <Link
              href={`/dressing-room?product=${product.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900"
            >
              <Box className="w-3.5 h-3.5" />
              Try on in 3D
            </Link>
          )}
        </div>

        <div className="py-2">
          <DressRoomViewer product={product} showDetails={true} />
        </div>
      </div>
    </Modal>
  );
}
