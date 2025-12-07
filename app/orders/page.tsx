'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import { Package, Calendar } from 'lucide-react';

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-123456',
    date: '2024-01-15',
    total: 299.99,
    status: 'Delivered',
    items: 3,
  },
  {
    id: 'ORD-123455',
    date: '2024-01-10',
    total: 149.99,
    status: 'Shipped',
    items: 2,
  },
  {
    id: 'ORD-123454',
    date: '2024-01-05',
    total: 89.99,
    status: 'Processing',
    items: 1,
  },
];

export default function OrdersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Orders</h1>

      {mockOrders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No orders yet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start shopping to see your orders here.
          </p>
          <Link href="/products">
            <Button size="lg">Start Shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {mockOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Order #{order.id}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      order.status === 'Delivered'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : order.status === 'Shipped'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(order.date).toLocaleDateString()}
                  </div>
                  <span>{order.items} item{order.items > 1 ? 's' : ''}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${order.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {order.status === 'Delivered' && (
                  <Button variant="outline" size="sm">
                    Reorder
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

