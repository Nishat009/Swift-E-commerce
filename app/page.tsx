'use client';

import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import { ShoppingBag, Truck, Shield, Star, Sparkles, ArrowRight, Mail, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchProducts } from '@/lib/api';
import { Product } from '@/types';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestsellers, setBestsellers] = useState<Product[]>([]);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 50]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const featured = await fetchProducts({ limit: 8 });
        setFeaturedProducts(featured.products);

        const arrivals = await fetchProducts({ limit: 8, skip: 0 });
        setNewArrivals(arrivals.products);

        const allProducts = await fetchProducts({ limit: 50 });
        const best = allProducts.products
          .filter(p => p.rating >= 4.5)
          .slice(0, 8);
        setBestsellers(best);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    loadProducts();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] dark:bg-gray-950">
      {/* Classic Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#faf9f6] via-[#f5f1eb] to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <motion.div
          style={{ y: y1, opacity }}
          className="absolute inset-0 z-0"
        >
          <Image
            src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&h=1080&fit=crop&q=80"
            alt="Classic Home Decor"
            fill
            className="object-cover opacity-20"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#faf9f6]/95 via-[#f5f1eb]/90 to-white/95 dark:from-gray-950/95 dark:via-gray-900/90 dark:to-gray-900/95"></div>
        </motion.div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 md:py-36">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-block px-4 py-2 bg-[#8b6f47]/10 text-[#8b6f47] dark:text-[#c9a96b] rounded-full text-sm font-medium tracking-wider uppercase">
                Handcrafted Excellence
              </span>
            </motion.div>
            <motion.h1
              variants={itemVariants}
              className="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold mb-6 sm:mb-8 text-[#2c2c2c] dark:text-[#f5f1eb] leading-[1.1]"
            >
              Discover Timeless
              <br />
              <span className="text-[#8b6f47] dark:text-[#c9a96b] italic">Elegance</span>
            </motion.h1>
            <motion.p
              variants={itemVariants}
              className="font-elegant text-xl sm:text-2xl md:text-3xl text-[#6b6b6b] dark:text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed"
            >
              Curated collection of premium products, crafted with care and attention to detail
            </motion.p>
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/products">
                <Button size="lg" className="bg-[#8b6f47] hover:bg-[#6b5435] text-white border-0 px-8 py-4 text-base font-medium tracking-wide shadow-lg hover:shadow-xl transition-all duration-300">
                  <ShoppingBag className="w-5 h-5 mr-2 inline" />
                  Explore Collection
                </Button>
              </Link>
              <Link href="/products?category=electronics">
                <Button variant="outline" size="lg" className="border-2 border-[#8b6f47] text-[#8b6f47] hover:bg-[#8b6f47] hover:text-white px-8 py-4 text-base font-medium tracking-wide transition-all duration-300">
                  View Catalog
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative Divider */}
        <div className="classic-divider">
          <span className="text-[#8b6f47] dark:text-[#c9a96b]">✦</span>
        </div>
      </section>

      {/* Featured Categories Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-16 sm:py-20 md:py-24 bg-[#faf9f6] dark:bg-gray-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-2">
              Featured Categories
            </h2>
            <p className="text-[#6b6b6b] dark:text-gray-400 text-lg">
              Browse our curated categories for every style
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Sofa & Chair', icon: '🪑', bgColor: 'bg-[#f5e6d3]', darkBg: 'dark:bg-[#5a4a38]', borderColor: 'border-[#d4c4b0]' },
              { name: 'Kitchen', icon: '🍽️', bgColor: 'bg-[#f0e5d8]', darkBg: 'dark:bg-[#5a4a38]', borderColor: 'border-[#d4c4b0]' },
              { name: 'Bathroom', icon: '🚿', bgColor: 'bg-[#ebe1d3]', darkBg: 'dark:bg-[#5a4a38]', borderColor: 'border-[#d4c4b0]' },
              { name: 'Home Decor', icon: '🎨', bgColor: 'bg-[#e6dccf]', darkBg: 'dark:bg-[#5a4a38]', borderColor: 'border-[#d4c4b0]' },
            ].map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <Link href={`/products?category=${category.name.toLowerCase().replace(' ', '-')}`}>
                  <div className={`${category.bgColor} ${category.darkBg} border border-[#d4c4b0] ${category.borderColor} rounded-lg p-8 cursor-pointer group overflow-hidden relative h-64 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-lg hover:border-[#8b6f47]`}>
                    {/* Background Pattern - Subtle */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#8b6f47] rounded-full -mr-16 -mt-16"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#8b6f47] rounded-full -ml-12 -mb-12"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 text-center">
                      <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        {category.icon}
                      </div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-[#2c2c2c] dark:text-[#f5e6d3]">
                        {category.name}
                      </h3>
                      <div className="flex items-center justify-center mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowRight className="w-5 h-5 text-[#8b6f47] dark:text-[#c9a96b]" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Collection Section */}
      {featuredProducts.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-4">
                Featured Collection
              </h2>
              <p className="font-elegant text-xl sm:text-2xl text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Handpicked selections from our finest artisans
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            >
              {featuredProducts.slice(0, 4).map((product, index) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-center mt-12"
            >
              <Link href="/products">
                <Button variant="outline" size="lg" className="border-2 border-[#8b6f47] text-[#8b6f47] hover:bg-[#8b6f47] hover:text-white px-8 py-4">
                  View All Products
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* New Arrivals Section */}
      {newArrivals.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="py-16 sm:py-20 md:py-24 bg-[#f5f1eb] dark:bg-gray-950"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <div className="inline-flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-[#8b6f47] dark:text-[#c9a96b]" />
                <span className="text-sm font-medium tracking-wider uppercase text-[#8b6f47] dark:text-[#c9a96b]">
                  Just Arrived
                </span>
              </div>
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-4">
                New Arrivals
              </h2>
              <p className="font-elegant text-xl sm:text-2xl text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Fresh additions to our curated collection
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            >
              {newArrivals.slice(0, 4).map((product, index) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Classic Banner Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-12 sm:py-16 md:py-20 relative overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1920&h=800&fit=crop&q=80"
            alt="Classic Collection"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#8b6f47]/90 via-[#c9a96b]/85 to-[#d4a574]/90"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center text-white max-w-3xl mx-auto"
          >
            <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold mb-4">
              Timeless Elegance
            </h2>
            <p className="font-elegant text-xl sm:text-2xl mb-8 text-white/90">
              Discover our curated collection of handcrafted treasures
            </p>
            <Link href="/products">
              <Button size="lg" className="bg-white text-[#8b6f47] hover:bg-[#f5f1eb] border-0 px-8 py-4">
                Explore Collection
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Bestsellers Section */}
      {bestsellers.length > 0 && (
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-900"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12 sm:mb-16"
            >
              <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-4">
                Bestsellers
              </h2>
              <p className="font-elegant text-xl sm:text-2xl text-[#6b6b6b] dark:text-gray-400 max-w-2xl mx-auto">
                Our most loved products, chosen by customers
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
            >
              {bestsellers.slice(0, 4).map((product, index) => (
                <motion.div key={product.id} variants={itemVariants}>
                  <ProductCard product={product} index={index} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.section>
      )}

      {/* Classic Image Gallery Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-12 sm:py-16 md:py-20 bg-[#f5f1eb] dark:bg-gray-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6"
          >
            {[
              {
                src: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop&q=80',
                title: 'Handcrafted',
                subtitle: 'Artisan Collection',
              },
              {
                src: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&h=600&fit=crop&q=80',
                title: 'Natural',
                subtitle: 'Organic Materials',
              },
              {
                src: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&h=600&fit=crop&q=80',
                title: 'Elegant',
                subtitle: 'Timeless Design',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -8 }}
                transition={{ duration: 0.3 }}
                className="relative h-64 sm:h-80 md:h-96 rounded-lg overflow-hidden group cursor-pointer"
              >
                <Image
                  src={item.src}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#8b6f47]/80 via-[#8b6f47]/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="font-serif text-2xl sm:text-3xl font-semibold mb-1">{item.title}</h3>
                  <p className="font-elegant text-lg sm:text-xl text-white/90">{item.subtitle}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Classic Features Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-900"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold text-center text-[#2c2c2c] dark:text-[#f5f1eb] mb-12 sm:mb-16"
          >
            Why Choose Us
          </motion.h2>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12"
          >
            {[
              { icon: Truck, title: 'Fast Delivery', desc: 'Swift and secure shipping to your doorstep' },
              { icon: Shield, title: 'Secure Payment', desc: 'Your information is always protected' },
              { icon: Star, title: 'Quality Assured', desc: 'Only the finest products make it to you' },
              { icon: Heart, title: 'Customer Care', desc: 'Dedicated support for your satisfaction' },
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className="w-20 h-20 sm:w-24 sm:h-24 bg-[#8b6f47]/10 dark:bg-[#c9a96b]/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-[#8b6f47]/20 dark:group-hover:bg-[#c9a96b]/30 transition-colors"
                >
                  <feature.icon className="w-10 h-10 sm:w-12 sm:h-12 text-[#8b6f47] dark:text-[#c9a96b]" />
                </motion.div>
                <h3 className="font-serif text-xl sm:text-2xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-3">
                  {feature.title}
                </h3>
                <p className="text-[#6b6b6b] dark:text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Classic Newsletter Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.8 }}
        className="py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-900"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-[#f5f1eb] dark:bg-gray-950 rounded-2xl p-8 sm:p-12 md:p-16 border border-[#e8e0d6] dark:border-gray-800"
          >
            <motion.div
              animate={{ rotate: [0, 5, -5, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
              className="inline-block mb-6"
            >
              <Mail className="w-12 h-12 sm:w-16 sm:h-16 text-[#8b6f47] dark:text-[#c9a96b] mx-auto" />
            </motion.div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-semibold text-[#2c2c2c] dark:text-[#f5f1eb] mb-4">
              Stay Connected
            </h2>
            <p className="font-elegant text-lg sm:text-xl text-[#6b6b6b] dark:text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Be the first to discover new arrivals, exclusive offers, and special collections
            </p>
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-6 py-4 rounded-lg bg-white dark:bg-gray-900 border-2 border-[#e8e0d6] dark:border-gray-800 text-[#2c2c2c] dark:text-[#f5f1eb] placeholder-[#9b9b9b] focus:outline-none focus:border-[#8b6f47] dark:focus:border-[#c9a96b] transition-colors font-medium"
              />
              <Button
                type="submit"
                size="lg"
                className="bg-[#8b6f47] hover:bg-[#6b5435] text-white border-0 px-8 py-4 font-medium tracking-wide"
              >
                Subscribe
              </Button>
            </form>
          </motion.div>
        </div>
      </motion.section>
    </div>
  );
}
